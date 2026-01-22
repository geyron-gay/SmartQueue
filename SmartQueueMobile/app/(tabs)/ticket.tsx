import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axiosClient from '../../src/api/axios';
import { Vibration } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { SafeAreaView } from 'react-native-safe-area-context';
import echo from '../../src/api/echo';

// The Blueprint
interface TicketData {
    ticket: {
        id: number;
        queue_number: number;
        status: string;
        student_name: string;
    };
    people_ahead: number;
    now_serving: number | string;
    estimated_wait_time: number; // 👈 Add this line
}

export default function Ticket() {
    const { id } = useLocalSearchParams<{ id: string }>(); 
    const router = useRouter();
    const [data, setData] = useState<TicketData | null>(null); // Use the blueprint
    const [loading, setLoading] = useState(true);
    const [hasNotified, setHasNotified] = useState(false);
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
            const response = await axiosClient.get(`/queues/status/${id}`);
            setData(response.data);
        } catch (error) {
            console.error("Status check failed", error);
        } finally {
            setLoading(false);
        }
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

    console.log("👂 Listening for: .QueueUpdated on queue-channel");
    
    const channel = echo.channel('queue-channel');

    // 1. Listen with the DOT (This is the most common fix for broadcastAs)
    channel.listen('.QueueUpdated', (e: any) => { 
        console.log('⚡ SIGNAL RECEIVED (.QueueUpdated)!', e);
        fetchStatus(); 
    });

    // 2. Listen without the dot (Just in case)
    channel.listen('QueueUpdated', (e: any) => { 
        console.log('⚡ SIGNAL RECEIVED (QueueUpdated)!', e);
        fetchStatus(); 
    });

    return () => {
        console.log("👋 Leaving channel");
        echo.leaveChannel('queue-channel');
    };
}, [id]);


    if (loading) return <ActivityIndicator size="large" style={{flex:1}} />;

    const isServing = data?.ticket?.status === 'serving';

    return (
        <View style={styles.container}>

            {/* New "Now Serving" Header */}
        <View style={styles.nowServingHeader}>
            <Text style={styles.nowServingLabel}>NOW SERVING</Text>
            <Text style={styles.nowServingNumber}>
                {data?.now_serving !== 'None' ? `#${data?.now_serving}` : '---'}
            </Text>
        </View>

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
// Inside your return statement, where the waitingBox is:
<View style={styles.waitingBox}>
    <View style={styles.timeCard}>
        <View style={styles.timeHeader}>
             <Text style={styles.clockIcon}>🕒</Text>
             <Text style={styles.timeLabel}>ESTIMATED WAIT</Text>
        </View>
        
        <Text style={styles.timeValue}>
            {data?.estimated_wait_time} 
            <Text style={styles.minsLabel}> mins</Text>
        </Text>

        {/* 🏆 THE CHERRY ON TOP: PROGRESS BAR */}
       <View style={styles.progressContainer}>
  <View
    style={[
      styles.progressBar,
      {
        width: `${Math.min(
          100,
          ((data?.estimated_wait_time ?? 0) / 60) * 100
        )}%`,
      },
    ]}
  />
</View>
        <Text style={styles.progressText}>
            {data?.people_ahead === 1 ? 'You are next!' : 'Stay close to the counter'}
        </Text>
    </View>

    <View style={styles.dividerSmall} />

    <Text style={styles.positionNumber}>{data?.people_ahead}</Text>
    <Text style={styles.waitingText}>People ahead of you</Text>
    <Text style={styles.statusBadge}>Status: {data?.ticket?.status.toUpperCase()}</Text>
</View>
)}
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={() => router.replace('/')}>
                <Text style={styles.cancelText}>Exit Queue</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#16a34a', justifyContent: 'center', padding: 20 },


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
    cancelButton: { marginTop: 30, alignItems: 'center' },
    cancelText: { color: 'white', fontWeight: 'bold', textDecorationLine: 'underline' }


});