import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import axiosClient from './src/api/axios'; // Adjust path

export default function JoinQueueScreen() {
    const [name, setName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [purpose, setPurpose] = useState('');

    const handleJoin = async () => {
        try {
            const response = await axiosClient.post('/join-queue', {
                student_name: name,
                student_id: studentId,
                purpose: purpose
            });
            Alert.alert("Success!", `Your Number is #${response.data.queue_number}`);
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Could not connect to the server.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Join School Queue 🎓</Text>
            <TextInput style={styles.input} placeholder="Full Name" onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Student ID" onChangeText={setStudentId} />
            <TextInput style={styles.input} placeholder="Purpose (e.g. Registrar)" onChangeText={setPurpose} />
            <Button title="Get Queue Number" onPress={handleJoin} color="#16a34a" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 40, flex: 1, justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { borderBottomWidth: 1, marginBottom: 20, padding: 10 }
});