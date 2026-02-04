import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Auto-redirect if already logged in
    useEffect(() => {
        if (user) {
            if (user.role === 'staff') {
                navigate('/staff/dashboard');
            } else if (user.role === 'admin') {
                navigate('/admin/dashboard');
            }
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const result = await login(email, password);
            if (result.role === 'staff') {
                navigate('/staff/dashboard');
            } else if (result.role === 'admin') {
                navigate('/admin/dashboard');
            }
        } catch (err) {
            console.error("Login failed:", err);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <form onSubmit={handleSubmit} className="p-10 bg-white shadow-xl rounded-2xl w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6">Staff Login</h1>
                <input
                    className="w-full p-3 mb-4 border rounded"
                    type="email"
                    placeholder="Email"
                    onChange={e => setEmail(e.target.value)}
                />
                <input
                    className="w-full p-3 mb-6 border rounded"
                    type="password"
                    placeholder="Password"
                    onChange={e => setPassword(e.target.value)}
                />
                <button className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold">
                    Sign In
                </button>

                <div className="mt-4 text-center">
                    <Link
                        to="/register"
                        className="inline-block w-full bg-gray-200 text-indigo-600 p-3 rounded-lg font-semibold hover:bg-gray-300"
                    >
                        Sign Up
                    </Link>
                </div>
            </form>
        </div>
    );
}