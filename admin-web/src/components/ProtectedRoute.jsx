import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRole }) {
    const { user, loading } = useAuth();

    console.log("Bouncer Stats -> Loading:", loading, "User:", user);

    // 1. If we are still fetching the user, show a loading screen
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <h1>Verifying Credentials...</h1>
            </div>
        );
    }

    // 2. If loading is finished and there is NO user, go to login
    if (!user) {
        console.log("Bouncer: No user found, kicking to login.");
        return <Navigate to="/login" replace />;
    }

    // 3. If user exists but role is wrong, go to unauthorized
    if (user && user.role !== allowedRole) {
        console.log("Bouncer: Wrong role! User is:", user.role, "but needs:", allowedRole);
        return <Navigate to="/unauthorized" replace state={{allowedRole}}/>;
    }

    // 4. Everything is perfect!
    console.log("Bouncer: Access Granted!");
    return children;
}