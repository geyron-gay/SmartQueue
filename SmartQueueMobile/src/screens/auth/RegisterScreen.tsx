import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView,
    Animated, StatusBar, Image, DimensionValue
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';

const COLORS = {
    navy:      '#0B1F3A',
    navyMid:   '#132847',
    navyLight: '#1A3658',
    navyCard:  '#152E4D',
    gold:      '#D4A017',
    goldLight: '#F0C040',
    white:     '#FFFFFF',
    gray:      '#8A9BB0',
    grayLight: '#C3CFDB',
    border:    'rgba(212,160,23,0.22)',
    inputBg:   'rgba(255,255,255,0.06)',
    shadow:    '#000000',
    red:       '#EF4444',
    amber:     '#F59E0B',
    green:     '#22C55E',
};

const departmentData = [
  { label: 'IT Department', value: 'BSIT' },
  { label: 'BSOA Department', value: 'BSOA' },
  { label: 'BSED Department', value: 'EDUC' },
  { label: 'BSCRIM Department ', value: 'CRIM' },
  { label: 'CAS Department ', value: 'CAS' },
];

const priorityData = [
  { label: 'Regular', value: 'regular' },
  { label: 'Senior Citizen', value: 'senior' },
  { label: 'PWD', value: 'pwd' },
  { label: 'Pregnant', value: 'pregnant' },
];

