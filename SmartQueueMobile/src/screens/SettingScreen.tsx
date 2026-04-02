import React, { useEffect, useState } from 'react';
import { 
  View, Text, Switch, Alert, StyleSheet, SafeAreaView, 
  TouchableOpacity, Platform, Modal, TextInput , StatusBar // Add Modal and TextInput
} from 'react-native';
import { biometricService } from '../services/biometricService';
import { useAuth } from '../context/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const COLORS = {
    navy: '#0B1F3A',
    navyLight: '#1A3658',
    gold: '#D4A017',
    white: '#FFFFFF',
    gray: '#8A9BB0',
    border: 'rgba(212,160,23,0.15)',
    danger: '#EF4444'
};

export default function SettingsScreen() {
  const { user, logout } = useAuth(); // Assuming logout exists in your context
  const [isSupported, setIsSupported] = useState(false);
  const [isBioEnabled, setIsBioEnabled] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function checkDevice() {
      const hasHardware = await biometricService.isHardwareSupported();
      setIsSupported(hasHardware);

      const saved = await biometricService.getStoredCredentials();
      setIsBioEnabled(!!saved);
    }
    checkDevice();
  }, []);

  const handleToggleBiometrics = async (value: boolean) => {
    if (value) {
      const success = await biometricService.authenticate();
      if (success) {
        // Instead of Alert.prompt, we open our Custom Modal
        setIsModalVisible(true);
      } else {
        setIsBioEnabled(false);
      }
    } else {
      await biometricService.clearCredentials();
      setIsBioEnabled(false);
    }
  };

  const saveBioWithPassword = async () => {
    if (confirmPassword.length > 0) {
      await biometricService.saveCredentials(user.email, confirmPassword);
      setIsBioEnabled(true);
      setIsModalVisible(false); // Close Modal
      setConfirmPassword(''); // Clear state
      Alert.alert("Success", "Fingerprint login is now active!");
    } else {
      Alert.alert("Error", "Please enter your password.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account Settings</Text>
      </View>

      <View style={styles.content}>
        
        {/* Profile Summary Card */}
        <View style={styles.profileCard}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
            </View>
            <View>
                <Text style={styles.userName}>{user?.name || 'TMC Student'}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
        </View>

        <Text style={styles.sectionTitle}>Security</Text>

        {/* Biometric Setting Row */}
        <View style={styles.settingsCard}>
            <View style={styles.row}>
                <View style={styles.iconCircle}>
                    <Ionicons name="finger-print" size={22} color={COLORS.gold} />
                </View>
                <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>Biometric Login</Text>
                    <Text style={styles.rowSubLabel}>
                        {isSupported ? 'Use fingerprint for quick access' : 'Not supported on this device'}
                    </Text>
                </View>
                {isSupported && (
                    <Switch
                        value={isBioEnabled}
                        onValueChange={handleToggleBiometrics}
                        trackColor={{ false: '#3E3E3E', true: COLORS.gold }}
                        thumbColor={isBioEnabled ? COLORS.white : '#f4f3f4'}
                    />
                )}
            </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <MaterialIcons name="logout" size={20} color={COLORS.danger} />
            <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

      </View>
      
      <Text style={styles.version}>TMC SmartQ v1.0.0</Text>
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm Password</Text>
            <Text style={styles.modalSubTitle}>Enter your password to enable Biometrics</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Your Password"
              placeholderTextColor="#8A9BB0"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => {
                  setIsModalVisible(false);
                  setIsBioEnabled(false);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.confirmBtn} 
                onPress={saveBioWithPassword}
              >
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  content: {
    padding: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navyLight,
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.navy,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },
  settingsCard: {
    backgroundColor: COLORS.navyLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212,160,23,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.white,
  },
  rowSubLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  logoutText: {
    color: COLORS.danger,
    fontWeight: '600',
    marginLeft: 8,
  },
  version: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    color: COLORS.gray,
    fontSize: 12,
  }
  ,
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)', // Dim the background
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1A3658', // navyLight
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.3)', // gold border
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  modalSubTitle: {
    fontSize: 14,
    color: '#8A9BB0',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 15,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.2)',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  cancelBtn: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  cancelText: {
    color: '#8A9BB0',
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#D4A017', // gold
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: {
    color: '#0B1F3A', // navy
    fontWeight: 'bold',
  },

});