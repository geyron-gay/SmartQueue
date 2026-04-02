import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator, Animated,
    StatusBar, KeyboardAvoidingView, Platform, DimensionValue
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import axiosClient from '../../src/api/axios';

// ─── Design Tokens ─────────────────────────────────────────────────
const COLORS = {
    navy:      '#0B1F3A',
    navyMid:   '#132847',
    navyLight: '#1A3658',
    gold:      '#D4A017',
    goldLight: '#F0C040',
    white:     '#FFFFFF',
    gray:      '#8A9BB0',
    border:    'rgba(212,160,23,0.22)',
    inputBg:   'rgba(255,255,255,0.06)',
    shadow:    '#000000',
    red:       '#EF4444',
    amber:     '#F59E0B',
    green:     '#22C55E',
};

// ─── Step Dot ──────────────────────────────────────────────────────
function StepDot({ state }: { state: 'done' | 'active' | 'idle' }) {
    return (
        <View style={[
            styles.dot,
            state === 'active' && styles.dotActive,
            state === 'done'   && styles.dotDone,
        ]}>
            {state === 'done' && <MaterialIcons name="check" size={10} color={COLORS.navy} />}
        </View>
    );
}

// ─── PIN Box ───────────────────────────────────────────────────────
function PinBox({ char, focused }: { char: string; focused: boolean }) {
    const pulse = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        if (focused) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulse, { toValue: 1.08, duration: 500, useNativeDriver: true }),
                    Animated.timing(pulse, { toValue: 1,    duration: 500, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulse.stopAnimation();
            pulse.setValue(1);
        }
    }, [focused]);

    return (
        <Animated.View style={[
            styles.pinBox,
            char  && styles.pinBoxFilled,
            focused && styles.pinBoxFocused,
            { transform: [{ scale: pulse }] },
        ]}>
            <Text style={styles.pinChar}>{char ? '●' : ''}</Text>
        </Animated.View>
    );
}

