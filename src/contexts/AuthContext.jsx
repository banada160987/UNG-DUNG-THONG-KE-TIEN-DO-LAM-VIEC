import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [committeeId, setCommitteeId] = useState(null);
  const [committeeName, setCommitteeName] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        await fetchUserRole(session.user.id);
      } else {
        setUser(null);
        setRole(null);
        setCommitteeId(null);
        setCommitteeName(null);
        setPermissions({});
      }
      setLoading(false);
    };

    checkUser();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchUserRole(session.user.id);
      } else {
        setUser(null);
        setRole(null);
        setCommitteeId(null);
        setCommitteeName(null);
        setPermissions({});
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('cbq_user_roles')
        .select('role, committee_id, cbq_committees(name)')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching role:', error.message);
        return;
      }
      
      if (data) {
        const userRole = data.role;
        const commId = data.committee_id;
        const commName = data.cbq_committees?.name || null;

        setRole(userRole);
        setCommitteeId(commId);
        setCommitteeName(commName);

        const isSecretaryOrAdmin = userRole === 'admin' || userRole === 'secretary' || (commName && commName.toLowerCase().includes('thư ký'));

        // Define permissions
        const perms = {
          canViewSponsors: isSecretaryOrAdmin || commName === 'Tiểu ban tiếp nhận tài trợ',
          canViewGuests: isSecretaryOrAdmin || commName === 'Tiểu ban Liên lạc, vận động, truyền thông' || commName === 'Tiểu ban Lễ tân, khánh tiết',
          canViewNews: userRole === 'admin' || commName === 'Tiểu ban Liên lạc, vận động, truyền thông' || commName === 'Tiểu ban Nội dung, biên tập tập san',
          canViewPages: userRole === 'admin' || commName === 'Tiểu ban Liên lạc, vận động, truyền thông',
          canViewDocs: userRole === 'admin' || commName === 'Tiểu ban Nội dung, biên tập tập san',
          canViewSports: isSecretaryOrAdmin || commName === 'Tiểu ban Liên lạc, vận động, truyền thông' || (commName && commName.toLowerCase().includes('thể thao')),
        };
        setPermissions(perms);
      }
    } catch (err) {
      console.error('Unexpected error fetching role:', err);
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
    <AuthContext.Provider value={{ user, role, committeeId, committeeName, permissions, signIn, signOut, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
