
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Or your navigation of choice
import { useAuth } from '../context/AuthContext'; // Example of where your user data comes from
import axiosClient from '../api/axios';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth(); 
    const [stats, setStats] = useState({ total_queues: 0, hours_saved: 0, account_status: '...' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await axiosClient.get('/user/stats');
            setStats(data);
        } catch (err) {
            console.error("Failed to fetch profile stats", err);
        } finally {
            setLoading(false);
        }
    };
    
 

// ─────────────────────────────────────────────────────────────────────────────
// REPLACE ONLY YOUR return() BLOCK AND styles = StyleSheet.create({}) WITH THIS.
// All imports, hooks, fetchStats, logout — COMPLETELY UNCHANGED.
// ─────────────────────────────────────────────────────────────────────────────

    return (
        <SafeAreaView style={styles.root} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >

                {/* ═══════════════════════════════════════════
                    HERO BANNER (Facebook cover-style)
                ═══════════════════════════════════════════ */}
                <View style={styles.heroBanner}>
                    {/* Decorative circles */}
                    <View style={styles.heroCircle1} />
                    <View style={styles.heroCircle2} />
                    <View style={styles.heroCircle3} />

                    {/* Top row: school label + QR icon */}
                    <View style={styles.heroTopRow}>
                        <View style={styles.schoolBadge}>
                            <Text style={styles.schoolBadgeText}>🏫 Trinidad Municipal College</Text>
                        </View>
                        <TouchableOpacity style={styles.qrIconBtn} activeOpacity={0.8}>
                            <Ionicons name="qr-code-outline" size={20} color="rgba(255,255,255,0.75)" />
                        </TouchableOpacity>
                    </View>

                    {/* Gold accent line */}
                    <View style={styles.heroGoldLine} />
                </View>

                {/* ═══════════════════════════════════════════
                    ID CARD — floats over hero
                ═══════════════════════════════════════════ */}
                <View style={styles.idCardWrap}>
                    <View style={styles.idCard}>
                        {/* Navy top accent */}
                        <View style={styles.idCardAccent} />

                        <View style={styles.idCardBody}>
                            {/* Avatar */}
                            <View style={styles.avatarWrap}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                                    </Text>
                                </View>
                                <View style={styles.avatarOnline} />
                            </View>

                            {/* User info */}
                            <View style={styles.idCardInfo}>
                                <Text style={styles.idCardName}>{user?.name ?? 'Guest'}</Text>
                                <Text style={styles.idCardStudentId}>{user?.student_id ?? 'N/A'}</Text>
                                <View style={styles.idCardBadgeRow}>
                                    <View style={styles.verifiedBadge}>
                                        <Ionicons name="checkmark-circle" size={10} color="#ffffff" />
                                        <Text style={styles.verifiedText}>VERIFIED STUDENT</Text>
                                    </View>
                                    <View style={styles.yearBadge}>
                                        <Text style={styles.yearBadgeText}>3rd Year</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Dept badge */}
                            <View style={styles.deptBadge}>
                                <Text style={styles.deptBadgeText} numberOfLines={2}>
                                    {user?.department ?? 'Unknown Department'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ═══════════════════════════════════════════
                    STATS STRIP
                ═══════════════════════════════════════════ */}
                <View style={styles.statsStrip}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{loading ? '—' : stats.total_queues}</Text>
                        <Text style={styles.statLabel}>Queues Joined</Text>
                    </View>
                    <View style={styles.statSep} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: '#16a34a' }]}>
                            {loading ? '—' : `${stats.hours_saved}h`}
                        </Text>
                        <Text style={styles.statLabel}>Time Saved</Text>
                    </View>
                    <View style={styles.statSep} />
                    <View style={styles.statItem}>
                        <Text style={[
                            styles.statValue,
                            { color: stats.account_status === 'In Queue' ? '#2563b0' : '#16a34a', fontSize: 13 }
                        ]}>
                            {loading ? '—' : stats.account_status}
                        </Text>
                        <Text style={styles.statLabel}>Status</Text>
                    </View>
                </View>

                {/* ═══════════════════════════════════════════
                    QUICK ACTION PILLS (static feature)
                ═══════════════════════════════════════════ */}
                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.quickBtn} activeOpacity={0.8}>
                        <Text style={styles.quickBtnIcon}>📋</Text>
                        <Text style={styles.quickBtnText}>History</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickBtn} activeOpacity={0.8}>
                        <Text style={styles.quickBtnIcon}>🔔</Text>
                        <Text style={styles.quickBtnText}>Alerts</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickBtn} activeOpacity={0.8}>
                        <Text style={styles.quickBtnIcon}>🎫</Text>
                        <Text style={styles.quickBtnText}>My Tickets</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickBtn} activeOpacity={0.8}>
                        <Text style={styles.quickBtnIcon}>⭐</Text>
                        <Text style={styles.quickBtnText}>Priority</Text>
                    </TouchableOpacity>
                </View>

                {/* ═══════════════════════════════════════════
                    MENU SECTIONS
                ═══════════════════════════════════════════ */}

                {/* Account */}
                <View style={styles.menuSection}>
                    <Text style={styles.menuSectionLabel}>Account Settings</Text>

                    <View style={styles.menuCard}>
                        <TouchableOpacity style={styles.menuItem} activeOpacity={0.75}>
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(26,58,107,0.08)' }]}>
                                    <Ionicons name="person-outline" size={18} color="#1a3a6b" />
                                </View>
                                <View>
                                    <Text style={styles.menuItemLabel}>Edit Profile</Text>
                                    <Text style={styles.menuItemSub}>Name, photo, contact</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                        </TouchableOpacity>

                        <View style={styles.menuDivider} />

                        <TouchableOpacity style={styles.menuItem} activeOpacity={0.75}>
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(220,38,38,0.07)' }]}>
                                    <Ionicons name="shield-checkmark-outline" size={18} color="#dc2626" />
                                </View>
                                <View>
                                    <Text style={styles.menuItemLabel}>Priority Verification</Text>
                                    <Text style={styles.menuItemSub}>PWD, Pregnant, Elderly</Text>
                                </View>
                            </View>
                            <View style={styles.actionRequiredBadge}>
                                <Text style={styles.actionRequiredText}>Action Required</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.menuDivider} />

                        <TouchableOpacity style={styles.menuItem} activeOpacity={0.75}>
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(22,163,74,0.08)' }]}>
                                    <Ionicons name="id-card-outline" size={18} color="#16a34a" />
                                </View>
                                <View>
                                    <Text style={styles.menuItemLabel}>Student ID</Text>
                                    <Text style={styles.menuItemSub}>{user?.student_id ?? 'Not set'}</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Preferences */}
                <View style={styles.menuSection}>
                    <Text style={styles.menuSectionLabel}>App Preferences</Text>

                    <View style={styles.menuCard}>
                        <TouchableOpacity style={styles.menuItem} activeOpacity={0.75}>
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(245,197,24,0.12)' }]}>
                                    <Ionicons name="notifications-outline" size={18} color="#d4a80e" />
                                </View>
                                <View>
                                    <Text style={styles.menuItemLabel}>Notifications</Text>
                                    <Text style={styles.menuItemSub}>Queue alerts, reminders</Text>
                                </View>
                            </View>
                            <View style={styles.toggleOn}>
                                <Text style={styles.toggleOnText}>ON</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.menuDivider} />

                        <TouchableOpacity style={styles.menuItem} activeOpacity={0.75}>
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(26,58,107,0.08)' }]}>
                                    <Ionicons name="language-outline" size={18} color="#1a3a6b" />
                                </View>
                                <View>
                                    <Text style={styles.menuItemLabel}>Language</Text>
                                    <Text style={styles.menuItemSub}>English (Default)</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Support */}
                <View style={styles.menuSection}>
                    <Text style={styles.menuSectionLabel}>Help &amp; Support</Text>

                    <View style={styles.menuCard}>
                        <TouchableOpacity style={styles.menuItem} activeOpacity={0.75}>
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(26,58,107,0.08)' }]}>
                                    <Ionicons name="help-circle-outline" size={18} color="#1a3a6b" />
                                </View>
                                <View>
                                    <Text style={styles.menuItemLabel}>FAQ</Text>
                                    <Text style={styles.menuItemSub}>Common questions</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                        </TouchableOpacity>

                        <View style={styles.menuDivider} />

                        <TouchableOpacity style={styles.menuItem} activeOpacity={0.75}>
                            <View style={styles.menuItemLeft}>
                                <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(26,58,107,0.08)' }]}>
                                    <Ionicons name="mail-outline" size={18} color="#1a3a6b" />
                                </View>
                                <View>
                                    <Text style={styles.menuItemLabel}>Contact Support</Text>
                                    <Text style={styles.menuItemSub}>registrar@tmc.edu.ph</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── SIGN OUT ── */}
                <TouchableOpacity style={styles.signOutBtn} onPress={logout} activeOpacity={0.85}>
                    <View style={styles.signOutIcon}>
                        <Ionicons name="log-out-outline" size={18} color="#dc2626" />
                    </View>
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>

                {/* Version */}
                <Text style={styles.versionText}>TMC SmartQueue · v1.0.4 Build 22</Text>

                <View style={{ height: 32 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES ← paste as your StyleSheet.create({...})
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

    /* ── Root ── */
    root: {
        flex: 1,
        backgroundColor: '#072682',
    },

    /* kept for backward compat */
    container: {
        flex: 1,
        backgroundColor: '#f8f9fc',
    },

    scrollContent: {
        flexGrow: 1,
    },

    /* ── Hero Banner ── */
    heroBanner: {
        backgroundColor: '#1a3a6b',
        height: 160,
        overflow: 'hidden',
        position: 'relative',
    },

    heroCircle1: {
        position: 'absolute',
        width: 260, height: 260,
        borderRadius: 130,
        backgroundColor: 'rgba(245,197,24,0.07)',
        top: -80, right: -60,
    },

    heroCircle2: {
        position: 'absolute',
        width: 160, height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(255,255,255,0.04)',
        top: 20, left: -40,
    },

    heroCircle3: {
        position: 'absolute',
        width: 80, height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(245,197,24,0.05)',
        bottom: -10, left: '45%',
    },

    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        zIndex: 1,
    },

    schoolBadge: {
        backgroundColor: 'rgba(245,197,24,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(245,197,24,0.25)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },

    schoolBadgeText: {
        color: '#f5c518',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    qrIconBtn: {
        width: 36, height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },

    heroGoldLine: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 3,
        backgroundColor: '#f5c518',
    },

    /* ── ID Card ── */
    idCardWrap: {
        paddingHorizontal: 16,
        marginTop: -24,
        marginBottom: 0,
        zIndex: 10,
    },

    idCard: {
        backgroundColor: '#ffffff',
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#1a3a6b',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },

    idCardAccent: {
        height: 4,
        backgroundColor: '#1a3a6b',
        borderBottomWidth: 1,
        borderBottomColor: '#f5c518',
    },

    idCardBody: {
        padding: 18,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
    },

    /* ── Avatar ── */
    avatarWrap: {
        position: 'relative',
        flexShrink: 0,
    },

    avatar: {
        width: 64, height: 64,
        borderRadius: 16,
        backgroundColor: '#1a3a6b',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#f5c518',
    },

    avatarText: {
        fontSize: 26,
        fontWeight: '900',
        color: '#f5c518',
        letterSpacing: -0.5,
    },

    avatarOnline: {
        position: 'absolute',
        bottom: -2, right: -2,
        width: 14, height: 14,
        borderRadius: 7,
        backgroundColor: '#16a34a',
        borderWidth: 2,
        borderColor: '#ffffff',
    },

    /* kept for backward compat */
    avatarPlaceholder: {
        width: 60, height: 60,
        borderRadius: 14,
        backgroundColor: '#1a3a6b',
        alignItems: 'center',
        justifyContent: 'center',
    },

    /* ── ID Info ── */
    idCardInfo: {
        flex: 1,
        gap: 3,
    },

    idCardName: {
        fontSize: 17,
        fontWeight: '900',
        color: '#0f1f3d',
        letterSpacing: -0.3,
    },

    /* kept for backward compat */
    userName: {
        fontSize: 17,
        fontWeight: '900',
        color: '#0f1f3d',
    },

    idCardStudentId: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '600',
        marginBottom: 4,
    },

    /* kept for backward compat */
    userStudentId: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '600',
    },

    idCardBadgeRow: {
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'wrap',
    },

    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#16a34a',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },

    verifiedText: {
        fontSize: 8,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: 0.4,
    },

    /* kept for backward compat */
    verifyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#16a34a',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    verifyText: { fontSize: 8, fontWeight: '800', color: '#ffffff', letterSpacing: 0.4 },

    yearBadge: {
        backgroundColor: 'rgba(26,58,107,0.08)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(26,58,107,0.14)',
        paddingHorizontal: 8,
        paddingVertical: 3,
    },

    yearBadgeText: {
        fontSize: 8,
        fontWeight: '700',
        color: '#1a3a6b',
    },

    /* kept for backward compat */
    yearText: { fontSize: 8, fontWeight: '700', color: '#1a3a6b' },

    deptBadge: {
        backgroundColor: 'rgba(26,58,107,0.05)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(26,58,107,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        alignSelf: 'flex-start',
        maxWidth: 100,
    },

    deptBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#1a3a6b',
        textAlign: 'center',
        lineHeight: 13,
    },

    /* kept for backward compat */
    deptText: { fontSize: 10, fontWeight: '700', color: '#1a3a6b' },

    /* kept for backward compat */
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    universityName: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 1 },
    userInfoRow:    { flexDirection: 'row', gap: 14, marginBottom: 12 },
    userBasicInfo:  { flex: 1, gap: 3 },
    cardFooter:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    /* ── Stats Strip ── */
    statsStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#1a3a6b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },

    /* kept for backward compat */
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },

    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 3,
    },

    /* kept for backward compat */
    statBox: { flex: 1, alignItems: 'center', gap: 3 },
    statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#e2e8f0' },

    statValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1a3a6b',
        letterSpacing: -0.5,
    },

    /* kept for backward compat */
    statNumber: { fontSize: 20, fontWeight: '900', color: '#1a3a6b', letterSpacing: -0.5 },

    statLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    statSep: {
        width: 1,
        height: 32,
        backgroundColor: '#e2e8f0',
    },

    /* ── Quick Action Pills ── */
    quickActions: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: 14,
        gap: 8,
    },

    quickBtn: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        gap: 5,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#1a3a6b',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },

    quickBtnIcon: {
        fontSize: 18,
    },

    quickBtnText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },

    /* ── Menu Sections ── */
    menuSection: {
        marginTop: 20,
        paddingHorizontal: 16,
    },

    menuSectionLabel: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.9,
        color: '#94a3b8',
        marginBottom: 8,
        marginLeft: 4,
    },

    /* kept for backward compat */
    menuHeader: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.9,
        color: '#94a3b8',
        marginBottom: 8,
    },

    menuCard: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
        shadowColor: '#1a3a6b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },

    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },

    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },

    menuIconWrap: {
        width: 36, height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },

    /* kept for backward compat */
    iconCircle: {
        width: 36, height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(26,58,107,0.07)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    menuItemLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0f1f3d',
        marginBottom: 1,
    },

    menuItemSub: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '500',
    },

    menuDivider: {
        height: 1,
        backgroundColor: '#f8f9fc',
        marginLeft: 64,
    },

    actionRequiredBadge: {
        backgroundColor: 'rgba(220,38,38,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(220,38,38,0.18)',
        borderRadius: 20,
        paddingHorizontal: 9,
        paddingVertical: 4,
    },

    actionRequiredText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#dc2626',
        letterSpacing: 0.3,
    },

    /* kept for backward compat */
    badgeDanger: {
        backgroundColor: 'rgba(220,38,38,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(220,38,38,0.18)',
        borderRadius: 20,
        paddingHorizontal: 9,
        paddingVertical: 4,
    },
    badgeText: { fontSize: 9, fontWeight: '800', color: '#dc2626' },

    toggleOn: {
        backgroundColor: 'rgba(22,163,74,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(22,163,74,0.2)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },

    toggleOnText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#16a34a',
        letterSpacing: 0.5,
    },

    /* ── Sign Out ── */
    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginHorizontal: 16,
        marginTop: 24,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(220,38,38,0.2)',
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 2,
    },

    signOutIcon: {
        width: 36, height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(220,38,38,0.07)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    signOutText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#dc2626',
    },

    /* kept for backward compat */
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginHorizontal: 16,
        marginTop: 24,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(220,38,38,0.2)',
    },
    logoutText: { fontSize: 14, fontWeight: '700', color: '#dc2626' },

    /* ── Version ── */
    versionText: {
        textAlign: 'center',
        color: '#cbd5e1',
        fontSize: 11,
        fontWeight: '500',
        marginTop: 20,
    },
});