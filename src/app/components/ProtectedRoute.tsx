import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string | string[];
}

/**
 * Renders children only when user is logged in; otherwise redirects to /login.
 * If requiredRole is provided, also checks if user has the required role(s).
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-muted-foreground font-medium">Đang tải...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role if required
    if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        const userRole = (user as { role?: string })?.role;

        if (!userRole || !roles.includes(userRole)) {
            return <Navigate to="/home" replace />;
        }
    }

    return <>{children}</>;
}
