import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const axiosClient = axios.create({
 baseURL:'http://192.168.178.165:8090/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

axiosClient.interceptors.request.use(async (config) => {
  const authDataSerialized = await AsyncStorage.getItem('@AuthData');
  
  if (authDataSerialized) {
    const _authData = JSON.parse(authDataSerialized);
    if (_authData && _authData.token) {
      config.headers.Authorization = `Bearer ${_authData.token}`;
    } else {
      // 🛡️ Force remove header if token is missing in the object
      delete config.headers.Authorization;
    }
  } else {
    // 🛡️ Force remove header if no auth data exists at all
    delete config.headers.Authorization;
  }
  return config;
});

export default axiosClient;
