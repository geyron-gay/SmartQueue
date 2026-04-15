import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, Image, ScrollView,
    Dimensions, Animated, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// ─── DATA (unchanged — just replace images as before) ───────────────────────
const teamMembers = [
    {
        id: '1',
        name: 'John Doe',
        role: 'Project Manager',
        tag: 'LEAD',
        tagColor: '#f5c518',
        bio: 'Drives the vision, keeps the team in sync.',
        image: require('../../assets/images/kayla.jpeg'),
    },
    {
        id: '2',
        name: 'Jane Smith',
        role: 'Frontend Developer',
        tag: 'UI',
        tagColor: '#38bdf8',
        bio: 'Crafts every pixel the user sees.',
        image: require('../../assets/images/laisa.jpeg'),
    },
    {
        id: '3',
        name: 'Michael Lee',
        role: 'Backend Developer',
        tag: 'API',
        tagColor: '#4ade80',
        bio: 'Powers the logic behind every action.',
        image: require('../../assets/images/marc.jpeg'),
    },
    {
        id: '4',
        name: 'Chris Evans',
        role: 'UI/UX Designer',
        tag: 'UX',
        tagColor: '#c084fc',
        bio: 'Makes complex flows feel effortless.',
        image: require('../../assets/images/eyron.jpg'),
    },
    {
        id: '5',
        name: 'Sarah Kim',
        role: 'QA Engineer',
        tag: 'QA',
        tagColor: '#fb7185',
        bio: 'Hunts bugs so users never have to.',
        image: require('../../assets/images/logo.webp'),
    },
];

