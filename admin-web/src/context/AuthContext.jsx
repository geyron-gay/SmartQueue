import { createContext, useContext, useState, useEffect } from "react";
import axiosClient from "../api/axios";
import axios from "axios";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage immediately on app start
  useEffect(() => {
        getUser();
    }, []);

    const getUser = async () => {
        try {
            const res = await axiosClient.get("/user");
            setUser(res.data);
            localStorage.setItem("user", JSON.stringify(res.data));
        } catch (e) {
            setUser(null);
            localStorage.removeItem("user");
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        // 1. Get CSRF cookie
     // OLD: await axios.get("http://10.124.34.165:8090/sanctum/csrf-cookie", ...);

// NEW: Use the /api prefix so Nginx picks it up
await axios.get("http://192.168.112.165:5173/sanctum/csrf-cookie", { withCredentials: true });

        // 2. Perform login
        await axiosClient.post("/login", { email, password });

        // 3. Fetch user data
        try {
            const res = await axiosClient.get("/user");
            setUser(res.data);
            localStorage.setItem("user", JSON.stringify(res.data)); // persist
            return res.data;
        } catch (error) {
            console.error("Could not fetch user after login", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await axiosClient.post("/logout");
            setUser(null);
            localStorage.removeItem("user");
            window.location.href = "/login";
        } catch (e) {
            console.error("Logout failed:", e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, loading, logout , getUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);