// ─── Animated Input ────────────────────────────────────────────────
function AnimatedInput({ icon, placeholder, value, onChangeText, secureTextEntry, showToggle, onToggle }: any) {
    const [focused, setFocused] = useState(false);
    const borderAnim = useRef(new Animated.Value(0)).current;
    const onFocus = () => { setFocused(true);  Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start(); };
    const onBlur  = () => { setFocused(false); Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start(); };
    const borderColor = borderAnim.interpolate({ inputRange: [0,1], outputRange: [COLORS.border, COLORS.gold] });
    
    return (
        <Animated.View style={[styles.inputWrapper, { borderColor }]}>
            <MaterialIcons name={icon} size={19} color={focused ? COLORS.gold : COLORS.gray} style={styles.inputIcon} />
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={COLORS.gray}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={onFocus}
                onBlur={onBlur}
            />
            {showToggle && (
                <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
                    <MaterialIcons name={secureTextEntry ? 'visibility-off' : 'visibility'} size={19} color={COLORS.gray} />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
}

// ─── Main Screen ───────────────────────────────────────────────────
export default function ResetPassword() {
    const { email } = useLocalSearchParams<{ email: string }>();
    const router = useRouter();

    const [step, setStep]                   = useState<1 | 2>(1);
    const [pin, setPin]                     = useState('');
    const [pinFocused, setPinFocused]       = useState(false);
    const [password, setPassword]           = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPass, setShowPass]           = useState(false);
    const [showConfirm, setShowConfirm]     = useState(false);
    const [loading, setLoading]             = useState(false);
    const pinInputRef = useRef<TextInput>(null);

    // Entrance animations
    const cardAnim  = useRef(new Animated.Value(40)).current;
    const fadeAnim  = useRef(new Animated.Value(0)).current;
    const iconAnim  = useRef(new Animated.Value(0)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const runEntrance = () => {
        cardAnim.setValue(40);
        fadeAnim.setValue(0);
        iconAnim.setValue(0);
        Animated.parallel([
            Animated.spring(iconAnim, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 450, delay: 150, useNativeDriver: true }),
            Animated.spring(cardAnim, { toValue: 0, tension: 50, friction: 9, delay: 150, useNativeDriver: true }),
        ]).start();
    };

    useEffect(() => { runEntrance(); }, []);
    useEffect(() => { runEntrance(); }, [step]);

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 8,  duration: 55, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 6,  duration: 55, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -6, duration: 55, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
        ]).start();
    };

    // Password strength
    const passwordStrength = useMemo(() => {
        if (!password) return { label: '', color: COLORS.border, pct: 0 };
        if (password.length < 6)  return { label: 'Weak',   color: COLORS.red,   pct: 0.28 };
        if (password.length < 10) return { label: 'Good',   color: COLORS.amber, pct: 0.62 };
        return                          { label: 'Strong',  color: COLORS.green, pct: 1.0 };
    }, [password]);

    const verifyPin = async () => {
        if (pin.length < 6) { shake(); Alert.alert('Invalid PIN', 'Please enter the complete 6-digit PIN.'); return; }
        setLoading(true);
        try {
            await axiosClient.post('/verify-pin', { email, token: pin });
            setStep(2);
        } catch (e: any) {
            shake();
            const msg = e?.response?.status === 410
                ? 'This PIN has expired. Please request a new one.'
                : 'Invalid PIN. Please double-check and try again.';
            Alert.alert('Verification Failed', msg);
        } finally { setLoading(false); }
    };

    const handleUpdatePassword = async () => {
        if (!password || !passwordConfirm) { shake(); Alert.alert('Missing Fields', 'Please fill in both password fields.'); return; }
        if (password.length < 6)           { shake(); Alert.alert('Too Short', 'Password must be at least 6 characters.'); return; }
        if (password !== passwordConfirm)  { shake(); Alert.alert('Mismatch', 'Passwords do not match.'); return; }
        setLoading(true);
        try {
            await axiosClient.post('/reset-password', { email, token: pin, password, password_confirmation: passwordConfirm });
            Alert.alert('Password Updated! 🎉', 'Your password has been reset successfully.', [
                { text: 'Sign In', onPress: () => router.replace('/Login') }
            ]);
        } catch (e: any) {
            shake();
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally { setLoading(false); }
    };

    const maskedEmail = email
        ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.max(2, b.length)) + c)
        : '';

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.root}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

                {/* Background */}
                <View style={styles.background} pointerEvents="none">
                    <View style={styles.orb1} />
                    <View style={styles.orb2} />
                    <View style={styles.stripe} />
                </View>

                <View style={styles.inner}>

                    {/* Back Button */}
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
                            <MaterialIcons name="arrow-back-ios" size={16} color={COLORS.gold} />
                            <Text style={styles.backBtnText}>Back</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Icon Header */}
                    <Animated.View style={[styles.iconBlock, { opacity: iconAnim, transform: [{ scale: iconAnim }] }]}>
                        <View style={styles.iconRing}>
                            <MaterialIcons
                                name={step === 1 ? 'verified-user' : 'lock-open'}
                                size={36}
                                color={COLORS.gold}
                            />
                        </View>
                        <Text style={styles.schoolTag}>TRINIDAD MUNICIPAL COLLEGE</Text>
                        <View style={styles.goldDivider} />
                    </Animated.View>

                    {/* Card */}
                    <Animated.View style={[
                        styles.card,
                        { opacity: fadeAnim, transform: [{ translateY: cardAnim }, { translateX: shakeAnim }] }
                    ]}>

                        {/* Step Indicator */}
                        <View style={styles.stepsRow}>
                            <StepDot state="done" />
                            <View style={[styles.stepLine, step === 2 && styles.stepLineActive]} />
                            <StepDot state={step === 1 ? 'active' : 'done'} />
                            <View style={styles.stepLine} />
                            <StepDot state={step === 2 ? 'active' : 'idle'} />
                        </View>
                        <Text style={styles.stepsCaption}>
                            {step === 1 ? 'Step 2 of 3 — Verify PIN' : 'Step 3 of 3 — New Password'}
                        </Text>
                        <View style={styles.stepDivider} />

                        {step === 1 ? (
                            /* ── STEP 1: Verify PIN ── */
                            <>
                                <Text style={styles.cardTitle}>Verify PIN</Text>
                                <Text style={styles.cardSubtitle}>
                                    A 6-digit code was sent to{'\n'}
                                    <Text style={styles.emailHighlight}>{maskedEmail}</Text>
                                </Text>

                                {/* Info Banner */}
                                <View style={styles.infoBanner}>
                                    <MaterialIcons name="schedule" size={14} color={COLORS.gold} style={{ marginRight: 8 }} />
                                    <Text style={styles.infoBannerText}>This PIN expires in 10 minutes. Check your spam folder if needed.</Text>
                                </View>

                                {/* PIN Label */}
                                <Text style={styles.fieldLabel}>ENTER 6-DIGIT PIN</Text>

                                {/* PIN Visual Boxes */}
                                <View style={styles.pinRow}>
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <PinBox
                                            key={i}
                                            char={pin[i] || ''}
                                            focused={pinFocused && pin.length === i}
                                        />
                                    ))}
                                </View>

                                {/* Hidden real input */}
                                <TextInput
    ref={pinInputRef}
    style={styles.hiddenInput}
    value={pin}
    onChangeText={v => setPin(v.replace(/[^0-9]/g, '').slice(0, 6))}
    keyboardType="number-pad"
    maxLength={6}
    onFocus={() => setPinFocused(true)}
    onBlur={() => setPinFocused(false)}
    caretHidden