function AnimatedInput({
    icon, placeholder, value, onChangeText,
    secureTextEntry, showToggle, onToggle,
    keyboardType, maxLength, autoCapitalize
}: any) {
    const [focused, setFocused] = useState(false);
    const borderAnim = useRef(new Animated.Value(0)).current;

    const onFocus = () => {
        setFocused(true);
        Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    };
    const onBlur = () => {
        setFocused(false);
        Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    };

    const borderColor = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.border, COLORS.gold],
    });

    return (
        <Animated.View style={[styles.inputWrapper, { borderColor }]}>
            <MaterialIcons
                name={icon}
                size={19}
                color={focused ? COLORS.gold : COLORS.gray}
                style={styles.inputIcon}
            />
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={COLORS.gray}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType || 'default'}
                maxLength={maxLength}
                autoCapitalize={autoCapitalize || 'none'}
                autoCorrect={false}
                onFocus={onFocus}
                onBlur={onBlur}
            />
            {showToggle && (
                <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
                    <MaterialIcons
                        name={secureTextEntry ? 'visibility-off' : 'visibility'}
                        size={19}
                        color={COLORS.gray}
                    />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
}

function SectionLabel({ icon, text }: { icon: string; text: string }) {
    return (
        <View style={styles.sectionLabel}>
            <MaterialIcons name={icon as any} size={14} color={COLORS.gold} />
            <Text style={styles.sectionLabelText}>{text}</Text>
        </View>
    );
}

export default function RegisterScreen() {
    const { register } = useAuth();
    const router = useRouter();

    const [loading, setLoading]           = useState(false);
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm]   = useState(false);

    const [form, setForm] = useState({
        name: '', username: '', email: '',
        student_id: '', department: '',
        password: '', password_confirmation: '',
        user_type: 'student', role: 'user',
        priority_type : 'regular'
    });

    const headerAnim = useRef(new Animated.Value(0)).current;
    const cardAnim   = useRef(new Animated.Value(30)).current;
    const fadeAnim   = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(headerAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
            Animated.timing(fadeAnim,   { toValue: 1, duration: 500, delay: 150, useNativeDriver: true }),
            Animated.spring(cardAnim,   { toValue: 0, tension: 50, friction: 9, delay: 150, useNativeDriver: true }),
        ]).start();
    }, []);


    const passwordStrength = useMemo(() => {
        if (!form.password) return { label: '', color: COLORS.border, pct: 0 };
        if (form.password.length < 6)  return { label: 'Weak',   color: COLORS.red,   pct: 0.28 };
        if (form.password.length < 10) return { label: 'Good',   color: COLORS.amber, pct: 0.62 };
        return                                { label: 'Strong',  color: COLORS.green, pct: 1.0 };
    }, [form.password]);

    const validateStudentId = (id: string) => /^23-0\d{5}$/.test(id);

    const handleRegister = async () => {
  if (
  !form.name || 
  !form.username || 
  !form.email || 
  !form.password || 
  !form.password_confirmation || 
  (form.user_type === 'student' && !form.department) || 
  (form.user_type === 'student' && !form.student_id)
) {
  Alert.alert('Missing Info', 'Please fill in all required fields.');
  return;
}
        if (form.user_type === 'student' && !validateStudentId(form.student_id)) {
            Alert.alert('Invalid ID', 'Please use the format: YY-XXXXXX (e.g. 23-0123456)');
            return;
        }
        if (form.password !== form.password_confirmation) {
            Alert.alert('Mismatch', 'Passwords do not match.');
            return;
        }
        if (!agreeToTerms) {
            Alert.alert('Data Privacy', 'Please agree to the TMC Data Privacy Policy to continue.');
            return;
        }
        setLoading(true);
        try {
            await register(form);
            Alert.alert('Success 🎉', 'Welcome to TMC Smart Queue!');
            router.replace('/(tabs)');
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Registration failed.';
            Alert.alert('Registration Error', msg);
        } finally {
            setLoading(false);
        }
    };

    const isStudent = form.user_type === 'student';

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.root}
        >
            <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

            <View style={styles.background} pointerEvents="none">
                <View style={styles.orb1} />
                <View style={styles.orb2} />
                <View style={styles.stripe} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={[
                    styles.header,
                    { opacity: headerAnim, transform: [{ scale: headerAnim }] }
                ]}>
                    <View style={styles.logoRing}>
                        <Image
                            source={require('../../../assets/images/logo.webp')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.schoolName}>TRINIDAD MUNICIPAL COLLEGE</Text>
                    <View style={styles.goldDivider} />
                </Animated.View>

                <Animated.View style={[
                    styles.card,
                    { opacity: fadeAnim, transform: [{ translateY: cardAnim }] }
                ]}>
                    <Text style={styles.cardTitle}>Create Account</Text>
                    <Text style={styles.cardSubtitle}>Join the TMC Smart Queue System</Text>

                    <View style={styles.toggleTrack}>
                        {(['student', 'visitor'] as const).map(type => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.toggleOption, form.user_type === type && styles.toggleOptionActive]}
                                onPress={() => setForm({ ...form, user_type: type, student_id: '' })}
                                activeOpacity={0.8}
                            >
                                <MaterialIcons
                                    name={type === 'student' ? 'school' : 'badge'}
                                    size={15}
                                    color={form.user_type === type ? COLORS.navy : COLORS.gray}
                                    style={{ marginRight: 5 }}
                                />
                                <Text style={[
                                    styles.toggleOptionText,
                                    form.user_type === type && styles.toggleOptionTextActive
                                ]}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <SectionLabel icon="person" text="Personal Information" />
                    <View style={styles.fieldGroup}>
                        <AnimatedInput
                            icon="badge"
                            placeholder="Full Name"
                            value={form.name}
                            onChangeText={(t: string) => setForm({ ...form, name: t })}
                            autoCapitalize="words"
                        />
                        <AnimatedInput
                            icon="alternate-email"
                            placeholder="Username"
                            value={form.username}
                            onChangeText={(t: string) => setForm({ ...form, username: t })}
                        />
                        <AnimatedInput
                            icon="email"
                            placeholder="Email Address"
                            value={form.email}
                            onChangeText={(t: string) => setForm({ ...form, email: t })}
                            keyboardType="email-address"
                        />

                        <Dropdown
  style={styles.deptGroup}
  data={priorityData}
  labelField="label"
  valueField="value"
  placeholder="Select Priority Type"
  value={form.priority_type}
  onChange={(item) => {
    setForm({ ...form, priority_type: item.value });
  }}

  renderLeftIcon={() => (
    <MaterialIcons
      name="priority-high"
      size={20}
      color="#666"
      style={{ marginRight: 10 }}
    />
  )}
/>

