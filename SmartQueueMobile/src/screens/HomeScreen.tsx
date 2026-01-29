import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    Alert, ActivityIndicator, ScrollView 
} from 'react-native'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosClient from '../api/axios';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import echo from '../api/echo';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

// 1. 🎫 DEFINE THE TICKET TYPE (This fixes the 'never' error)
type Ticket = {
    id: string | number;
    department: string;
    queue_number: string | number;
};

const getPrecisionDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export default function JoinQueueScreen() {
    const [name, setName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [purpose, setPurpose] = useState('');
    const [loading, setLoading] = useState(false);
    const [offices, setOffices] = useState([]);
    const router = useRouter();
    const { user, logout } = useAuth(); 
    
    // 2. 👈 Update state to use the Ticket type
    const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

    const OFFICE_LOCATION = { 
        latitude: 9.9861651582219, 
        longitude: 124.34256193209444
    }; 
    const ALLOWED_RADIUS_KM = 0.15; 

    useFocusEffect(
        useCallback(() => {
            checkActiveStatus();
        }, [])
    );

    const checkActiveStatus = async () => {
        try {
            const response = await axiosClient.get('/user/active-ticket');
            setActiveTicket(response.data.has_active ? response.data.ticket : null);
        } catch (error) {
            console.error("Status check failed", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOffices = async () => {
        try {
            const res = await axiosClient.get('/active-sessions');
            setOffices(res.data);
        } catch (err) {
            console.error("Could not load offices", err);
        }
    };

    useEffect(() => {
        fetchOffices();
        const channel = echo.channel('queue-channel');
        channel.listen('.QueueUpdated', () => {
            fetchOffices();
        });
        return () => echo.leaveChannel('queue-channel');
    }, []);

    const handleJoin = async (selectedOffice: any) => {
        if (!purpose) {
            Alert.alert("Wait!", "Please fill in your details first.");
            return;
        }
        setLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Denied", "Location access is required.");
                setLoading(false);
                return;
            }
            let location = await Location.getCurrentPositionAsync({});
            const distance = getPrecisionDistance(
                location.coords.latitude,
                location.coords.longitude,
                OFFICE_LOCATION.latitude,
                OFFICE_LOCATION.longitude
            );
            if (distance > ALLOWED_RADIUS_KM) {
                Alert.alert("Too Far!", `You are ${Math.round(distance * 1000)}m away. Go to the office!`);
                setLoading(false);
                return;
            }
            const response = await axiosClient.post('/join-queue', {
                purpose: purpose,
                department: selectedOffice.department,
                year_level: selectedOffice.target_year,
            });
            router.push({
                pathname: "/main/Ticket",
                params: { id: response.data.id }
            });
        } catch (error: any) {
            if (error.response?.status === 403) {
                Alert.alert(
                    "Active Ticket Found",
                    error.response.data.error,
                    [
                        { text: "OK", style: "cancel" },
                        { 
                            text: "View Ticket", 
                            onPress: () => router.push({
                                pathname: "/main/Ticket",
                                params: { id: error.response.data.active_ticket_id }
                            }) 
                        }
                    ]
                );
            } else {
                Alert.alert("Error", "Something went wrong.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: async () => await logout() }
        ]);
    };

    if (loading && !activeTicket) return <ActivityIndicator style={{flex:1}} />;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <View style={styles.card}>
                    <Text style={styles.welcome}>Hello, {user?.name} 👋</Text>
                    <Text style={styles.roleTag}>Type: {user?.user_type?.toUpperCase()}</Text>
                    <Text style={styles.header}>School Queue 🏫</Text>

                    {activeTicket ? (
                        <View style={styles.activeCard}>
                            <Text style={styles.activeTitle}>You are currently in line!</Text>
                            {/* 3. 👈 Optional chaining ?. used here */}
                            <Text style={styles.activeSub}>Office: {activeTicket?.department}</Text>
                            <Text style={styles.ticketNum}>#{activeTicket?.queue_number}</Text>
                            <TouchableOpacity 
                                style={styles.viewBtn}
                                onPress={() => router.push({
                                    pathname: "/main/Ticket",
                                    params: { id: activeTicket?.id }
                                })}
                            >
                                <Text style={styles.viewBtnText}>View My Ticket</Text>
                            </TouchableOpacity>
                        </View> 
                    ) : (
                        <>
                            <Text style={styles.subHeader}>Fill your info, then select an office</Text>
                            <TextInput style={styles.input} placeholder="Purpose" value={purpose} onChangeText={setPurpose} />
                        </>
                    )}
                </View>

                <Text style={styles.sectionTitle}>Tap an Office to Join:</Text>

                {offices.length === 0 ? (
                    <Text style={styles.emptyMessage}>No offices are active.</Text>
                ) : (
                offices.map((office: any) => {
              const isFull = office.current_count >= office.capacity_limit;
                return (
                 <TouchableOpacity
               key={office.id}
              style={[styles.officeCard, isFull && styles.disabledCard]}
              onPress={() => !isFull && handleJoin(office)}
              disabled={isFull || loading}
                 >
                 <View style={styles.cardHeader}>
               <Text style={styles.deptName}>{office.department}</Text>
                  <View
                 style={[
              styles.badge,
              { backgroundColor: isFull ? '#ef4444' : '#22c55e' },
            ]}
          >
            <Text style={styles.badgeText}>
              {isFull ? 'FULL' : 'OPEN'} {office.is_active ? '' : '(CLOSED)'}
            </Text>
          </View>
        </View>

        <Text style={styles.subInfo}>Serving: {office.target_year}</Text>

        <View style={styles.slotInfo}>
          <Text style={styles.slotText}>
            Slots: {office.current_count} / {office.capacity_limit}
          </Text>
        </View>

                   {loading && <ActivityIndicator size="small" color="#16a34a" />}
                   </TouchableOpacity>
                  );
             })
            )}

            <View style={styles.footer}>
  <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
    <Text style={styles.logoutText}>Logout</Text>
  </TouchableOpacity>
</View>
            </ScrollView>
        </SafeAreaView>
    );
}

// 4. 👈 NOTE: You need to make sure your 'styles' object is defined below this!

const styles = StyleSheet.create({
    card: {
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 15,
        marginBottom: 20,
        elevation: 3,
    },
    header: { fontSize: 24, fontWeight: 'bold', color: '#16a34a', textAlign: 'center' },
    subHeader: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 20 },
    input: {
        backgroundColor: '#f9fafb',
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#374151' },
    officeCard: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 5,
        borderLeftColor: '#16a34a',
        elevation: 2,
    },
    disabledCard: { opacity: 0.5, borderLeftColor: '#9ca3af' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    deptName: { fontSize: 18, fontWeight: 'bold' },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
    badgeText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
    subInfo: { color: '#6b7280', marginTop: 5 },
    slotInfo: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 5 },
    slotText: { fontSize: 12, fontWeight: '600' },
    closedBox: { padding: 40, alignItems: 'center' },
    closedText: { color: '#9ca3af', fontStyle: 'italic' },
    welcome: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    roleTag: { fontSize: 12, color: '#16a34a', fontWeight: 'bold', marginTop: 4 },
    content: { padding: 20 },
    footer: {
  marginTop: 30,
  paddingVertical: 20,
  borderTopWidth: 1,
  borderColor: '#e5e7eb',
  alignItems: 'center',
},
footerText: {
  fontSize: 14,
  color: '#374151',
  marginBottom: 10,
},
logoutBtn: {
  backgroundColor: '#ef4444',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 8,
},
logoutText: {
  color: '#fff',
  fontWeight: '600',
},
activeCard: { backgroundColor: '#f0fdf4', padding: 25, borderRadius: 20, borderWidth: 2, borderColor: '#16a34a', alignItems: 'center' },
    activeTitle: { fontSize: 18, color: '#166534', fontWeight: 'bold' },
    activeSub: { color: '#16a34a', marginTop: 5 },
    ticketNum: { fontSize: 60, fontWeight: 'black', color: '#16a34a', marginVertical: 10 },
    viewBtn: { backgroundColor: '#16a34a', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 10 },
    viewBtnText: { color: '#fff', fontWeight: 'bold' },
    emptyMessage: {
  textAlign: 'center',
  marginTop: 20,
  fontSize: 16,
  color: '#94a3b8',
  fontWeight: '500',
},
});