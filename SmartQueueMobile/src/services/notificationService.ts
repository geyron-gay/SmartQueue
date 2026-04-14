import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

class NotificationService {
    async requestPermissions() {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
    }

    async setupAndroidChannel() {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('sticky-queue', {
                name: 'Sticky Queue',
                importance: Notifications.AndroidImportance.MAX,
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                sound: 'default',
                bypassDnd: true,
            });
        }
    }

async updateStickyQueueNotification(
    queueNumber: string, 
    status: string, 
    peopleAhead: number, 
    estTime: number, 
    isInitialJoin: boolean
) {
    await this.setupAndroidChannel(); 

    let title = 'Queue Status';
    let body = `Ticket #${queueNumber}`;
    let notificationColor = '#3b82f6'; 

    const lowerStatus = status.toLowerCase();

    if (lowerStatus === 'serving' || lowerStatus === 'calling') {
        title = '🔔 YOUR TURN!';
        body = `Ticket #${queueNumber} is being called! Please proceed to the counter.`;
        notificationColor = '#ef4444'; 
    } 
    else if (lowerStatus === 'completed' || lowerStatus === 'done') {
        title = '✅ Transaction Finished';
        body = `Ticket #${queueNumber} has been served. Thank you!`;
        notificationColor = '#22c55e';
    }
    else if (lowerStatus === 'cancelled') {
        title = '❌ Ticket Cancelled';
        body = `Ticket #${queueNumber} was removed from the queue.`;
        notificationColor = '#64748b';
    }
  
    else if (isInitialJoin) {
        title = '🎫 Ticket Secured';
        body = peopleAhead === 0 
            ? `You are next in line! Head to the counter.` 
            : `You are #${queueNumber}. ${peopleAhead} students ahead.`;
        notificationColor = '#22c55e';
    } 
    else {
        title = peopleAhead === 0 ? '🚀 You\'re Next!' : 'Queue Update';
        body = peopleAhead === 0 
            ? `You are now #1! Please stay nearby.` 
            : `Ticket #${queueNumber} | ${peopleAhead} ahead | Est: ${estTime}m`;
    }

    try {
        await Notifications.scheduleNotificationAsync({
            identifier: `ticket-${queueNumber}-${Date.now()}`,
            content: {
                title,
                body,
                data: { queueNumber, status },
                android: {
                    channelId: 'sticky-queue',
                    sticky: lowerStatus !== 'completed' && lowerStatus !== 'cancelled',
                    color: notificationColor,
                   ongoing: lowerStatus !== 'completed' && lowerStatus !== 'cancelled',
                    vibrationPattern: (lowerStatus === 'serving') ? [0, 500, 200, 500] : [0, 250, 250, 250],
                }
            } as any,
            trigger: null, 
        });
    } catch (error) {
        console.error("❌ Notification Error:", error);
    }
}


async sendBroadcastNotification(message: string, type: string) {
    const icons = {
        info: 'ℹ️',
        warning: '⚠️',
        emergency: '🚨'
    };

    await Notifications.scheduleNotificationAsync({
        content: {
            title: `${icons[type as keyof typeof icons] || '📢'} Announcement`,
            body: message,
            data: { type: 'broadcast' },
            // Not sticky, we want them to be able to swipe announcements
            android: {
                channelId: 'broadcast-channel', // Create a separate channel for this
                color: type === 'emergency' ? '#ef4444' : '#3b82f6',
            }
        }as any,
        trigger: null,
    });
}

}

export const notificationService = new NotificationService();