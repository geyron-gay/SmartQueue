// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRole }) {
    const { user, loading } = useAuth();

    console.log("Bouncer Stats -> Loading:", loading, "User:", user);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <h1>Verifying Credentials...</h1>
            </div>
        );
    }

    if (!user) {
        console.log("Bouncer: No user found, kicking to login.");
        return <Navigate to="/login" replace />;
    }

    // ✅ SUPER SENIOR FIX: Handle both single strings AND arrays of roles
    const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    
    if (!roles.includes(user.role)) {
        console.log("Bouncer: Wrong role! User is:", user.role, "but needs one of:", roles);
        return <Navigate to="/unauthorized" replace state={{ allowedRole: roles }} />;
    }

    console.log("Bouncer: Access Granted!");
    return children;
}