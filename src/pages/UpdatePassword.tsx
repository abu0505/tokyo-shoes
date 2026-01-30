
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import TextLoader from '@/components/TextLoader';
import { toast } from 'sonner';

const updatePasswordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

const UpdatePassword = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    // Check if we have a valid session to update password
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // Sometimes the session is not immediately available after the hash fragment redirect
                // Give it a small delay or check URL hash for access_token
                const hash = window.location.hash;
                if (hash && hash.includes('access_token')) {
                    // Supabase handles the session setting automatically from hash, 
                    // but we might need to wait a tick
                    const { data: { session: newSession }, error } = await supabase.auth.getSession();
                    if (newSession) {
                        setCheckingSession(false);
                        return;
                    }
                }

                toast.error("Invalid or expired password reset link.");
                navigate('/auth');
            } else {
                setCheckingSession(false);
            }
        };

        // We can rely on onAuthStateChange as well, which might be safer
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setCheckingSession(false);
            } else if (session) {
                setCheckingSession(false);
            }
        });

        checkSession();

        return () => {
            subscription.unsubscribe();
        };
    }, [navigate]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<UpdatePasswordFormData>({
        resolver: zodResolver(updatePasswordSchema),
    });

    const onSubmit = async (data: UpdatePasswordFormData) => {
        setIsSubmitting(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: data.password
            });

            if (error) {
                toast.error(error.message);
            } else {
                toast.success("Password updated successfully");
                navigate('/');
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred while updating the password");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <TextLoader isWhite={false} />
            </div>
        );
    }

    return (
        <motion.div
            className="min-h-screen bg-background flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <motion.div
                className="w-full max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black tracking-tighter">TOKYO</h1>
                    <p className="text-muted-foreground mt-2 text-sm font-medium">
                        Set New Password
                    </p>
                </div>

                <div className="bg-card border-2 border-foreground p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="font-bold text-sm tracking-wide">
                                NEW PASSWORD
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
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

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="font-bold text-sm tracking-wide">
                                CONFIRM PASSWORD
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10 h-12 border-2 border-foreground focus:border-accent"
                                    {...register('confirmPassword')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-sm text-destructive font-medium">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 bg-foreground text-background hover:bg-accent hover:text-accent-foreground font-bold text-lg transition-all"
                        >
                            {isSubmitting ? <TextLoader className="text-background" isWhite /> : 'UPDATE PASSWORD'}
                        </Button>
                    </form>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default UpdatePassword;
