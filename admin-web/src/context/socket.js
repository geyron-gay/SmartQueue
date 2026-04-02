import { io } from "socket.io-client";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://192.168.112.165:3000'

export const initializeSocket = () => {
 
  const token = localStorage.getItem('userToken'); 
  
  const socket = io(SOCKET_URL, {
    auth: {
      token: token
    },
    transports: ['websocket'] 
  });

  socket.on("connect", () => {
    console.log("✅ Web App: Connected to WebSocket!");
  });

  socket.on("connect_error", (err) => {
    console.log("❌ Web App: Connection Error:", err.message);
  });

  return socket;
};