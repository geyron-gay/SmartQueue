
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
    
 


  
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                
                {/* 🆔 VIRTUAL ID CARD */}
                <View style={styles.idCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.universityName}>CAMPUS QUEUE PRO</Text>
                        <Ionicons name="qr-code-outline" size={24} color="rgba(255,255,255,0.8)" />
                    </View>
                    
                    <View style={styles.userInfoRow}>
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{user?.name ? user.name.charAt(0) : "?"}</Text>
                        </View>
                        <View style={styles.userBasicInfo}>
                            <Text style={styles.userName}>{user?.name ?? "Guest"}</Text>
                            <Text style={styles.userStudentId}>{user?.student_id ?? "N/A"}</Text>
                            <View style={styles.verifyBadge}>
                                <Ionicons name="checkmark-circle" size={10} color="#fff" />
                                <Text style={styles.verifyText}>VERIFIED STUDENT</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <Text style={styles.deptText}>{user?.department ?? "Unknown Department"}</Text>
                        <Text style={styles.yearText}>3rd Year</Text>
                    </View>
                </View>

                {/* 📊 ENGAGEMENT STATS */}
                <View style={styles.statsContainer}>
     
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>{stats.total_queues}</Text>
                        <Text style={styles.statLabel}>Queues</Text>
                    </View>
                    
                    <View style={[styles.statBox, styles.statBorder]}>
                        <Text style={styles.statNumber}>{stats.hours_saved}h</Text>
                        <Text style={styles.statLabel}>Time Saved</Text>
                    </View>
                    
                    <View style={styles.statBox}>
                        <Text style={[
                            styles.statNumber, 
                            { color: stats.account_status === 'In Queue' ? '#3b82f6' : '#10b981', fontSize: 16 }
                        ]}>
                            {stats.account_status}
                        </Text>
                        <Text style={styles.statLabel}>Status</Text>
                    </View>
                
                </View>

                {/* ⚙️ MENU GROUPS */}
                <View style={styles.menuSection}>
                    <Text style={styles.menuHeader}>Account Settings</Text>
                    
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuItemLeft}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="person-outline" size={20} color="#475569" />
                            </View>
                            <Text style={styles.menuItemLabel}>Edit Profile</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuItemLeft}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="shield-checkmark-outline" size={20} color="#475569" />
                            </View>
                            <Text style={styles.menuItemLabel}>Priority Verification</Text>
                        </View>
                        <View style={styles.badgeDanger}>
                            <Text style={styles.badgeText}>Action Required</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.menuHeader}>App Preferences</Text>
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuItemLeft}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="notifications-outline" size={20} color="#475569" />
                            </View>
                            <Text style={styles.menuItemLabel}>Notifications</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                    </TouchableOpacity>
                </View>

                {/* 🚪 LOGOUT */}
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>v1.0.4 Build 22</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    idCard: {
        backgroundColor: '#0f172a',
        margin: 20,
        borderRadius: 24,
        padding: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    universityName: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    userInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
    avatarPlaceholder: {
        width: 65,
        height: 65,
        borderRadius: 32.5,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarText: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    userBasicInfo: { marginLeft: 16 },
    userName: { color: 'white', fontSize: 22, fontWeight: 'bold' },
    userStudentId: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },
    verifyBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#059669', 
        paddingHorizontal: 8, 
        paddingVertical: 3, 
        borderRadius: 6, 
        marginTop: 8,
        alignSelf: 'flex-start'
    },
    verifyText: { color: 'white', fontSize: 8, fontWeight: 'bold', marginLeft: 4 },
    cardFooter: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 15, flexDirection: 'row', justifyContent: 'space-between' },
    deptText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
    yearText: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },

    statsContainer: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: 'white', borderRadius: 24, padding: 20, elevation: 2 },
    statBox: { flex: 1, alignItems: 'center' },
    statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#f1f5f9' },
    statNumber: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
    statLabel: { fontSize: 10, color: '#94a3b8', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

    menuSection: { marginTop: 30, paddingHorizontal: 20 },
    menuHeader: { fontSize: 13, fontWeight: '800', color: '#94a3b8', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase' },
    menuItem: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: 'white', 
        padding: 16, 
        borderRadius: 20, 
        marginBottom: 10 
    },
    menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    menuItemLabel: { fontSize: 15, fontWeight: '600', color: '#334155' },
    badgeDanger: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: '#ef4444', fontSize: 10, fontWeight: 'bold' },

    logoutButton: { flexDirection: 'row', margin: 25, justifyContent: 'center', alignItems: 'center', padding: 18, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#fee2e2' },
    logoutText: { color: '#ef4444', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
    versionText: { textAlign: 'center', color: '#cbd5e1', fontSize: 11, marginBottom: 40 },
});