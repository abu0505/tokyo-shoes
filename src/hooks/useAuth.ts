import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdminLoading: boolean;
  isAdmin: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAdminLoading: true,
    isAdmin: false,
  });

  const checkAdminRole = useCallback(async (userId: string) => {
    try {
      // 1. Try RPC check first (secure, encapsulated)
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: userId, _role: 'admin' });

      if (!error) {
        return !!data;
      }

      console.warn('RPC check failed, falling back to table query:', error);

      // 2. Fallback to direct table query (if RPC is missing or fails)
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError) {
        console.error('Admin role check failed:', roleError);
        return false;
      }

      return !!roleData;
    } catch (err) {
      console.error('Unexpected error checking admin role:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const safeSetState = (updater: (prev: AuthState) => AuthState) => {
      if (isMounted) {
        setAuthState(updater);
      }
    };

    const handleAdminCheck = async (userId: string) => {
      // Start loading state for admin check if not already loading
      safeSetState(prev => ({ ...prev, isAdminLoading: true }));

      const isAdmin = await checkAdminRole(userId);

      safeSetState(prev => ({
        ...prev,
        isAdmin,
        isAdminLoading: false,
        isLoading: false, // Ensure main loading is done too
      }));
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        safeSetState(prev => ({
          ...prev,
          session,
          user: session.user,
          isLoading: true, // Keep loading while we check admin
          isAdminLoading: true,
        }));
        handleAdminCheck(session.user.id);
      } else {
        safeSetState(prev => ({
          ...prev,
          session: null,
          user: null,
          isLoading: false,
          isAdminLoading: false,
          isAdmin: false,
        }));
      }
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        safeSetState(prev => ({
          ...prev,
          session,
          user: session.user,
        }));
        // Always re-check admin on auth change to be safe
        handleAdminCheck(session.user.id);
      } else {
        safeSetState(prev => ({
          ...prev,
          session: null,
          user: null,
          isLoading: false,
          isAdminLoading: false,
          isAdmin: false,
        }));
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [checkAdminRole]);

  return {
    ...authState,
    signUp: async (email: string, password: string, firstName: string, lastName: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim(),
          }
        }
      });
      return { data, error };
    },
    signIn: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { data, error };
    },
    signInWithGoogle: async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` }
      });
      return { data, error };
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      return { error };
    },
  };
};
