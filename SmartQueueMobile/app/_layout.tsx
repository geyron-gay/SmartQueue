import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function InitialLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

useEffect(() => {
    if (loading) return;

    const rootSegment = segments[0] as any;
    
    // Check if user is trying to access the protected tabs
    const inTabsGroup = rootSegment === '(tabs)';
    
    // Check if user is currently on the login or register screens
    // Since they are in (auth), segments[0] will be "(auth)"
    // and segments[1] will be the filename
    const inAuthGroup = rootSegment === '(auth)';

    if (!user && inTabsGroup) {
      // 🛑 Not logged in? Go to the Login file inside the (auth) group
      // If your file is Register.tsx, the path is just '/Register'
      router.replace('/Login' as any); 
    } 
    else if (user && (inAuthGroup || rootSegment === 'index' || !rootSegment)) {
      // ✅ Logged in? Skip Login/Register and go to the tabs
      router.replace('/(tabs)' as any);
    }
}, [user, loading, segments]);

  return (
    <Stack>

  {/* The name here must match the folder/file structure */}
  <Stack.Screen name="(auth)/Login" options={{ headerShown: false }} />
  <Stack.Screen name="(auth)/Register" options={{ headerShown: false }} />
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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