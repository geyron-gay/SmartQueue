import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosClient from '../api/axios';

// 1. Define the shape of your context data
interface AuthContextData {
    user: any;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (formData: any) => Promise<void>;
    logout: () => Promise<void>; 
}

// 2. Initialize with the interface to stop the "Property doesn't exist" errors
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    async function loadStorageData() {
        try {
            const authDataSerialized = await AsyncStorage.getItem('@AuthData');
            if (authDataSerialized) {
                const _authData = JSON.parse(authDataSerialized);
                setToken(_authData.token);
                setUser(_authData.user);
                axiosClient.defaults.headers.common['Authorization'] = `Bearer ${_authData.token}`;
            }
        } catch (error) {
            console.error("Storage Load Error:", error);
        } finally {
            setLoading(false);
        }
    }

    const login = async (email: string, password: string) => {
        const response = await axiosClient.post('/loginUser', { email, password });
        const data = { token: response.data.access_token, user: response.data.user };
        
        setUser(data.user);
        setToken(data.token);
        axiosClient.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        
        await AsyncStorage.setItem('@AuthData', JSON.stringify(data));
    };

    const register = async (formData: any) => {
        const response = await axiosClient.post('/registerUser', formData);
        const data = { token: response.data.access_token, user: response.data.user };
        
        setUser(data.user);
        setToken(data.token);
        axiosClient.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        
        await AsyncStorage.setItem('@AuthData', JSON.stringify(data));
    };

    const logout = async () => {
        await AsyncStorage.removeItem('@AuthData');
        setUser(null);
        setToken(null);
        delete axiosClient.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);