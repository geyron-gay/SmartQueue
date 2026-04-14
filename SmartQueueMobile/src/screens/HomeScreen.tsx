// screens/JoinQueueScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    Alert, ActivityIndicator, ScrollView, Modal, Pressable, Button
} from 'react-native'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Picker } from '@react-native-picker/picker';
import { notificationService } from '../services/notificationService';
import { queueService } from '../services/queueService';
import { useActiveTickets } from '../hooks/useActiveTickets';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { initializeSocket } from '../context/socket';
import * as Notifications from 'expo-notifications';

type Ticket = {
    id: string | number;
    department: string;
    queue_number: string | number;
    people_ahead: number; 
    estimated_wait_time: number; 
    status: string;
};

type Office = {
    id: number;
    department: string;
    target_year: string;
    current_count: number;
    capacity_limit: number;
    stop_time_at: Date | string;
    purposes?: Array<{ id: number; name: string }>;
};

// ── Constants ─────────────────────────────────────────────────
const OFFICE_LOCATION = { 
    latitude: 9.985800374224583,
    longitude: 124.3423668012716
}; 
const ALLOWED_RADIUS_KM = 0.50; 

// ── Component ─────────────────────────────────────────────────
export default function JoinQueueScreen() {
    const { user, logout, handleApiError } = useAuth();
    const router = useRouter();
    
    // ── State ─────────────────────────────────────────────
    const [purpose, setPurpose] = useState('');
    const [loading, setLoading] = useState(false);
    const [offices, setOffices] = useState<Office[]>([]);
    const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [joiningId, setJoiningId] = useState<number | null>(null);

    const { activeTickets, fetchTickets, setActiveTickets } = useActiveTickets(user?.id);

    const handleQueueUpdate = (payload: any) => {
    // 1. Extract the data (Laravel Echo usually wraps it in 'data' or the event name)
    const socketData = payload.data || payload;

    // 2. CHECK: Is this a Broadcast?
    if (socketData.is_broadcast) {
        console.log("📢 New Broadcast Received:", socketData.message);
        
        // Show a standard notification (not sticky)
        notificationService.sendBroadcastNotification(
            socketData.message, 
            socketData.type
        );
        
        // Optional: Show an on-screen alert if they are using the app
        Alert.alert(`${socketData.type.toUpperCase()}`, socketData.message);
        return; 
    }

    // 3. TICKET LOGIC (Your existing code)
    const ticket = socketData.message || socketData; // Fallback to payload
    
    if (ticket === "refresh" || !ticket || typeof ticket === 'string') {
        fetchTickets();
        return;
    }
    
    if (ticket.user_id === user?.id) {
        const isNew = !activeTickets.some((t: any) => t.id === ticket.id);
        notificationService.updateStickyQueueNotification(
            String(ticket.queue_number),
            ticket.status,
            ticket.people_ahead || 0,
            ticket.estimated_wait_time || 0,
            isNew
        );
    }
    fetchTickets();
}
    const socketRef = useQueueSocket(user, handleQueueUpdate, [activeTickets]);

useEffect(() => {
    if (!user) return;

    let socket: any;

    const fetchOfficesAndTickets = async () => {
        try {
            // 1️⃣ Tickets
            fetchTickets();

            // 2️⃣ Offices
            const officesData = await queueService.getOffices();
            setOffices(officesData);
        } catch (err) {
            console.error("Failed to fetch offices or tickets", err);
        }
    };

 
    fetchOfficesAndTickets();

    const setupSocket = async () => {
        socket = await initializeSocket();
        socket.on('QueueUpdated', async () => {
            console.log("📢 Global Update!");
            fetchOfficesAndTickets(); 
        });
    };

    setupSocket();

    return () => { if (socket) socket.disconnect(); };
}, [user]);

    // ── Handlers ───────────────────────────────────────────
    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Logout", 
                style: "destructive", 
                onPress: async () => await logout() 
            }
        ]);
    };

    const handleJoin = (office: Office) => {
        setSelectedOffice(office);
        setPurpose('');
        setIsModalVisible(true);
    };

    const handleConfirmJoin = () => {
        if (!purpose) {
            Alert.alert("Wait!", "Please select a purpose first.");
            return;
        }

        if (user?.priority === 'Priority') {
            Alert.alert(
                "⚠️ Priority Verification",
                "Priority slots are strictly for PWD, Pregnant, or Seniors. Present ID at the counter.",
                [
                    { text: "Cancel", style: "cancel" },
                    { 
                        text: "I Understand & Proceed", 
                        onPress: proceedToJoin 
                    }
                ]
            );
        } else {
            proceedToJoin();
        }
    };

    const proceedToJoin = async () => {
        if (!selectedOffice || !purpose) return;
        
        setJoiningId(selectedOffice.id);
        setLoading(true);
        setIsModalVisible(false); // Close modal before processing
        
        try {
            // 1. Validate location (inside try so errors are caught)
            await queueService.validateLocation(
                OFFICE_LOCATION.latitude,
                OFFICE_LOCATION.longitude,
                ALLOWED_RADIUS_KM
            );

            // 2. Join queue API call
            const response = await queueService.joinQueue({
                purpose,
                department: selectedOffice.department,
                year_level: selectedOffice.target_year
            });

console.log("🔥 RESPONSE:", response);

const ticketId = response?.queue?.id;

if (!ticketId) {
  console.error("❌ No ticket ID found!", response);
  Alert.alert("Error", "Server did not return ticket ID.");
  return;
}
           
        router.push({ pathname: "/main/Ticket",  params: { id: String(ticketId)}});
            

       } catch (error: any) {
    if (error.response) {
        const data = error.response.data;
        const status = error.response.status;

        // 1. Check if it's a Penalty Error (403 with penalty data)
        if (status === 403 && data.unlocks_at) {
            // Format the date to a readable time (e.g., "11:45 PM")
            const timeString = new Date(data.unlocks_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            Alert.alert(
                "Queue Restriction ✋",
                `Penalty Level: ${data.no_show_count}\n\n` +
                `Reason: ${data.message}\n\n` +
                `You can join again at: ${timeString}`,
                [{ text: "Understood" }]
            );
        } else {
            // 2. Handle other server errors (Safety Gap, Already in line, etc.)
            const errorMessage = data.error || data.message || "Permission Denied";
            Alert.alert("Join Failed", errorMessage);
        }
    } else if (error.request) {
        Alert.alert("Network Error", "Unable to reach the server. Please check your connection.");
    } else {
        Alert.alert("Error hehe", error.message || "An unexpected error occurred.");
    }
} finally {
    setLoading(false);
    setJoiningId(null);
}
    };

    // ── Loading State ──────────────────────────────────────
    if (loading && activeTickets.length === 0 && offices.length === 0) {
        return <ActivityIndicator style={{ flex: 1 }} size="large" color="#D4A017" />;
    }

  return (
    <SafeAreaView style={styles.safeArea}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
            {/* Decorative bg circles */}
            <View style={styles.headerCircle1} />
            <View style={styles.headerCircle2} />
            {/* Top row */}
            <View style={styles.headerTopRow}>
                <View>
                    <Text style={styles.welcomeLabel}>Good day,</Text>
                    <Text style={styles.welcomeName}>{user?.name || 'Student'} 👋</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.8}>
                    <Text style={styles.logoutBtnText}>Sign Out</Text>
                </TouchableOpacity>
            </View>

            {/* Badges */}
            <View style={styles.userBadgeRow}>
                <View style={styles.userBadgePill}>
                    <Text style={styles.userBadgeText}>🎓 {user?.user_type?.toUpperCase() || 'STUDENT'}</Text>
                </View>
                <View style={styles.userBadgePill}>
                    <Text style={styles.userBadgeText}>🏫 Trinidad Municipal College</Text>
                </View>
            </View>

            {/* Gold accent line */}
            <View style={styles.headerDivider} />

            {/* ── ACTIVE QUEUES ── */}
            <View style={styles.activeSection}>
                <View style={styles.activeSectionHeader}>
                    <Text style={styles.activeSectionTitle}>My Active Queues</Text>
                    <View style={[styles.activeBadge, activeTickets.length === 0 && styles.activeBadgeEmpty]}>
                        <Text style={styles.activeBadgeText}>{activeTickets.length}</Text>
                    </View>
                </View>

                {activeTickets.length > 0 ? (
                    <ScrollView style={{ maxHeight: 215 }} showsVerticalScrollIndicator={false}>
                        {activeTickets.map((t) => (
                            <TouchableOpacity
                                key={t.id}
                                style={[
                                    styles.ticketCard,
                                    t.status === 'serving' && styles.ticketCardServing
                                ]}
                                onPress={() => router.push({ pathname: '/main/Ticket', params: { id: t.id } })}
                                activeOpacity={0.85}
                            >
                    
                                <View style={styles.ticketBody}>
                                    <View style={styles.ticketBodyLeft}>
                                        <Text style={styles.ticketDept} numberOfLines={1}>{t.department}</Text>
                                        <Text style={styles.ticketAhead}>
                                            {t.people_ahead === 0 && t.status !== 'serving'
                                                ? '🎉 You\'re next!'
                                                : t.status === 'serving' ? '⚡ You\'re being served!' : `${t.people_ahead} ahead of you`}
                                        </Text>
                                        <View style={[
                                            styles.ticketStatusPill,
                                            t.status === 'serving' && styles.ticketStatusPillServing
                                        ]}>
                                            <Text style={[
                                                styles.ticketStatusText,
                                                t.status === 'serving' && styles.ticketStatusTextServing
                                            ]}>
                                                {t.status === 'serving' ? '⚡ NOW SERVING' : t.status?.toUpperCase()}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.ticketBodyRight}>
                                        <Text style={styles.ticketNumLarge}>#{t.queue_number}</Text>
                                        <Text style={styles.ticketWait}>
                                            ⏱ {(t?.estimated_wait_time ?? 0) <= 0 ? '~1' : t?.estimated_wait_time} min
                                        </Text>
                                        <Text style={styles.ticketViewLink}>View →</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                ) : (
                    <View style={styles.emptyQueue}>
                        <Text style={styles.emptyQueueIcon}>🪑</Text>
                        <Text style={styles.emptyQueueText}>You're not in any queue.</Text>
                        <Text style={styles.emptyQueueSub}>Join an office below to get started.</Text>
                    </View>
                )}
            </View>
        </View>

        {/* ── OFFICES ── */}
        <ScrollView contentContainerStyle={styles.officeScroll} showsVerticalScrollIndicator={false}>

            <View style={styles.officeSectionHeader}>
                <Text style={styles.officeSectionTitle}>Available Offices</Text>
                <Text style={styles.officeSectionCount}>{offices.length} open</Text>
            </View>


            {offices.length === 0 ? (
    <View style={styles.emptyOfficeWrap}>
        <Text style={styles.emptyOfficeIcon}>🏢</Text>

        <Text style={styles.emptyOfficeTitle}>
            No Offices Available
        </Text>

        <Text style={styles.emptyOfficeSubtitle}>
            All offices are currently closed or no queue sessions are active.
        </Text>

    </View>
) : (

            offices.map((office: any) => {
                const isFull     = office.current_count >= office.capacity_limit;
                const pct        = Math.min((office.current_count / office.capacity_limit) * 100, 100);
                const isNearFull = pct >= 75 && !isFull;
                const isSessionClosed = (stopTime: string | number | Date) => {
  if (!stopTime) return false;

  const now = Date.now();
  const stop = new Date(stopTime).getTime();

  if (isNaN(stop)) return false; // safety

  return stop <= now;
};

                const isStop = isSessionClosed(office.stop_time_at);

                const formatTime = (dateStr: string | number | Date) => {
  if (!dateStr) return "—";

  return new Date(dateStr).toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};
                return (
                    <TouchableOpacity
                        key={office.id}
                        style={[styles.officeCard, isFull && styles.officeCardFull]}
                        onPress={() => {
  if (isStop) {
    Alert.alert("This queue is already closed.");
    return;
  }

  if (!isFull) {
    handleJoin(office);
  }
}}
                        disabled={isFull || loading}
                        activeOpacity={0.85}
                    >
                       
                        {/* Header row */}

                        <View >
                            <Text style={styles.officeCardTitle}>Office Details</Text>
                            <Text style={styles.officeStopTime}>Stop Time: {formatTime(office.stop_time_at)}</Text>
                        </View>
                        <View style={styles.officeCardHeader}>
                            <View style={styles.officeIconWrap}>
                                <Text style={styles.officeIcon}>🏛️</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.officeDeptName}>{office.department}</Text>
                                <Text style={styles.officeSubInfo}>Target: {office.target_year}</Text>
                            </View>
                            <View style={[
                                styles.officeStatusBadge,
                                isFull     ? styles.officeStatusFull
                                : isNearFull ? styles.officeStatusWarn
                                :              styles.officeStatusOpen
                            ]}>
                                <Text style={[
                                    styles.officeStatusText,
                                    isFull     ? styles.officeStatusTextFull
                                    : isNearFull ? styles.officeStatusTextWarn
                                    :              styles.officeStatusTextOpen
                                ]}>
                                    {isFull ? 'FULL' : isNearFull ? 'ALMOST FULL' : 'OPEN'}
                                </Text>
                            </View>
                        </View>

                        {/* Progress bar */}
                        <View style={styles.officeProgressWrap}>
                            <View style={styles.officeProgressBg}>
                                <View style={[
                                    styles.officeProgressFill,
                                    { width: `${pct}%` as any },
                                    isFull      ? styles.progressFull
                                    : isNearFull ? styles.progressWarn
                                    :              styles.progressOpen
                                ]} />
                            </View>
                            <View style={styles.officeProgressFooter}>
                                <Text style={styles.officeSlotText}>
                                    {office.current_count} / {office.capacity_limit} slots used
                                </Text>
                                <Text style={[
                                    styles.officeSlotsLeft,
                                    { color: isFull ? '#dc2626' : '#16a34a' }
                                ]}>
                                    {isFull
                                        ? 'No slots left'
                                        : `${office.capacity_limit - office.current_count} left`}
                                </Text>
                            </View>
                        </View>
                        
                        {isStop && (
  <Text style={{ color: "red", fontSize: 12 }}>
    ⛔ Queue Closed
  </Text>
)}

                        {/* CTA row */}
                        {!isFull && (
                            <View style={styles.officeCTARow}>
                                <Text style={styles.officeCTAText}>
                                    {joiningId === office.id ? 'Joining...' : 'Tap to join queue →'}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })
        )}
        
            <View style={{ height: 32 }} />
        </ScrollView>

        {/* ── MODAL ── */}
        <Modal
            animationType="slide"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={() => setIsModalVisible(false)}
        >
            <Pressable style={styles.modalOverlay} onPress={() => setIsModalVisible(false)}>
                <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>

                    <View style={styles.modalHandle} />

                    {/* Modal header */}
                    <View style={styles.modalHeader}>
                        <View style={styles.modalHeaderIcon}>
                            <Text style={{ fontSize: 22 }}>🏛️</Text>
                        </View>
                        <View>
                            <Text style={styles.modalTitle}>Join Queue</Text>
                            <Text style={styles.modalSubtitle}>{selectedOffice?.department}</Text>
                        </View>
                    </View>

                    <View style={styles.modalDivider} />

                    {/* Purpose */}
                    <Text style={styles.fieldLabel}>Purpose of Visit</Text>
                    <View style={styles.pickerWrap}>
                        <Picker selectedValue={purpose} onValueChange={(val) => setPurpose(val)}>
                            <Picker.Item label="Select your purpose..." value="" />
                            {selectedOffice?.purposes?.map((p: any) => (
                                <Picker.Item key={p.id} label={p.name} value={p.name} />
                            ))}
                        </Picker>
                    </View>
                    

                    {/* Actions */}
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalVisible(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.joinBtn, !purpose && styles.joinBtnDisabled]}
                            onPress={handleConfirmJoin}
                            disabled={!purpose}
                        >
                            <Text style={styles.joinBtnText}>Confirm &amp; Join →</Text>
                        </TouchableOpacity>
                    </View>

                </Pressable>
            </Pressable>

            {/* Processing overlay */}
            {loading && (
                <View style={styles.processingOverlay}>
                    <ActivityIndicator size="large" color="#f5c518" />
                    <Text style={styles.processingTitle}>Securing your slot...</Text>
                    <Text style={styles.processingSubtitle}>Please wait a moment.</Text>
                </View>
            )}
        </Modal>
            {loading && (
    <View style={styles.loadingOverlay}>
        <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#D4A017" />

            <Text style={styles.loadingTitle}>
                Securing your place in line...
            </Text>

            <Text style={styles.loadingSubtitle}>
                Please wait while we reserve your queue slot.
            </Text>
        </View>
    </View>
)}

 
    </SafeAreaView>
  );
}
const UI = {
  bluePrimary: '#eeeeee',       
  blueSoft: '#EAF2FB',      
  blueMuted: '#0c3169',

  yellowPrimary: '#F4B41A', 
  yellowSoft: '#FFF7DD',

  bgMain: '#F9FAFB',   
  bgCard: '#FFFFFF',

  textPrimary: '#1F2937',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  borderSoft: '#E5E7EB',

  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
};

const styles = StyleSheet.create({

safeArea: {
  flex: 1,
  backgroundColor: UI.bluePrimary, // SAME as header
},

header: {
  backgroundColor: UI.blueMuted,
  paddingHorizontal: 20,
  paddingTop: 0,               // IMPORTANT
  paddingBottom: 28,
  borderBottomLeftRadius: 32,
  borderBottomRightRadius: 32,

  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.18,
  shadowRadius: 14,
  elevation: 10,
},
    headerCircle1: {
        position: 'absolute',
        width: 180, height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(245,197,24,0.06)',
        top: -60, right: -40,
    },

    headerCircle2: {
        position: 'absolute',
        width: 120, height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(205, 0, 0, 0.04)',
        bottom: -30,
        left: '30%',
    },

    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
        zIndex: 1,
    },

    welcomeLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '500',
        marginBottom: 2,
    },

    welcomeName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: -0.3,
    },

    /* kept for backward compat */
    welcomeText:  { fontSize: 18, fontWeight: '700', color: '#ffffff' },
    userBadge:    { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' },

    logoutBtn: {
        backgroundColor: 'rgba(220,38,38,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(220,38,38,0.3)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },

    logoutBtnText: {
        color: '#fca5a5',
        fontWeight: '700',
        fontSize: 12,
    },

    /* kept for backward compat */
    logoutLink:   { color: '#fca5a5', fontWeight: '600', fontSize: 14 },
    iconLogoutBtn:{ padding: 8 },

    userBadgeRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 14,
        flexWrap: 'wrap',
    },

    userBadgePill: {
        backgroundColor: 'rgba(245,197,24,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(245,197,24,0.25)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },

    userBadgeText: {
        color: '#f5c518',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    headerDivider: {
        height: 2,
        backgroundColor: '#f5c518',
        borderRadius: 2,
        marginBottom: 14,
        width: 36,
    },

    /* ── Active queues ── */
    activeSection: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },

    /* kept for backward compat */
    activeContainer: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },

    activeSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },

    /* kept for backward compat */
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },

    activeSectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.65)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },

    /* kept for backward compat */
    activeTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.65)',
        marginRight: 8,
    },

    activeBadge: {
        backgroundColor: '#16a34a',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 20,
        minWidth: 22,
        alignItems: 'center',
    },

    activeBadgeEmpty: {
        backgroundColor: 'rgba(255,255,255,0.15)',
    },

    activeBadgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '800',
    },

    /* kept for backward compat */
    countBadge: {
        backgroundColor: '#16a34a',
        paddingHorizontal: 8,
        borderRadius: 10,
    },

    countText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },

    /* ── Ticket card ── */
    ticketCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        marginBottom: 8,
        flexDirection: 'row',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },

    ticketCardServing: {
        shadowColor: '#16a34a',
        shadowOpacity: 0.22,
        elevation: 5,
    },

    /* kept for backward compat */
    ticketStrip: {
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#f5c518',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
        elevation: 2,
    },


    ticketBody: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
    },

    ticketBodyLeft: {
        flex: 1,
        gap: 4,
    },

    ticketBodyRight: {
        alignItems: 'flex-end',
        gap: 4,
    },

    ticketDept: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0f1f3d',
    },

    ticketAhead: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '500',
    },

    ticketStatusPill: {
        backgroundColor: 'rgba(245,197,24,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(212,168,14,0.2)',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: 'flex-start',
        marginTop: 2,
    },

    ticketStatusPillServing: {
        backgroundColor: 'rgba(22,163,74,0.1)',
        borderColor: 'rgba(22,163,74,0.25)',
    },

    ticketStatusText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#d4a80e',
        letterSpacing: 0.4,
    },

    ticketStatusTextServing: {
        color: '#16a34a',
    },

    /* kept for backward compat */
    ticketStatus: {
        fontSize: 11,
        color: '#16a34a',
        fontWeight: '600',
    },

    ticketNumLarge: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1a3a6b',
        letterSpacing: -0.5,
    },

    ticketWait: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '500',
    },

    ticketViewLink: {
        fontSize: 10,
        color: '#1e4d8c',
        fontWeight: '700',
        marginTop: 2,
    },

    /* kept for backward compat */
    ticketSmallNum: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1a3a6b',
        textAlign: 'right',
    },

    viewLink: {
        fontSize: 10,
        color: '#1e4d8c',
        textAlign: 'right',
        fontWeight: '700',
    },

    ticketLeft:  { flexDirection: 'column', gap: 3 },
    ticketRight: { flexDirection: 'column', alignItems: 'flex-end', gap: 3 },

    /* ── Empty queue ── */
    emptyQueue: {
        alignItems: 'center',
        paddingVertical: 16,
        gap: 4,
    },

    emptyQueueIcon: {
        fontSize: 28,
        marginBottom: 4,
        opacity: 0.5,
    },

    emptyQueueText: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 13,
        fontWeight: '600',
    },

    emptyQueueSub: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 11,
    },

    /* kept for backward compat */
    emptyTickets: { padding: 20, alignItems: 'center' },
    emptyText:    { color: 'rgba(255,255,255,0.45)', fontSize: 12 },

    /* ── Office list ── */
    officeScroll: {
        padding: 20,
    },

    officeSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        marginTop: 4,
    },

    officeSectionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f1f3d',
        letterSpacing: -0.2,
    },

    officeSectionCount: {
        fontSize: 11,
        fontWeight: '700',
        color: '#16a34a',
        backgroundColor: 'rgba(22,163,74,0.09)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
        overflow: 'hidden',
    },

    /* kept for backward compat */
    sectionLabel: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f1f3d',
        marginTop: 4,
        marginBottom: 14,
    },

    /* ── Office card ── */
officeCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  marginBottom: 14,

  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 3,

  borderWidth: 0, // remove outline
},
officeCardFull: {
  opacity: 0.55,
},

/* backward compat */
disabledCard: {
  opacity: 0.5,
},

officeCardHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 16,
  gap: 12,
},

/* backward compat */
cardHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 16,
  gap: 12,
},

officeIconWrap: {
  width: 44,
  height: 44,
  borderRadius: 12,
  backgroundColor: 'rgba(74, 111, 165, 0.08)', // soft blue tint
  alignItems: 'center',
  justifyContent: 'center',
},

officeIcon: {
  fontSize: 20,
  color: '#4A6FA5',
},

officeDeptName: {
  fontSize: 15,
  fontWeight: '700',
  color: '#1F2937',
  letterSpacing: -0.3,
  marginBottom: 2,
},
    /* kept for backward compat */
    deptName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f1f3d',
    },

    officeSubInfo: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '500',
    },

    /* kept for backward compat */
    subInfo: { fontSize: 12, color: '#94a3b8' },

    officeStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },

    /* kept for backward compat */
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },

    officeStatusOpen: {
        backgroundColor: 'rgba(22,163,74,0.09)',
        borderWidth: 1,
        borderColor: 'rgba(22,163,74,0.2)',
    },

    officeStatusFull: {
        backgroundColor: 'rgba(220,38,38,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(220,38,38,0.18)',
    },

    officeStatusWarn: {
        backgroundColor: 'rgba(217,119,6,0.09)',
        borderWidth: 1,
        borderColor: 'rgba(217,119,6,0.2)',
    },

    officeStatusText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.4,
    },

    /* kept for backward compat */
    statusBadgeText: { fontSize: 10, fontWeight: 'bold' },

    officeStatusTextOpen: { color: '#16a34a' },
    officeStatusTextFull: { color: '#dc2626' },
    officeStatusTextWarn: { color: '#d97706' },

    officeProgressWrap: {
        paddingHorizontal: 14,
        paddingBottom: 12,
    },

    /* kept for backward compat */
    officeFooter: { paddingHorizontal: 14, paddingBottom: 12 },

    officeProgressBg: {
        height: 7,
        backgroundColor: '#f8f9fc',
        borderRadius: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 6,
    },

    /* kept for backward compat */
    progressBarBg: {
        height: 6,
        backgroundColor: '#f1f5f9',
        borderRadius: 3,
        overflow: 'hidden',
    },

    officeProgressFill: { height: '100%', borderRadius: 4 },

    /* kept for backward compat */
    progressBarFill: { height: '100%', borderRadius: 3 },

    progressOpen: { backgroundColor: '#16a34a' },
    progressWarn: { backgroundColor: '#d97706' },
    progressFull: { backgroundColor: '#dc2626' },

    officeProgressFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    officeSlotText: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '600',
    },

    officeSlotsLeft: {
        fontSize: 10,
        fontWeight: '700',
    },

    /* kept for backward compat */
    slotCount: { fontSize: 11, color: '#64748b', fontWeight: 'bold', textAlign: 'right', marginTop: 4 },

    officeCTARow: {
        borderTopWidth: 1,
        borderTopColor: '#f8f9fc',
        paddingHorizontal: 14,
        paddingVertical: 9,
        backgroundColor: 'rgba(26,58,107,0.02)',
    },

    officeCTAText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1e4d8c',
        textAlign: 'right',
    },

    /* ── Modal ── */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(10,20,40,0.72)',
        justifyContent: 'flex-end',
    },

    modalSheet: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 20,
    },

    /* kept for backward compat */
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },

    modalHandle: {
        width: 40, height: 4,
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 18,
    },

    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },

    modalHeaderIcon: {
        width: 46, height: 46,
        borderRadius: 13,
        backgroundColor: 'rgba(26,58,107,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f1f3d',
        letterSpacing: -0.3,
    },

    modalSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
        marginTop: 1,
    },

    modalDivider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginBottom: 18,
    },

    fieldLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        color: '#475569',
        marginBottom: 8,
        marginTop: 14,
    },

    pickerWrap: {
        backgroundColor: '#f8f9fc',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
    },

    /* kept for backward compat */
    modernPickerWrapper: {
        backgroundColor: '#f8f9fc',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },

    priorityNotice: {
        marginTop: 12,
        backgroundColor: 'rgba(245,197,24,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(212,168,14,0.25)',
        borderRadius: 10,
        padding: 12,
    },

    priorityNoticeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#d4a80e',
        lineHeight: 18,
    },

    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },

    cancelBtn: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#f8f9fc',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },

    cancelBtnText: {
        fontWeight: '700',
        color: '#475569',
        fontSize: 14,
    },

    /* kept for backward compat */
    cancelButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
    },

    cancelButtonText: { fontWeight: '700', color: '#64748b' },

    joinBtn: {
        flex: 2,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#1a3a6b',
        shadowColor: '#1a3a6b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },

    joinBtnDisabled: {
        backgroundColor: '#94a3b8',
        shadowOpacity: 0,
        elevation: 0,
    },

    joinBtnText: {
        fontWeight: '800',
        color: '#ffffff',
        fontSize: 14,
        letterSpacing: 0.2,
    },

    /* kept for backward compat */
    joinButton: {
        flex: 2,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#1a3a6b',
    },

    joinButtonText: { fontWeight: '700', color: '#ffffff' },
    buttonDisabled: { backgroundColor: '#94a3b8' },

    /* ── Processing overlay ── */
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        borderRadius: 24,
    },

    processingTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f1f3d',
        marginTop: 4,
    },

    processingSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
    },

    /* kept for backward compat */
    processingText: { marginTop: 15, fontSize: 16, fontWeight: '600', color: '#1e293b' },
    loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
},

loadingBox: {
    backgroundColor: "#fff",
    paddingVertical: 28,
    paddingHorizontal: 34,
    borderRadius: 18,
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
},

loadingTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#0B1F3A",
},

loadingSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
},

emptyOfficeWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
},

emptyOfficeIcon: {
    fontSize: 48,
    marginBottom: 12,
},

emptyOfficeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
},

emptyOfficeSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
},

emptyOfficeBtn: {
    backgroundColor: '#1a3a6b',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
},

emptyOfficeBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
},
officeCardTitle: {  
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 4,
},

officeStopTime: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 4,
},
});