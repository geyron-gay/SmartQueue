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

    const renderItem = ({ item }: ListRenderItemInfo<Announcement>) => {
        // Dynamic styling based on importance
        const isWarning = item.type === 'warning';
        const isEmergency = item.type === 'emergency';

        return (
            <View style={[
                styles.newsCard, 
                isWarning && styles.warningCard, 
                isEmergency && styles.emergencyCard
            ]}>
                <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        <Ionicons 
                            name={isEmergency ? "alert-circle" : isWarning ? "warning" : "information-circle"} 
                            size={24} 
                            color={isEmergency ? "#dc2626" : isWarning ? "#d97706" : "#2563eb"} 
                        />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.deptLabel}>{item.department || 'General'}</Text>
                        <Text style={styles.timeLabel}>2h ago</Text> 
                    </View>
                </View>

                <Text style={styles.newsContent} numberOfLines={3}>
                    {item.message.length > 100 ? item.message.substring(0, 100) + '...' : item.message}
                </Text>

                <TouchableOpacity style={styles.readMore}>
                    <Text style={styles.readMoreText}>View Details</Text>
                    <Ionicons name="arrow-forward" size={14} color="#64748b" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Campus Feed</Text>
                <TouchableOpacity style={styles.filterBtn}>
                    <Ionicons name="funnel-outline" size={20} color="#1e293b" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={news}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="notifications-off-outline" size={50} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No new announcements today</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
    listContent: { padding: 20 },
    newsCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        elevation: 2,
    },
    warningCard: { borderColor: '#fde68a', backgroundColor: '#fffdf5' },
    emergencyCard: { borderColor: '#fecaca', backgroundColor: '#fffafb' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
    headerText: { marginLeft: 12, flex: 1 },
    deptLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
    timeLabel: { fontSize: 10, color: '#94a3b8' },
    newsTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 6 },
    newsContent: { fontSize: 14, color: '#475569', lineHeight: 20 },
    readMore: { flexDirection: 'row', alignItems: 'center', marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    readMoreText: { fontSize: 13, fontWeight: '600', color: '#64748b', marginRight: 4 },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 10, color: '#94a3b8', fontSize: 16 },
    filterBtn: { padding: 8, backgroundColor: '#e2e8f0', borderRadius: 8 }, 
});