{form.priority_type !== 'regular' && (
  <Text style={{ color: '#f39c12', marginTop: 5 }}>
    You will need to upload a valid ID for verification.
  </Text>
)}
                    </View>

                    {isStudent && (
                        <>
                            <SectionLabel icon="school" text="Student Details" />
                            <View style={styles.fieldGroup}>
                                <AnimatedInput
                                    icon="fingerprint"
                                    placeholder="Student ID (e.g. 23-0123456)"
                                    value={form.student_id}
                                    maxLength={10}
                                    keyboardType="numeric"
                                    onChangeText={(text: string) => {
                                        const cleaned = text.replace(/[^0-9]/g, '');
                                        let formatted = cleaned;
                                        if (cleaned.length > 2 && cleaned.startsWith('23')) {
                                            formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2, 8)}`;
                                        }
                                        setForm({ ...form, student_id: formatted });
                                    }}
                                />

<Dropdown
  style={styles.deptGroup}
  placeholderStyle={styles.placeholderStyle}
  selectedTextStyle={styles.selectedTextStyle}
  data={departmentData}
  labelField="label"
  valueField="value"
  placeholder="Select Department"
  value={form.department}
onChange={(item) => {
  setForm({ ...form, department: String(item.value) });
}}

  // 👇 THIS IS THE KEY PART
  renderLeftIcon={() => (
    <MaterialIcons
      name="account-balance"
      size={20}
      color="#666"
      style={{ marginRight: 10 }} // spacing between icon & text
    />
  )}
/>

                            </View>
                        </>
                    )}

                    <SectionLabel icon="lock" text="Security" />
                    <View style={styles.fieldGroup}>
                        <AnimatedInput
                            icon="lock-outline"
                            placeholder="Password"
                            value={form.password}
                            onChangeText={(t: string) => setForm({ ...form, password: t })}
                            secureTextEntry={!showPassword}
                            showToggle
                            onToggle={() => setShowPassword(p => !p)}
                        />

                        {form.password.length > 0 && (
                            <View style={styles.strengthContainer}>
                                <View style={styles.strengthTrack}>
                                    <Animated.View style={[
                                        styles.strengthFill,
                                        {
                                            backgroundColor: passwordStrength.color,
                                            width: `${passwordStrength.pct * 100}%` as DimensionValue,
                                        }
                                    ]} />
                                </View>
                                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                                    {passwordStrength.label}
                                </Text>
                            </View>
                        )}

                        <AnimatedInput
                            icon="lock-reset"
                            placeholder="Confirm Password"
                            value={form.password_confirmation}
                            onChangeText={(t: string) => setForm({ ...form, password_confirmation: t })}
                            secureTextEntry={!showConfirm}
                            showToggle
                            onToggle={() => setShowConfirm(p => !p)}
                        />

                        {form.password_confirmation.length > 0 && (
                            <View style={styles.matchRow}>
                                <MaterialIcons
                                    name={form.password === form.password_confirmation ? 'check-circle' : 'cancel'}
                                    size={14}
                                    color={form.password === form.password_confirmation ? COLORS.green : COLORS.red}
                                />
                                <Text style={[
                                    styles.matchText,
                                    { color: form.password === form.password_confirmation ? COLORS.green : COLORS.red }
                                ]}>
                                    {form.password === form.password_confirmation ? 'Passwords match' : 'Passwords do not match'}
                                </Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.privacyRow, agreeToTerms && styles.privacyRowActive]}
                        onPress={() => setAgreeToTerms(p => !p)}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.checkbox, agreeToTerms && styles.checkboxActive]}>
                            {agreeToTerms && (
                                <MaterialIcons name="check" size={14} color={COLORS.navy} />
                            )}
                        </View>
                        <Text style={styles.privacyText}>
                            I agree to the{' '}
                            <Text style={styles.privacyHighlight}>TMC Data Privacy Policy (R.A. 10173)</Text>
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.registerBtn, (!agreeToTerms || loading) && styles.registerBtnDisabled]}
                        onPress={handleRegister}
                        disabled={loading || !agreeToTerms}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.navy} />
                        ) : (
                            <>
                                <Text style={styles.registerBtnText}>Create Account</Text>
                                <MaterialIcons name="arrow-forward" size={20} color={COLORS.navy} style={{ marginLeft: 6 }} />
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                        style={styles.loginBtn}
                        onPress={() => router.push('/Login' as any)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.loginBtnText}>Already have an account? Sign In</Text>
                    </TouchableOpacity>
                </Animated.View>

                <Text style={styles.footer}>© 2025 Trinidad Municipal College · Bohol</Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.navy },

    background: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
    orb1: {
        position: 'absolute', width: 280, height: 280, borderRadius: 999,
        backgroundColor: 'rgba(212,160,23,0.07)', top: -60, right: -60,
    },
    orb2: {
        position: 'absolute', width: 200, height: 200, borderRadius: 999,
        backgroundColor: 'rgba(212,160,23,0.04)', bottom: 80, left: -50,
    },
    stripe: {
        position: 'absolute', width: '160%', height: 2,
        backgroundColor: 'rgba(212,160,23,0.12)', top: '38%',
        left: '-25%', transform: [{ rotate: '-8deg' }],
    },

    scroll: {
        paddingHorizontal: 22,
        paddingTop: Platform.OS === 'ios' ? 56 : 36,
        paddingBottom: 36,
    },


    header: { alignItems: 'center', marginBottom: 22 },
    logoRing: {
        width: 80, height: 80, borderRadius: 40,
        borderWidth: 2, borderColor: COLORS.gold,
        backgroundColor: 'rgba(212,160,23,0.08)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 10,
        shadowColor: COLORS.gold, shadowOpacity: 0.3, shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 }, elevation: 8,
    },
    logoImage: { width: 66, height: 66, borderRadius: 33 },
    schoolName: {
        fontSize: 10, fontWeight: '800', color: COLORS.gold,
        letterSpacing: 2.4, textAlign: 'center',
    },
    goldDivider: {
        width: 36, height: 2, backgroundColor: COLORS.gold,
        borderRadius: 2, marginTop: 8,
    },

    card: {
        backgroundColor: COLORS.navyLight,
        borderRadius: 24, padding: 24,
        borderWidth: 1, borderColor: 'rgba(212,160,23,0.18)',
        shadowColor: COLORS.shadow, shadowOpacity: 0.45,
        shadowRadius: 28, shadowOffset: { width: 0, height: 10 },
        elevation: 18,
    },
    cardTitle: {
        fontSize: 24, fontWeight: '800', color: COLORS.white,
        marginBottom: 3, letterSpacing: 0.3,
    },
    cardSubtitle: {
        fontSize: 12, color: COLORS.gray, marginBottom: 20, letterSpacing: 0.2,
    },

    toggleTrack: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12, padding: 4, marginBottom: 22,
        borderWidth: 1, borderColor: 'rgba(212,160,23,0.15)',
    },
    toggleOption: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', paddingVertical: 10, borderRadius: 10,
    },
    toggleOptionActive: {
        backgroundColor: COLORS.gold,
        shadowColor: COLORS.gold, shadowOpacity: 0.4,
        shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5,
    },
    toggleOptionText: { color: COLORS.gray, fontWeight: '700', fontSize: 13 },
    toggleOptionTextActive: { color: COLORS.navy },

    sectionLabel: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 4,
    },
    sectionLabelText: {
        color: COLORS.gold, fontSize: 11, fontWeight: '700',
        letterSpacing: 1.2, marginLeft: 5, textTransform: 'uppercase',
    },

    fieldGroup: { gap: 10, marginBottom: 16 },

 deptGroup: {
  height: 55,
  borderColor: '#ccc',
  borderWidth: 1,
  borderRadius: 10,
  paddingHorizontal: 12, // back to normal
  marginTop: 10,
},

placeholderStyle: {
  color: '#999',
  fontSize: 14,
},

selectedTextStyle: {
  color: '#000',
  fontSize: 14,
},

    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.inputBg,
        borderRadius: 13, paddingHorizontal: 14, height: 52,
        borderWidth: 1.5,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 14, color: COLORS.white, letterSpacing: 0.1 },
    eyeBtn: { paddingLeft: 10 },

    strengthContainer: { paddingHorizontal: 2, marginTop: -4 },
    strengthTrack: {
        height: 4, backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 4, overflow: 'hidden',
    },
    strengthFill: { height: '100%', borderRadius: 4 },
    strengthLabel: {
        fontSize: 11, fontWeight: '700', textAlign: 'right', marginTop: 3,
    },

    matchRow: { flexDirection: 'row', alignItems: 'center', marginTop: -4 },
    matchText: { fontSize: 11, fontWeight: '600', marginLeft: 4 },

    privacyRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12, padding: 14, marginBottom: 20,
        borderWidth: 1, borderColor: 'rgba(212,160,23,0.12)',
    },
    privacyRowActive: { borderColor: 'rgba(212,160,23,0.35)', backgroundColor: 'rgba(212,160,23,0.05)' },
    checkbox: {
        width: 22, height: 22, borderRadius: 6,
        borderWidth: 1.5, borderColor: COLORS.gray,
        alignItems: 'center', justifyContent: 'center', marginRight: 10,
    },
    checkboxActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
    privacyText: { flex: 1, fontSize: 12, color: COLORS.gray, lineHeight: 17 },
    privacyHighlight: { color: COLORS.goldLight, fontWeight: '700' },

    registerBtn: {
        backgroundColor: COLORS.gold, borderRadius: 14, height: 54,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        shadowColor: COLORS.gold, shadowOpacity: 0.4,
        shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 7,
    },
    registerBtnDisabled: {
        backgroundColor: COLORS.navyMid, shadowOpacity: 0, elevation: 0,
        borderWidth: 1, borderColor: 'rgba(212,160,23,0.12)',
    },
    registerBtnText: { color: COLORS.navy, fontSize: 15, fontWeight: '800', letterSpacing: 0.4 },

    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
    dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
    dividerText: { color: COLORS.gray, fontSize: 11, marginHorizontal: 12, letterSpacing: 1 },

    loginBtn: {
        borderRadius: 14, height: 50, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: 'rgba(212,160,23,0.32)',
        backgroundColor: 'rgba(212,160,23,0.05)',
    },
    loginBtnText: { color: COLORS.goldLight, fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },

    footer: {
        textAlign: 'center', color: 'rgba(138,155,176,0.5)',
        fontSize: 10, marginTop: 20, letterSpacing: 0.5,
    },
});