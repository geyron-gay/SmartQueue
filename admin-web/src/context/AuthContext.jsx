import { createContext, useContext, useState, useEffect } from "react";
import axiosClient from "../api/axios";
import axios from "axios";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // This function checks if the user is already logged in when the app starts
    const getUser = async () => {
        try {
            const res = await axiosClient.get('/user');
            setUser(res.data);
        } catch (e) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // Inside your AuthProvider...

const logout = async () => {
    try {
        // 1. Tell Laravel to kill the session
        await axiosClient.post('/logout');
        
        // 2. Clear the user state in React
        setUser(null);
        
        // 3. Optional: Force a refresh or redirect to login
        window.location.href = '/login'; 
    } catch (e) {
        console.error("Logout failed:", e);
    }
};

const login = async (email, password) => {
    // 1. Get the cookie
    await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });
    
    // 2. Perform login (This gives the 204)
    await axiosClient.post('/login', { email, password });
    
    // 3. IMMEDIATELY fetch the user data
    try {
        const res = await axiosClient.get('/user');
        console.log("User fetched after login:", res.data); // Debug log
        setUser(res.data);
        return res.data; // This goes back to Login.jsx
    } catch (error) {
        console.error("Could not fetch user after successful login", error);
        throw error;
    }
};
    useEffect(() => {
        getUser(); // Check for user on page load/refresh
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, loading , logout}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);