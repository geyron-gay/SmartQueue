import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axiosClient from '../../src/api/axios';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location'; // 👈 Import this!

// 1. Helper: Distance math stays outside the component
const getPrecisionDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's Radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export default function JoinQueueScreen() {
    const [name, setName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [purpose, setPurpose] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // 📍 SET YOUR SCHOOL COORDINATES HERE
    // Right-click your school on Google Maps to get these!
    const OFFICE_LOCATION = { 
        latitude: 9.9861651582219, 
        longitude: 124.34256193209444
    }; 
    const ALLOWED_RADIUS_KM = 0.15; // 150 meters

    const handleJoin = async () => {
        // Basic Validation
        if (!name || !studentId || !purpose) {
            Alert.alert("Wait!", "Please fill in all fields");
            return;
        }

        setLoading(true);

        try {
            // --- 🛰️ GEOLOCATION CHECK START ---
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Denied", "Location access is required to join the queue.");
                setLoading(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const distance = getPrecisionDistance(
                location.coords.latitude,
                location.coords.longitude,
                OFFICE_LOCATION.latitude,
                OFFICE_LOCATION.longitude
            );

            // If user is further than 150m, block them
            if (distance > ALLOWED_RADIUS_KM) {
                const distanceInMeters = Math.round(distance * 1000);
                Alert.alert(
                    "Too Far Away! 📍",
                    `You are ${distanceInMeters}m away. You must be at the school office to join the queue.`
                );
                setLoading(false);
                return;
            }
            // --- 🛰️ GEOLOCATION CHECK END ---

            // If we reach here, the user is at the office! ✅
            const response = await axiosClient.post('/join-queue', {
                student_name: name,
                student_id: studentId,
                purpose: purpose
            });

            router.push({
                pathname: "/(tabs)/ticket",
                params: { id: response.data.id }
            });

            setName('');
            setStudentId('');
            setPurpose('');

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Check your connection or GPS settings.");
        } finally {
            setLoading(false);
        }
    };

    // ... your return/UI code ...

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            <View style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.header}>School Queue 🏫</Text>
                    <Text style={styles.subHeader}>Enter your details to get a ticket</Text>

                    <TextInput 
                        style={styles.input} 
                        placeholder="Full Name" 
                        value={name}
                        onChangeText={setName} 
                    />
                    <TextInput 
                        style={styles.input} 
                        placeholder="Student ID (e.g. 2024-0001)" 
                        value={studentId}
                        onChangeText={setStudentId} 
                    />
                    <TextInput 
                        style={styles.input} 
                        placeholder="Purpose (e.g. Registrar, Clinic)" 
                        value={purpose}
                        onChangeText={setPurpose} 
                    />

                    <TouchableOpacity 
                        style={[styles.button, loading && styles.buttonDisabled]} 
                        onPress={handleJoin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Get My Number</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    card: {
        padding: 30,
        backgroundColor: 'white',
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    header: { fontSize: 26, fontWeight: 'bold', color: '#16a34a', textAlign: 'center' },
    subHeader: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 30 },
    input: {
        backgroundColor: '#f3f4f6',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        fontSize: 16
    },
    button: {
        backgroundColor: '#16a34a',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10
    },
    buttonDisabled: { backgroundColor: '#86efac' },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});