// ─── ANIMATED CARD ──────────────────────────────────────────────────────────
function MemberCard({ item, index }: { item: typeof teamMembers[0]; index: number }) {
    const fadeAnim  = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: index * 110,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                delay: index * 110,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const isFullWidth = index === 0; // Lead gets full-width featured card

    return (
        <Animated.View
            style={[
                styles.card,
                isFullWidth && styles.cardFeatured,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
        >
            {/* Gold left border accent */}
            <View style={[styles.cardAccent, { backgroundColor: item.tagColor }]} />

            <View style={[styles.cardInner, isFullWidth && styles.cardInnerFeatured]}>

                {/* Avatar */}
                <View style={[styles.avatarWrap, isFullWidth && styles.avatarWrapFeatured]}>
                    <Image
                        source={item.image}
                        style={[styles.avatar, isFullWidth && styles.avatarFeatured]}
                    />
                    {/* Tag badge over avatar */}
                    <View style={[styles.tagBadge, { backgroundColor: item.tagColor }]}>
                        <Text style={styles.tagText}>{item.tag}</Text>
                    </View>
                </View>

                {/* Info */}
                <View style={[styles.cardInfo, isFullWidth && styles.cardInfoFeatured]}>
                    {isFullWidth && (
                        <Text style={styles.featuredLabel}>⭐ TEAM LEAD</Text>
                    )}
                    <Text style={[styles.memberName, isFullWidth && styles.memberNameFeatured]}>
                        {item.name}
                    </Text>
                    <Text style={[styles.memberRole, { color: item.tagColor }]}>
                        {item.role}
                    </Text>
                    <Text style={styles.memberBio}>{item.bio}</Text>

                    {/* Decorative dots row */}
                    <View style={styles.dotsRow}>
                        <View style={[styles.dot, { backgroundColor: item.tagColor }]} />
                        <View style={[styles.dot, { backgroundColor: item.tagColor, opacity: 0.5 }]} />
                        <View style={[styles.dot, { backgroundColor: item.tagColor, opacity: 0.25 }]} />
                    </View>
                </View>
            </View>
        </Animated.View>
    );
}

// ─── MAIN SCREEN ────────────────────────────────────────────────────────────
const AboutTeam = () => {
    const heroFade = useRef(new Animated.Value(0)).current;
    const heroSlide = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(heroFade,  { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(heroSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            <SafeAreaView style={styles.root} edges={['top']}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scroll}
                >

                    {/* ══════════════ HERO HEADER ══════════════ */}
                    <View style={styles.hero}>
                        {/* Background grid lines (decorative) */}
                        <View style={styles.gridLine1} />
                        <View style={styles.gridLine2} />
                        <View style={styles.gridCircle} />

                        <Animated.View style={{
                            opacity: heroFade,
                            transform: [{ translateY: heroSlide }],
                        }}>
                            {/* School badge */}
                            <View style={styles.schoolBadge}>
                                <Text style={styles.schoolBadgeText}>🏫 Trinidad Municipal College</Text>
                            </View>

                            {/* Eyebrow */}
                            <View style={styles.eyebrowRow}>
                                <View style={styles.eyebrowLine} />
                                <Text style={styles.eyebrow}>SYSTEM PROJECT 2024–2025</Text>
                                <View style={styles.eyebrowLine} />
                            </View>

                            {/* Hero title */}
                            <Text style={styles.heroTitle}>Meet The{'\n'}
                                <Text style={styles.heroTitleGold}>Team</Text>
                            </Text>

                            {/* Subtitle */}
                            <Text style={styles.heroSub}>
                                The minds behind{' '}
                                <Text style={styles.heroSubBold}>TMC SmartQueue</Text>
                                {' '}— a modern campus queue management system built for students, by students.
                            </Text>

                            {/* Stats row */}
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNum}>5</Text>
                                    <Text style={styles.statLbl}>Members</Text>
                                </View>
                                <View style={styles.statDiv} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statNum}>1</Text>
                                    <Text style={styles.statLbl}>Project</Text>
                                </View>
                                <View style={styles.statDiv} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statNum}>∞</Text>
                                    <Text style={styles.statLbl}>Dedication</Text>
                                </View>
                            </View>
                        </Animated.View>

                        {/* Gold bottom border */}
                        <View style={styles.heroBorder} />
                    </View>

                    {/* ══════════════ TEAM SECTION LABEL ══════════════ */}
                    <View style={styles.sectionLabel}>
                        <Text style={styles.sectionLabelNum}>01</Text>
                        <View style={styles.sectionLabelLine} />
                        <Text style={styles.sectionLabelText}>CORE TEAM</Text>
                    </View>

                    {/* ══════════════ MEMBER CARDS ══════════════ */}
                    <View style={styles.cardsList}>
                        {teamMembers.map((item, index) => (
                            <MemberCard key={item.id} item={item} index={index} />
                        ))}
                    </View>

                    {/* ══════════════ PROJECT CARD ══════════════ */}
                    <View style={styles.sectionLabel}>
                        <Text style={styles.sectionLabelNum}>02</Text>
                        <View style={styles.sectionLabelLine} />
                        <Text style={styles.sectionLabelText}>THE PROJECT</Text>
                    </View>

                    <View style={styles.projectCard}>
                        <View style={styles.projectCardAccent} />
                        <View style={styles.projectCardInner}>
                            <Text style={styles.projectTitle}>TMC SmartQueue</Text>
                            <Text style={styles.projectYear}>AY 2024–2025</Text>
                            <Text style={styles.projectDesc}>
                                A real-time campus queue management system that eliminates long waiting lines in Trinidad Municipal College offices. Students can join queues digitally, track their position live, and receive alerts when it's their turn.
                            </Text>

                            <View style={styles.techRow}>
                                {['React Native', 'Laravel', 'Socket.IO', 'Expo'].map(t => (
                                    <View key={t} style={styles.techChip}>
                                        <Text style={styles.techChipText}>{t}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* ══════════════ FOOTER ══════════════ */}
                    <View style={styles.footer}>
                        <View style={styles.footerDivider} />
                        <Text style={styles.footerText}>
                            Built with ❤️ by the SmartQueue Team
                        </Text>
                        <Text style={styles.footerSub}>
                            Trinidad Municipal College · Bohol, Philippines
                        </Text>
                        <Text style={styles.footerVersion}>v1.0.4 · Build 22</Text>
                    </View>

                    <View style={{ height: 32 }} />
                </ScrollView>
            </SafeAreaView>
        </>
    );
};

// ─── STYLES ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

    root: { flex: 1, backgroundColor: '#0a1628' },
    scroll: { flexGrow: 1 },

    /* ── Hero ── */
    hero: {
        backgroundColor: '#0a1628',
        paddingHorizontal: 22,
        paddingTop: 16,
        paddingBottom: 0,
        position: 'relative',
        overflow: 'hidden',
    },

    /* Decorative lines */
    gridLine1: {
        position: 'absolute', top: 0, right: 60,
        width: 1, height: '100%',
        backgroundColor: 'rgba(245,197,24,0.06)',
    },
    gridLine2: {
        position: 'absolute', top: 0, right: 120,
        width: 1, height: '100%',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    gridCircle: {
        position: 'absolute',
        width: 280, height: 280, borderRadius: 140,
        borderWidth: 1, borderColor: 'rgba(245,197,24,0.05)',
        top: -60, right: -80,
    },

    schoolBadge: {
        backgroundColor: 'rgba(245,197,24,0.1)',
        borderWidth: 1, borderColor: 'rgba(245,197,24,0.22)',
        borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 5,
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    schoolBadgeText: { color: '#f5c518', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

    eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    eyebrow: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.3)', letterSpacing: 2 },
    eyebrowLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },

    heroTitle: {
        fontSize: 40,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -1.5,
        lineHeight: 46,
        marginBottom: 14,
    },
    heroTitleGold: { color: '#f5c518' },

    heroSub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        lineHeight: 20,
        fontWeight: '400',
        marginBottom: 22,
        maxWidth: width * 0.82,
    },
    heroSubBold: { color: '#ffffff', fontWeight: '700' },

    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
        paddingVertical: 14,
        paddingHorizontal: 10,
        marginBottom: 24,
    },
    statItem: { flex: 1, alignItems: 'center', gap: 3 },
    statNum: { fontSize: 22, fontWeight: '900', color: '#f5c518', letterSpacing: -0.5 },
    statLbl: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.8 },
    statDiv: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.08)' },

    heroBorder: { height: 2, backgroundColor: '#f5c518', width: 40, borderRadius: 2, marginBottom: 0 },

    /* ── Section label ── */
    sectionLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 22,
        paddingVertical: 18,
    },
    sectionLabelNum: { fontSize: 11, fontWeight: '900', color: '#f5c518', letterSpacing: 0.5 },
    sectionLabelLine: { width: 24, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
    sectionLabelText: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.35)', letterSpacing: 2 },

    /* ── Cards list ── */
    cardsList: { paddingHorizontal: 16, gap: 10 },

    /* ── Card ── */
    card: {
        backgroundColor: '#111f38',
        borderRadius: 18,
        overflow: 'hidden',
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        marginBottom: 0,
    },

    cardFeatured: {
        backgroundColor: '#142d56',
        borderColor: 'rgba(245,197,24,0.2)',
        shadowColor: '#f5c518',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
        elevation: 6,
        flexDirection: 'column',
    },

    cardAccent: {
        width: 3,
        alignSelf: 'stretch',
    },

    cardInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 14,
    },

    cardInnerFeatured: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 18,
        gap: 16,
    },

    /* ── Avatar ── */
    avatarWrap: { position: 'relative', flexShrink: 0 },
    avatarWrapFeatured: {},

    avatar: {
        width: 52, height: 52,
        borderRadius: 14,
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.08)',
    },

    avatarFeatured: {
        width: 70, height: 70,
        borderRadius: 18,
        borderWidth: 2, borderColor: 'rgba(245,197,24,0.3)',
    },

    tagBadge: {
        position: 'absolute',
        bottom: -4, right: -6,
        paddingHorizontal: 5, paddingVertical: 2,
        borderRadius: 6,
    },
    tagText: { fontSize: 7, fontWeight: '900', color: '#000000', letterSpacing: 0.5 },

    /* ── Card info ── */
    cardInfo: { flex: 1, gap: 3 },
    cardInfoFeatured: { gap: 4 },

    featuredLabel: {
        fontSize: 8, fontWeight: '800',
        color: '#f5c518', letterSpacing: 1.2,
        marginBottom: 2,
    },

    memberName: {
        fontSize: 15, fontWeight: '800',
        color: '#ffffff', letterSpacing: -0.3,
    },
    memberNameFeatured: { fontSize: 19, letterSpacing: -0.5 },

    memberRole: { fontSize: 11, fontWeight: '700' },

    memberBio: {
        fontSize: 11, fontWeight: '400',
        color: 'rgba(255,255,255,0.4)',
        lineHeight: 16, marginTop: 2,
    },

    dotsRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
    dot: { width: 5, height: 5, borderRadius: 3 },

    /* ── Project card ── */
    projectCard: {
        marginHorizontal: 16,
        backgroundColor: '#111f38',
        borderRadius: 20,
        overflow: 'hidden',
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: 'rgba(245,197,24,0.15)',
        shadowColor: '#f5c518',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    projectCardAccent: { width: 3, backgroundColor: '#f5c518' },
    projectCardInner: { flex: 1, padding: 18, gap: 8 },

    projectTitle: {
        fontSize: 20, fontWeight: '900',
        color: '#ffffff', letterSpacing: -0.5,
    },
    projectYear: {
        fontSize: 10, fontWeight: '700',
        color: '#f5c518', letterSpacing: 0.8,
        marginTop: -4,
    },
    projectDesc: {
        fontSize: 12, color: 'rgba(255,255,255,0.5)',
        lineHeight: 19, fontWeight: '400',
    },

    techRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    techChip: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 4,
    },
    techChipText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },

    /* ── Footer ── */
    footer: { alignItems: 'center', paddingTop: 28, paddingHorizontal: 22, gap: 6 },
    footerDivider: { width: 40, height: 2, backgroundColor: '#f5c518', borderRadius: 2, marginBottom: 10 },
    footerText:    { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
    footerSub:     { fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: '500' },
    footerVersion: { fontSize: 10, color: 'rgba(255,255,255,0.18)', fontWeight: '600', marginTop: 4 },
});

export default AboutTeam;