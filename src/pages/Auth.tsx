import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import TextLoader from '@/components/TextLoader';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().optional(),
});

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
});

const resetSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type AuthView = 'login' | 'signup' | 'reset';
type AuthFormData = {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
};

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, signInWithGoogle, isLoading: authLoading } = useAuth();

  const [view, setView] = useState<AuthView>((location.state as { view?: AuthView })?.view || 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: string })?.from || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormData>({
    resolver: zodResolver(
      view === 'login'
        ? loginSchema
        : view === 'signup'
          ? signupSchema
          : resetSchema
    ),
  });

  const checkIsAdmin = async (userId: string) => {
    try {
      // Use RPC function first
      const { data, error } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });

      if (!error && data) return true;

      // Fallback to table check
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleError && roleData) return true;

      return false;
    } catch (err) {
      console.error('Error checking admin status:', err);
      return false;
    }
  };

  const handlePostAuth = async (userId: string, isSignup: boolean = false) => {
    // Check if user is admin
    const isAdmin = await checkIsAdmin(userId);

    if (isAdmin) {
      toast.success('Welcome Administrator');
      navigate('/admin');
    } else {
      if (isSignup) {
        toast.success('Account created! Welcome!');
        navigate('/');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const fullName = user?.user_metadata?.full_name;
        toast.success(fullName ? `Welcome back, ${fullName}!` : 'Welcome back!');
        navigate(from, { replace: true });
      }
    }
  };

  const onSubmit = async (data: AuthFormData) => {
    setIsSubmitting(true);
    try {
      if (view === 'login' && data.password) {
        const { data: authData, error } = await signIn(data.email, data.password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
          return;
        }

        if (authData.user) {
          await handlePostAuth(authData.user.id);
        }
      } else if (view === 'signup' && data.password && data.firstName && data.lastName) {
        const { data: signUpData, error } = await signUp(data.email, data.password, data.firstName, data.lastName);
        if (error) {
          if (error.message.includes('User already registered')) {
            toast.error('An account with this email already exists');
          } else {
            toast.error(error.message);
          }
          return;
        }

        // If email confirmation is disabled, we get a session immediately
        if (signUpData.session && signUpData.user) {
          await handlePostAuth(signUpData.user.id, true);
        } else {
          toast.success('Account created! Please check your email to verify.');
          setView('login');
          reset();
        }
      } else if (view === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
          redirectTo: window.location.origin + '/update-password',
        });
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Check your email for the password reset link.");
          setView('login');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message);
    }
    // Note: Google Sign In redirects away, so we don't need to handle post-auth here usually.
    // If it's a popup (not typical for this supabase setup usually), we would wait.
    // Standard Supabase OAuth redirects the whole page.
  };


  return (
    <motion.div
      className="min-h-screen bg-background flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 -ml-4 font-bold hover:bg-transparent hover:text-accent group"
        >
          <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
          BACK TO HOME
        </Button>

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter">TOKYO</h1>
          <p className="text-muted-foreground mt-2 text-sm font-medium">
            {view === 'login'
              ? 'Welcome back'
              : view === 'signup'
                ? 'Create your account'
                : 'Reset your password'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-card border-2 border-foreground p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Fields - Only show for signup */}
            {view === 'signup' && (
              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="firstName" className="font-bold text-sm tracking-wide">
                    FIRST NAME
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="firstName"
                      type="text"
                      autoComplete="given-name"
                      placeholder="John"
                      className="pl-10 h-12 border-2 border-foreground focus:border-accent"
                      {...register('firstName')}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-sm text-destructive font-medium">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <Label htmlFor="lastName" className="font-bold text-sm tracking-wide">
                    LAST NAME
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="lastName"
                      type="text"
                      autoComplete="family-name"
                      placeholder="Doe"
                      className="pl-10 h-12 border-2 border-foreground focus:border-accent"
                      {...register('lastName')}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-sm text-destructive font-medium">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-sm tracking-wide">
                EMAIL
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  className="pl-10 h-12 border-2 border-foreground focus:border-accent"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            {view !== 'reset' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="font-bold text-sm tracking-wide">
                    PASSWORD
                  </Label>
                  {view === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setView('reset');
                        reset();
                      }}
                      className="text-xs font-medium text-muted-foreground hover:text-accent transition-colors"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={view === 'signup' ? 'new-password' : 'current-password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-12 border-2 border-foreground focus:border-accent"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive font-medium">{errors.password.message}</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || authLoading}
              className="w-full h-12 bg-foreground text-background hover:bg-accent hover:text-accent-foreground font-bold text-lg transition-all"
            >
              {isSubmitting
                ? <TextLoader className="text-background" isWhite />
                : view === 'login'
                  ? 'SIGN IN'
                  : view === 'signup'
                    ? 'CREATE ACCOUNT'
                    : 'SEND RESET LINK'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground font-medium">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            className="w-full h-12 border-2 border-foreground font-bold hover:bg-foreground hover:text-background transition-all"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            CONTINUE WITH GOOGLE
          </Button>

          {/* Toggle */}
          <p className="text-center mt-6 text-sm">
            {view === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setView('signup');
                    reset();
                  }}
                  className="font-bold text-accent hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : view === 'signup' ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    reset();
                  }}
                  className="font-bold text-accent hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  reset();
                }}
                className="font-bold text-accent hover:underline"
              >
                Back to Sign in
              </button>
            )}
          </p>
        </div>

        {/* Note about email confirmation */}
        {view === 'signup' && (
          <p className="text-center mt-4 text-xs text-muted-foreground">
            You may need to verify your email before signing in.
            <br />
            Check your Supabase settings to disable email confirmation for testing.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Auth;
