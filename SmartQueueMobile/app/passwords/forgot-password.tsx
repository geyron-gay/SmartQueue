import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, Animated, StatusBar,
    KeyboardAvoidingView, Platform, Image, ActivityIndicator
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import axiosClient from '../../src/api/axios';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Design Tokens (matches Login & Register) ──────────────────────
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
    green:     '#22C55E',
};

// ─── Step indicator dot ────────────────────────────────────────────
function StepDot({ active, done }: { active: boolean; done: boolean }) {
    return (
        <View style={[
            styles.dot,
            active && styles.dotActive,
            done   && styles.dotDone,
        ]}>
            {done && <MaterialIcons name="check" size={10} color={COLORS.navy} />}
        </View>
    );
}

export default function ForgotPassword() {
    const [email, setEmail]     = useState('');
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(false);
    const router = useRouter();

    // Animations
    const iconAnim   = useRef(new Animated.Value(0)).current;
    const cardAnim   = useRef(new Animated.Value(40)).current;
    const fadeAnim   = useRef(new Animated.Value(0)).current;
    const shakeAnim  = useRef(new Animated.Value(0)).current;
    const borderAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(iconAnim,  { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
            Animated.timing(fadeAnim,  { toValue: 1, duration: 500, delay: 180, useNativeDriver: true }),
            Animated.spring(cardAnim,  { toValue: 0, tension: 50, friction: 9, delay: 180, useNativeDriver: true }),
        ]).start();
    }, []);

    const onFocus = () => {
        setFocused(true);
        Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    };
    const onBlur = () => {
        setFocused(false);
        Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    };

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
        ]).start();
    };

    const handleSend = async () => {
        const cleanEmail = email.trim();
        if (!cleanEmail) {
            shake();
            Alert.alert('Missing Info', 'Please enter your email address.');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            shake();
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }
        setLoading(true);
        try {
            await axiosClient.post('/forgot-password', { email: cleanEmail });
            Alert.alert('Code Sent! ✉️', 'Please check your email for the 6-digit PIN.');
            router.push({ pathname: '/passwords/ResetPassword', params: { email: cleanEmail } });
        } catch (e: any) {
            shake();
            const status = e?.response?.status;
            const msg =
                status === 404 ? 'No account found with that email address.' :
                status === 429 ? 'Too many attempts. Please wait a moment.' :
                'Something went wrong. Please try again.';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    const borderColor = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.border, COLORS.gold],
    });

    const isReady = email.trim().length > 0;

    return (
        <>
    
            <Stack.Screen options={{ headerShown: false }} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.root}
            >
                <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

                {/* ── Background Orbs ── */}
                <View style={styles.background} pointerEvents="none">
                    <View style={styles.orb1} />
                    <View style={styles.orb2} />
                    <View style={styles.stripe} />
                </View>

                <View style={styles.inner}>

                    {/* ── Back Button ── */}
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons name="arrow-back-ios" size={16} color={COLORS.gold} />
                            <Text style={styles.backBtnText}>Back to Sign In</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* ── Icon Header ── */}
                    <Animated.View style={[
                        styles.iconBlock,
                        { opacity: iconAnim, transform: [{ scale: iconAnim }] }
                    ]}>
                        <View style={styles.iconRing}>
                            <MaterialIcons name="lock-reset" size={38} color={COLORS.gold} />
                        </View>
                        <Text style={styles.schoolTag}>TRINIDAD MUNICIPAL COLLEGE</Text>
                        <View style={styles.goldDivider} />
                    </Animated.View>

                    {/* ── Card ── */}
                    <Animated.View style={[
                        styles.card,
                        { opacity: fadeAnim, transform: [{ translateY: cardAnim }] }
                    ]}>
                        {/* Step Indicator */}
                        <View style={styles.stepsRow}>
                            <StepDot active done={false} />
                            <View style={styles.stepLine} />
                            <StepDot active={false} done={false} />
                            <View style={styles.stepLine} />
                            <StepDot active={false} done={false} />
                        </View>
                        <Text style={styles.stepsCaption}>Step 1 of 3 — Enter Email</Text>

                        <View style={styles.stepDivider} />

                        {/* Title */}
                        <Text style={styles.cardTitle}>Forgot Password?</Text>
                        <Text style={styles.cardSubtitle}>
                            No worries! Enter your registered email and we'll send you a 6-digit reset PIN.
                        </Text>

                        {/* Info Banner */}
                        <View style={styles.infoBanner}>
                            <MaterialIcons name="info-outline" size={15} color={COLORS.gold} style={{ marginRight: 8, marginTop: 1 }} />
                            <Text style={styles.infoBannerText}>
                                Make sure to use the email linked to your TMC Smart Queue account.
                            </Text>
                        </View>

                        {/* Email Label */}
                        <Text style={styles.fieldLabel}>
                            <MaterialIcons name="email" size={12} color={COLORS.gold} />
                            {'  '}EMAIL ADDRESS
                        </Text>

                        {/* Email Input */}
                        <Animated.View style={[styles.inputWrapper, { borderColor }, { transform: [{ translateX: shakeAnim }] }]}>
                            <MaterialIcons
                                name="email"
                                size={19}
                                color={focused ? COLORS.gold : COLORS.gray}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="yourname@email.com"
                                placeholderTextColor={COLORS.gray}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                onFocus={onFocus}
                                onBlur={onBlur}
                            />
                            {email.length > 0 && (
                                <TouchableOpacity onPress={() => setEmail('')} style={styles.clearBtn}>
                                    <MaterialIcons name="cancel" size={17} color={COLORS.gray} />
                                </TouchableOpacity>
                            )}
                        </Animated.View>

                        <Text style={styles.helperText}>
                            A PIN will be sent to this address. Check your spam folder if you don't see it.
                        </Text>

                        {/* Send Button */}
                        <TouchableOpacity
                            style={[styles.sendBtn, !isReady && styles.sendBtnDisabled]}
                            onPress={handleSend}
                            disabled={loading || !isReady}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <ActivityIndicator color={COLORS.navy} />
                            ) : (
                                <>
                                    <MaterialIcons name="send" size={18} color={COLORS.navy} style={{ marginRight: 8 }} />
                                    <Text style={styles.sendBtnText}>Send Reset PIN</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* What happens next */}
                        <View style={styles.nextStepsBlock}>
                            <Text style={styles.nextStepsTitle}>WHAT HAPPENS NEXT</Text>
                            {[
                                { icon: 'email',     text: 'Receive a 6-digit PIN in your inbox' },
                                { icon: 'pin',       text: 'Enter the PIN on the next screen' },
                                { icon: 'lock-open', text: 'Set your new password securely' },
                            ].map((item, i) => (
                                <View key={i} style={styles.nextStepRow}>
                                    <View style={styles.nextStepIconBox}>
                                        <MaterialIcons name={item.icon as any} size={14} color={COLORS.gold} />
                                    </View>
                                    <Text style={styles.nextStepText}>{item.text}</Text>
                                </View>
                            ))}
                        </View>
                    </Animated.View>

                    {/* Footer */}
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
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 56 : 36,
        paddingBottom: 24,
        justifyContent: 'center',
    },

    // Back button
    backBtn: {
        flexDirection: 'row', alignItems: 'center',
        alignSelf: 'flex-start', marginBottom: 20,
        paddingVertical: 6, paddingHorizontal: 2,
    },
    backBtnText: {
        color: COLORS.gold, fontSize: 13, fontWeight: '700', letterSpacing: 0.3,
    },

    // Icon block
    iconBlock: { alignItems: 'center', marginBottom: 24 },
    iconRing: {
        width: 80, height: 80, borderRadius: 40,
        borderWidth: 2, borderColor: COLORS.gold,
        backgroundColor: 'rgba(212,160,23,0.08)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
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

    // Card
    card: {
        backgroundColor: COLORS.navyLight,
        borderRadius: 24, padding: 24,
        borderWidth: 1, borderColor: 'rgba(212,160,23,0.18)',
        shadowColor: COLORS.shadow, shadowOpacity: 0.45,
        shadowRadius: 28, shadowOffset: { width: 0, height: 10 },
        elevation: 18,
    },

    // Step indicator
    stepsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    dot: {
        width: 20, height: 20, borderRadius: 10,
        borderWidth: 1.5, borderColor: COLORS.gray,
        alignItems: 'center', justifyContent: 'center',
    },
    dotActive: { borderColor: COLORS.gold, backgroundColor: COLORS.gold },
    dotDone:   { borderColor: COLORS.green, backgroundColor: COLORS.green },
    stepLine:  { flex: 1, height: 1.5, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 4 },
    stepsCaption: { fontSize: 10, color: COLORS.gold, fontWeight: '700', letterSpacing: 1, marginBottom: 14 },
    stepDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 16 },

    cardTitle: {
        fontSize: 22, fontWeight: '800', color: COLORS.white,
        marginBottom: 6, letterSpacing: 0.3,
    },
    cardSubtitle: {
        fontSize: 13, color: COLORS.gray, lineHeight: 19,
        marginBottom: 16, letterSpacing: 0.1,
    },

    // Info banner
    infoBanner: {
        flexDirection: 'row', alignItems: 'flex-start',
        backgroundColor: 'rgba(212,160,23,0.08)',
        borderRadius: 10, padding: 12, marginBottom: 18,
        borderWidth: 1, borderColor: 'rgba(212,160,23,0.2)',
    },
    infoBannerText: { flex: 1, fontSize: 12, color: COLORS.gray, lineHeight: 17 },

    // Field label
    fieldLabel: {
        fontSize: 10, fontWeight: '800', color: COLORS.gold,
        letterSpacing: 1.4, marginBottom: 8,
        textTransform: 'uppercase',
    },

    // Input
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.inputBg,
        borderRadius: 13, paddingHorizontal: 14, height: 54,
        borderWidth: 1.5, marginBottom: 8,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: COLORS.white, letterSpacing: 0.2 },
    clearBtn: { paddingLeft: 10 },

    helperText: {
        fontSize: 11, color: COLORS.gray, marginBottom: 20,
        lineHeight: 16, letterSpacing: 0.1,
    },

    // Send button
    sendBtn: {
        backgroundColor: COLORS.gold, borderRadius: 14, height: 54,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        shadowColor: COLORS.gold, shadowOpacity: 0.4,
        shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 7,
        marginBottom: 20,
    },
    sendBtnDisabled: {
        backgroundColor: COLORS.navyMid, shadowOpacity: 0, elevation: 0,
        borderWidth: 1, borderColor: 'rgba(212,160,23,0.12)',
    },
    sendBtnText: { color: COLORS.navy, fontSize: 15, fontWeight: '800', letterSpacing: 0.4 },

    // What happens next
    nextStepsBlock: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12, padding: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    nextStepsTitle: {
        fontSize: 10, fontWeight: '800', color: COLORS.gray,
        letterSpacing: 1.4, marginBottom: 12,
    },
    nextStepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    nextStepIconBox: {
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: 'rgba(212,160,23,0.1)',
        borderWidth: 1, borderColor: 'rgba(212,160,23,0.2)',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    nextStepText: { flex: 1, fontSize: 12, color: COLORS.gray, letterSpacing: 0.1 },

    footer: {
        textAlign: 'center', color: 'rgba(138,155,176,0.5)',
        fontSize: 10, marginTop: 20, letterSpacing: 0.5,
    },
});