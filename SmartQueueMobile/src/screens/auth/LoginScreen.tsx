import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform, Animated,
    Image, Dimensions, StatusBar
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons , MaterialIcons } from '@expo/vector-icons';
import { biometricService } from '@/src/services/biometricService';

const { width, height } = Dimensions.get('window');


const COLORS = {
    navy:        '#0B1F3A',  
    navyMid:     '#132847',   
    navyLight:   '#1A3658',   
    gold:        '#D4A017',   
    goldLight:   '#F0C040',  
    goldPale:    '#FFF3CC',   
    white:       '#FFFFFF',
    offWhite:    '#F4F6F9',
    gray:        '#8A9BB0',
    grayLight:   '#C3CFDB',
    success:     '#16A34A',
    border:      'rgba(212,160,23,0.25)',
    inputBg:     'rgba(255,255,255,0.06)',
    shadow:      '#000000',
};


function Orb({ style }: { style: any }) {
    return <View style={[styles.orb, style]} />;
}


function AnimatedInput({
    icon, placeholder, value, onChangeText,
    secureTextEntry, showToggle, onToggle, keyboardType, autoCapitalize
}: any) {
    const [focused, setFocused] = useState(false);
    const borderAnim = useRef(new Animated.Value(0)).current;

    const onFocus = () => {
        setFocused(true);
        Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    };
    const onBlur = () => {
        setFocused(false);
        Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    };

    const borderColor = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.border, COLORS.gold],
    });

    return (
        <Animated.View style={[styles.inputWrapper, { borderColor }]}>
            <MaterialIcons
                name={icon}
                size={20}
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
                autoCapitalize={autoCapitalize || 'none'}
                autoCorrect={false}
                onFocus={onFocus}
                onBlur={onBlur}
            />
            {showToggle && (
                <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
                    <MaterialIcons
                        name={secureTextEntry ? 'visibility-off' : 'visibility'}
                        size={20}
                        color={COLORS.gray}
                    />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
}


export default function LoginScreen() {
    const { login } = useAuth();
    const router = useRouter();

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword]     = useState('');
    const [loading, setLoading]       = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isBioEnabled, setIsBioEnabled] = useState(false);

    // Entrance animations
    const logoAnim  = useRef(new Animated.Value(0)).current;
    const cardAnim  = useRef(new Animated.Value(40)).current;
    const fadeAnim  = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(logoAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
            Animated.timing(fadeAnim,  { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
            Animated.spring(cardAnim,  { toValue: 0, tension: 50, friction: 9, delay: 200, useNativeDriver: true }),
        ]).start();
        checkBiometrics();
    }, []);

    const checkBiometrics = async () => {
        const saved = await biometricService.getStoredCredentials();
        if (saved) {
            setIsBioEnabled(true);
        }
    };

    const handleBiometricLogin = async () => {
    const success = await biometricService.authenticate();
    if (success) {
        const creds = await biometricService.getStoredCredentials();


        if (creds && creds.email && creds.password) {
            setLoading(true);
            try {
                await login(creds.email, creds.password);
                router.replace('/(tabs)' as any);
            } catch (error: any) {
                console.error("API Login Error:", error.response?.data || error.message);
                Alert.alert("Auto-login Failed", "Your API rejected the saved credentials.");
            } finally {
                setLoading(false);
            }
        } else {
            Alert.alert("Vault Empty", "No valid credentials found in secure storage.");
        }
    }
};
    
    const handleLogin = async () => {
        const cleanIdentifier = identifier.trim();
        if (!cleanIdentifier || !password) {
            Alert.alert('Missing Info', 'Please enter both identifier and password.');
            return;
        }
        setLoading(true);
        try {
            const loginPromise   = login(cleanIdentifier, password);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), 30000)
            );
            await Promise.race([loginPromise, timeoutPromise]);
            router.replace('/(tabs)' as any);
        } catch (error: any) {
            let errorMsg = 'Invalid credentials. Please try again.';
            if (error.response?.status === 429) {
                Alert.alert('Too Many Attempts', 'Your account is temporarily locked. Try again in 1 minute.');
                return;
            }
            if (error.message === 'TIMEOUT')         errorMsg = 'Connection too slow. Check your signal or TMC Wi-Fi.';
            else if (error.response?.status === 401) errorMsg = 'Incorrect email or password.';
            else if (error.response?.status === 500) errorMsg = 'Server is down. Please try again later.';
            Alert.alert('Login Failed', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const isReady = identifier.length > 0 && password.length > 0;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.root}
        >
            <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

       
            <View style={styles.background}>
                <Orb style={styles.orb1} />
                <Orb style={styles.orb2} />
                <Orb style={styles.orb3} />
            
                <View style={styles.stripe} />
            </View>

            <View style={styles.inner}>

          
                <Animated.View style={[
                    styles.logoBlock,
                    { opacity: logoAnim, transform: [{ scale: logoAnim }] }
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
                    <Text style={styles.tagline}>A Tradition of Excellence · Est. 1985</Text>
                </Animated.View>

          
                <Animated.View style={[
                    styles.card,
                    { opacity: fadeAnim, transform: [{ translateY: cardAnim }] }
                ]}>
                    <Text style={styles.cardTitle}>Welcome Back</Text>
                    <Text style={styles.cardSubtitle}>Sign in to continue to the queue system</Text>

                    <View style={styles.formGap}>
                        <AnimatedInput
                            icon="person-outline"
                            placeholder="Username or Email"
                            value={identifier}
                            onChangeText={setIdentifier}
                        />
                        <AnimatedInput
                            icon="lock-outline"
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            showToggle
                            onToggle={() => setShowPassword(p => !p)}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push('/passwords/forgot-password' as any)}
                        style={styles.forgotRow}
                    >
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>

            
                    <TouchableOpacity
                        style={[styles.loginBtn, !isReady && styles.loginBtnDisabled]}
                        onPress={handleLogin}
                        disabled={loading || !isReady}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.navy} />
                        ) : (
                            <>
                                <Text style={styles.loginBtnText}>Sign In</Text>
                                <MaterialIcons name="arrow-forward" size={20} color={COLORS.navy} style={{ marginLeft: 6 }} />
                            </>
                        )}
                    </TouchableOpacity>

                    {isBioEnabled && (
    <TouchableOpacity 
        style={styles.bioButton} 
        onPress={handleBiometricLogin}
        disabled={loading}
    >
        <Ionicons name="finger-print" size={32} color={COLORS.gold} />
        <Text style={styles.bioText}>Quick Sign In</Text>
    </TouchableOpacity>
)}

             
                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>

              
                    <TouchableOpacity
                        style={styles.registerBtn}
                        onPress={() => router.push('/Register' as any)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.registerBtnText}>Create an Account</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Footer */}
                <Animated.Text style={[styles.footer, { opacity: fadeAnim }]}>
                    © 2025 Trinidad Municipal College · Bohol
                </Animated.Text>
            </View>
        </KeyboardAvoidingView>
    );
}


