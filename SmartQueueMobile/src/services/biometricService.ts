import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIO_EMAIL_KEY = 'user_email';
const BIO_PASS_KEY = 'user_password';
const BIO_ENABLED_KEY = 'biometrics_enabled';

export const biometricService = {
  // 1. Check if the phone is even capable
  async isHardwareSupported() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  // 2. The "Ceremony" - Show the fingerprint prompt
  async authenticate() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to enable Fingerprint Login',
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
    });
    return result.success;
  },

  // 3. Save credentials to the Encrypted Vault
  async saveCredentials(email: string, password: string) {
    await SecureStore.setItemAsync(BIO_EMAIL_KEY, email);
    await SecureStore.setItemAsync(BIO_PASS_KEY, password);
    await SecureStore.setItemAsync(BIO_ENABLED_KEY, 'true');
  },

  // 4. Get credentials out of the Vault
  async getStoredCredentials() {
    const email = await SecureStore.getItemAsync(BIO_EMAIL_KEY);
    const password = await SecureStore.getItemAsync(BIO_PASS_KEY);
    const enabled = await SecureStore.getItemAsync(BIO_ENABLED_KEY);
    
    if (enabled === 'true' && email && password) {
      return { email, password };
    }
    return null;
  },

  // 5. Clear everything (When they logout or disable it)
  async clearCredentials() {
    await SecureStore.deleteItemAsync(BIO_EMAIL_KEY);
    await SecureStore.deleteItemAsync(BIO_PASS_KEY);
    await SecureStore.deleteItemAsync(BIO_ENABLED_KEY);
  }
};