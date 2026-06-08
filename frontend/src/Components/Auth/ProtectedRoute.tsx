import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

const homeForRole = (role: string) => {
    if (role === 'organization_staff') return '/staff/dashboard';
    if (role === 'organization_admin') return '/org-admin';
    if (role === 'admin') return '/admin';
    return '/';
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { user, token, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!token || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to={homeForRole(user.role)} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
