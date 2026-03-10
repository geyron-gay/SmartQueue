import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axiosClient from '../../src/api/axios';

export default function ResetPassword() {
    const { email } = useLocalSearchParams();
    const router = useRouter();

    const [step, setStep] = useState(1); // Step 1: PIN, Step 2: New Password
    const [pin, setPin] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [loading, setLoading] = useState(false);

    // 🛡️ Function to check if the PIN is correct
    const verifyPin = async () => {
        if (pin.length < 6) return Alert.alert("Error", "Please enter the 6-digit PIN.");
        
        setLoading(true);
        try {
            // We'll create a simple endpoint in Laravel to just check the PIN
            await axiosClient.post('/verify-pin', { email, token: pin });
            setStep(2); // ✅ PIN is correct, move to Step 2
        } catch (e: any) {
            Alert.alert("Error", "Invalid or expired PIN.");
        } finally {
            setLoading(false);
        }
    };

    // 💾 Function to save the new password
    const handleUpdatePassword = async () => {
        setLoading(true);
        try {
            await axiosClient.post('/reset-password', {
                email,
                token: pin,
                password,
                password_confirmation: passwordConfirm,
            });
            Alert.alert("Success", "Password updated!", [{ text: "Login", onPress: () => router.replace('/Login') }]);
        } catch (e: any) {
            Alert.alert("Error", "Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {step === 1 ? (
                // 🚪 STEP 1: PIN ENTRY
                <View style={styles.card}>
                    <Text style={styles.title}>Verify PIN</Text>
                    <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="000000" 
                        value={pin} 
                        onChangeText={setPin} 
                        keyboardType="number-pad" 
                        maxLength={6}
                    />
                    <TouchableOpacity style={styles.button} onPress={verifyPin} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify PIN</Text>}
                    </TouchableOpacity>
                </View>
            ) : (
                // 🔑 STEP 2: NEW PASSWORD
                <View style={styles.card}>
                    <Text style={styles.title}>New Password</Text>
                    <Text style={styles.subtitle}>Set your new secure password</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="New Password" 
                        value={password} 
                        onChangeText={setPassword} 
                        secureTextEntry 
                    />
                    <TextInput 
                        style={styles.input} 
                        placeholder="Confirm Password" 
                        value={passwordConfirm} 
                        onChangeText={setPasswordConfirm} 
                        secureTextEntry 
                    />
                    <TouchableOpacity style={[styles.button, {backgroundColor: '#28a745'}]} onPress={handleUpdatePassword} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA', justifyContent: 'center', padding: 20 },
    card: { backgroundColor: '#fff', padding: 25, borderRadius: 15, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 25 },
    input: { backgroundColor: '#F9FAFB', height: 55, borderRadius: 10, paddingHorizontal: 15, fontSize: 18, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
    button: { backgroundColor: '#007BFF', height: 55, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});