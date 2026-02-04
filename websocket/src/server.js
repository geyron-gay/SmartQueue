const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// CHANGED THESE: removed the "./src" because server.js is ALREADY in src
const { subRedis } = require('./config/redis'); 
const authMiddleware = require('./middleware/authMiddleware');
const registerHandlers = require('./handlers/socketHandlers');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // Allow your mobile app to connect
});

// 🛡️ Use the Guard
io.use(authMiddleware);

// 🕹️ Setup Handlers
registerHandlers(io);

// 📻 THE MAGIC: Listen to Laravel/Redis
// Laravel usually broadcasts on a channel named 'laravel_database_' + channel name
subRedis.subscribe('laravel_database_queue-channel', (err, count) => {
    if (err) console.error("❌ Redis Sub Error:", err);
    //console.log(`📡 Subscribed to ${count} channel. Waiting for Laravel updates...`);
});

subRedis.on('message', (channel, message) => {
    // This log will show you EXACTLY what Laravel is sending
    //console.log('📩 Incoming from Redis:', message); 
    
    try {
        const payload = JSON.parse(message);
        // Laravel's event data is usually inside payload.data
        const eventData = payload.data || payload;

        io.emit('QueueUpdated', eventData);
        console.log('🚀 Broadcasted to Mobile Apps');
    } catch (e) {
        console.error("❌ JSON Parse Error:", e);
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    //console.log(`🚀 WebSocket Server running on port ${PORT}`);
});