const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.navy,
    },

    background: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    orb: {
        position: 'absolute',
        borderRadius: 999,
    },
    orb1: {
        width: 320,
        height: 320,
        backgroundColor: 'rgba(212,160,23,0.08)',
        top: -80,
        right: -80,
    },
    orb2: {
        width: 240,
        height: 240,
        backgroundColor: 'rgba(212,160,23,0.05)',
        bottom: 100,
        left: -60,
    },
    orb3: {
        width: 120,
        height: 120,
        backgroundColor: 'rgba(255,255,255,0.03)',
        top: height * 0.4,
        right: 30,
    },
    stripe: {
        position: 'absolute',
        width: width * 1.5,
        height: 2,
        backgroundColor: 'rgba(212,160,23,0.15)',
        top: height * 0.38,
        left: -width * 0.25,
        transform: [{ rotate: '-8deg' }],
    },

    inner: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        justifyContent: 'center',
    },

    logoBlock: {
        alignItems: 'center',
        marginBottom: 28,
    },
    logoRing: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 2.5,
        borderColor: COLORS.gold,
        backgroundColor: 'rgba(212,160,23,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        shadowColor: COLORS.gold,
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        elevation: 10,
    },
    logoImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    schoolName: {
        fontSize: 11,
        fontWeight: '800',
        color: COLORS.gold,
        letterSpacing: 2.5,
        textAlign: 'center',
    },
    goldDivider: {
        width: 40,
        height: 2,
        backgroundColor: COLORS.gold,
        borderRadius: 2,
        marginVertical: 8,
    },
    tagline: {
        fontSize: 11,
        color: COLORS.gray,
        letterSpacing: 0.8,
    },

    card: {
        backgroundColor: COLORS.navyLight,
        borderRadius: 24,
        padding: 28,
        borderWidth: 1,
        borderColor: 'rgba(212,160,23,0.18)',
        shadowColor: COLORS.shadow,
        shadowOpacity: 0.5,
        shadowRadius: 30,
        shadowOffset: { width: 0, height: 12 },
        elevation: 20,
    },
    cardTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.white,
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    cardSubtitle: {
        fontSize: 13,
        color: COLORS.gray,
        marginBottom: 24,
        letterSpacing: 0.2,
    },


    formGap: { gap: 12 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBg,
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1.5,
    },
    inputIcon: { marginRight: 12 },
    input: {
        flex: 1,
        fontSize: 15,
        color: COLORS.white,
        letterSpacing: 0.2,
    },
    eyeBtn: { paddingLeft: 10 },

    forgotRow: { alignItems: 'flex-end', marginTop: 8, marginBottom: 20 },
    forgotText: {
        color: COLORS.gold,
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.2,
    },

    loginBtn: {
        backgroundColor: COLORS.gold,
        borderRadius: 14,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.gold,
        shadowOpacity: 0.45,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
    loginBtnDisabled: {
        backgroundColor: COLORS.navyMid,
        shadowOpacity: 0,
        elevation: 0,
        borderWidth: 1,
        borderColor: 'rgba(212,160,23,0.15)',
    },
    loginBtnText: {
        color: COLORS.navy,
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 18,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    dividerText: {
        color: COLORS.gray,
        fontSize: 12,
        marginHorizontal: 12,
        letterSpacing: 1,
    },

    registerBtn: {
        borderRadius: 14,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(212,160,23,0.35)',
        backgroundColor: 'rgba(212,160,23,0.06)',
    },
    registerBtnText: {
        color: COLORS.goldLight,
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    footer: {
        textAlign: 'center',
        color: 'rgba(138,155,176,0.6)',
        fontSize: 11,
        marginTop: 20,
        letterSpacing: 0.5,
    },

    bioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,160,23,0.1)', // Subtle gold background
    padding: 12,
    borderRadius: 12,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.3)',
},
bioText: {
    color: COLORS.gold,
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
},
});