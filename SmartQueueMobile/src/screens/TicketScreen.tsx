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


// The Blueprint
interface TicketData {
    ticket: {
        id: number;
        queue_number: number;
        status: string;
        student_name: string;
        department: string;
        priority_level: number | string;
        
    };

    neighborhood: Array<{
        id: number;
        queue_number: number;
        status: string;
        student_name: string;
        is_me: boolean;
        priority: string;
        purpose: string;
    }>;

    people_ahead: number;
    now_serving: number | string;
    estimated_wait_time: number; // 👈 Add this line
}

export default function TicketScreen() {
    const { id } = useLocalSearchParams<{ id: string }>(); 
    const router = useRouter();
    const [data, setData] = useState<TicketData | null>(null); // Use the blueprint
    const [loading, setLoading] = useState(true);
    const [hasNotified, setHasNotified] = useState(false);
    const [viewMode, setViewMode] = useState<'ticket' | 'feed'>('ticket');
    // Inside your component:
const player = useAudioPlayer('https://www.myinstants.com/media/sounds/ding-sound-effect.mp3');

    // ... rest of your code ...
    //php artisan serve --host=0.0.0.0

useEffect(() => {
    if (data?.ticket?.status === 'serving' && !hasNotified) {
        player.play(); // Much simpler!
        Vibration.vibrate([500, 500, 500]);
        setHasNotified(true); 
    }
}, [data?.ticket?.status]);

 const fetchStatus = async () => {
    try {
        // 1. Ensure this path matches your api.php exactly!
        const response = await axiosClient.get(`/queues/status/${id}`); 
        
        // 2. Map the data correctly (Laravel sends 'ticket', not 'queue')
       
        setData(response.data); 
    } catch (error) {
        console.error("Status check failed", error);
    } finally {
        setLoading(false);
    }
};

const handleCancel = () => {
    Alert.alert(
        "Cancel Ticket",
        "Are you sure you want to leave the queue? Your ticket will be marked as cancelled.",
        [
            { text: "No, Stay", style: "cancel" },
            { 
                text: "Yes, Cancel", 
                style: "destructive", 
                onPress: async () => {
                    try {
                        // Changed to PUT to update the status instead of deleting the row
                        await axiosClient.put(`/queues/${data?.ticket?.id}/cancel`, {
                            status: 'cancelled'
                        });
                        
                        router.replace('/'); 
                    } catch (e) {
                        console.error("Cancel failed", e);
                        router.replace('/');
                    }
                }
            }
        ]
    );
};
/*
    useEffect(() => {
        fetchStatus();
        // Check for updates every 10 seconds
        const interval = setInterval(fetchStatus, 10000);
        return () => clearInterval(interval);
    }, [id]); */

    useEffect(() => {
        fetchStatus();
    
        let socket: any;
    
        const setupSocket = async () => {
            socket = await initializeSocket();
    
            // Listen for the event emitted by your Node.js server
            socket.on('QueueUpdated', (data: any) => {
                console.log("📢 Real-time update from Private Socket!", data);
                fetchStatus(); 
            });
        };
    
        setupSocket();
    
        return () => {
            if (socket) socket.disconnect();
        };
    }, [id]);



    if (loading) return <ActivityIndicator size="large" style={{flex:1}} />;

    const isServing = data?.ticket?.status === 'serving';

   return (
    <>

     <SafeAreaView style={styles.safe}>
    <View style={styles.container}>

        {/* 🎫 NEW: Department Header so they know which ticket this is! */}
    <View style={styles.deptHeader}>
        <Text style={styles.deptHeaderText}>
            {data?.ticket?.department ?? 'Loading...'}
        </Text>
    </View>

    

        {/* New "Now Serving" Header */}
        <View style={styles.nowServingHeader}>
            <Text style={styles.nowServingLabel}>NOW SERVING</Text>
            <Text style={styles.nowServingNumber}>
                {data?.now_serving !== 'None' ? `#${data?.now_serving}` : '---'}
            </Text>
        </View>

        <View style={styles.toggleContainer}>
    <TouchableOpacity 
        style={[styles.toggleBtn, viewMode === 'ticket' && styles.toggleActive]}
        onPress={() => setViewMode('ticket')}
    >
        <Text style={viewMode === 'ticket' ? styles.toggleTextActive : styles.toggleText}>My Ticket</Text>
    </TouchableOpacity>
    <TouchableOpacity 
        style={[styles.toggleBtn, viewMode === 'feed' && styles.toggleActive]}
        onPress={() => setViewMode('feed')}
    >
        <Text style={viewMode === 'feed' ? styles.toggleTextActive : styles.toggleText}>Live Feed</Text>
    </TouchableOpacity>
</View>

        {/* 🛑 PRO CANCEL BUTTON: Styled to be visible but distinct */}

        {data?.ticket?.status =='pending' && (
        <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleCancel}
        >
            <Text style={styles.cancelText}>Cancel Ticket & Exit</Text>
        </TouchableOpacity>
        )}

{viewMode === 'ticket' ? (
        <View style={styles.ticketCard}>
            <Text style={styles.label}>YOUR TICKET NUMBER</Text>
            <Text style={styles.ticketNumber}>#{data?.ticket?.queue_number}</Text>
            
            <View style={styles.divider} />

            {isServing ? (
                <View style={styles.servingBox}>
                    <Text style={styles.servingText}>IT'S YOUR TURN! 🎉</Text>
                    <Text style={styles.subText}>Please proceed to the counter.</Text>
                </View>
          ) : (
    <View style={styles.waitingBox}>
        <View style={styles.timeCard}>
    <View style={styles.timeHeader}>
        <Text style={styles.clockIcon}>🕒</Text>
        <Text style={styles.timeLabel}>ESTIMATED WAIT</Text>
    </View>
    
    {/* Logic: If serving, show 'Your Turn', else show minutes */}
    <Text style={styles.timeValue}>


        {data?.ticket?.status === 'serving' ? (
            <Text style={{color: '#4CAF50'}}>Your Turn!</Text>
        ) : data?.ticket?.status === 'completed' ? (
            <Text style={{color: '#4CAF50'}}>Completed!</Text>
        ) : data?.ticket?.status === 'cancelled' ? (
            <Text style={{color: '#f44336'}}>Cancelled!</Text>
        ) : (
            <>
                {(data?.estimated_wait_time ?? 0) <= 0 ? '1' : data?.estimated_wait_time} 
                <Text style={styles.minsLabel}> mins</Text>
            </>
        )}  
    </Text>

    <View style={styles.progressContainer}>
        <View
            style={[
                styles.progressBar,
                {
                    // If 0 mins, make bar 100% or very small? 
                    // Let's make it reflect the "wait"
                    width: `${Math.max(5, Math.min(100, ((data?.estimated_wait_time ?? 0) / 30) * 100))}%`,
                    backgroundColor: (data?.estimated_wait_time ?? 0) < 5 ? '#FF9800' : '#2196F3'
                },
            ]}
        />
    </View>

    <Text style={styles.progressText}>
        {data?.ticket?.status === 'serving' 
            ? 'Please proceed to the counter' 
            : data?.ticket?.status === 'completed' 
            ? 'Layaas naaa !'
            : data?.people_ahead === 0 
            ? 'You are next in line!' 
            : `${data?.people_ahead} people waiting ahead of you`
            }
    </Text>
</View>

            <View>
                {data?.ticket?.priority_level == "1" && <Text>Please Prepare ID</Text>}
            </View>

        <View style={styles.dividerSmall} />

        <Text style={styles.positionNumber}>{data?.people_ahead}</Text>
        <Text style={styles.waitingText}>People ahead of you</Text>
        <Text style={styles.statusBadge}>Status: {data?.ticket?.status.toUpperCase()}</Text>
    </View>
)}
        </View>
        ) : (
            
    // 📊 NEW: LIVE FEED VIEW
    <ScrollView style={styles.feedContainer}>
        <Text style={styles.feedTitle}>Queue Neighborhood</Text>
        {data?.neighborhood.length === 0 && (
            <Text style={{textAlign: 'center', color: '#666'}}>No one else is in the queue right now.</Text>
        )}
        {data?.neighborhood.map((item) => (
            <View key={item.id} style={[
                styles.feedItem, 
                item.is_me && styles.feedItemMe,
                item.status === 'serving' && styles.feedItemServing
            ]}>
                <View>
                    <Text style={styles.feedNum}>#{item.queue_number}</Text>
                    <Text style={styles.feedName}>{item.student_name}</Text>
                    <Text >{item.purpose}</Text>
                </View>
                
                <View style={{alignItems: 'flex-end'}}>
                    <Text style={styles.feedStatus}>{item.status.toUpperCase()}</Text>
                    {item.is_me && <View style={styles.meBadge}><Text style={styles.meText}>YOU</Text></View>}
                </View>
            </View>
        ) )}
    </ScrollView>
)}      
    </View>
    </SafeAreaView>
    </>
);
}

