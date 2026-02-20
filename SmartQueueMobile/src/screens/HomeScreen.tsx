import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    Alert, ActivityIndicator, ScrollView , Modal, Pressable
} from 'react-native'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosClient from '../api/axios';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { initializeSocket } from '../context/socket';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import messaging from '@react-native-firebase/messaging';

messaging().onMessage(async (remoteMessage) => {
  console.log('🔥 Firebase SDK caught it!', remoteMessage);

  // MANUALLY trigger the pop-up
  await Notifications.scheduleNotificationAsync({
    content: {
      title: remoteMessage.notification?.title || "Queue Update",
      body: remoteMessage.notification?.body || "",
      data: remoteMessage.data,
      // 💡 In Expo, we link the channel by its ID here:
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    // 📌 This ensures it uses the high-priority channel we created in useEffect
    trigger: {
        channelId: 'queue-status', 
    } as any, // 'as any' bypasses the strict TS check if it's being stubborn
  });
});
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // 🕵️ Check if the backend sent the 'sticky' or 'ongoing' flags in the data payload
    const isSticky = notification.request.content.data?.ongoing === 'true' || 
                     notification.request.content.data?.sticky === 'true';

    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      // 📌 This tells Android: "Do not let the user swipe this away"
      priority: Notifications.AndroidNotificationPriority.MAX,
    };
  },
});

// 1. Add a foreground listener specifically to log "hidden" data
useEffect(() => {
    console.log("🕵️ Debugger: Notification Listeners Active");

    const subscription = Notifications.addNotificationReceivedListener(notification => {
        console.log("🔔 [RECEIVED EVENT]:", JSON.stringify(notification, null, 2));
        Alert.alert(
  "DEBUG: Message Received!",
  notification.request.content.title ?? ""
);

    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        console.log("タップ [TAP EVENT]:", response);
    });

    return () => {
        subscription.remove();
        responseSubscription.remove();
    };
}, []);

