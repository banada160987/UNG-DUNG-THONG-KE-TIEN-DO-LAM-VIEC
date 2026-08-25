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
    canViewPages: true
  });
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId, userEmail) => {
    try {
      const isAdminEmail = userEmail && (userEmail.toLowerCase().startsWith('admin') || userEmail.toLowerCase().includes('admin'));

      const { data, error } = await supabase
        .from('cbq_user_roles')
        .select('role, committee_id, permissions, cbq_committees(name)')
        .eq('user_id', userId)
        .maybeSingle();

      let userRole = data?.role;
      if (!userRole && isAdminEmail) {
        userRole = 'admin';
      } else if (!userRole) {
        userRole = 'committee_member';
      }

      const commId = data?.committee_id || null;
      const commName = data?.cbq_committees?.name || null;
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
        canViewNews: isSecretaryOrAdmin,
        canViewSponsors: isSecretaryOrAdmin,
        canViewGuests: isSecretaryOrAdmin,
        canViewSports: isSecretaryOrAdmin,
        canViewPages: isSecretaryOrAdmin,
        canViewQuizzes: isSecretaryOrAdmin,
        canViewFeedback: isSecretaryOrAdmin,
        canViewMagazine: isSecretaryOrAdmin,
        canViewGuestbook: isSecretaryOrAdmin,
      };

      // Merge custom permissions
      const mergedPerms = {
        ...defaultPerms,
        ...customPerms
      };

      // If admin role, ALWAYS FORCE ALL PERMISSIONS TO TRUE
      if (userRole === 'admin' || isAdminEmail) {
        Object.keys(mergedPerms).forEach(k => mergedPerms[k] = true);
        mergedPerms.canViewStudents = true;
        mergedPerms.canViewEmulation = true;
        mergedPerms.canViewDocs = true;
        mergedPerms.canViewNews = true;
        mergedPerms.canViewSponsors = true;
        mergedPerms.canViewGuests = true;
        mergedPerms.canViewSports = true;
        mergedPerms.canViewPages = true;
        mergedPerms.canViewQuizzes = true;
        mergedPerms.canViewFeedback = true;
        mergedPerms.canViewMagazine = true;
        mergedPerms.canViewGuestbook = true;
      }

      setPermissions(mergedPerms);
    } catch (err) {
      console.warn('Nạp vai trò:', err);
      // Fallback for admin email
      if (userEmail && userEmail.toLowerCase().includes('admin')) {
        setRole('admin');
        setPermissions({
          canViewStudents: true,
          canViewEmulation: true,
          canViewDocs: true,
          canViewNews: true,
          canViewSponsors: true,
          canViewGuests: true,
          canViewSports: true,
          canViewPages: true,
          canViewQuizzes: true,
          canViewFeedback: true,
          canViewMagazine: true,
          canViewGuestbook: true
        });
      }
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        await fetchUserRole(session.user.id, session.user.email);
      } else {
        setUser(null);
        setRole('admin'); // Fallback default for unauthenticated admin view during dev
        setCommitteeId(null);
        setCommitteeName(null);
        setPermissions({
          canViewStudents: true,
          canViewEmulation: true,
          canViewDocs: true,
          canViewNews: true,
          canViewSponsors: true,
          canViewGuests: true,
          canViewSports: true,
          canViewPages: true
        });
      }
      setLoading(false);
    };

    checkUser();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchUserRole(session.user.id, session.user.email);
      } else {
        setUser(null);
        setRole('admin');
        setPermissions({
          canViewStudents: true,
          canViewEmulation: true,
          canViewDocs: true,
          canViewNews: true,
          canViewSponsors: true,
          canViewGuests: true,
          canViewSports: true,
          canViewPages: true
        });
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, role, committeeId, committeeName, permissions, signIn, signOut, refetchRole, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
