import axios from 'axios';

const axiosClient = axios.create({
  // Use the IP address consistently
  baseURL: 'http://192.168.137.88:8000/api', 
  withCredentials: true,
  withXSRFToken: true, 
  headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
  },
});

export default axiosClient;