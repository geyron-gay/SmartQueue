// services/notificationService.ts
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

    async updateStickyQueueNotification(queueNumber: string, status: string, peopleAhead: number, estTime: number) {
        console.log("🔥 [DEBUG] SCHEDULING NOTIFICATION FOR:", queueNumber);
        // 1. ENSURE CHANNEL EXISTS
        await this.setupAndroidChannel(); 
try{
        await Notifications.scheduleNotificationAsync({
            identifier: 'sticky-queue-notification',
            content: {
                title: 'Your Queue Status',
                body: `Ticket: ${queueNumber} | Status: ${status} | Ahead: ${peopleAhead} | Est: ${estTime} mins`,
                priority: Notifications.AndroidNotificationPriority.MAX,
                sticky: true,
                autoDismiss: false,
                // 🔥 ADD THIS FOR ANDROID TO SHOW THE ICON
                data: { queueNumber }, 
            },
            trigger: null, // 👈 2. Change from channelId to null for immediate sending
        });
        console.log("🔥 [DEBUG] SCHEDULE SUCCESSFUL");
} catch (error) {
    console.error("❌ [ERROR] Failed to schedule notification:", error);
    }
    }
    async removeStickyNotification() {
        await Notifications.dismissNotificationAsync('sticky-queue-notification');
    }
}

export const notificationService = new NotificationService();