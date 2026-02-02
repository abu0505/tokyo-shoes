import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import TextLoader from './TextLoader';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
    const { session, isLoading, isAdmin } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <TextLoader text="Verifying access" />
            </div>
        );
    }

    // If not logged in, redirect to auth page
    if (!session) {
        // Save the location we were trying to access to redirect back after login (optional, but good UX)
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // If admin is required but user is not admin and not currently loading admin status (which is covered by isLoading)
    if (requireAdmin && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
