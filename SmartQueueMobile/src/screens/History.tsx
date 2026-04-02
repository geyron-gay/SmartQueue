import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, StyleSheet, RefreshControl, 
  TouchableOpacity, Modal 
} from 'react-native';
import axiosClient from '../api/axios';
import { format } from 'date-fns';
import QRCode from 'react-native-qrcode-svg'; 
import { initializeSocket } from '../context/socket';

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

  // ─────────────────────────────────────────────────────────────────────────────
// REPLACE ONLY YOUR return() BLOCK AND styles = StyleSheet.create({}) WITH THIS.
// All imports, interfaces, hooks, handlers above are COMPLETELY UNCHANGED.
// ─────────────────────────────────────────────────────────────────────────────

  // ── Derived stats ──
  const completedCount = history.filter(h => h.status === 'completed').length;
  const cancelledCount = history.filter(h => h.status === 'cancelled').length;
  const pendingCount   = history.filter(h => h.status === 'pending').length;

  return (
    <View style={styles.root}>

      {/* ── HERO HEADER ── */}
      <View style={styles.hero}>
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />

        <View style={styles.heroInner}>
          <View>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>🏫 Trinidad Municipal College</Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>My Transactions</Text>
            <Text style={styles.heroSub}>Queue history &amp; verification receipts</Text>
          </View>
        </View>

        {/* Gold accent line */}
        <View style={styles.heroDivider} />

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{history.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#4ade80' }]}>{completedCount}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#fca5a5' }]}>{cancelledCount}</Text>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#fcd34d' }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </View>

      {/* ── LIST ── */}
      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
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
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySub}>Your queue history will appear here.</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const s = getStatusStyle(item.status);
          const isCompleted = item.status === 'completed';
          const isCancelled = item.status === 'cancelled';

          return (
            <TouchableOpacity
              style={[
                styles.card,
                isCancelled && styles.cardCancelled,
              ]}
              onPress={() => setSelectedTicket(item)}
              activeOpacity={0.82}
            >
              {/* Top color accent bar */}
              <View style={[
                styles.cardAccent,
                isCompleted && styles.cardAccentDone,
                isCancelled && styles.cardAccentCancelled,
              ]} />

              <View style={styles.cardInner}>
                {/* Row 1: dept + status badge */}
                <View style={styles.cardRow1}>
                  <View style={styles.cardIconWrap}>
                    <Text style={styles.cardIcon}>🏛️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardDept} numberOfLines={1}>{item.department}</Text>
                    <Text style={styles.cardPurpose} numberOfLines={1}>{item.purpose}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statusPillText, { color: s.text }]}>
                      {item.status === 'completed' ? '✓ DONE'
                        : item.status === 'cancelled' ? '✕ CANCELLED'
                        : item.status === 'noshow' ? '✕ wa nagpakita' 
                        : '⏳ PENDING'}
                    </Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.cardDivider} />

                {/* Row 2: ticket # + date + QR hint */}
                <View style={styles.cardRow2}>
                  <View>
                    <Text style={styles.cardDateLabel}>Date &amp; Time</Text>
                    <Text style={styles.cardDate}>
                      {format(new Date(item.created_at), 'MMM dd, yyyy · hh:mm a')}
                    </Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.cardTicketNum}>#{item.queue_number}</Text>
                    <Text style={styles.cardQRHint}>Tap for QR →</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* ── MODAL ── */}
      <Modal
        visible={!!selectedTicket}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedTicket(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>

            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}>
                <Text style={{ fontSize: 22 }}>🎟️</Text>
              </View>
              <View>
                <Text style={styles.modalTitle}>Verification Ticket</Text>
                <Text style={styles.modalSub}>{selectedTicket?.department}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseX}
                onPress={() => setSelectedTicket(null)}
              >
                <Text style={styles.modalCloseXText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            {/* QR Code section */}
            {selectedTicket && (
              <View style={styles.qrSection}>
                <View style={styles.qrFrame}>
                  {/* Corner decorations */}
                  <View style={[styles.qrCorner, styles.qrCornerTL]} />
                  <View style={[styles.qrCorner, styles.qrCornerTR]} />
                  <View style={[styles.qrCorner, styles.qrCornerBL]} />
                  <View style={[styles.qrCorner, styles.qrCornerBR]} />

                  <QRCode
                    value={`TICKET-${selectedTicket.id}-${selectedTicket.student_id}`}
                    size={170}
                    color="#1a3a6b"
                    backgroundColor="#ffffff"
                  />
                </View>
                <Text style={styles.qrLabel}>Show this QR to the staff</Text>
                <View style={styles.qrTicketBadge}>
                  <Text style={styles.qrTicketNum}>Ticket #{selectedTicket.queue_number}</Text>
                </View>
              </View>
            )}

            {/* Info rows */}
            <View style={styles.infoGrid}>
              <View style={styles.infoCell}>
                <Text style={styles.infoCellLabel}>Transaction ID</Text>
                <Text style={styles.infoCellValue}>#{selectedTicket?.id}</Text>
              </View>
              <View style={styles.infoCellSep} />
              <View style={styles.infoCell}>
                <Text style={styles.infoCellLabel}>Status</Text>
                <Text style={[
                  styles.infoCellValue,
                  selectedTicket?.status === 'completed' && { color: '#16a34a' },
                  selectedTicket?.status === 'cancelled' && { color: '#dc2626' },
                ]}>
                  {selectedTicket?.status?.toUpperCase()}
                </Text>
              </View>
              <View style={styles.infoCellSep} />
              <View style={styles.infoCell}>
                <Text style={styles.infoCellLabel}>Date</Text>
                <Text style={styles.infoCellValue}>
                  {selectedTicket ? format(new Date(selectedTicket.created_at), 'MMM dd') : '—'}
                </Text>
              </View>
            </View>

            {/* Purpose row */}
            <View style={styles.purposeRow}>
              <Text style={styles.purposeRowLabel}>Purpose</Text>
              <Text style={styles.purposeRowValue}>{selectedTicket?.purpose}</Text>
            </View>

            {/* Action buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={() => handleDownloadReceipt(selectedTicket)}
                activeOpacity={0.85}
              >
                <Text style={styles.downloadBtnText}>📥 Download Receipt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedTicket(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES ← paste this entire block as your StyleSheet.create({...})
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

    /* ── Root ── */
    root: {
        flex: 1,
        backgroundColor: '#f8f9fc',
    },

    /* kept for backward compat */
    container: {
        flex: 1,
        backgroundColor: '#f8f9fc',
    },

    /* ── Hero Header ── */
    hero: {
        backgroundColor: '#1a3a6b',
        paddingTop: 56,
        paddingBottom: 0,
        overflow: 'hidden',
        position: 'relative',
    },

    heroCircle1: {
        position: 'absolute',
        width: 220, height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(245,197,24,0.06)',
        top: -70, right: -50,
    },

    heroCircle2: {
        position: 'absolute',
        width: 140, height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.03)',
        top: 20, left: -30,
    },

    heroInner: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        zIndex: 1,
    },

    heroBadgeRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },

    heroBadge: {
        backgroundColor: 'rgba(245,197,24,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(245,197,24,0.25)',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },

    heroBadgeText: {
        color: '#f5c518',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    heroTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -0.5,
        marginBottom: 4,
    },

    heroSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '500',
    },

    /* kept for backward compat */
    header: {
        fontSize: 24,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -0.5,
    },

    heroDivider: {
        height: 2,
        backgroundColor: '#f5c518',
        width: 36,
        borderRadius: 2,
        marginLeft: 20,
        marginBottom: 16,
    },

    /* ── Stats strip (inside hero) ── */
    statsStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingVertical: 14,
        paddingHorizontal: 20,
    },

    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },

    statValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -0.5,
    },

    statLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.45)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    statSep: {
        width: 1,
        height: 28,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },

    /* ── List ── */
    listContent: {
        padding: 16,
        paddingTop: 18,
        paddingBottom: 40,
        flexGrow: 1,
    },

    /* ── Empty state ── */
    emptyWrap: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 8,
    },

    emptyIcon: { fontSize: 40, opacity: 0.3, marginBottom: 4 },

    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#475569',
    },

    emptySub: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: '500',
    },

    /* kept for backward compat */
    empty: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 14,
        marginTop: 40,
    },

    /* ── Card ── */
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#1a3a6b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },

    cardCancelled: {
        opacity: 0.7,
    },

    cardAccent: {
        height: 3,
        backgroundColor: '#1a3a6b',
    },

    cardAccentDone:      { backgroundColor: '#16a34a' },
    cardAccentCancelled: { backgroundColor: '#dc2626' },

    cardInner: {
        padding: 14,
    },

    cardRow1: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },

    cardIconWrap: {
        width: 40, height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(26,58,107,0.07)',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },

    cardIcon: { fontSize: 18 },

    cardDept: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f1f3d',
        letterSpacing: -0.2,
        marginBottom: 2,
    },

    /* kept for backward compat */
    dept: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f1f3d',
    },

    cardPurpose: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '500',
    },

    /* kept for backward compat */
    purpose: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 10,
    },

    statusPill: {
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 20,
        flexShrink: 0,
    },

    statusPillText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.4,
    },

    /* kept for backward compat */
    badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },

    cardDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginBottom: 10,
    },

    cardRow2: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    /* kept for backward compat */
    cardBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },

    cardDateLabel: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: '#94a3b8',
        marginBottom: 2,
    },

    cardDate: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '600',
    },

    /* kept for backward compat */
    date: { fontSize: 11, color: '#475569', fontWeight: '600' },

    cardRight: { alignItems: 'flex-end', gap: 2 },

    cardTicketNum: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1a3a6b',
        letterSpacing: -0.5,
    },

    /* kept for backward compat */
    qNumber: { fontSize: 18, fontWeight: '900', color: '#1a3a6b', letterSpacing: -0.5 },

    cardQRHint: {
        fontSize: 10,
        color: '#2563b0',
        fontWeight: '700',
    },

    /* kept for backward compat */
    tapNote: { fontSize: 10, color: '#2563b0', fontWeight: '700', textAlign: 'right', marginTop: 2 },

    /* ── Modal ── */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(10,20,40,0.75)',
        justifyContent: 'flex-end',
    },

    modalSheet: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 24,
    },

    /* kept for backward compat */
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },

    modalHandle: {
        width: 40, height: 4,
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 18,
    },

    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 24,
        marginBottom: 16,
    },

    modalHeaderIcon: {
        width: 46, height: 46,
        borderRadius: 13,
        backgroundColor: 'rgba(26,58,107,0.07)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    modalTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0f1f3d',
        letterSpacing: -0.2,
    },

    modalSub: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
        marginTop: 1,
    },

    modalCloseX: {
        marginLeft: 'auto',
        width: 30, height: 30,
        borderRadius: 15,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },

    modalCloseXText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },

    modalDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginHorizontal: 24,
        marginBottom: 20,
    },

    /* ── QR Section ── */
    qrSection: {
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 20,
    },

    qrFrame: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        shadowColor: '#1a3a6b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        position: 'relative',
        marginBottom: 12,
    },

    /* QR corner decorators */
    qrCorner: {
        position: 'absolute',
        width: 18, height: 18,
        borderColor: '#1a3a6b',
    },
    qrCornerTL: { top: 8, left: 8, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
    qrCornerTR: { top: 8, right: 8, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
    qrCornerBL: { bottom: 8, left: 8, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
    qrCornerBR: { bottom: 8, right: 8, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },

    /* kept for backward compat */
    qrContainer: {
        alignItems: 'center',
        paddingVertical: 16,
    },

    qrLabel: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
        marginBottom: 8,
    },

    /* kept for backward compat */
    qrSub: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
        marginTop: 10,
    },

    qrTicketBadge: {
        backgroundColor: 'rgba(26,58,107,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(26,58,107,0.14)',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 5,
    },

    qrTicketNum: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1a3a6b',
        letterSpacing: -0.2,
    },

    /* ── Info grid ── */
    infoGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 24,
        backgroundColor: '#f8f9fc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingVertical: 14,
        marginBottom: 10,
    },

    infoCell: {
        flex: 1,
        alignItems: 'center',
        gap: 3,
    },

    infoCellSep: {
        width: 1,
        height: 28,
        backgroundColor: '#e2e8f0',
    },

    infoCellLabel: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: '#94a3b8',
    },

    infoCellValue: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1a3a6b',
    },

    /* kept for backward compat */
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 8,
    },
    label: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
    value: { fontSize: 13, fontWeight: '800', color: '#1a3a6b' },

    purposeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 24,
        backgroundColor: '#f8f9fc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 20,
    },

    purposeRowLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    purposeRowValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0f1f3d',
        maxWidth: '65%',
        textAlign: 'right',
    },

    /* ── Modal action buttons ── */
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 24,
    },

    downloadBtn: {
        flex: 2,
        backgroundColor: '#1a3a6b',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        shadowColor: '#1a3a6b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
        elevation: 5,
    },

    downloadBtnText: {
        color: '#ffffff',
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: 0.2,
    },

    /* kept for backward compat */
    downloadText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },

    closeBtn: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },

    closeBtnText: {
        color: '#475569',
        fontWeight: '700',
        fontSize: 14,
    },

    /* kept for backward compat */
    closeText: { color: '#475569', fontWeight: '700', fontSize: 14 },
});