import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Tabs, useLocalSearchParams, useRouter } from 'expo-router';
import axiosClient from '../api/axios';
import { Vibration } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { SafeAreaView } from 'react-native-safe-area-context';
import echo from '../api/echo';
import { Stack } from "expo-router";
import { initializeSocket } from '../context/socket';
import ServingCountdown from '../components/ServingCountdown';
import { useWalkAlert } from '../components/useWalkAlert';
import { useTicket } from '../hooks/useTicket';
import { ticketService } from '../services/ticketService';
import { useQueueSocket } from '../hooks/useQueueSocket';
import * as Speech from 'expo-speech';

export default function TicketScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter(); 

    const { data, loading, fetchStatus } = useTicket(id);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [hasNotified, setHasNotified] = useState(false);
    const [viewMode, setViewMode] = useState<'ticket' | 'feed'>('ticket');

    const player = useAudioPlayer('https://www.myinstants.com/media/sounds/ding-sound-effect.mp3');

    const OFFICE_LOCATION = { 
         latitude: 9.98589750376055,
    longitude:  124.3423668012716
    };

    const isNearlyTurn = !!data && data.people_ahead <= 2 && data.people_ahead > 0;

    const { distance } = useWalkAlert(
        isNearlyTurn ? (data?.people_ahead ?? 0) : 0,
        OFFICE_LOCATION
    );

  useEffect(() => { 
    fetchStatus(); 
    let socket: any;
     const setupSocket = async () => { 
        socket = await initializeSocket();
         socket.on('QueueUpdated', (data: any) => {
             console.log("📢 Real-time update from Private Socket!", data);
              fetchStatus(); 
            }); }; 
            setupSocket(); 
            return () => { 
                if (socket)
                     socket.disconnect(); 
                    }; }, 
                    [id]);

