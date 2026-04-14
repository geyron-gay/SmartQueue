import { io } from "socket.io-client";
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = 'http://192.168.178.165:3000';

export const initializeSocket = async () => {
  const token = await AsyncStorage.getItem('userToken');
  
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