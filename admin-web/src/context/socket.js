import { io } from "socket.io-client";

// In Web, we use the standard localStorage
const SOCKET_URL = "http://192.168.137.252:3000"; 

export const initializeSocket = () => {
  // Browsers don't need 'await' for localStorage
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