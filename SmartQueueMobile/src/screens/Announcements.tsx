import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ListRenderItemInfo } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axiosClient from '../api/axios';

interface Announcement {
    id: number;
    title: string;
    message: string;
    type?: 'warning' | 'emergency' | 'normal';
    department?: string;
}

export default function AnnouncementScreen() {
    const [news, setNews] = useState<Announcement[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAnnouncements = async () => {
        try {
            const { data } = await axiosClient.get('/broadcasts/active');
            setNews(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => { fetchAnnouncements(); }, []);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchAnnouncements();
        setRefreshing(false);
    }, []);

    const [activeFilter, setActiveFilter] = useState<'all' | 'warning' | 'emergency' | 'normal'>('all');

    const filtered = activeFilter === 'all'
        ? news
        : news.filter(n => (n.type ?? 'normal') === activeFilter);

    const emergencyCount = news.filter(n => n.type === 'emergency').length;
    const warningCount   = news.filter(n => n.type === 'warning').length;

    // ── Render each card ──
    const renderItem = ({ item, index }: ListRenderItemInfo<Announcement> & { index: number }) => {
        const isWarning   = item.type === 'warning';
        const isEmergency = item.type === 'emergency';
        const isNormal    = !isWarning && !isEmergency;

        const accentColor = isEmergency ? '#dc2626' : isWarning ? '#d97706' : '#1a3a6b';
        const iconName    = isEmergency ? 'alert-circle'   : isWarning ? 'warning' : 'information-circle';
        const typLabel    = isEmergency ? 'EMERGENCY'      : isWarning ? 'WARNING' : 'INFO';

        return (
            <View style={[
                styles.card,
                isEmergency && styles.cardEmergency,
                isWarning   && styles.cardWarning,
            ]}>
                {/* Left accent bar */}
                <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />

                <View style={styles.cardInner}>
                    {/* Header row */}
                    <View style={styles.cardHeaderRow}>
                        {/* Icon wrap */}
                        <View style={[
                            styles.cardIconWrap,
                            isEmergency && styles.cardIconWrapEmergency,
                            isWarning   && styles.cardIconWrapWarning,
                        ]}>
                            <Ionicons name={iconName as any} size={20} color={accentColor} />
                        </View>

                        {/* Title + meta */}
                        <View style={{ flex: 1 }}>
                            <View style={styles.cardMeta}>
                                <View style={[
                                    styles.typeTag,
                                    isEmergency && styles.typeTagEmergency,
                                    isWarning   && styles.typeTagWarning,
                                ]}>
                                    <Text style={[
                                        styles.typeTagText,
                                        isEmergency && { color: '#dc2626' },
                                        isWarning   && { color: '#d97706' },
                                    ]}>
                                        {typLabel}
                                    </Text>
                                </View>
                                <View style={styles.deptChip}>
                                    <Text style={styles.deptChipText}>
                                        {item.department || 'General'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Time */}
                        <Text style={styles.cardTime}>2h ago</Text>
                    </View>

                    {/* Message */}
                    <Text style={styles.cardMessage} numberOfLines={3}>
                        {item.message}
                    </Text>

                    {/* Footer */}
                    <TouchableOpacity style={styles.cardFooter} activeOpacity={0.7}>
                        <Text style={[styles.readMoreText, { color: accentColor }]}>Read full message</Text>
                        <Ionicons name="arrow-forward" size={13} color={accentColor} />
                    </TouchableOpacity>
                </View>

                {/* Emergency pulsing dot */}
                {isEmergency && (
                    <View style={styles.emergencyDot} />
                )}
            </View>
        );
    };

    // ── Main return ──
    return (
        <View style={styles.root}>

            {/* ── HERO HEADER (edge-to-edge, no safe area gap) ── */}
            <View style={styles.hero}>
                <View style={styles.heroCircle1} />
                <View style={styles.heroCircle2} />

                {/* Status bar spacer */}
                <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
                    <View style={styles.heroInner}>
                        {/* Top row */}
                        <View style={styles.heroTopRow}>
                            <View>
                                <View style={styles.heroBadge}>
                                    <Text style={styles.heroBadgeText}>🏫 Trinidad Municipal College</Text>
                                </View>
                                <Text style={styles.heroTitle}>Campus Feed</Text>
                                <Text style={styles.heroSub}>Real-time announcements &amp; alerts</Text>
                            </View>

                            <TouchableOpacity style={styles.heroBellBtn} activeOpacity={0.8}>
                                <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.8)" />
                                {emergencyCount > 0 && (
                                    <View style={styles.bellDot}>
                                        <Text style={styles.bellDotText}>{emergencyCount}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Gold line */}
                        <View style={styles.heroDivider} />

                        {/* Live stats row */}
                        <View style={styles.heroStats}>
                            <View style={styles.heroStat}>
                                <Text style={styles.heroStatValue}>{news.length}</Text>
                                <Text style={styles.heroStatLabel}>Total</Text>
                            </View>
                            <View style={styles.heroStatSep} />
                            <View style={styles.heroStat}>
                                <Text style={[styles.heroStatValue, { color: '#fca5a5' }]}>{emergencyCount}</Text>
                                <Text style={styles.heroStatLabel}>Emergency</Text>
                            </View>
                            <View style={styles.heroStatSep} />
                            <View style={styles.heroStat}>
                                <Text style={[styles.heroStatValue, { color: '#fcd34d' }]}>{warningCount}</Text>
                                <Text style={styles.heroStatLabel}>Warnings</Text>
                            </View>
                            <View style={styles.heroStatSep} />
                            <View style={styles.heroStat}>
                                {/* Static live dot */}
                                <View style={styles.liveDotWrap}>
                                    <View style={styles.liveDot} />
                                    <Text style={[styles.heroStatValue, { color: '#4ade80', fontSize: 12 }]}>LIVE</Text>
                                </View>
                                <Text style={styles.heroStatLabel}>Status</Text>
                            </View>
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            {/* ── FILTER TABS ── */}
            <View style={styles.filterBar}>
                {(['all', 'normal', 'warning', 'emergency'] as const).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
                        onPress={() => setActiveFilter(tab)}
                        activeOpacity={0.8}
                    >
                        <Text style={[
                            styles.filterTabText,
                            activeFilter === tab && styles.filterTabTextActive,
                            tab === 'emergency' && activeFilter === tab && { color: '#dc2626' },
                            tab === 'warning'   && activeFilter === tab && { color: '#d97706' },
                        ]}>
                            {tab === 'all'       ? `All · ${news.length}`
                            : tab === 'normal'    ? `Info · ${news.filter(n => !n.type || n.type === 'normal').length}`
                            : tab === 'warning'  ? `⚠ Warning · ${warningCount}`
                            :                      `🚨 Emergency · ${emergencyCount}`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ── EMERGENCY BANNER (shown only when there's an emergency) ── */}
            {emergencyCount > 0 && (
                <View style={styles.emergencyBanner}>
                    <Ionicons name="alert-circle" size={16} color="#dc2626" />
                    <Text style={styles.emergencyBannerText}>
                        {emergencyCount} active emergency alert{emergencyCount > 1 ? 's' : ''}. Scroll to view.
                    </Text>
                </View>
            )}

            {/* ── FEED LIST ── */}
            <FlatList
                data={filtered}
                renderItem={({ item, index }) => renderItem({ item, index } as any)}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#f5c518"
                        colors={['#1a3a6b']}
                    />
                }
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                ListHeaderComponent={
                    filtered.length > 0 ? (
                        <Text style={styles.listHeader}>
                            {filtered.length} announcement{filtered.length !== 1 ? 's' : ''}
                            {activeFilter !== 'all' ? ` · ${activeFilter}` : ''}
                        </Text>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={styles.emptyWrap}>
                        <Ionicons name="notifications-off-outline" size={52} color="#e2e8f0" />
                        <Text style={styles.emptyTitle}>No announcements</Text>
                        <Text style={styles.emptySubtitle}>
                            {activeFilter === 'all'
                                ? 'Pull down to check for updates.'
                                : `No ${activeFilter} alerts at this time.`}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}


const styles = StyleSheet.create({

 
    root: {
        flex: 1,
        backgroundColor: '#f8f9fc',
    },

    container: {
        flex: 1,
        backgroundColor: '#f8f9fc',
    },

   
    hero: {
        backgroundColor: '#1a3a6b',
        overflow: 'hidden',
        position: 'relative',
    },

    heroCircle1: {
        position: 'absolute',
        width: 240, height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(245,197,24,0.06)',
        top: -70, right: -50,
    },

    heroCircle2: {
        position: 'absolute',
        width: 150, height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.03)',
        bottom: -30, left: -20,
    },

    heroInner: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 0,
        zIndex: 1,
    },

    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },

    heroBadge: {
        backgroundColor: 'rgba(245,197,24,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(245,197,24,0.25)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },

    heroBadgeText: {
        color: '#f5c518',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    heroTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -0.5,
        marginBottom: 3,
    },

    /* kept for backward compat */
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#ffffff',
    },

    heroSub: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '500',
    },

    heroBellBtn: {
        width: 40, height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },

    /* kept for backward compat */
    filterBtn: {
        width: 38, height: 38,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    /* kept for backward compat */
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },

    bellDot: {
        position: 'absolute',
        top: 6, right: 6,
        width: 16, height: 16,
        borderRadius: 8,
        backgroundColor: '#dc2626',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#1a3a6b',
    },

    bellDotText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#ffffff',
    },

    heroDivider: {
        height: 2,
        backgroundColor: '#f5c518',
        width: 36,
        borderRadius: 2,
        marginBottom: 14,
    },

    heroStats: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        marginHorizontal: -20,
        paddingVertical: 12,
        paddingHorizontal: 20,
    },

    heroStat: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },

    heroStatValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -0.3,
    },

    heroStatLabel: {
        fontSize: 8,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    heroStatSep: {
        width: 1,
        height: 26,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },

    liveDotWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },

    liveDot: {
        width: 6, height: 6,
        borderRadius: 3,
        backgroundColor: '#4ade80',
    },

    /* ── Filter tabs ── */
    filterBar: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingHorizontal: 8,
    },

    filterTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },

    filterTabActive: {
        borderBottomColor: '#1a3a6b',
    },

    filterTabText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },

    filterTabTextActive: {
        color: '#1a3a6b',
    },

    /* ── Emergency banner ── */
    emergencyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(220,38,38,0.07)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(220,38,38,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 9,
    },

    emergencyBannerText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#dc2626',
    },

    /* ── List ── */
    listContent: {
        padding: 16,
        paddingTop: 12,
        paddingBottom: 40,
        flexGrow: 1,
    },

    listHeader: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
        color: '#94a3b8',
        marginBottom: 10,
    },

    /* ── Card ── */
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        flexDirection: 'row',
        shadowColor: '#1a3a6b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        position: 'relative',
    },

    /* kept for backward compat */
    newsCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        flexDirection: 'row',
        shadowColor: '#1a3a6b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },

    cardEmergency: {
        borderColor: 'rgba(220,38,38,0.25)',
        backgroundColor: '#fffafa',
        shadowColor: '#dc2626',
        shadowOpacity: 0.1,
        elevation: 4,
    },

    /* kept for backward compat */
    emergencyCard: {
        borderColor: 'rgba(220,38,38,0.25)',
        backgroundColor: '#fffafa',
    },

    cardWarning: {
        borderColor: 'rgba(217,119,6,0.25)',
        backgroundColor: '#fffdf0',
        shadowColor: '#d97706',
        shadowOpacity: 0.08,
    },

    /* kept for backward compat */
    warningCard: {
        borderColor: 'rgba(217,119,6,0.25)',
        backgroundColor: '#fffdf0',
    },

    cardAccent: {
        width: 4,
        backgroundColor: '#1a3a6b',
    },

    cardInner: {
        flex: 1,
        padding: 14,
    },

    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 10,
    },

    cardIconWrap: {
        width: 36, height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(26,58,107,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },

    cardIconWrapEmergency: {
        backgroundColor: 'rgba(220,38,38,0.08)',
    },

    cardIconWrapWarning: {
        backgroundColor: 'rgba(217,119,6,0.09)',
    },

    /* kept for backward compat */
    iconContainer: {
        width: 36, height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(26,58,107,0.07)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },

    typeTag: {
        backgroundColor: 'rgba(26,58,107,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(26,58,107,0.12)',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },

    typeTagEmergency: {
        backgroundColor: 'rgba(220,38,38,0.07)',
        borderColor: 'rgba(220,38,38,0.18)',
    },

    typeTagWarning: {
        backgroundColor: 'rgba(217,119,6,0.08)',
        borderColor: 'rgba(217,119,6,0.2)',
    },

    typeTagText: {
        fontSize: 8,
        fontWeight: '800',
        color: '#1a3a6b',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    deptChip: {
        backgroundColor: 'rgba(245,197,24,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(212,168,14,0.2)',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },

    deptChipText: {
        fontSize: 8,
        fontWeight: '700',
        color: '#d4a80e',
        letterSpacing: 0.3,
    },

    /* kept for backward compat */
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    headerText: { flex: 1 },
    deptLabel:  { fontSize: 11, fontWeight: '700', color: '#1a3a6b' },

    cardTime: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '500',
        flexShrink: 0,
        marginTop: 2,
    },

    /* kept for backward compat */
    timeLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },

    cardMessage: {
        fontSize: 13,
        color: '#334155',
        lineHeight: 19,
        fontWeight: '500',
        marginBottom: 10,
    },

    /* kept for backward compat */
    newsContent: {
        fontSize: 13,
        color: '#334155',
        lineHeight: 19,
        marginBottom: 10,
    },

    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },

    /* kept for backward compat */
    readMore: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },

    readMoreText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1a3a6b',
    },

    /* Emergency pulsing dot */
    emergencyDot: {
        position: 'absolute',
        top: 12, right: 12,
        width: 8, height: 8,
        borderRadius: 4,
        backgroundColor: '#dc2626',
    },

    /* ── Empty ── */
    emptyWrap: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 10,
    },

    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#475569',
    },

    emptySubtitle: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: '500',
        textAlign: 'center',
        paddingHorizontal: 24,
    },

    /* kept for backward compat */
    empty: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 10,
    },

    emptyText: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '500',
    },
});