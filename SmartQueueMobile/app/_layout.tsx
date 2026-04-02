import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,      // Still keep this for older versions
    shouldPlaySound: true,
    shouldSetBadge: false,
    // 🔥 NEW PROPERTIES REQUIRED BY TYPESCRIPT:
    shouldShowBanner: true,    // Shows the drop-down at the top
    shouldShowList: true,      // Shows it in the notification tray
  }),
});

function InitialLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

useEffect(() => {

    if (loading) return;



    const rootSegment = segments[0] as any;

   

    // 1. Identify where the user is

    const inTabsGroup = rootSegment === '(tabs)';

    const inAuthGroup = rootSegment === '(auth)';

   

    // 🔥 NEW: Check if the user is on the password reset screen

    const isResettingPassword = rootSegment === 'password-reset';



    // 2. The Bouncer Logic

    if (!user && inTabsGroup) {

        // Redirect to Login if trying to access Tabs without auth

        router.replace('/Login' as any);

    }

    else if (user && (inAuthGroup || !rootSegment)) {

        // Redirect to Tabs if logged in but trying to access Login/Register

        router.replace('/(tabs)' as any);

    }

    // 🚀 If isResettingPassword is true, we do NOTHING.

    // We let the user stay on that screen!



}, [user, loading, segments]);



// AND ADD THE SCREEN TO YOUR STACK BELOW:

return (

  <Stack>

    <Stack.Screen name="(auth)/Login" options={{ headerShown: false }} />

    <Stack.Screen name="(auth)/Register" options={{ headerShown: false }} />

    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

    <Stack.Screen name="main/Ticket" options={{ headerShown: false }} />

  </Stack>
);

}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayoutNav />
    </AuthProvider>
  );
}