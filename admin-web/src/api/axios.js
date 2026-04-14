import axios from 'axios';

const axiosClient = axios.create({
  // Use the IP address consistently
  baseURL: import.meta.env.VITE_API_URL || 'http://192.168.178.165:8090/api',
  withCredentials: true,
  withXSRFToken: true, 
  headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
  },
});

export default axiosClient;