import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
    const { register } = useAuth();
    const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    password_confirmation: '',
    role: 'staff' // 👈 Default new registrations to staff
});

    const handleSubmit = async (e) => {
        e.preventDefault();
  
    try {
        await register(form);
        alert("Account created! Now please log in.");
    } catch (err) {
 
        console.error("Register Error:", err.response?.data || err.message);
    }
// ...
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <form onSubmit={handleSubmit} className="p-10 bg-white shadow-xl rounded-2xl w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6">Create Staff Account</h1>
                <input className="w-full p-3 mb-4 border rounded" type="text" placeholder="Full Name" 
                    onChange={e => setForm({...form, name: e.target.value})} />
                <input className="w-full p-3 mb-4 border rounded" type="email" placeholder="Email" 
                    onChange={e => setForm({...form, email: e.target.value})} />
                <input className="w-full p-3 mb-4 border rounded" type="password" placeholder="Password" 
                    onChange={e => setForm({...form, password: e.target.value})} />
                <input className="w-full p-3 mb-6 border rounded" type="password" placeholder="Confirm Password" 
                    onChange={e => setForm({...form, password_confirmation: e.target.value})} />
                <button className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold">Register</button>
            </form>
        </div>
    );
}