
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Image,
    Alert, ActivityIndicator, Animated, StatusBar,
    KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axiosClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Design Tokens ─────────────────────────────────────────────────
const C = {
    bg:           '#F7F8FA',
    white:        '#FFFFFF',
    navy:         '#0B1F3A',
    navyLight:    '#1A3658',
    gold:         '#D4A017',
    goldLight:    '#F0C040',
    goldPale:     '#FEF9EC',
    goldBorder:   '#E8C84A',
    textPrimary:  '#0B1F3A',
    textSub:      '#4B5A6E',
    textMuted:    '#8A9BB0',
    border:       '#E8ECF0',
    borderLight:  '#F0F3F6',
    green:        '#16A34A',
    greenPale:    '#F0FDF4',
    greenBorder:  '#BBF7D0',
    amber:        '#D97706',
    amberPale:    '#FFFBEB',
    amberBorder:  '#FDE68A',
    red:          '#DC2626',
    redPale:      '#FEF2F2',
    redBorder:    '#FECACA',
    shadow:       '#0B1F3A',
};

// ─── Status config ─────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
    label: string; icon: string;
    color: string; bg: string; border: string; desc: string;
}> = {
    none: {
        label: 'Not Submitted',
        icon: 'radio-button-unchecked',
        color: C.textMuted, bg: C.borderLight, border: C.border,
        desc: 'Upload a valid ID to apply for priority access.',
    },
    pending: {
        label: 'Under Review',
        icon: 'schedule',
        color: C.amber, bg: C.amberPale, border: C.amberBorder,
        desc: 'Your ID is being reviewed by the admin. This usually takes 1–2 business days.',
    },
    approved: {
        label: 'Verified',
        icon: 'verified',
        color: C.green, bg: C.greenPale, border: C.greenBorder,
        desc: 'You are verified and can use the Priority Queue lane.',
    },
    rejected: {
        label: 'Rejected',
        icon: 'cancel',
        color: C.red, bg: C.redPale, border: C.redBorder,
        desc: 'Your submission was rejected. Please re-upload a clearer valid ID.',
    },
};

