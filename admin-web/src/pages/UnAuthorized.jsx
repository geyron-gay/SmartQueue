import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

export default function Unauthorized() {
    const { user } = useAuth();
    const location = useLocation();
    const { allowedRole } = location.state || {}; // fallback if state is missing

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-center p-6">
            <h1 className="text-6xl font-bold text-red-600 mb-4">403</h1>
            <h2 className="text-2xl font-semibold mb-2">
                Access Denied, Bro! You are a {user?.role} ✋ not a {allowedRole}
            </h2>
            <p className="text-gray-600 mb-6">
                You don't have the right permissions to see this page.
            </p>
            <Link 
                to="/login" 
                className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-black">
                Back to Login
            </Link>
        </div>
    );
}