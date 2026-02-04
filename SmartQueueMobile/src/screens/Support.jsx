
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
 /*type Ticket = {
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
    const [joiningId, setJoiningId] = useState<number | null>(null);
    
    // 2. 👈 Update state to use the Ticket type
   const [activeTickets, setActiveTickets] = useState<Ticket[]>([]);

    const OFFICE_LOCATION = { 
        latitude: 9.9861651582219, 
        longitude: 124.34256193209444
    }; 
    const ALLOWED_RADIUS_KM = 0.15; 

    const checkActiveStatus = async () => {
  try {
    const response = await axiosClient.get('/user/active-tickets');
    setActiveTickets(response.data.tickets);
  } catch (error) {
    console.error("Status check failed", error);
  }
};

useEffect(() => {
  // Initial fetch when component mounts
  checkActiveStatus();

  // Subscribe to Echo channel
  const channel = echo.channel('queue-channel');

  // Listen for updates (event name depends on your backend broadcast)
  channel.listen('.QueueUpdated', () => {
    checkActiveStatus();
  });

  // Cleanup when component unmounts
  return () => {
    echo.leaveChannel('queue-channel');
  };
}, []);

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
        Alert.alert("Wait!", "Please enter your purpose first.");
        return;
    }

    setJoiningId(selectedOffice.id); // Set the specific ID being clicked
    setLoading(true);

    try {
        // ... (Your Location Logic remains the same) ...
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "Location access is required.");
            setLoading(false);
            setJoiningId(null);
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
            Alert.alert("Too Far!", `You are ${Math.round(distance * 1000)}m away.`);
            setLoading(false);
            setJoiningId(null);
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
        // ✅ FIX: Catch the specific error message from Laravel (like the Gap error)
        if (error.response?.status === 403) {
            Alert.alert(
                "Queue Restricted",
                error.response.data.error // This will show your "10-Ticket Gap" message!
            );
        } else {
            console.error(error);
            Alert.alert("Error", "Check your connection or server.");
        }
    } finally {
        setLoading(false);
        setJoiningId(null); // Reset the specific loader
    }
};

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: async () => await logout() }
        ]);
    };

    if (loading && !activeTickets) return <ActivityIndicator style={{flex:1}} />;

    // Mock data for the active ticket display (use your actual data)
    const activeTicket = activeTickets.length > 0 ? activeTickets[0] : null;

    return (
        <SafeAreaView style={styles.container}>
        
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoText}>🎓</Text>
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>TMC SMARTQUEUE</Text>
                        <Text style={styles.headerSubtitle}>Trinidad, Bohol</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.notificationBtn}>
                    <Text style={styles.notificationIcon}>🔔</Text>
                </TouchableOpacity>
            </View>

            <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
          
                {activeTicket && (
                    <View style={styles.ticketCard}>
                        <View style={styles.servingBadge}>
                            <View style={styles.greenDot} />
                            <Text style={styles.servingText}>NOW SERVING</Text>
                        </View>
                        
                        <Text style={styles.ticketLabel}>Your Ticket Number</Text>
                        <Text style={styles.ticketNumber}>{activeTicket.queue_number}</Text>
                        
                        <View style={styles.counterBadge}>
                            <Text style={styles.counterText}>
                                {activeTicket.department} • Counter 2
                            </Text>
                        </View>

                        <View style={styles.ticketFooter}>
                            <View style={styles.ticketInfo}>
                                <Text style={styles.ticketInfoLabel}>ESTIMATED WAIT</Text>
                                <Text style={styles.ticketInfoValue}>≈ 12 mins</Text>
                            </View>
                            <View style={styles.ticketInfo}>
                                <Text style={styles.ticketInfoLabel}>POSITION</Text>
                                <Text style={styles.ticketInfoValue}>3rd in line</Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.viewTicketBtn}
                            onPress={() => router.push({
                                pathname: "/main/Ticket",
                                params: { id: activeTicket.id }
                            })}
                        >
                            <Text style={styles.viewTicketBtnText}>View Full Details →</Text>
                        </TouchableOpacity>
                    </View>
                )}

         
                <View style={styles.officeStatusHeader}>
                    <Text style={styles.sectionTitle}>Office Status</Text>
                    <TouchableOpacity>
                        <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                </View>

            
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Enter your purpose</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="e.g., Document request, Inquiry..." 
                        value={purpose} 
                        onChangeText={setPurpose}
                        placeholderTextColor="#9ca3af"
                    />
                </View>

             
                {offices.map((office: any) => {
                    const isFull = office.current_count >= office.capacity_limit;
                    
                    return (
                        <TouchableOpacity
                            key={office.id}
                            style={[styles.officeCard, isFull && styles.officeCardDisabled]}
                            onPress={() => !isFull && handleJoin(office)}
                            disabled={isFull || loading}
                            activeOpacity={0.7}
                        >
                            <View style={styles.officeIconContainer}>
                                <Text style={styles.officeIcon}>
                                    {office.department.includes('Registrar') ? '📋' : 
                                     office.department.includes('Cashier') ? '💰' : '🎓'}
                                </Text>
                            </View>
                            
                            <View style={styles.officeContent}>
                                <View style={styles.officeHeader}>
                                    <Text style={styles.officeName}>{office.department}</Text>
                                    <View style={styles.waitingBadge}>
                                        <Text style={styles.waitingLabel}>WAITING</Text>
                                        <Text style={styles.waitingNumber}>{office.current_count}</Text>
                                    </View>
                                </View>
                                
                                <Text style={styles.servingInfo}>
                                    Serving: {office.target_year || 'All Students'}
                                </Text>

                                {joiningId === office.id && (
                                    <View style={styles.joiningLoader}>
                                        <ActivityIndicator size="small" color="#1e40af" />
                                        <Text style={styles.joiningText}>Joining queue...</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}

            
                <View style={{ height: 100 }} />
                </ScrollView> 

           
            <TouchableOpacity style={styles.fab}>
                <Text style={styles.fabIcon}>➕</Text>
            </TouchableOpacity>

      
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <Text style={styles.navIconActive}>📊</Text>
                    <Text style={styles.navTextActive}>Queue</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.navItem}>
                    <Text style={styles.navIcon}>🎫</Text>
                    <Text style={styles.navText}>Get Ticket</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.navItem}>
                    <Text style={styles.navIcon}>🏫</Text>
                    <Text style={styles.navText}>Campus</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.navItem} onPress={handleLogout}>
                    <Text style={styles.navIcon}>👤</Text>
                    <Text style={styles.navText}>Profile</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
} 
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    
    // Header Styles
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#65a30d',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 24,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e3a8a',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    },
    notificationBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationIcon: {
        fontSize: 20,
    },

    // Scroll View
    scrollView: {
        flex: 1,
    },

    // Active Ticket Card
    ticketCard: {
        margin: 20,
        marginBottom: 10,
        padding: 24,
        borderRadius: 24,
        backgroundColor: '#1e40af',
        shadowColor: '#1e40af',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    servingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 16,
        gap: 6,
    },
    greenDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22c55e',
    },
    servingText: {
        color: '#22c55e',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    ticketLabel: {
        fontSize: 13,
        color: '#bfdbfe',
        marginBottom: 8,
        textAlign: 'center',
    },
    ticketNumber: {
        fontSize: 56,
        fontWeight: '800',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: 2,
    },
    counterBadge: {
        backgroundColor: '#fbbf24',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    counterText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e3a8a',
        textAlign: 'center',
    },
    ticketFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    ticketInfo: {
        flex: 1,
    },
    ticketInfoLabel: {
        fontSize: 10,
        color: '#93c5fd',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    ticketInfoValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
    viewTicketBtn: {
        marginTop: 8,
        paddingVertical: 4,
        alignItems: 'center',
    },
    viewTicketBtnText: {
        color: '#bfdbfe',
        fontSize: 13,
        fontWeight: '600',
    },

    // Office Status Header
    officeStatusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 10,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0f172a',
    },
    viewAllText: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: '600',
    },

    // Input Container
    inputContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        color: '#1e293b',
    },

    // Office Card
    officeCard: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        marginHorizontal: 20,
        marginBottom: 12,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    officeCardDisabled: {
        opacity: 0.5,
        backgroundColor: '#f9fafb',
    },
    officeIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#fef3c7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    officeIcon: {
        fontSize: 28,
    },
    officeContent: {
        flex: 1,
        justifyContent: 'center',
    },
    officeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    officeName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0f172a',
        flex: 1,
    },
    waitingBadge: {
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    waitingLabel: {
        fontSize: 9,
        color: '#94a3b8',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    waitingNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0f172a',
        marginTop: -2,
    },
    servingInfo: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 4,
    },
    joiningLoader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    joiningText: {
        fontSize: 12,
        color: '#1e40af',
        fontWeight: '600',
    },

    // Floating Action Button
    fab: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#eab308',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#eab308',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    fabIcon: {
        fontSize: 24,
        color: '#ffffff',
    },

    // Bottom Navigation
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 10,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    navIcon: {
        fontSize: 22,
        marginBottom: 4,
        opacity: 0.5,
    },
    navIconActive: {
        fontSize: 22,
        marginBottom: 4,
    },
    navText: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '500',
    },
    navTextActive: {
        fontSize: 11,
        color: '#1e40af',
        fontWeight: '700',
    },
}); */