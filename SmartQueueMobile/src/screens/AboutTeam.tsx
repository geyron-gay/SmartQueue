import React from 'react';
import { View, Text, StyleSheet, Image, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter,Stack } from 'expo-router';    

const { width } = Dimensions.get('window');

// 👉 Replace these with your actual images inside assets/images
const teamMembers = [
  {
    id: '1',
    name: 'John Doe',
    role: 'Project Manager',
    image: require('../../assets/images/icon.png'),
  },
  {
    id: '2',
    name: 'Jane Smith',
    role: 'Frontend Developer',
    image: require('../../assets/images/icon.png'),
  },
  {
    id: '3',
    name: 'Michael Lee',
    role: 'Backend Developer',
    image: require('../../assets/images/icon.png'),
  },
  {
    id: '4',
    name: 'Chris Evans',
    role: 'UI/UX Designer',
    image: require('../../assets/images/icon.png'),
  },
  {
    id: '5',
    name: 'Sarah Kim',
    role: 'QA Tester',
    image: require('../../assets/images/icon.png'),
  },
];

const AboutTeam = () => {
  const renderItem = ({ item }: { item: typeof teamMembers[0] }) => (
    <View style={styles.card}>
      <Image source={item.image} style={styles.image} />
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.role}>{item.role}</Text>
    </View>
  );

  return (
    <>
    <Stack.Screen options={{ headerTitle: 'About Our Team', headerStyle: { backgroundColor: '#0F172A' }, headerTintColor: '#FACC15', headerTitleStyle: { fontWeight: 'bold' } }} />  
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Meet Our Team</Text>
      <Text style={styles.subtitle}>
        Dedicated developers behind SmartQueue
      </Text>

      <FlatList
        data={teamMembers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FACC15',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#CBD5F5',
    marginBottom: 20,
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    width: width * 0.44,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  role: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

export default AboutTeam;
