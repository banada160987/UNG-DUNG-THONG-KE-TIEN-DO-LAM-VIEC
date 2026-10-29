import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [committeeId, setCommitteeId] = useState(null);
  const [committeeName, setCommitteeName] = useState(null);
  const [permissions, setPermissions] = useState({
    canViewStudents: true,
    canViewEmulation: true,
    canViewDocs: true,
    canViewNews: true,
    canViewSponsors: true,
    canViewGuests: true,
    canViewSports: true,
    canViewPages: true,
    canViewLinks: true
  });
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId, userEmail) => {
    try {
      const { data, error } = await supabase
        .from('cbq_user_roles')
        .select('role, committee_id, permissions')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Lỗi đọc vai trò từ CSDL:', error.message);
      }

      let userRole = data?.role;
      if (!userRole) {
        userRole = 'committee_member';
      }

      const commId = data?.committee_id || null;
      let commName = null;
      if (commId) {
        const { data: commData } = await supabase
          .from('cbq_committees')
          .select('name')
          .eq('id', commId)
          .maybeSingle();
        commName = commData?.name || null;
      }
      const customPerms = data?.permissions || {};

      setRole(userRole);
      setCommitteeId(commId);
      setCommitteeName(commName);

      const isSecretaryOrAdmin = userRole === 'admin' || userRole === 'secretary';

      // Default permissions based on role
      const defaultPerms = {
        canViewStudents: true,
        canViewEmulation: true,
        canViewDocs: true,
        canManageDepartments: isSecretaryOrAdmin || (typeof userRole === 'string' && userRole.startsWith('to_')),
        canViewEduHub: isSecretaryOrAdmin,
        canViewDigitalVault: isSecretaryOrAdmin,
        canViewFeedback: isSecretaryOrAdmin || userRole === 'gvcn' || userRole === 'doan_thanh_nien',
        canManageCanteen: isSecretaryOrAdmin || userRole === 'canteen_staff',
        canViewParking: isSecretaryOrAdmin || userRole === 'bao_ve',
        canViewSports: isSecretaryOrAdmin || userRole === 'to_gdtc_qpan' || userRole === 'doan_thanh_nien',
        canViewRegistrations: isSecretaryOrAdmin || userRole === 'doan_thanh_nien',
        canViewQuizzes: isSecretaryOrAdmin || userRole === 'doan_thanh_nien',
        canViewNews: isSecretaryOrAdmin,
        canViewSponsors: isSecretaryOrAdmin,
        canViewGuests: isSecretaryOrAdmin,
        canViewPages: isSecretaryOrAdmin,
        canViewLinks: isSecretaryOrAdmin,
        canViewMagazine: isSecretaryOrAdmin,
        canViewGuestbook: isSecretaryOrAdmin,
      };

      // Merge custom permissions
      const mergedPerms = {
        ...defaultPerms,
        ...customPerms
      };

      // If admin role, ALWAYS FORCE ALL PERMISSIONS TO TRUE
      if (userRole === 'admin') {
        Object.keys(mergedPerms).forEach(k => mergedPerms[k] = true);
      }

      setPermissions(mergedPerms);

      // Lưu trữ đồng bộ cbq_user để các phân hệ khác (giáo viên, chuyên môn) nhận diện quyền quản trị viên
      if (isSecretaryOrAdmin) {
        try {
          localStorage.setItem('cbq_user', JSON.stringify({
            id: userId,
            email: userEmail,
            role: userRole,
            username: userEmail?.split('@')[0] || 'admin',
            name: userRole === 'admin' ? 'Ban Giám Hiệu / Quản trị viên' : 'Thư ký Hội đồng'
          }));
        } catch (_) {}
      }
    } catch (err) {
      console.warn('Nạp vai trò:', err);
      setRole('guest');
      setPermissions({
        canViewStudents: true,
        canViewEmulation: true,
        canViewDocs: true,
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Safety timeout: If auth check takes longer than 1.5s (slow connection / offline), 
    // mark loading false so visitors can view public schedules and portals immediately.
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 1500);

    // Check active sessions and sets the user
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && isMounted) {
          setUser(session.user);
          await fetchUserRole(session.user.id, session.user.email);
        } else if (isMounted) {
          setUser(null);
          setRole(null);
          setCommitteeId(null);
          setCommitteeName(null);
          setPermissions({});
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        if (isMounted) {
          setUser(null);
          setRole(null);
        }
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimer);
          setLoading(false);
        }
      }
    };

    checkUser();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
        await fetchUserRole(session.user.id, session.user.email);
      } else {
        setUser(null);
        setRole(null);
        setCommitteeId(null);
        setCommitteeName(null);
        setPermissions({});
        try { localStorage.removeItem('cbq_user'); } catch (_) {}
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const refetchRole = async () => {
    if (user) {
      await fetchUserRole(user.id, user.email);
    }
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('cbq_user');
    } catch (_) {}
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, role, committeeId, committeeName, permissions, signIn, signOut, refetchRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