// 2. Add extra logging to your registration function
export async function registerForPushNotificationsAsync() {
    let token;
    if (!Device.isDevice) {
        console.log("❌ Debugger: Not a physical device!");
        return;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    console.log("🔐 Permission Status:", status);

    if (Platform.OS === 'android') {
        // Log the native device token vs expo token
        const deviceToken = await Notifications.getDevicePushTokenAsync();
        console.log("🔑 NATIVE DEVICE TOKEN:", deviceToken.data);
        token = deviceToken.data;
    }
    
    return token;
}


// 1. 🎫 DEFINE THE TICKET TYPE (This fixes the 'never' error)
type Ticket = {
    id: string | number;
    department: string;
    queue_number: string | number;
    people_ahead: number; // Add this field to show how many people are ahead in the queue
    estimated_wait_time: number; // Add this field to show estimated wait time  
    status:string
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
    const [priority, setPriority] = useState('Regular');
    const [studentId, setStudentId] = useState('');
    const [purpose, setPurpose] = useState('');
    const [loading, setLoading] = useState(false);
    const [offices, setOffices] = useState([]);
    const router = useRouter();
    const { user, logout } = useAuth(); 
    const [joiningId, setJoiningId] = useState<number | null>(null);
    
    // 2. 👈 Update state to use the Ticket type
   const [activeTickets, setActiveTickets] = useState<Ticket[]>([]);
   const [selectedOffice, setSelectedOffice] = useState<any>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
  
 useEffect(() => {
    // 1. Setup the Android Channel
    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('queue-status', {
            name: 'Queue Updates',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            showBadge: true,
        });
    }

    // 2. Setup the Listener correctly
    // subscription.remove() is the way to go now!
    const subscription = Notifications.addNotificationReceivedListener(notification => {
        console.log("🔔 NOTIFICATION RECEIVED:", notification);
    });

    // 3. Register Token logic
    if (user) {
        const registerToken = async () => {
            try {
                const token = await registerForPushNotificationsAsync();
                if (token) {
                    await axiosClient.post('/update-fcm-token', { token });
                    console.log("✅ Token synced to backend:", token);
                }
            } catch (error) {
                console.log("❌ FCM Sync Error:", error);
            }
        };
        registerToken();
    }

    // Cleanup
    return () => {
        subscription.remove(); // 👈 This fixes the error you just got!
    };
}, [user]);

    const OFFICE_LOCATION = { 
        latitude: 9.9861651582219, 
        longitude: 124.34256193209444
    }; 
    const ALLOWED_RADIUS_KM = 0.15; 
// 1. Create a variable OUTSIDE the function to hold the current request


let abortController: AbortController | null = null;

const checkActiveStatus = async () => {
  if (!user) return;

  // 2. If there's an existing request, kill it!
  if (abortController) {
    abortController.abort();
  }

  // 3. Create a new controller for THIS request
  abortController = new AbortController();

  try {
    const response = await axiosClient.get('user/active-tickets', {
      signal: abortController.signal // 👈 Attach the "kill switch"
    });
    
    console.log("✅ Success! Tickets found:", response.data.tickets.length);
    setActiveTickets(response.data.tickets);
    
  } catch (error: any) {
    // 4. Ignore the error if we were the ones who cancelled it
    if (error.name === 'CanceledError') {
      return; 
    }
    console.error("Status check failed", error);
  }
};


useEffect(() => {
    if (!user || loading) return;

    // Initial Fetch
    checkActiveStatus();
    fetchOffices();

    let socket: any;
    const setup = async () => {
        socket = await initializeSocket();
        socket.on('QueueUpdated', (data: any) => {
            console.log("📢 Global Update!");
            checkActiveStatus(); 
            fetchOffices(); 
        });
    };

    setup();
    return () => { if (socket) socket.disconnect(); };
}, [user, loading]); // 👈 Added user/loading here for safety



    const fetchOffices = async () => {

         if (!user) return; 

        try {
            const res = await axiosClient.get('/active-sessions');
            setOffices(res.data);
        } catch (err) {
            console.error("Could not load offices", err);
        }
    };


 const handleJoin = (selectedOffice: any) => {
    // We don't check for 'purpose' here anymore because the user 
    // hasn't even seen the purposes for this office yet!
    
    setSelectedOffice(selectedOffice); // Step 1: IDLE -> OFFICE_SELECTED
    setPurpose(''); // Clear old purpose for safety
    setIsModalVisible(true); // Open the Modal
};

const handleConfirmJoin = () => {
    if (!purpose) {
        Alert.alert("Wait!", "Please select a purpose first.");
        return;
    }

    // Move your Priority Alert here because this is the final confirmation
    if (priority === 'Priority') {
        Alert.alert(
            "⚠️ Priority Verification",
            "Priority slots are strictly for PWD, Pregnant, or Seniors. Present ID at the counter.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "I Understand & Proceed", 
                    onPress: () => {
                        setIsModalVisible(false); // Close modal
                        proceedToJoin(selectedOffice); // Trigger the API
                        setLoading(true); // Show loader while processing
                    } 
                }
            ]
        );
    } else {
        setIsModalVisible(false);
        proceedToJoin(selectedOffice);
    }
};

  const proceedToJoin = async (selectedOffice: any) => {
    console.log("🚀 DEBUG: Starting join process...");
    
    if (!purpose) {
        Alert.alert("Wait!", "Purpose is empty");
        return;
    }

    setJoiningId(selectedOffice.id);
    setLoading(true);

    try {
        // STEP 1: Check if we even reach the API call
        console.log("🚀 DEBUG: Sending request to join-queue...");
        console.log("Payload:", {
            purpose: purpose,
            priority: priority,
            department: selectedOffice.department,
            year_level: selectedOffice.target_year,
        });

        // STEP 2: The API Call (Note: removed leading slash)
        const response = await axiosClient.post('join-queue', {
            purpose: purpose,
            priority: priority,
            department: selectedOffice.department,
            year_level: selectedOffice.target_year,
        });

        // Inside your handleJoinQueue function, right before or after the axios call:
 /*await Notifications.scheduleNotificationAsync({
  content: {
    title: "TEST: Local Notification",
    body: "If you see this, your phone's notification system is WORKING!",
    data: { data: 'goes here' },
  },
  trigger: null, // 'null' means send it immediately
});*/

        console.log("✅ DEBUG: Server Response received!", response.data);

        if (response.data && (response.data.id || response.data.queue?.id)) {
            const ticketId = response.data.id || response.data.queue.id;
            router.push({
                pathname: "/main/Ticket",
                params: { id: ticketId }
            });
        } else {
            Alert.alert("Data Error", "Server responded but no ID found!");
        }

    } catch (error: any) {
        // STEP 3: Catch the exact reason for failure
        console.log("❌ DEBUG: JOIN FAILED");
        
        if (error.response) {
            // The server answered with an error (403, 422, 500)
            console.log("Server Error Data:", error.response.data);
            console.log("Server Status:", error.response.status);
            Alert.alert("Server Error " + error.response.status, JSON.stringify(error.response.data));
        } else if (error.request) {
            // The request was sent but no answer (Network issue)
            console.log("Network Error: No response received");
            Alert.alert("Network Error", "Is your Laravel server running at " + axiosClient.defaults.baseURL + "?");
        } else {
            console.log("Error:", error.message);
            Alert.alert("Error", error.message);
        }
    } finally {
        setLoading(false);
        setJoiningId(null);
    }
};


    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: async () => await logout() }
        ]);
    };

    if (loading && !activeTickets) return <ActivityIndicator style={{flex:1}} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        {/* 🚀 PRODUCTION HEADER: Fixed top area so status is always visible */}
        <View style={styles.topDashboard}>
            <View style={styles.headerInfo}>
                <View>
                    <Text style={styles.welcomeText}>Hello, {user?.name || 'Student'} 👋</Text>
                    <Text style={styles.userBadge}>{user?.user_type?.toUpperCase()}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.iconLogoutBtn}>
                    <Text style={styles.logoutLink}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* 🎫 ACTIVE TICKETS SECTION: Vertical Stack for better visibility */}
            <View style={styles.activeContainer}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.activeTitle}>Active Queues</Text>
                    <View style={styles.countBadge}><Text style={styles.countText}>{activeTickets.length}</Text></View>
                </View>

                {activeTickets.length > 0 ? (
                    <ScrollView 
                        style={{ maxHeight: 220 }} // Limits height so it doesn't take over the whole screen
                        showsVerticalScrollIndicator={true}
                    >
                        {activeTickets.map((t) => (
                            <TouchableOpacity 
                                key={t.id} 
                                style={styles.ticketStrip}
                                onPress={() => router.push({ pathname: "/main/Ticket", params: { id: t.id } })}
                            >
                                <View style={styles.ticketLeft}>
                                    <Text style={styles.ticketDept}>{t.department}</Text>
                                    <Text >{t.people_ahead} people ahead</Text>
                                    <Text style={styles.ticketStatus}>{t.status}</Text>
                                </View>
                                <View style={styles.ticketRight}>
                                    <Text style={styles.ticketSmallNum}>#{t.queue_number}</Text>
                                    <Text>{(t?.estimated_wait_time ?? 0) <= 0 ? '1' : t?.estimated_wait_time} mins</Text>
                                    <Text style={styles.viewLink}>View Details</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                ) : (
                    <View style={styles.emptyTickets}>
                        <Text style={styles.emptyText}>You are not in any queue yet.</Text>
                    </View>
                )}
            </View>
        </View>

        {/* 🏢 OFFICE SELECTION SECTION */}
        <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.sectionLabel}>Available Offices</Text>
            {offices.map((office: any) => {
                const isFull = office.current_count >= office.capacity_limit;
                return (
                    <TouchableOpacity
                        key={office.id}
                        style={[styles.officeCard, isFull && styles.disabledCard]}
                        onPress={() => !isFull && handleJoin(office)}
                        disabled={isFull || loading}
                    >
                        <View style={styles.cardHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.deptName}>{office.department}</Text>
                                <Text style={styles.subInfo}>Target: {office.target_year}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: isFull ? '#fee2e2' : '#dcfce7' }]}>
                                <Text style={[styles.statusBadgeText, { color: isFull ? '#ef4444' : '#16a34a' }]}>
                                    {isFull ? 'FULL' : 'OPEN'}
                                </Text>
                            </View>
                        </View>
                        
                        <View style={styles.officeFooter}>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { 
                                    width: `${(office.current_count / office.capacity_limit) * 100}%`,
                                    backgroundColor: isFull ? '#ef4444' : '#16a34a'
                                }]} />
                            </View>
                            <Text style={styles.slotCount}>{office.current_count} / {office.capacity_limit} Slots</Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>

        {/* 🛡️ MODAL (Keep your existing Modal code here) */}
        <Modal
            animationType="slide"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={() => setIsModalVisible(false)}
        >
            <Pressable style={styles.modalOverlay} onPress={() => setIsModalVisible(false)}>
                <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.modalHandle} />
                    <Text style={styles.modalTitle}>Join {selectedOffice?.department}</Text>
                    
                    <Text style={styles.fieldLabel}>Purpose</Text>
                    <View style={styles.modernPickerWrapper}>
                        <Picker
                            selectedValue={purpose}
                            onValueChange={(val) => setPurpose(val)}
                        >
                            <Picker.Item label="Select Purpose..." value="" />
                            {selectedOffice?.purposes?.map((p: any) => (
                                <Picker.Item key={p.id} label={p.name} value={p.name} />
                            ))}
                        </Picker>
                    </View>

                    <Text style={styles.fieldLabel}>Priority</Text>
                    <View style={styles.modernPickerWrapper}>
                        <Picker
                            selectedValue={priority}
                            onValueChange={(val) => setPriority(val)}
                        >
                            <Picker.Item label="Regular Student" value="Regular" />
                            <Picker.Item label="PWD / Pregnant / Elderly" value="Priority" />
                        </Picker>
                    </View>

                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setIsModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.joinButton, !purpose && styles.buttonDisabled]} 
                            onPress={handleConfirmJoin}
                            disabled={!purpose}
                        >
                            <Text style={styles.joinButtonText}>Confirm Join</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
            {loading && (
                <View style={styles.processingOverlay}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.processingText}>Securing your slot...</Text>
                </View>
            )}
        </Modal>
    </SafeAreaView>
);
}

