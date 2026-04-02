import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosClient from '../api/axios';
import { Alert } from 'react-native';

// 1. Define the shape of your context data
interface AuthContextData {
    user: any;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (formData: any) => Promise<void>;
    logout: () => Promise<void>; 
    handleApiError: (error: any) => boolean;
    updateUser: (userData: any) => void;
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

    const login = async (identifier: string, password: string) => {
        const response = await axiosClient.post('/loginUser', { identifier, password });
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

    const updateUser = async (userData: any) => {
    const updatedUser = { ...user, ...userData };

    setUser(updatedUser);

    // 🔥 keep AsyncStorage in sync
    const stored = await AsyncStorage.getItem('@AuthData');
    if (stored) {
        const parsed = JSON.parse(stored);
        parsed.user = updatedUser;
        await AsyncStorage.setItem('@AuthData', JSON.stringify(parsed));
    }
};

 const handleApiError = (error: any): boolean => {
        const status = error.response?.status;
        const message = error.response?.data?.error;
        const errors = error.response?.data?.errors;

        switch (status) {
            case 401:
                // Session expired / invalid token → auto logout
                Alert.alert(
                    "Session Expired",
                    "Please log in again to continue.",
                    [{ text: "OK", onPress: logout }]
                );
                return true;

            case 403:
                // Forbidden / restricted access
                Alert.alert(
                    "Access Denied",
                    message || "You don't have permission to perform this action."
                );
                return true;

            case 422:
                // Validation errors from backend
                if (errors) {
                    const messages = Object.values(errors).flat().join('\n');
                    Alert.alert("Validation Error", messages);
                } else {
                    Alert.alert("Validation Error", message || "Please check your input.");
                }
                return true;

            case 404:
                Alert.alert("Not Found", message || "The requested resource was not found.");
                return true;

            case 409:
                Alert.alert("Conflict", message || "This action conflicts with existing data.");
                return true;

            case 500:
                Alert.alert("Server Error", "Something went wrong on our end. Please try again later.");
                return true;

            default:
                // Unhandled error → let caller decide what to do
                return false;
        }
    };
    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout,handleApiError,updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);