useEffect(() => {
  if (data?.ticket?.status === 'serving' && !hasNotified) {
    // 1️⃣ Play bell sound
    player.play();

    Vibration.vibrate([500, 500, 500]);

setTimeout(() => {
  Speech.speak(`wandoy hawd kaayu mo duwa mobile legend ${data.ticket.queue_number}`, {
    language: 'ceb-PH',
    pitch: 1,
    rate: 1,
  });
}, 3000); // 3 seconds

    setHasNotified(true);
  }
}, [data?.ticket?.status]);

    // ✅ Cancel handler (uses service)
    const handleCancel = () => {
        Alert.alert(
            "Leave Queue?",
            "You will lose your position.",
            [
                { text: "Stay", style: "cancel" },
                {
                    text: "Leave",
                    style: "destructive",
                    onPress: async () => {
                        if (!data?.ticket?.id) return;

                        setCancelLoading(true);
                        try {
                            await ticketService.cancelTicket(data.ticket.id);
                            router.back();
                        } catch (e) {
                            console.error("Cancel failed", e);
                            router.replace("/");
                        } finally {
                            setCancelLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // ✅ Loading UI
    if (loading) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#f5c518" />
                    <Text style={styles.loadingText}>Loading your ticket...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const isServing   = data?.ticket?.status === 'serving';
    const isCompleted = data?.ticket?.status === 'completed';
    const isCancelled = data?.ticket?.status === 'cancelled';
    const isPending   = data?.ticket?.status === 'pending';
    const isNoShow    = data?.ticket?.status === 'noshow';

    const waitFill = Math.max(5, Math.min(100, ((data?.estimated_wait_time ?? 0) / 30) * 100));

    return (
        <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.heroHeader}>
                    <View style={styles.heroCircle1} />
                    <View style={styles.heroCircle2} />

                    {distance !== null && (
         <View style={distance > 15 ? styles.alertBox : styles.successBox}>
            <Text style={styles.alertTitle}>
               {distance > 15 ? "🚶 Time to Move!" : "📍 You've Arrived"}
            </Text>
            <Text style={styles.alertMessage}>
              {distance > 15 
                ? `You are ${distance}m away. Please start walking to the office.` 
                : "You are within the office vicinity. Please wait for your name to be called."}
            </Text>
         </View>
       )}

                    <View style={styles.heroTopRow}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
                            <Text style={styles.backBtnText}>← Back</Text>
                        </TouchableOpacity>
                        <View style={styles.deptPill}>
                            <Text style={styles.deptPillText} numberOfLines={1}>
                                🏛️ {data?.ticket?.department ?? '—'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.nowServingWrap}>
                        <Text style={styles.nowServingLabel}>NOW SERVING</Text>
                        <Text style={styles.nowServingNumber}>
                            {data?.now_serving !== 'None' ? `#${data?.now_serving}` : '- - -'}
                        </Text>
                    </View>

                    <View style={styles.heroDivider} />

                    <View style={styles.heroStatusRow}>
                        <View style={[
                            styles.heroStatusPill,
                            isServing   && styles.heroStatusServing,
                            isCompleted && styles.heroStatusDone,
                            isCancelled && styles.heroStatusCancelled,
                        ]}>
                            <Text style={[
                                styles.heroStatusText,
                                isServing   && styles.heroStatusTextServing,
                                isCompleted && styles.heroStatusTextDone,
                                isCancelled && styles.heroStatusTextCancelled,
                            ]}>
                                {isServing   ? '⚡ NOW SERVING'
                                : isCompleted ? '✓ COMPLETED'
                                : isCancelled ? '✕ CANCELLED'
                                :               '⏳ WAITING'}
                            </Text>
                        </View>
                        {data?.ticket?.priority_level == '1' && (
                            <View style={styles.priorityPill}>
                                <Text style={styles.priorityPillText}>⭐ PRIORITY</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── VIEW TOGGLE ── */}
                <View style={styles.toggleWrap}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, viewMode === 'ticket' && styles.toggleActive]}
                        onPress={() => setViewMode('ticket')}
                        activeOpacity={0.8}
                    >
                        <Text style={viewMode === 'ticket' ? styles.toggleTextActive : styles.toggleText}>
                            🎫 My Ticket
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, viewMode === 'feed' && styles.toggleActive]}
                        onPress={() => setViewMode('feed')}
                        activeOpacity={0.8}
                    >
                        <Text style={viewMode === 'feed' ? styles.toggleTextActive : styles.toggleText}>
                            📡 Live Feed
                        </Text>
                    </TouchableOpacity>
                </View>

                {viewMode === 'ticket' && (
                    <View style={styles.ticketView}>

                        {/* Ticket card */}
                        <View style={styles.ticketCard}>
                            {/* Top accent */}
                            <View style={[
                                styles.ticketCardAccent,
                                isServing   && styles.ticketAccentServing,
                                isCompleted && styles.ticketAccentDone,
                                isCancelled && styles.ticketAccentCancelled,
                            ]} />

                            <View style={styles.ticketCardBody}>
                                <Text style={styles.ticketLabel}>YOUR TICKET NUMBER</Text>
                                <Text style={[
            styles.ticketNumber,
            isServing   && styles.ticketNumberServing,
            isCompleted && { color: '#16a34a' },
            isCancelled && { color: '#dc2626' },
        ]}
    >
        {data?.ticket
            ? `${data.ticket.department?.charAt(0).toUpperCase()}-${String(data.ticket.queue_number).padStart(2, '0')}`
            : '---'}
    </Text>

                                {isServing && (
<View style={styles.servingHero}>
    <Text style={styles.servingEmoji}>🎉</Text>
    <Text style={styles.servingHeadline}>It's Your Turn!</Text>
    <Text style={styles.servingSubtext}>
        Please proceed to the counter now.
    </Text>

    <ServingCountdown startedAt={data?.started_at} />

</View>
)}

                                {/* Completed state */}
                                {isCompleted && (
                                    <View style={styles.completedHero}>
                                        <Text style={styles.completedEmoji}>✅</Text>
                                        <Text style={styles.completedHeadline}>Transaction Complete</Text>
                                        <Text style={styles.completedSubtext}>You're all done. Have a great day!</Text>
                                    </View>
                                )}

                                {/* Cancelled state */}
                                {isCancelled && (
                                    <View style={styles.cancelledHero}>
                                        <Text style={styles.cancelledEmoji}>❌</Text>
                                        <Text style={styles.cancelledHeadline}>Ticket Cancelled</Text>
                                        <Text style={styles.cancelledSubtext}>Your ticket has been cancelled.</Text>
                                    </View>
                                )}

                                {/* Waiting state — wait card */}
                                {isPending && (
                                    <View style={styles.waitCard}>

                                        <View style={styles.waitCardHeader}>
                                            <Text style={styles.waitCardIcon}>🕒</Text>
                                            <Text style={styles.waitCardLabel}>ESTIMATED WAIT TIME</Text>
                                        </View>

                                        <Text style={styles.waitTime}>
                                            {(data?.estimated_wait_time ?? 0) <= 0 ? '< 1' : data?.estimated_wait_time}
                                            <Text style={styles.waitTimeSuffix}> min</Text>
                                        </Text>

                                        {/* Progress bar */}
                                        <View style={styles.waitProgressBg}>
                                            <View style={[
                                                styles.waitProgressFill,
                                                { width: `${waitFill}%` as any },
                                                (data?.estimated_wait_time ?? 0) < 5 && styles.waitProgressFillHot,
                                            ]} />
                                        </View>

                                        <Text style={styles.waitProgressLabel}>
                                            {data?.people_ahead === 0
                                                ? '🎉 You are next in line!'
                                                : `${data?.people_ahead} student${data?.people_ahead !== 1 ? 's' : ''} ahead of you`}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {isNoShow && (
                                <View style={styles.noShowHero}>
                                    <Text style={styles.noShowEmoji}>⏰</Text>
                                    <Text style={styles.noShowHeadline}>Ticket No-Show</Text>
                                    <Text style={styles.noShowSubtext}>You missed your appointment.</Text>
                                </View>
                            )}

                            {/* Ticket footer stats */}
                            {!isCancelled && (
                                <>
                                    <View style={styles.ticketDivider} />
                                    <View style={styles.ticketStats}>
                                        <View style={styles.ticketStat}>
                                            <Text style={styles.ticketStatValue}>{data?.people_ahead ?? 0}</Text>
                                            <Text style={styles.ticketStatLabel}>Ahead</Text>
                                        </View>
                                        <View style={styles.ticketStatSep} />
                                        <View style={styles.ticketStat}>
                                            <Text style={styles.ticketStatValue}>
                                                {data?.now_serving !== 'None' ? `#${data?.now_serving}` : '—'}
                                            </Text>
                                            <Text style={styles.ticketStatLabel}>Now Serving</Text>
                                        </View>
                                        <View style={styles.ticketStatSep} />
                                        <View style={styles.ticketStat}>
                                            <Text style={[styles.ticketStatValue, { color: '#f5c518' }]}>
                                                {data?.ticket?.status === 'serving' ? '⏳ In Service' : data?.ticket?.status === 'completed' ? '✅ Done' : data?.ticket?.status === 'cancelled' ? '🚫 Cancelled' :
                                                data?.ticket?.status ==='noshow' ? "wa nagpakita" : data?.estimated_wait_time === undefined ? '—' : `${(data?.estimated_wait_time ?? 0) <= 0 ? '< 1' : data?.estimated_wait_time}m`}
                                               
                                            </Text>
                                            <Text style={styles.ticketStatLabel}>Your Status</Text>
                                        </View>
                                    </View>
                                </>
                            )}
                        </View>

                        {/* Priority notice */}
                        {data?.ticket?.priority_level == '1' && isPending && (
                            <View style={styles.priorityNotice}>
                                <Text style={styles.priorityNoticeText}>
                                    ⭐ You are in the priority lane. Please present your ID at the counter.
                                </Text>
                            </View>
                        )}

                        {/* Cancel button */}
                       {isPending && (
    <TouchableOpacity
        style={[styles.cancelBtn, cancelLoading && styles.cancelBtnDisabled]}
        onPress={handleCancel}
        disabled={cancelLoading}
        activeOpacity={0.85}
    >
        <Text style={styles.cancelBtnText}>
            {cancelLoading ? "Leaving Queue..." : "Cancel Ticket & Exit Queue"}
        </Text>
    </TouchableOpacity>
)}

                    </View>
                )}

                {/* ═══════════════ LIVE FEED VIEW ═══════════════ */}
                {viewMode === 'feed' && (
                    <View style={styles.feedView}>
                        <View style={styles.feedHeaderRow}>
                            <Text style={styles.feedTitle}>Queue Neighborhood</Text>
                            <View style={styles.feedLiveBadge}>
                                <View style={styles.feedLiveDot} />
                                <Text style={styles.feedLiveText}>LIVE</Text>
                            </View>
                        </View>

                        {data?.neighborhood?.length === 0 && (
                            <View style={styles.feedEmpty}>
                                <Text style={styles.feedEmptyIcon}>😴</Text>
                                <Text style={styles.feedEmptyText}>No one else is in the queue right now.</Text>
                            </View>
                        )}

                        {data?.neighborhood?.map((item) => (
                            <View
                                key={item.id}
                                style={[
                                    styles.feedItem,
                                    item.is_me      && styles.feedItemMe,
                                    item.status === 'serving' && styles.feedItemServing,
                                ]}
                            >
                                {/* Left accent */}
                                <View style={[
                                    styles.feedItemAccent,
                                    item.is_me            && styles.feedItemAccentMe,
                                    item.status === 'serving' && styles.feedItemAccentServing,
                                ]} />

                                {/* Avatar */}
                                <View style={[
                                    styles.feedAvatar,
                                    item.is_me            && styles.feedAvatarMe,
                                    item.status === 'serving' && styles.feedAvatarServing,
                                ]}>
                                    <Text style={styles.feedAvatarText}>
                                        {item.student_name?.charAt(0)?.toUpperCase() ?? '?'}
                                    </Text>
                                </View>

                                {/* Info */}
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.feedNum}>#{item.queue_number}</Text>
                                    <Text style={styles.feedName} numberOfLines={1}>
                                        {item.is_me ? `${item.student_name} (You)` : item.student_name}
                                    </Text>
                                    <Text style={styles.feedPurpose} numberOfLines={1}>{item.purpose}</Text>
                                </View>

                                {/* Right */}
                                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                    <View style={[
                                        styles.feedStatusPill,
                                        item.status === 'serving'   && styles.feedStatusServing,
                                        item.status === 'completed' && styles.feedStatusDone,
                                    ]}>
                                        <Text style={[
                                            styles.feedStatusText,
                                            item.status === 'serving'   && { color: '#16a34a' },
                                            item.status === 'completed' && { color: '#94a3b8' },
                                        ]}>
                                            {item.status?.toUpperCase()}
                                        </Text>
                                    </View>
                                    {item.is_me && (
                                        <View style={styles.meBadge}>
                                            <Text style={styles.meText}>YOU</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 32 }} />
            </ScrollView>

            {cancelLoading && (
    <View style={styles.loadingOverlay}>
        <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#D4A017" />

            <Text style={styles.loadingTitle}>
                Removing you from the queue...
            </Text>

            <Text style={styles.loadingSubtitle}>
                Please wait while we update your ticket status.
            </Text>
        </View>
    </View>
)}

        </SafeAreaView>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES  ← paste this entire block as your StyleSheet.create({...})
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

    /* ── Base ── */
    safe: {
        flex: 1,
        backgroundColor: '#f8f9fc',
    },

    scrollContent: {
        flexGrow: 1,
    },

    /* ── Loading ── */
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },

    loadingText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },

    alertBox: {
        backgroundColor: 'rgba(220,38,38,0.1)',
        borderColor: 'rgba(220,38,38,0.3)', 
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 14,
        alignItems: 'center',
    },

    successBox: {
        backgroundColor: 'rgba(22,163,74,0.1)',
        borderColor: 'rgba(22,163,74,0.3)',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 14,
        alignItems: 'center',
    },

    alertTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#dc2626',
    },

    alertMessage: {
        fontSize: 11,
        color: '#dc2626',
    },
    /* ── Hero Header ── */
    heroHeader: {
        backgroundColor: '#1a3a6b',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 24,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        shadowColor: '#1a3a6b',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 12,
        overflow: 'hidden',
        position: 'relative',
    },

    heroCircle1: {
        position: 'absolute',
        width: 200, height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(245,197,24,0.06)',
        top: -60, right: -50,
    },

    heroCircle2: {
        position: 'absolute',
        width: 130, height: 130,
        borderRadius: 65,
        backgroundColor: 'rgba(255,255,255,0.04)',
        bottom: -30, left: '25%',
    },

    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 18,
        zIndex: 1,
    },

    backBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 7,
    },

    backBtnText: {
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '700',
        fontSize: 13,
    },

    deptPill: {
        backgroundColor: 'rgba(245,197,24,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(245,197,24,0.25)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 5,
        maxWidth: 200,
    },

    deptPillText: {
        color: '#f5c518',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    /* kept for backward compat */
    deptHeader: {
        backgroundColor: 'rgba(245,197,24,0.12)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 5,
        alignSelf: 'flex-end',
        marginBottom: 10,
    },
    deptHeaderText: {
        color: '#f5c518',
        fontSize: 11,
        fontWeight: '700',
    },

    nowServingWrap: {
        alignItems: 'center',
        marginBottom: 14,
        zIndex: 1,
    },

    nowServingLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        marginBottom: 4,
    },

    nowServingNumber: {
        fontSize: 48,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -1,
        lineHeight: 54,
    },

    /* kept for backward compat */
    nowServingHeader: {
        alignItems: 'center',
        marginBottom: 14,
    },

    heroDivider: {
        height: 2,
        backgroundColor: '#f5c518',
        borderRadius: 2,
        width: 40,
        alignSelf: 'center',
        marginBottom: 14,
    },

    heroStatusRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        zIndex: 1,
    },

    heroStatusPill: {
        backgroundColor: 'rgba(245,197,24,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(245,197,24,0.25)',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 5,
    },

    heroStatusServing: {
        backgroundColor: 'rgba(22,163,74,0.15)',
        borderColor: 'rgba(22,163,74,0.3)',
    },

    heroStatusDone: {
        backgroundColor: 'rgba(148,163,184,0.15)',
        borderColor: 'rgba(148,163,184,0.25)',
    },

    heroStatusCancelled: {
        backgroundColor: 'rgba(220,38,38,0.15)',
        borderColor: 'rgba(220,38,38,0.3)',
    },

    heroStatusText: {
        color: '#f5c518',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    heroStatusTextServing:  { color: '#4ade80' },
    heroStatusTextDone:     { color: '#94a3b8' },
    heroStatusTextCancelled:{ color: '#fca5a5' },

    priorityPill: {
        backgroundColor: 'rgba(217,119,6,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(217,119,6,0.3)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },

    priorityPillText: {
        color: '#fcd34d',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.4,
    },

    /* ── View Toggle ── */
    toggleWrap: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        margin: 20,
        marginBottom: 0,
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#1a3a6b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },

    /* kept for backward compat */
    toggleContainer: {
        flexDirection: 'row',
        margin: 20,
        marginBottom: 0,
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#ffffff',
    },

    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 9,
        alignItems: 'center',
    },

    toggleActive: {
        backgroundColor: '#1a3a6b',
        shadowColor: '#1a3a6b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },

    toggleText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94a3b8',
    },

    toggleTextActive: {
        fontSize: 13,
        fontWeight: '700',
        color: '#ffffff',
    },

    /* ── Ticket View ── */
    ticketView: {
        padding: 20,
        paddingTop: 16,
    },

    ticketCard: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#1a3a6b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 12,
    },

    ticketCardAccent: {
        height: 4,
        backgroundColor: '#1a3a6b',
    },

    ticketAccentServing:   { backgroundColor: '#16a34a' },
    ticketAccentDone:      { backgroundColor: '#94a3b8' },
    ticketAccentCancelled: { backgroundColor: '#dc2626' },

    ticketCardBody: {
        padding: 24,
        alignItems: 'center',
    },

    ticketLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.2,
        color: '#94a3b8',
        textTransform: 'uppercase',
        marginBottom: 8,
    },

    ticketNumber: {
        fontSize: 64,
        fontWeight: '900',
        color: '#1a3a6b',
        letterSpacing: -2,
        lineHeight: 70,
        marginBottom: 16,
    },

    ticketNumberServing: { color: '#16a34a' },

    /* ── Serving hero ── */
    servingHero: {
        alignItems: 'center',
        backgroundColor: 'rgba(22,163,74,0.07)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(22,163,74,0.2)',
        padding: 18,
        width: '100%',
    },

    servingEmoji:    { fontSize: 36, marginBottom: 6 },
    servingHeadline: { fontSize: 18, fontWeight: '800', color: '#16a34a', marginBottom: 4 },
    servingSubtext:  { fontSize: 13, color: '#475569', fontWeight: '500' },

    /* kept for backward compat */
    servingBox:  { alignItems: 'center', padding: 10 },
    servingText: { fontSize: 18, fontWeight: '800', color: '#16a34a' },
    subText:     { fontSize: 13, color: '#475569' },

    /* ── Completed hero ── */
    completedHero: {
        alignItems: 'center',
        backgroundColor: 'rgba(148,163,184,0.07)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(148,163,184,0.2)',
        padding: 18,
        width: '100%',
    },

    completedEmoji:    { fontSize: 36, marginBottom: 6 },
    completedHeadline: { fontSize: 18, fontWeight: '800', color: '#475569', marginBottom: 4 },
    completedSubtext:  { fontSize: 13, color: '#94a3b8', fontWeight: '500' },

    /* ── No-Show hero ── */
    noShowHero: {
        alignItems: 'center',
        backgroundColor: 'rgba(245,158,11,0.07)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.2)',
        padding: 18,
        width: '100%',
    },

    noShowEmoji:    { fontSize: 36, marginBottom: 6 },
    noShowHeadline: { fontSize: 18, fontWeight: '800', color: '#d97706', marginBottom: 4 },
    noShowSubtext:  { fontSize: 13, color: '#975a16', fontWeight: '500' },  



    /* ── Cancelled hero ── */
    cancelledHero: {
        alignItems: 'center',
        backgroundColor: 'rgba(220,38,38,0.06)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(220,38,38,0.18)',
        padding: 18,
        width: '100%',
    },

    cancelledEmoji:    { fontSize: 36, marginBottom: 6 },
    cancelledHeadline: { fontSize: 18, fontWeight: '800', color: '#dc2626', marginBottom: 4 },
    cancelledSubtext:  { fontSize: 13, color: '#94a3b8', fontWeight: '500' },

    /* ── Wait card ── */
    waitCard: {
        backgroundColor: 'rgba(26,58,107,0.04)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 18,
        width: '100%',
        alignItems: 'center',
    },

    /* kept for backward compat */
    waitingBox: { width: '100%' },
    timeCard:   { backgroundColor: 'rgba(26,58,107,0.04)', borderRadius: 14, padding: 18, width: '100%', alignItems: 'center' },

    waitCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },

    waitCardIcon: { fontSize: 18 },

    waitCardLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
        color: '#94a3b8',
        textTransform: 'uppercase',
    },

    /* kept for backward compat */
    timeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    clockIcon:  { fontSize: 18 },
    timeLabel:  { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: '#94a3b8', textTransform: 'uppercase' },

    waitTime: {
        fontSize: 52,
        fontWeight: '900',
        color: '#1a3a6b',
        letterSpacing: -1,
        lineHeight: 58,
        marginBottom: 14,
    },

    waitTimeSuffix: {
        fontSize: 18,
        fontWeight: '600',
        color: '#94a3b8',
    },

    /* kept for backward compat */
    timeValue: { fontSize: 52, fontWeight: '900', color: '#1a3a6b', letterSpacing: -1, lineHeight: 58 },
    minsLabel: { fontSize: 18, fontWeight: '600', color: '#94a3b8' },

    waitProgressBg: {
        width: '100%',
        height: 8,
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 10,
    },

    waitProgressFill: {
        height: '100%',
        backgroundColor: '#1a3a6b',
        borderRadius: 4,
    },

    waitProgressFillHot: {
        backgroundColor: '#d97706',
    },

    waitProgressLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
        textAlign: 'center',
    },

    /* kept for backward compat */
    progressContainer: {
        width: '100%', height: 8,
        backgroundColor: '#e2e8f0',
        borderRadius: 4, overflow: 'hidden', marginBottom: 10,
    },
    progressBar:  { height: '100%', borderRadius: 4 },
    progressText: { fontSize: 12, fontWeight: '600', color: '#475569', textAlign: 'center' },

    /* ── Ticket stats footer ── */
    ticketDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginHorizontal: 0,
    },

    /* kept for backward compat */
    divider:      { height: 1, backgroundColor: '#f1f5f9', marginVertical: 16, width: '100%' },
    dividerSmall: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10, width: '100%' },

    ticketStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        paddingHorizontal: 12,
    },

    ticketStat: {
        alignItems: 'center',
        gap: 4,
    },

    ticketStatValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1a3a6b',
    },

    ticketStatLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    ticketStatSep: {
        width: 1,
        height: 32,
        backgroundColor: '#e2e8f0',
    },

    /* kept for backward compat */
    positionNumber:{ fontSize: 36, fontWeight: '900', color: '#1a3a6b', textAlign: 'center' },
    waitingText:   { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 8 },
    statusBadge:   { alignSelf: 'center', fontSize: 11, fontWeight: '700', color: '#475569' },

    /* ── Priority notice ── */
    priorityNotice: {
        backgroundColor: 'rgba(217,119,6,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(217,119,6,0.2)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },

    priorityNoticeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#d97706',
        lineHeight: 18,
    },

    /* ── Cancel button ── */
    cancelBtn: {
        backgroundColor: 'rgba(220,38,38,0.07)',
        borderWidth: 1.5,
        borderColor: 'rgba(220,38,38,0.25)',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
    },

    cancelBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#dc2626',
    },

    /* kept for backward compat */
    cancelButton: {
        backgroundColor: 'rgba(220,38,38,0.07)',
        borderWidth: 1.5,
        borderColor: 'rgba(220,38,38,0.25)',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 10,
    },

    cancelText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#dc2626',
    },

    /* ── Live Feed ── */
    feedView: {
        padding: 20,
        paddingTop: 16,
    },

    feedHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },

    feedTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f1f3d',
    },

    feedLiveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(22,163,74,0.09)',
        borderWidth: 1,
        borderColor: 'rgba(22,163,74,0.2)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },

    feedLiveDot: {
        width: 6, height: 6,
        borderRadius: 3,
        backgroundColor: '#16a34a',
    },

    feedLiveText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#16a34a',
        letterSpacing: 0.5,
    },

    /* kept for backward compat */
    feedContainer: { paddingHorizontal: 20, paddingTop: 16 },

    feedEmpty: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 8,
    },

    feedEmptyIcon: { fontSize: 28, opacity: 0.4 },
    feedEmptyText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },

    feedItem: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        gap: 12,
        paddingRight: 14,
        paddingVertical: 12,
    },

    feedItemMe: {
        borderColor: '#f5c518',
        backgroundColor: '#fffbeb',
        shadowColor: '#f5c518',
        shadowOpacity: 0.12,
        elevation: 3,
    },

    feedItemServing: {
        borderColor: '#16a34a',
        backgroundColor: '#f0fdf4',
        shadowColor: '#16a34a',
        shadowOpacity: 0.12,
        elevation: 3,
    },

    feedItemAccent: {
        width: 4,
        alignSelf: 'stretch',
        backgroundColor: '#e2e8f0',
    },

    feedItemAccentMe:      { backgroundColor: '#f5c518' },
    feedItemAccentServing: { backgroundColor: '#16a34a' },

    feedAvatar: {
        width: 36, height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(26,58,107,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },

    feedAvatarMe:      { backgroundColor: 'rgba(245,197,24,0.2)' },
    feedAvatarServing: { backgroundColor: 'rgba(22,163,74,0.15)' },

    feedAvatarText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1a3a6b',
    },

    feedNum: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1a3a6b',
        marginBottom: 1,
    },

    feedName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0f1f3d',
        marginBottom: 2,
    },

    feedPurpose: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '500',
    },

    feedStatusPill: {
        backgroundColor: 'rgba(245,197,24,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(212,168,14,0.2)',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },

    feedStatusServing: {
        backgroundColor: 'rgba(22,163,74,0.1)',
        borderColor: 'rgba(22,163,74,0.2)',
    },

    feedStatusDone: {
        backgroundColor: 'rgba(148,163,184,0.1)',
        borderColor: 'rgba(148,163,184,0.2)',
    },

    feedStatus: {
        fontSize: 9,
        fontWeight: '700',
        color: '#d4a80e',
        letterSpacing: 0.4,
    },

    feedStatusText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#d4a80e',
        letterSpacing: 0.4,
    },

    meBadge: {
        backgroundColor: '#1a3a6b',
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },

    meText: {
        color: '#f5c518',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
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
  backgroundColor: "#FFFFFF",
  paddingVertical: 28,
  paddingHorizontal: 34,
  borderRadius: 18,
  alignItems: "center",

  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },

  elevation: 10, // Android shadow
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
cancelBtnDisabled: {
  opacity: 0.6,
},

    container: { flex: 1, backgroundColor: '#f8f9fc' },
    label:     { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 },
});