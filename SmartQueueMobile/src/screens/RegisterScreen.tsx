import React, { useState, useMemo } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, 
    StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
// Import a checkbox tool or use a simple TouchableOpacity for the toggle
import { MaterialIcons } from '@expo/vector-icons'; 
import { DimensionValue } from 'react-native';

export default function RegisterScreen() {
    const { register } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [agreeToTerms, setAgreeToTerms] = useState(false); // 📜 Privacy Toggle
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        student_id: '',
        password: '',
        password_confirmation: '',
        user_type: 'student',
        role: 'user'
    });

    // 🛡️ 1. REGEX GUARD: Enforce Student ID format (e.g., 2024-0001)
            const validateStudentId = (id: string) => {
  // Must start with "23-0" followed by 6 digits
        const regex = /^23-0\d{5}$/;
             return regex.test(id);
};

    // 💪 2. PASSWORD STRENGTH LOGIC
    const passwordStrength = useMemo(() => {
        if (!form.password) return { label: '', color: '#e5e7eb', width: '0%' };
        if (form.password.length < 6) return { label: 'Weak', color: '#ef4444', width: '33%' };
        if (form.password.length < 10) return { label: 'Good', color: '#f59e0b', width: '66%' };
        return { label: 'Strong', color: '#22c55e', width: '100%' as DimensionValue };
    }, [form.password]);

    const handleRegister = async () => {
        // --- PRODUCTION LEVEL VALIDATION ---
        if (!form.name || !form.email || !form.password) {
            Alert.alert("Missing Info", "Please fill in all required fields.");
            return;
        }

        if (form.user_type === 'student' && !validateStudentId(form.student_id)) {
            Alert.alert("Invalid ID", "Please use the format: YY-XXXXXX (e.g., 23-0*****)");
            return;
        }

        if (form.password !== form.password_confirmation) {
            Alert.alert("Wait!", "Passwords do not match.");
            return;
        }

        if (!agreeToTerms) {
            Alert.alert("Data Privacy", "Please agree to the TMC Data Privacy Policy to continue.");
            return;
        }

        setLoading(true);
        try {
            await register(form);
            Alert.alert("Success", "Welcome to TMC Smart Queue!");
            router.replace('/(tabs)'); 
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Registration failed.";
            Alert.alert("Registration Error", errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Trinidad Municipal College</Text>

                {/* 🔘 TOGGLE SWITCH */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity 
                        style={[styles.toggleBtn, form.user_type === 'student' && styles.activeToggle]}
                        onPress={() => setForm({...form, user_type: 'student'})}
                    >
                        <Text style={[styles.toggleText, form.user_type === 'student' && styles.activeToggleText]}>Student</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.toggleBtn, form.user_type === 'visitor' && styles.activeToggle]}
                        onPress={() => setForm({...form, user_type: 'visitor', student_id: ''})}
                    >
                        <Text style={[styles.toggleText, form.user_type === 'visitor' && styles.activeToggleText]}>Visitor</Text>
                    </TouchableOpacity>
                </View>

                {/* 📝 FORM INPUTS */}
                <View style={styles.inputGroup}>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Full Name" 
                        value={form.name}
                        onChangeText={(text) => setForm({...form, name: text})}
                    />

                    <TextInput 
                        style={styles.input} 
                        placeholder="Email Address" 
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={form.email}
                        onChangeText={(text) => setForm({...form, email: text})}
                    />

                    {form.user_type === 'student' && (
                        <TextInput
                         style={styles.input}
                         placeholder="Student ID (e.g. 23-0123456)"
                         value={form.student_id}
                         maxLength={10} // "23-" + 7 digits = 10 chars total
                         keyboardType="numeric"
                         onChangeText={(text) => {
                         // Remove non-digits
            const cleaned = text.replace(/[^0-9]/g, '');

             let formatted = cleaned;

    // If starts with "23" and has more than 2 digits, insert the dash after "23"
              if (cleaned.length > 2 && cleaned.startsWith("23")) {
                 formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2, 8)}`;
                    }

                setForm({ ...form, student_id: formatted });
                 }}
                />

                    )}
                <View style={styles.passwordContainer}>
                 <TextInput 
        style={styles.inputInsideContainer} // 👈 Use the new style here!
        placeholder="Password"
        secureTextEntry={!showPassword}
        value={form.password}
        onChangeText={(text) => setForm({...form, password: text})}
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

                    {/* 📊 PASSWORD STRENGTH BAR */}
                    {form.password.length > 0 && (
                        <View style={styles.strengthWrapper}>
                            <View style={[
                             styles.strengthBar, 
                    { backgroundColor: passwordStrength.color, width: passwordStrength.width as any } // 👈 Add 'as any' here
                                ]} />
                            <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
                        </View>
                    )}

                    <TextInput 
                        style={styles.input} 
                        placeholder="Confirm Password" 
                        secureTextEntry
                        value={form.password_confirmation}
                        onChangeText={(text) => setForm({...form, password_confirmation: text})}
                        returnKeyType='done'
                    />
                </View>

                {/* ✅ PRIVACY TOGGLE */}
                <TouchableOpacity 
                    style={styles.checkboxContainer} 
                    onPress={() => setAgreeToTerms(!agreeToTerms)}
                >
                    <MaterialIcons 
                        name={agreeToTerms ? "check-box" : "check-box-outline-blank"} 
                        size={24} 
                        color={agreeToTerms ? "#16a34a" : "#666"} 
                    />
                    <Text style={styles.checkboxText}>
                        I agree to the TMC Data Privacy Policy (R.A. 10173)
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.registerBtn, (!agreeToTerms || loading) && styles.disabledBtn]} 
                    onPress={handleRegister}
                    disabled={loading || !agreeToTerms}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerBtnText}>Sign Up</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/Login')}>
                    <Text style={styles.loginLink}>Already have an account? <Text style={{fontWeight: 'bold', color: '#16a34a'}}>Sign In</Text></Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContainer: { padding: 30, paddingBottom: 50 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#16a34a', textAlign: 'center', marginTop: 40 },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
    toggleContainer: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 12, padding: 5, marginBottom: 25 },
    toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
    activeToggle: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1 },
    toggleText: { color: '#666', fontWeight: '600' },
    activeToggleText: { color: '#16a34a' },
    inputGroup: { marginBottom: 10 },
    input: { backgroundColor: '#f9fafb', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e5e7eb' },
    strengthWrapper: { marginBottom: 15, marginTop: -10 },
    strengthBar: { height: 4, borderRadius: 2 },
    strengthLabel: { fontSize: 12, fontWeight: 'bold', marginTop: 4, textAlign: 'right' },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingRight: 20 },
    checkboxText: { fontSize: 13, color: '#666', marginLeft: 8 },
    registerBtn: { backgroundColor: '#16a34a', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    disabledBtn: { backgroundColor: '#9ca3af' },
    registerBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    loginLink: { textAlign: 'center', marginTop: 20, color: '#666' },
    passwordContainer: {
        flexDirection: 'row', // This puts the input and the eye icon on the same line
        alignItems: 'center', // This centers the icon vertically
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden', // This ensures the inner input doesn't "leak" out of the rounded corners
    },
    inputInsideContainer: {
        flex: 1, // This makes the text input take up all the available space
        padding: 15,
        fontSize: 16,
        color: '#000',
    },
    eyeIcon: {
        paddingHorizontal: 15, // Gives the icon some clickable space
        justifyContent: 'center',
        alignItems: 'center',
    },
});