/>

                                <TouchableOpacity
    style={styles.pinTapArea}
    onPress={() => pinInputRef.current?.focus()}
    activeOpacity={0.7}
>
                                    <MaterialIcons name="keyboard" size={14} color={COLORS.gray} />
                                    <Text style={styles.pinTapText}>Tap to enter PIN</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionBtn, pin.length < 6 && styles.actionBtnDisabled]}
                                    onPress={verifyPin}
                                    disabled={loading || pin.length < 6}
                                    activeOpacity={0.85}
                                >
                                    {loading
                                        ? <ActivityIndicator color={COLORS.navy} />
                                        : <>
                                            <MaterialIcons name="verified" size={18} color={COLORS.navy} style={{ marginRight: 8 }} />
                                            <Text style={styles.actionBtnText}>Verify PIN</Text>
                                          </>
                                    }
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.resendRow} onPress={() => router.back()} activeOpacity={0.7}>
                                    <Text style={styles.resendText}>Didn't receive a code? </Text>
                                    <Text style={styles.resendLink}>Resend PIN</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            /* ── STEP 2: New Password ── */
                            <>
                                <Text style={styles.cardTitle}>New Password</Text>
                                <Text style={styles.cardSubtitle}>Set a strong, secure password for your account.</Text>

                                <View style={styles.successBanner}>
                                    <MaterialIcons name="check-circle" size={15} color={COLORS.green} style={{ marginRight: 8 }} />
                                    <Text style={styles.successBannerText}>PIN verified successfully! Create your new password below.</Text>
                                </View>

                                <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
                                <View style={styles.fieldGroup}>
                                    <AnimatedInput
                                        icon="lock-outline"
                                        placeholder="Enter new password"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPass}
                                        showToggle
                                        onToggle={() => setShowPass(p => !p)}
                                    />

                                    {/* Strength Bar */}
                                    {password.length > 0 && (
                                        <View style={styles.strengthContainer}>
                                            <View style={styles.strengthTrack}>
                                                <View style={[
                                                    styles.strengthFill,
                                                    { backgroundColor: passwordStrength.color, width: `${passwordStrength.pct * 100}%` as DimensionValue }
                                                ]} />
                                            </View>
                                            <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                                                {passwordStrength.label}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
                                <View style={styles.fieldGroup}>
                                    <AnimatedInput
                                        icon="lock-reset"
                                        placeholder="Re-enter new password"
                                        value={passwordConfirm}
                                        onChangeText={setPasswordConfirm}
                                        secureTextEntry={!showConfirm}
                                        showToggle
                                        onToggle={() => setShowConfirm(p => !p)}
                                    />
                                    {passwordConfirm.length > 0 && (
                                        <View style={styles.matchRow}>
                                            <MaterialIcons
                                                name={password === passwordConfirm ? 'check-circle' : 'cancel'}
                                                size={13}
                                                color={password === passwordConfirm ? COLORS.green : COLORS.red}
                                            />
                                            <Text style={[styles.matchText, { color: password === passwordConfirm ? COLORS.green : COLORS.red }]}>
                                                {password === passwordConfirm ? 'Passwords match' : 'Passwords do not match'}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Password Rules */}
                                <View style={styles.rulesBlock}>
                                    <Text style={styles.rulesTitle}>PASSWORD REQUIREMENTS</Text>
                                    {[
                                        { rule: 'At least 6 characters',         met: password.length >= 6 },
                                        { rule: 'Passwords match',                met: password === passwordConfirm && passwordConfirm.length > 0 },
                                    ].map((r, i) => (
                                        <View key={i} style={styles.ruleRow}>
                                            <MaterialIcons
                                                name={r.met ? 'check-circle' : 'radio-button-unchecked'}
                                                size={13}
                                                color={r.met ? COLORS.green : COLORS.gray}
                                            />
                                            <Text style={[styles.ruleText, r.met && styles.ruleTextMet]}>{r.rule}</Text>
                                        </View>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={[styles.actionBtn, (!password || !passwordConfirm) && styles.actionBtnDisabled]}
                                    onPress={handleUpdatePassword}
                                    disabled={loading || !password || !passwordConfirm}
                                    activeOpacity={0.85}
                                >
                                    {loading
                                        ? <ActivityIndicator color={COLORS.navy} />
                                        : <>
                                            <MaterialIcons name="lock" size={18} color={COLORS.navy} style={{ marginRight: 8 }} />
                                            <Text style={styles.actionBtnText}>Reset Password</Text>
                                          </>
                                    }
                                </TouchableOpacity>
                            </>
                        )}
                    </Animated.View>

                    <Animated.Text style={[styles.footer, { opacity: fadeAnim }]}>
                        © 2025 Trinidad Municipal College · Bohol
                    </Animated.Text>
                </View>
            </KeyboardAvoidingView>
        </>
    );
}

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.navy },

    background: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
    orb1: {
        position: 'absolute', width: 260, height: 260, borderRadius: 999,
        backgroundColor: 'rgba(212,160,23,0.07)', top: -50, right: -60,
    },
    orb2: {
        position: 'absolute', width: 180, height: 180, borderRadius: 999,
        backgroundColor: 'rgba(212,160,23,0.04)', bottom: 60, left: -40,
    },
    stripe: {
        position: 'absolute', width: '160%', height: 2,
        backgroundColor: 'rgba(212,160,23,0.12)', top: '42%',
        left: '-25%', transform: [{ rotate: '-8deg' }],
    },

    inner: {
        flex: 1, paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 56 : 36,
        paddingBottom: 24, justifyContent: 'center',
    },

    backBtn: {
        flexDirection: 'row', alignItems: 'center',
        alignSelf: 'flex-start', marginBottom: 18,
        paddingVertical: 6,
    },
    backBtnText: { color: COLORS.gold, fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },

    iconBlock: { alignItems: 'center', marginBottom: 22 },
    iconRing: {
        width: 78, height: 78, borderRadius: 39,
        borderWidth: 2, borderColor: COLORS.gold,
        backgroundColor: 'rgba(212,160,23,0.08)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 10,
        shadowColor: COLORS.gold, shadowOpacity: 0.3, shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 }, elevation: 8,
    },
    schoolTag: {
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

    // Steps
    stepsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    dot: {
        width: 20, height: 20, borderRadius: 10,
        borderWidth: 1.5, borderColor: COLORS.gray,
        alignItems: 'center', justifyContent: 'center',
    },
    dotActive: { borderColor: COLORS.gold, backgroundColor: COLORS.gold },
    dotDone:   { borderColor: COLORS.green, backgroundColor: COLORS.green },
    stepLine: { flex: 1, height: 1.5, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 4 },
    stepLineActive: { backgroundColor: COLORS.green },
    stepsCaption: { fontSize: 10, color: COLORS.gold, fontWeight: '700', letterSpacing: 1, marginBottom: 14 },
    stepDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 16 },

    cardTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white, marginBottom: 4, letterSpacing: 0.3 },
    cardSubtitle: { fontSize: 13, color: COLORS.gray, lineHeight: 19, marginBottom: 14, letterSpacing: 0.1 },
    emailHighlight: { color: COLORS.goldLight, fontWeight: '700' },

    infoBanner: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(212,160,23,0.08)',
        borderRadius: 10, padding: 11, marginBottom: 18,
        borderWidth: 1, borderColor: 'rgba(212,160,23,0.2)',
    },
    infoBannerText: { flex: 1, fontSize: 12, color: COLORS.gray, lineHeight: 17 },

    successBanner: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(34,197,94,0.08)',
        borderRadius: 10, padding: 11, marginBottom: 18,
        borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
    },
    successBannerText: { flex: 1, fontSize: 12, color: COLORS.green, lineHeight: 17, fontWeight: '600' },

    fieldLabel: {
        fontSize: 10, fontWeight: '800', color: COLORS.gold,
        letterSpacing: 1.4, marginBottom: 10, textTransform: 'uppercase',
    },
    fieldGroup: { marginBottom: 14, gap: 8 },

    // PIN
    pinRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    pinBox: {
        width: 44, height: 52, borderRadius: 12,
        borderWidth: 1.5, borderColor: COLORS.border,
        backgroundColor: COLORS.inputBg,
        alignItems: 'center', justifyContent: 'center',
    },
    pinBoxFilled:  { borderColor: 'rgba(212,160,23,0.5)' },
    pinBoxFocused: { borderColor: COLORS.gold, backgroundColor: 'rgba(212,160,23,0.08)' },
    pinChar: { fontSize: 22, color: COLORS.gold, lineHeight: 26 },
    hiddenInput: {
        position: 'absolute', opacity: 0, width: 1, height: 1,
    },
    pinTapArea: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        marginTop: 8, marginBottom: 20, gap: 6,
    },
    pinTapText: { fontSize: 12, color: COLORS.gray, letterSpacing: 0.3 },

    // Animated input
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.inputBg,
        borderRadius: 13, paddingHorizontal: 14, height: 52,
        borderWidth: 1.5,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 14, color: COLORS.white, letterSpacing: 0.1 },
    eyeBtn: { paddingLeft: 10 },

    // Strength
    strengthContainer: { paddingHorizontal: 2 },
    strengthTrack: {
        height: 4, backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 4, overflow: 'hidden',
    },
    strengthFill: { height: '100%', borderRadius: 4 },
    strengthLabel: { fontSize: 11, fontWeight: '700', textAlign: 'right', marginTop: 3 },

    matchRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    matchText: { fontSize: 11, fontWeight: '600' },

    // Rules
    rulesBlock: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 10, padding: 12, marginBottom: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    rulesTitle: {
        fontSize: 9, fontWeight: '800', color: COLORS.gray,
        letterSpacing: 1.4, marginBottom: 10,
    },
    ruleRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
    ruleText:   { fontSize: 12, color: COLORS.gray },
    ruleTextMet:{ color: COLORS.green, fontWeight: '600' },

    // Resend
    resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
    resendText: { fontSize: 12, color: COLORS.gray },
    resendLink: { fontSize: 12, color: COLORS.goldLight, fontWeight: '700' },

    // Action button
    actionBtn: {
        backgroundColor: COLORS.gold, borderRadius: 14, height: 54,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        shadowColor: COLORS.gold, shadowOpacity: 0.4,
        shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 7,
    },
    actionBtnDisabled: {
        backgroundColor: COLORS.navyMid, shadowOpacity: 0, elevation: 0,
        borderWidth: 1, borderColor: 'rgba(212,160,23,0.12)',
    },
    actionBtnText: { color: COLORS.navy, fontSize: 15, fontWeight: '800', letterSpacing: 0.4 },

    footer: {
        textAlign: 'center', color: 'rgba(138,155,176,0.5)',
        fontSize: 10, marginTop: 20, letterSpacing: 0.5,
    },
});