export default function VerifyScreen() {
    const { user, updateUser } = useAuth();
    const router = useRouter();

    const [image, setImage]               = useState<any>(null);
    const [originalImage, setOriginalImage] = useState<any>(null); // track server image
    const [loading, setLoading]           = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isEditing, setIsEditing]       = useState(false); // edit mode for rejected

    // Animations
    const fadeAnim  = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    const status = user?.priority_status || 'none';
    const cfg    = STATUS_CONFIG[status] || STATUS_CONFIG.none;

    

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
        ]).start();
    }, [initialLoading]);

  useEffect(() => {
  const fetchVerification = async () => {
    try {
      if (!user?.id) {
        console.log('No user ID yet');
        return;
      }

      setInitialLoading(true);
      console.log('Fetching verification for user ID:', user.id);

      const res = await axiosClient.get(`/priority-verification/${user.id}`);
      console.log('Raw API response:', res.data);

      const verification = res.data.verification;
      console.log('Verification object:', verification);

 if (verification?.file_url) {
    const url = verification.file_url + '?v=' + Date.now(); // cache buster
    console.log('Setting image with URL:', url);
    setImage({ uri: url });
    setOriginalImage({ uri: url });
} else {
    setImage(null);
    setOriginalImage(null);
        console.log('No file_url found in verification');
      }

      // Update local user with latest status
      updateUser({ ...user, priority_status: verification?.status || 'none' });
      console.log('User updated locally with priority_status:', verification?.status || 'none');

    } catch (err: any) {
      console.log('Fetch verification error:', err.message || err);
    } finally {
      setInitialLoading(false);
      console.log('Finished fetching verification');
    }
  };

  fetchVerification();
}, [user?.id]);
    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission Required', 'Please allow access to your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [4, 3],
        });
        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    };

    const handleChangeImage = () => {
        Alert.alert(
            'Change Image',
            'Are you sure you want to replace the current image?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Replace', onPress: pickImage },
            ]
        );
    };

    const handleCancelEdit = () => {
        setImage(originalImage); // revert to server image
        setIsEditing(false);
    };

    const handleSubmit = async () => {
        if (!image) {
            Alert.alert('No Image', 'Please upload your valid ID first.');
            return;
        }

        // Guard: already pending or approved
        if (status === 'pending') {
            Alert.alert('Already Submitted', 'Your ID is currently under review. Please wait.');
            return;
        }
        if (status === 'approved') {
            Alert.alert('Already Verified', 'Your priority status is already approved.');
            return;
        }

        // Confirm before submitting
        Alert.alert(
            'Confirm Submission',
            'Make sure your ID is clear and valid. Once submitted, it will be reviewed by the admin.',
            [
                { text: 'Review Again', style: 'cancel' },
                {
                    text: 'Submit',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const formData = new FormData();
                            formData.append('priority_id', {
                                uri: image.uri,
                                name: `priority_${Date.now()}.jpg`,
                                type: 'image/jpeg',
                            } as any);

                            await axiosClient.post('/upload-priority-id', formData, {
                                headers: { 'Content-Type': 'multipart/form-data' },
                            });

                            updateUser({ ...user, priority_status: 'pending' });
                            setOriginalImage(image);
                            setIsEditing(false);

                            Alert.alert('Submitted ✓', 'Your ID has been submitted for review. We\'ll notify you once it\'s processed.');
                        } catch (error: any) {
                            Alert.alert('Upload Failed', error?.response?.data?.message || 'Something went wrong. Please try again.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const canSubmit   = !!image && (status === 'none' || (status === 'rejected' && isEditing));
    const imageChanged = image?.uri !== originalImage?.uri;
    const showSubmit   = status === 'none' || (status === 'rejected' && isEditing);
    const hasImage = image && image.uri && image.uri !== 'null';



    return (
        <>
        
           <Stack.Screen options={{ headerTitle: 'About Our Team', headerStyle: { backgroundColor: '#F7F8FA' }, headerTintColor: '#6c602f', headerTitleStyle: { fontWeight: 'bold' } }} />  
             <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            <View style={styles.root}>

    

                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

                        {/* ── Status Card ── */}
                        <View style={[styles.statusCard, { borderColor: cfg.border, backgroundColor: cfg.bg }]}>
                            <View style={[styles.statusIconBox, { backgroundColor: cfg.bg }]}>
                                <MaterialIcons name={cfg.icon as any} size={22} color={cfg.color} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                                <Text style={styles.statusDesc}>{cfg.desc}</Text>
                            </View>
                        </View>

                        {/* ── Info Block ── */}
                        <View style={styles.infoCard}>
                            <View style={styles.infoCardHeader}>
                                <MaterialIcons name="info-outline" size={15} color={C.navy} />
                                <Text style={styles.infoCardTitle}>Priority Access Requirements</Text>
                            </View>
                            <View style={styles.infoDivider} />
                            {[
                                'Person with Disability (PWD) — PWD ID',
                                'Pregnant — Medical certificate or OB booklet',
                                'Senior Citizen (60+) — Senior Citizen ID',
                            ].map((item, i) => (
                                <View key={i} style={styles.infoRow}>
                                    <View style={styles.infoDot} />
                                    <Text style={styles.infoText}>{item}</Text>
                                </View>
                            ))}
                        </View>

                        {/* ── ID Upload Section ── */}
                        <Text style={styles.sectionLabel}>YOUR SUBMITTED ID</Text>

                        {/* Image Preview or Placeholder */}
                  {/* Image Preview or Placeholder */}
                  
{hasImage ? (
  <View style={styles.previewWrapper}>
    <Image
      source={{ uri: image.uri }}
      style={styles.preview}
      resizeMode="cover"
    />

    {/* Only show “Change Photo” if there's an image */}
     {image.uri && (status === 'none' || (status === 'rejected' && isEditing)) && (
      <View style={styles.previewOverlay}>
        <TouchableOpacity
          style={styles.previewOverlayBtn}
          onPress={handleChangeImage}
          activeOpacity={0.85}
        >
          <MaterialIcons name="edit" size={15} color={C.white} />
          <Text style={styles.previewOverlayBtnText}>Change Photo</Text>
        </TouchableOpacity>
      </View>
    )}

    {/* New image badge */}
    {image?.uri !== originalImage?.uri && (
      <View style={styles.changedBadge}>
        <MaterialIcons name="fiber-new" size={12} color={C.white} />
        <Text style={styles.changedBadgeText}>New image selected</Text>
      </View>
    )}
  </View>
) : (
  // Show this when there's no image (null file_url)
  <TouchableOpacity
    style={styles.uploadPlaceholder}
    onPress={pickImage}
    activeOpacity={0.8}
    disabled={status !== 'none'}
  >
    <View style={styles.uploadIconBox}>
      <MaterialIcons name="add-photo-alternate" size={28} color={C.gold} />
    </View>
    <Text style={styles.uploadTitle}>Upload Your Valid ID</Text>
    <Text style={styles.uploadSub}>Tap to choose from your gallery</Text>
    <View style={styles.uploadFormatRow}>
      {['JPG', 'PNG', 'Max 5MB'].map((f, i) => (
        <View key={i} style={styles.formatChip}>
          <Text style={styles.formatChipText}>{f}</Text>
        </View>
      ))}
    </View>
  </TouchableOpacity>
)}
                        

                        {/* ── Image Tips ── */}
                        {(status === 'none' || (status === 'rejected' && isEditing)) && (
                            <View style={styles.tipsCard}>
                                <Text style={styles.tipsTitle}>📋  ID PHOTO TIPS</Text>
                                {[
                                    'Ensure the ID is fully visible — no cropped edges',
                                    'Take the photo in good lighting, avoid glare',
                                    'All text on the ID must be clearly readable',
                                    'Government-issued or school-verified IDs only',
                                ].map((tip, i) => (
                                    <View key={i} style={styles.tipRow}>
                                        <MaterialIcons name="check" size={13} color={C.green} style={{ marginTop: 1 }} />
                                        <Text style={styles.tipText}>{tip}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* ── Rejected: Edit Mode Controls ── */}
                        {status === 'rejected' && !isEditing && (
                            <TouchableOpacity
                                style={styles.resubmitBtn}
                                onPress={() => setIsEditing(true)}
                                activeOpacity={0.85}
                            >
                                <MaterialIcons name="refresh" size={17} color={C.navy} />
                                <Text style={styles.resubmitBtnText}>Re-submit Verification</Text>
                            </TouchableOpacity>
                        )}

                        {status === 'rejected' && isEditing && (
                            <View style={styles.editModeRow}>
                                <TouchableOpacity
                                    style={styles.cancelEditBtn}
                                    onPress={handleCancelEdit}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.cancelEditBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* ── Submit Button ── */}
                        {showSubmit && (
                            <TouchableOpacity
                                style={[
                                    styles.submitBtn,
                                    (!canSubmit || loading) && styles.submitBtnDisabled,
                                ]}
                                onPress={handleSubmit}
                                disabled={!canSubmit || loading}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator color={C.navy} />
                                ) : (
                                    <>
                                        <MaterialIcons name="send" size={17} color={C.navy} style={{ marginRight: 8 }} />
                                        <Text style={styles.submitBtnText}>Submit for Verification</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        {/* ── Pending: info only ── */}
                        {status === 'pending' && (
                            <View style={styles.pendingNote}>
                                <MaterialIcons name="hourglass-empty" size={15} color={C.amber} style={{ marginRight: 8 }} />
                                <Text style={styles.pendingNoteText}>
                                    You cannot change your submission while it is under review. Contact TMC admin if needed.
                                </Text>
                            </View>
                        )}

                        {/* ── Approved: note ── */}
                        {status === 'approved' && (
                            <View style={styles.approvedNote}>
                                <MaterialIcons name="verified" size={15} color={C.green} style={{ marginRight: 8 }} />
                                <Text style={styles.approvedNoteText}>
                                    You are verified! You can now select the Priority lane when joining any queue.
                                </Text>
                            </View>
                        )}

                        <View style={{ height: 40 }} />
                    </Animated.View>
                </ScrollView>
            </View>
            </SafeAreaView>
        </>
    );
}

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },

    loadingScreen: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        backgroundColor: C.bg,
    },
    loadingText: { fontSize: 13, color: C.textMuted, marginTop: 12 },

    // Top bar
    topBar: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 54 : 20,
        paddingBottom: 14, backgroundColor: C.white,
        borderBottomWidth: 1, borderBottomColor: C.border,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: C.borderLight, alignItems: 'center', justifyContent: 'center',
    },
    topBarTitle: {
        flex: 1, textAlign: 'center',
        fontSize: 15, fontWeight: '800', color: C.navy, letterSpacing: 0.2,
    },

    scroll: { paddingHorizontal: 18, paddingTop: 20 },

    // Status card
    statusCard: {
        flexDirection: 'row', alignItems: 'flex-start',
        borderRadius: 14, padding: 14, marginBottom: 14,
        borderWidth: 1,
    },
    statusIconBox: {
        width: 42, height: 42, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center',
    },
    statusLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3, marginBottom: 3 },
    statusDesc: { fontSize: 12, color: C.textSub, lineHeight: 17 },

    // Info card
    infoCard: {
        backgroundColor: C.white, borderRadius: 14,
        padding: 14, marginBottom: 22,
        borderWidth: 1, borderColor: C.border,
        shadowColor: C.shadow, shadowOpacity: 0.03,
        shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    infoCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    infoCardTitle: {
        fontSize: 12, fontWeight: '800', color: C.navy,
        marginLeft: 7, letterSpacing: 0.2,
    },
    infoDivider: { height: 1, backgroundColor: C.borderLight, marginBottom: 10 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
    infoDot: {
        width: 5, height: 5, borderRadius: 3,
        backgroundColor: C.gold, marginTop: 5, marginRight: 10,
    },
    infoText: { flex: 1, fontSize: 12, color: C.textSub, lineHeight: 17 },

    // Section label
    sectionLabel: {
        fontSize: 10, fontWeight: '800', color: C.textMuted,
        letterSpacing: 1.3, marginBottom: 10,
    },

    // Preview
    previewWrapper: {
        borderRadius: 14, overflow: 'hidden',
        marginBottom: 14, borderWidth: 1, borderColor: C.border,
        shadowColor: C.shadow, shadowOpacity: 0.06,
        shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3,
    },
    preview: { width: '100%', height: 210 },
    previewOverlay: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(11,31,58,0.65)',
        padding: 12, alignItems: 'center',
    },
    previewOverlayBtn: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(212,160,23,0.9)',
        borderRadius: 8, paddingVertical: 7, paddingHorizontal: 16,
    },
    previewOverlayBtnText: {
        fontSize: 13, fontWeight: '700', color: C.white, marginLeft: 6,
    },
    changedBadge: {
        position: 'absolute', top: 10, right: 10,
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.green,
        borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4,
    },
    changedBadgeText: { fontSize: 10, fontWeight: '700', color: C.white, marginLeft: 4 },

    // Upload placeholder
    uploadPlaceholder: {
        backgroundColor: C.goldPale, borderRadius: 14,
        borderWidth: 1.5, borderColor: C.goldBorder,
        borderStyle: 'dashed', padding: 28,
        alignItems: 'center', marginBottom: 14,
    },
    uploadIconBox: {
        width: 56, height: 56, borderRadius: 14,
        backgroundColor: C.white, borderWidth: 1, borderColor: C.goldBorder,
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    uploadTitle: { fontSize: 14, fontWeight: '800', color: C.navy, marginBottom: 4 },
    uploadSub: { fontSize: 12, color: C.textMuted, marginBottom: 12 },
    uploadFormatRow: { flexDirection: 'row', gap: 6 },
    formatChip: {
        backgroundColor: C.white, borderRadius: 20,
        paddingHorizontal: 10, paddingVertical: 3,
        borderWidth: 1, borderColor: C.goldBorder,
    },
    formatChipText: { fontSize: 10, fontWeight: '700', color: C.gold },

    // Tips
    tipsCard: {
        backgroundColor: C.white, borderRadius: 14,
        padding: 14, marginBottom: 20,
        borderWidth: 1, borderColor: C.border,
    },
    tipsTitle: {
        fontSize: 10, fontWeight: '800', color: C.textMuted,
        letterSpacing: 1.2, marginBottom: 10,
    },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 7, gap: 8 },
    tipText: { flex: 1, fontSize: 12, color: C.textSub, lineHeight: 17 },

    // Resubmit
    resubmitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: C.gold, borderRadius: 12, height: 50,
        marginBottom: 16,
        shadowColor: C.gold, shadowOpacity: 0.3,
        shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    resubmitBtnText: { fontSize: 14, fontWeight: '800', color: C.navy, marginLeft: 8 },

    editModeRow: { marginBottom: 10 },
    cancelEditBtn: {
        height: 44, borderRadius: 12,
        borderWidth: 1.5, borderColor: C.border,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: C.white,
    },
    cancelEditBtnText: { fontSize: 14, fontWeight: '700', color: C.textSub },

    // Submit button
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: C.gold, borderRadius: 12, height: 52,
        marginBottom: 12,
        shadowColor: C.gold, shadowOpacity: 0.35,
        shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
    },
    submitBtnDisabled: {
        backgroundColor: C.borderLight, shadowOpacity: 0, elevation: 0,
        borderWidth: 1, borderColor: C.border,
    },
    submitBtnText: { fontSize: 15, fontWeight: '800', color: C.navy, letterSpacing: 0.3 },

    // Notes
    pendingNote: {
        flexDirection: 'row', alignItems: 'flex-start',
        backgroundColor: C.amberPale, borderRadius: 12,
        padding: 13, borderWidth: 1, borderColor: C.amberBorder, marginTop: 4,
    },
    pendingNoteText: { flex: 1, fontSize: 12, color: C.amber, lineHeight: 17 },
    approvedNote: {
        flexDirection: 'row', alignItems: 'flex-start',
        backgroundColor: C.greenPale, borderRadius: 12,
        padding: 13, borderWidth: 1, borderColor: C.greenBorder, marginTop: 4,
    },
    approvedNoteText: { flex: 1, fontSize: 12, color: C.green, lineHeight: 17 },
});