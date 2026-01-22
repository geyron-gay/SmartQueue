import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axios';

export default function AdminDashboard() {
    const { user,logout } = useAuth();

    const testAdminApi = async () => {
        try {
            const res = await axiosClient.get('/admin/stats');
            alert("Backend says: " + res.data.message);
        } catch (err) {
            alert("Backend Blocked You: " + err.response?.data?.message);
        }
    };

    return (
        <div className="p-8 bg-blue-50 min-h-screen">
            <h1 className="text-3xl font-bold text-blue-800">Admin Control Center 🛡️</h1>
            <p className="mt-4">Welcome, {user?.name}. You have full system access.</p>
            
            <div className="mt-6 p-6 bg-white rounded-xl shadow-md inline-block">
                <h2 className="font-semibold mb-2">Security Test:</h2>
                <button 
                    onClick={testAdminApi}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Call Admin-Only API
                </button>
            </div>
            
            <button 
                onClick={logout}
                style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}
            >
                Logout
                </button>
        </div>
    );
}