// 4. 👈 NOTE: You need to make sure your 'styles' object is defined below this!

const styles = StyleSheet.create({
    topDashboard: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    headerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    welcomeText: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
    userBadge: { fontSize: 10, color: '#64748b', fontWeight: 'bold' },
    logoutLink: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
    
    // Ticket List Styles
    activeContainer: { backgroundColor: '#f1f5f9', borderRadius: 20, padding: 15 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    activeTitle: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginRight: 8 },
    countBadge: { backgroundColor: '#16a34a', paddingHorizontal: 8, borderRadius: 10 },
    countText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    ticketStrip: { 
        backgroundColor: '#fff', 
        padding: 12, 
        borderRadius: 12, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#16a34a'
    },
    ticketDept: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
    ticketStatus: { fontSize: 11, color: '#16a34a' },
    ticketSmallNum: { fontSize: 16, fontWeight: '900', color: '#1e293b', textAlign: 'right' },
    viewLink: { fontSize: 10, color: '#3b82f6', textAlign: 'right' },
    emptyTickets: { padding: 20, alignItems: 'center' },
    emptyText: { color: '#94a3b8', fontSize: 12 },

    // Office Card Progress Bar Styles
    sectionLabel: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginTop: 10, marginBottom: 15 },
    officeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 15, elevation: 2 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    statusBadgeText: { fontSize: 10, fontWeight: 'bold' },
    officeFooter: { marginTop: 15 },
    progressBarBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },
    slotCount: { fontSize: 11, color: '#64748b', marginTop: 5, textAlign: 'right', fontWeight: 'bold' },

    // Keep your Modal/Overlay styles from the previous message...
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalHandle: { width: 40, height: 5, backgroundColor: '#e2e8f0', borderRadius: 10, alignSelf: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8, marginTop: 15 },
    modernPickerWrapper: { backgroundColor: '#f1f5f9', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 30 },
    cancelButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#f1f5f9' },
    cancelButtonText: { fontWeight: '700', color: '#64748b' },
    joinButton: { flex: 2, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#1e293b' },
    joinButtonText: { fontWeight: '700', color: '#fff' },
    buttonDisabled: { backgroundColor: '#94a3b8' },
    processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.9)', justifyContent: 'center', alignItems: 'center', borderRadius: 24 },
    processingText: { marginTop: 15, fontSize: 16, fontWeight: '600', color: '#1e293b' },
    deptName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    subInfo: { fontSize: 12, color: '#64748b' },
    disabledCard: { opacity: 0.6 },
    iconLogoutBtn: { padding: 8 },
    ticketLeft: { flexDirection: 'column' },
    ticketRight: { flexDirection: 'column', alignItems: 'flex-end' },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
});