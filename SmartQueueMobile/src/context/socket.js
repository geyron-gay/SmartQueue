import { io } from "socket.io-client";
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = "http://192.168.137.252:3000"; // Replace with your WebSocket server URL

export const initializeSocket = async () => {
  const token = await AsyncStorage.getItem('userToken'); // Get your login token
  
  const socket = io(SOCKET_URL, {
    auth: {
      token: token
    },
    transports: ['websocket'] 
  });

  socket.on("connect", () => {
    //console.log("✅ Connected to Private WebSocket Server!");
  });

  socket.on("connect_error", (err) => {
    console.log("❌ Connection Error:", err.message);
  });

  return socket;
};