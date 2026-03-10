import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router'; // Add this for navigation
import axiosClient from '../../src/api/axios';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const router = useRouter();

    const handleSend = async () => {
        try {
            await axiosClient.post('/forgot-password', { email });
            Alert.alert("Code Sent!", "Please check your email for the 6-digit PIN.");
            // 🚀 Navigate to the Reset screen and pass the email so the user doesn't have to re-type it
            router.push({ pathname: '/passwords/ResetPassword', params: { email: email } });
        } catch (e) {
            Alert.alert("Error", "User not found or server error.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>Enter your email to receive a reset PIN</Text>
            <TextInput 
                style={styles.input} 
                placeholder="Enter your email" 
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TouchableOpacity style={styles.button} onPress={handleSend}>
                <Text style={styles.buttonText}>Send Reset PIN</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold' },
    subtitle: { fontSize: 14, color: 'gray', marginBottom: 20, textAlign: 'center' },
    input: { width: '100%', height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 5, paddingHorizontal: 10, marginBottom: 20 },
    button: { backgroundColor: '#007BFF', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 5, width: '100%' },
    buttonText: { color: '#fff', fontSize: 16, textAlign: 'center' },
});