import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, RefreshControl, 
  TouchableOpacity, Modal 
} from 'react-native';
import axiosClient from '../../src/api/axios';
import { format } from 'date-fns';
import QRCode from 'react-native-qrcode-svg'; 
import echo from '../../src/api/echo';
import { initializeSocket } from '../../src/context/socket';

interface HistoryItem {
  id: number;
  department: string;
  purpose: string;
  queue_number: number;
  status: string;
  student_id: string;
  created_at: string;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<HistoryItem | null>(null);

  const fetchHistory = async () => {
    try {
      const response = await axiosClient.get('/my-history');
      setHistory(response.data);
    } catch (error) {
      console.error("History Error:", error);
    }
  };

useEffect(() => {
    fetchHistory();

    let socket: any;

    const setupSocket = async () => {
        socket = await initializeSocket();

        // Listen for the event emitted by your Node.js server
        socket.on('QueueUpdated', (data: any) => {
            console.log("📢 Real-time update from Private Socket!", data);
            fetchHistory(); 
        });
    };

    setupSocket();

    return () => {
        if (socket) socket.disconnect();
    };
}, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return { bg: '#dcfce7', text: '#166534' };
      case 'pending': return { bg: '#fef9c3', text: '#854d0e' };
      case 'cancelled': return { bg: '#fee2e2', text: '#991b1b' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const handleDownloadReceipt = (ticket: HistoryItem | null) => {
    if (!ticket) return;
    // TODO: implement receipt download/share logic
    console.log("Downloading receipt for ticket:", ticket.id);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Transactions</Text>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No transactions yet.</Text>}
        renderItem={({ item }) => {
          const status = getStatusStyle(item.status);
          return (
            <TouchableOpacity style={styles.card} onPress={() => setSelectedTicket(item)}>
              <View style={styles.cardTop}>
                <Text style={styles.dept}>{item.department}</Text>
                <View style={[styles.badge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.badgeText, { color: status.text }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.purpose}>Purpose: {item.purpose}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.date}>
                  {format(new Date(item.created_at), 'MMM dd, yyyy • hh:mm a')}
                </Text>
                <Text style={styles.qNumber}>#{item.queue_number}</Text>
              </View>
              <Text style={styles.tapNote}>Tap to view QR & Receipt</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* 🎟️ Ticket Modal */}
      <Modal visible={!!selectedTicket} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verification Ticket</Text>

            {selectedTicket && (
              <View style={styles.qrContainer}>
                <QRCode 
                  value={`TICKET-${selectedTicket.id}-${selectedTicket.student_id}`}
                  size={180}
                  color="#16a34a"
                />
                <Text style={styles.qrSub}>Show this to the Staff</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.label}>Transaction ID:</Text>
              <Text style={styles.value}>#{selectedTicket?.id}</Text>
            </View>

            <TouchableOpacity 
              style={styles.downloadBtn} 
              onPress={() => handleDownloadReceipt(selectedTicket)}
            >
              <Text style={styles.downloadText}>Download/Share Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedTicket(null)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 40, color: '#1e293b' },
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 15, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dept: { fontSize: 18, fontWeight: 'bold', color: '#334155' },
  purpose: { fontSize: 15, color: '#64748b', marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  date: { fontSize: 12, color: '#94a3b8' },
  qNumber: { fontSize: 14, fontWeight: 'bold', color: '#16a34a' },
  tapNote: { fontSize: 12, color: '#16a34a', marginTop: 8, textAlign: 'center' },
  empty: { textAlign: 'center', marginTop: 50, color: '#94a3b8' },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 20, width: '90%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#1e293b' },
  qrContainer: { alignItems: 'center', marginBottom: 20 },
  qrSub: { marginTop: 10, fontSize: 12, color: '#64748b' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
  value: { fontSize: 14, color: '#374151' },
  downloadBtn: { backgroundColor: '#16a34a', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginBottom: 10 },
  downloadText: { color: '#fff', fontWeight: '600' },
  closeBtn: { backgroundColor: '#ef4444', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  closeText: { color: '#fff', fontWeight: '600' },
});