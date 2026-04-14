import { Stack } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AboutSmartQ = () => {
  return (
  <>
   <Stack.Screen options={{ headerTitle: 'About TMC SmartQ', headerStyle: { backgroundColor: '#0F172A' }, headerTintColor: '#FACC15', headerTitleStyle: { fontWeight: 'bold' } }} />  
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>About SmartQueue</Text>

        <Text style={styles.sectionTitle}>What is SmartQueue?</Text>
        <Text style={styles.text}>
          SmartQueue is a digital queuing system designed for TMC School to reduce long lines,
          improve efficiency, and provide a better experience for students and staff. Instead
          of waiting physically, users can join queues using their mobile devices and receive
          real-time updates.
        </Text>

        <Text style={styles.sectionTitle}>Key Features</Text>
        <Text style={styles.text}>• Join queues anytime, anywhere</Text>
        <Text style={styles.text}>• Real-time queue updates</Text>
        <Text style={styles.text}>• Estimated waiting time</Text>
        <Text style={styles.text}>• Notifications when your turn is near</Text>
        <Text style={styles.text}>• Priority lane for special cases</Text>

        <Text style={styles.sectionTitle}>How to Use</Text>
        <Text style={styles.text}>1. Log in to your SmartQueue account</Text>
        <Text style={styles.text}>2. Select the service you need</Text>
        <Text style={styles.text}>3. Tap “Join Queue”</Text>
        <Text style={styles.text}>4. Monitor your position in real-time</Text>
        <Text style={styles.text}>5. Proceed when your number is called</Text>

        <Text style={styles.sectionTitle}>Our Goal</Text>
        <Text style={styles.text}>
          Our mission is to modernize queue management in TMC School by making it faster,
          more organized, and stress-free. SmartQueue helps minimize congestion and ensures
          fair and efficient service for everyone.
        </Text>

        <Text style={styles.footer}>
          SmartQueue © 2026 • Built for TMC School
        </Text>
      </ScrollView>
    </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
     paddingHorizontal: 16,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FACC15',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 15,
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    color: '#CBD5F5',
    lineHeight: 22,
    marginBottom: 4,
  },
  footer: {
    marginTop: 30,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default AboutSmartQ;