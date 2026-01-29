import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, 
    StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons'; // 👈 Consistency with Register

export default function LoginScreen() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // 👈 Eye toggle state

    const handleLogin = async () => {
        // 1. 🧹 SANITIZE: Trim spaces (common typo for students)
        const cleanEmail = email.trim();

        if (!cleanEmail || !password) {
            Alert.alert("Missing Info", "Please enter both email and password.");
            return;
        }

        setLoading(true);
        try {
            // 2. ⏳ TIMEOUT LOGIC: We "race" the login against a 15s timer
            const loginPromise = login(cleanEmail, password);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('TIMEOUT')), 15000)
            );

            await Promise.race([loginPromise, timeoutPromise]);

            router.replace('/(tabs)' as any);
        } catch (error: any) {
            console.error(error);
            let errorMsg = "Invalid credentials. Please try again.";
            
            if (error.response?.status === 429) {
        
        Alert.alert(
            "Too Many Attempts", 
            "For security, your account is temporarily locked. Please try again in 1 minute."
        );
    }
            if (error.message === 'TIMEOUT') {
                errorMsg = "Connection is too slow. Please check your signal or TMC Wi-Fi.";
            } else if (error.response?.status === 401) {
                errorMsg = "Incorrect email or password.";
            } else if (error.response?.status === 500) {
                errorMsg = "Server is currently down. Please try again later.";
            }

            Alert.alert("Login Failed", errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.container}
        >
            <View style={styles.inner}>
                <Text style={styles.logo}>🏫</Text>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Log in to join the queue</Text>

                <View style={styles.inputGroup}>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Email Address" 
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />

                    {/* 4. 👁️ CONSISTENT PASSWORD BOX */}
                    <View style={styles.passwordContainer}>
                        <TextInput 
                            style={styles.inputInsideContainer} 
                            placeholder="Password" 
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity 
                            style={styles.eyeIcon} 
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <MaterialIcons 
                                name={showPassword ? "visibility" : "visibility-off"} 
                                size={22} 
                                color="#666" 
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 5. 🔑 FORGOT PASSWORD LINK (The "Life Hack" version) */}
                <TouchableOpacity onPress={() => Alert.alert("Account Recovery", "Please visit the IT department or answer your security questions.")}>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.loginBtn, (loading || !email || !password) && styles.disabledBtn]} 
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.loginBtnText}>Login</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/Register' as any)}>
                    <Text style={styles.registerLink}>
                        Don't have an account? <Text style={{fontWeight: 'bold', color: '#16a34a'}}>Sign Up</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    inner: { flex: 1, padding: 30, justifyContent: 'center' },
    logo: { fontSize: 60, textAlign: 'center', marginBottom: 10 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#16a34a', textAlign: 'center' },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 },
    inputGroup: { marginBottom: 10 },
    input: { 
        backgroundColor: '#f9fafb', 
        padding: 15, 
        borderRadius: 12, 
        marginBottom: 15, 
        borderWidth: 1, 
        borderColor: '#e5e7eb',
        fontSize: 16
    },
    // Reuse these from your Register screen!
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
    },
    inputInsideContainer: {
        flex: 1,
        padding: 15,
        fontSize: 16,
    },
    eyeIcon: {
        paddingHorizontal: 15,
    },
    forgotText: {
        textAlign: 'right',
        color: '#16a34a',
        fontWeight: '600',
        marginBottom: 20,
    },
    loginBtn: { 
        backgroundColor: '#16a34a', 
        padding: 18, 
        borderRadius: 12, 
        alignItems: 'center', 
        elevation: 2,
    },
    disabledBtn: {
        backgroundColor: '#9ca3af',
    },
    loginBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    registerLink: { textAlign: 'center', marginTop: 25, color: '#666', fontSize: 15 }
});