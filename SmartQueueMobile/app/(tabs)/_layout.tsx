import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { HapticTab } from '@/components/haptic-tab';
import { Platform } from 'react-native';

const TMC_COLORS = {
  gold: '#F4B41A',
  lightGray: '#94A3B8',
  transparentNavy: 'rgba(15, 23, 42, 0.85)', // Transparent navy
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,

        tabBarActiveTintColor: TMC_COLORS.gold,
        tabBarInactiveTintColor: TMC_COLORS.lightGray,

        tabBarStyle: {
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: TMC_COLORS.transparentNavy,
          borderTopWidth: 1,
          borderTopColor: 'rgba(244, 180, 26, 0.2)',
          position: 'absolute',
          
          // Subtle shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      <Tabs.Screen
        name="Announcements"
        options={{
          title: 'News',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "megaphone" : "megaphone-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "receipt" : "receipt-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "cog" : "cog-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "person-circle" : "person-circle-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}