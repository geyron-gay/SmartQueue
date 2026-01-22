import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');


const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Checkpoint 1: Button Clicked");

    try {
        const result = await login(email, password); 
        
        console.log("Checkpoint 2: Login Function Finished");
        console.log("Checkpoint 3: What is inside result? ->", result);

        if (!result) {
            console.log("Checkpoint 4: Result is NULL or Undefined!");
            return;
        }

        if (result.role === 'staff') {
            console.log("Checkpoint 5: Role is staff. Navigating now...");
            navigate('/staff/dashboard');
        } else if (result.role === 'admin') {
            console.log("Checkpoint 5: Role is admin. Navigating now...");
            navigate('/admin/dashboard');
        } else {
            console.log("Checkpoint 6: Role is something else:", result.role);
        }

    } catch (err) {
        console.log("Checkpoint ERROR: Something crashed!");
        console.error(err);
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

                {/* Sign Up button using Link */}
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