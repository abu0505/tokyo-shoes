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
      // Use RPC function with SECURITY DEFINER to bypass RLS
      const { data, error } = await supabase
        .rpc('check_is_admin', { check_user_id: userId });

      if (error) {
        console.error('Error checking admin role via RPC:', error);
        // Fallback to direct query if RPC fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();

        if (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          return false;
        }
        return !!fallbackData;
      }
      return !!data;
    } catch (err) {
      console.error('Error checking admin role:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Helper to safely update state only if component is still mounted
    const safeSetState = (updater: (prev: AuthState) => AuthState) => {
      if (isMounted) {
        setAuthState(updater);
      }
    };

    // Check admin and update state safely
    const handleAdminCheck = async (userId: string) => {
      try {
        const isAdmin = await checkAdminRole(userId);
        safeSetState(prev => ({
          ...prev,
          isAdmin,
          isLoading: false,
          isAdminLoading: false,
        }));
      } catch (error) {
        console.error('Admin check failed:', error);
        safeSetState(prev => ({
          ...prev,
          isAdmin: false,
          isLoading: false,
          isAdminLoading: false,
        }));
      }
    };

    // Set up auth state listener - keep it synchronous, defer async work
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Update session info immediately
        safeSetState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          isLoading: !!session?.user,
          isAdminLoading: !!session?.user,
          // Reset admin status when user changes
          isAdmin: session?.user ? prev.isAdmin : false,
        }));

        // Defer admin check to avoid async issues in callback
        if (session?.user) {
          handleAdminCheck(session.user.id);
        } else {
          safeSetState(prev => ({
            ...prev,
            isAdmin: false,
            isLoading: false,
            isAdminLoading: false,
          }));
        }
      }
    );

    // Check for existing session on mount
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          safeSetState(prev => ({
            ...prev,
            session,
            user: session.user,
          }));

          await handleAdminCheck(session.user.id);
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
      } catch (error) {
        console.error('Session init failed:', error);
        safeSetState(prev => ({
          ...prev,
          isLoading: false,
          isAdminLoading: false,
        }));
      }
    };

    initSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [checkAdminRole]);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    ...authState,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };
};
