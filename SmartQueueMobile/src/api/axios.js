import axios from 'axios';

const axiosClient = axios.create({
    baseURL: `http://192.168.137.88:8000/api`, // 👈 REPLACE WITH YOUR IP!
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

export default axiosClient;