import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axios';
import { SafeAreaView } from 'react-native-safe-area-context';
const COLORS = {
    navy: '#0B1F3A',
    navyLight: '#1A3658',
    gold: '#D4A017',
    white: '#FFFFFF',
    gray: '#8A9BB0',
    error: '#FF5252'
};

export default function EditProfileScreen() {
    const { user, updateUser, handleApiError } = useAuth();
    const router = useRouter();

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [username, setUsername] = useState(user?.username || '');
    const [department, setDepartment] = useState(user?.department || '');
    
    const [password, setPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
    // 1. Validation: If changing sensitive info, current password is REQUIRED
    const isChangingSensitiveInfo = 
        password.length > 0 || 
        email !== user.email || 
        name !== user.name ||
        username !== user.username ||
        department !== user.department;

    if (isChangingSensitiveInfo && !currentPassword) {
        Alert.alert("Security Check", "Please enter your current password to authorize these changes.");
        return;
    }

    setSaving(true);
    try {
        const payload: any = {
            name,
            email,
            username,
            department,
            current_password: currentPassword, // Always send this for verification
        };

        if (password) {
            payload.new_password = password;
            payload.new_password_confirmation = confirmPassword;
        }

        const response = await axiosClient.put('/user/update', payload);
        
         updateUser(response.data.user);
        
        Alert.alert("Success", "Profile secured and updated!");
        router.back();
    } catch (error: any) {
        // If the old password was wrong, handleApiError will catch the 422 or 401
        handleApiError(error);
    } finally {
        setSaving(false);
    }
};


    return (
<>
         <Stack.Screen options={{ headerTitle: 'Edit Profile', headerStyle: {backgroundColor: COLORS.navy}, headerTintColor: '#FACC15', headerTitleStyle: { fontWeight: 'bold' } }} />  
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    
                    {/* Header Section */}
                    <View style={styles.header}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>
                                {name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <Text style={styles.studentIdText}>ID: {user?.student_id}</Text>
                        <Text style={styles.roleBadge}>{user?.role?.toUpperCase()}</Text>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.form}>
                        <Text style={styles.sectionTitle}>Personal Information</Text>
                        
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput 
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter full name"
                                placeholderTextColor={COLORS.gray}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput 
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Username</Text>
                            <TextInput 
                                style={styles.input}
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Department</Text>
                            <TextInput 
                                style={styles.input}
                                value={department}
                                onChangeText={setDepartment}
                            />
                        </View>

                        <View style={styles.divider} />

                        <Text style={styles.sectionTitle}>Security</Text>
                        <Text style={styles.infoNote}>Leave blank if you don't want to change password</Text>

                        <View style={styles.inputGroup}>
    <Text style={[styles.label, { color: COLORS.gold }]}>Verify Identity</Text>
    <TextInput 
        style={[styles.input, { borderColor: COLORS.gold }]}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        placeholder="Enter CURRENT password to save"
        placeholderTextColor={COLORS.gray}
    />
</View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>New Password</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput 
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    placeholder="Enter new password"
                                    placeholderTextColor={COLORS.gray}
                                />
                                <TouchableOpacity 
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}
                                >
                                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={COLORS.gold} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirm New Password</Text>
                            <TextInput 
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword}
                                placeholder="Confirm new password"
                                placeholderTextColor={COLORS.gray}
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.saveBtn, saving && styles.btnDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color={COLORS.navy} />
                            ) : (
                                <>
                                    <MaterialIcons name="check" size={20} color={COLORS.navy} />
                                    <Text style={styles.saveBtnText}>Save Changes</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.navy,
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.gold,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.navy,
    },
    studentIdText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    roleBadge: {
        color: COLORS.gold,
        fontSize: 12,
        marginTop: 4,
        letterSpacing: 1,
    },
    form: {
        backgroundColor: COLORS.navyLight,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(212,160,23,0.1)',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.gold,
        marginBottom: 15,
    },
    infoNote: {
        color: COLORS.gray,
        fontSize: 12,
        fontStyle: 'italic',
        marginBottom: 15,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: COLORS.white,
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 15,
        color: COLORS.white,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    eyeIcon: {
        padding: 15,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 20,
    },
    saveBtn: {
        backgroundColor: COLORS.gold,
        flexDirection: 'row',
        padding: 18,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    saveBtnText: {
        color: COLORS.navy,
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 10,
    },
    btnDisabled: {
        opacity: 0.6,
    }
});