const styles = StyleSheet.create({
    safe: {
  flex: 1,
  backgroundColor: '#16a34a',
},

container: {
  flex: 1,
  padding: 20,
}
,
    nowServingHeader: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white
        padding: 15,
        borderRadius: 15,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    nowServingLabel: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    nowServingNumber: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
    },
    // ... your existing styles ...
  timeCard: {
    backgroundColor: '#F0F7FF', // Light professional blue
    borderRadius: 15,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D1E9FF',
  },
  timeLabel: {
    color: '#555',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 5,
  },
  timeValue: {
    fontSize: 38,
    fontWeight: '900',
    color: '#007AFF', // Primary Blue
  },
  minsLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  dividerSmall: {
    height: 1,
    backgroundColor: '#EEE',
    width: '50%',
    marginBottom: 20,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  clockIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  progressContainer: {
    height: 8,
    width: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginTop: 15,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF', // Blue progress
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#888',
    marginTop: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
 
  // ... ensure your other styles are present ...

    
    ticketCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 40,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    label: { fontSize: 14, color: '#666', fontWeight: 'bold', letterSpacing: 1 },
    ticketNumber: { fontSize: 80, fontWeight: 'bold', color: '#16a34a', marginVertical: 10 },
    divider: { height: 1, backgroundColor: '#eee', width: '100%', marginVertical: 20, borderStyle: 'dashed', borderRadius: 1 },
    waitingBox: { alignItems: 'center' },
    positionNumber: { fontSize: 40, fontWeight: 'bold', color: '#333' },
    waitingText: { fontSize: 16, color: '#666' },
    statusBadge: { marginTop: 15, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#f3f4f6', borderRadius: 20, fontSize: 12, color: '#666' },
    servingBox: { alignItems: 'center', backgroundColor: '#dcfce7', padding: 20, borderRadius: 15 },
    servingText: { fontSize: 22, fontWeight: 'bold', color: '#166534' },
    subText: { fontSize: 14, color: '#166534', marginTop: 5 },
    cancelButton: {
        marginTop: 25,
        paddingVertical: 15,
        width: '100%',
        borderRadius: 12,
        backgroundColor: '#fff', // White background
        borderWidth: 1.5,
        borderColor: '#ef4444', // Red border
        alignItems: 'center',
    },
    cancelText: {
        color: '#ef4444', // Red text
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
   deptHeader: {
  paddingVertical: 12,
  alignItems: 'center',
  backgroundColor: 'rgba(130, 207, 22, 0.95)',
  borderRadius: 12,
  marginBottom: 15,
}
,
deptHeaderText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#c3097f',
    textTransform: 'uppercase',
},
toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    padding: 5,
    marginBottom: 20
},
toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 20 },
toggleActive: { backgroundColor: 'white' },
toggleTextActive: { color: '#16a34a', fontWeight: 'bold' },
toggleText: { color: 'white' },

feedContainer: { backgroundColor: 'white', borderRadius: 20, padding: 15 },
feedTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#444' },
feedItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee'
},
feedItemServing: { backgroundColor: '#dcfce7', borderColor: '#22c55e', borderWidth: 2 },
feedItemMe: { borderColor: '#16a34a', borderWidth: 2, backgroundColor: '#f0fdf4' },
feedNum: { fontSize: 18, fontWeight: 'bold', color: '#333' },
feedName: { fontSize: 12, color: '#666' },
feedStatus: { fontSize: 10, fontWeight: 'bold', color: '#999' },
meBadge: { backgroundColor: '#16a34a', paddingHorizontal: 6, borderRadius: 4, marginTop: 4 },
meText: { color: 'white', fontSize: 10, fontWeight: 'bold' }


});