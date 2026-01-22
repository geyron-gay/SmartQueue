import axios from "axios"; 
import axiosClient from "../api/axios";
import { useState } from "react";

export const useAuth = () => {
    const [user, setUser] = useState(null);

   const login = async (email, password) => {
    // 1. Handshake (This is outside the API prefix, so we use full URL)
    await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });
    
    // 2. Login (This will now use http://localhost:8000/api/login)
    await axiosClient.post('/login', { email, password });
        
        // 3. Fetch the actual user data
        const res = await axiosClient.get('/user');
        setUser(res.data);
        return res.data;
    };

const register = async (data) => {
    // 1. We must use the base axios to get the cookie from the main URL
    // Make sure 'import axios from "axios"' is at the top of this file!
    await axios.get('http://localhost:8000/sanctum/csrf-cookie', { 
        withCredentials: true 
    });
    
    // 2. Now perform the POST
    return await axiosClient.post('/register', data);
};

    return { user, login, register };
};