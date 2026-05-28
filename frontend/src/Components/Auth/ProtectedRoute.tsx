import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

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
        // If user is a 'user' and not selected an org yet, they shouldn't be here but let's redirect to picker if needed
        // Otherwise just redirect to home or unauthorized
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
