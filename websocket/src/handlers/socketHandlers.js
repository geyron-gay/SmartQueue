module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`👤 User Connected: ${socket.id}`);

        // Join a private room based on User ID
        // Example: if user ID is 5, they join room "user_5"
        if (socket.handshake.auth.userId) {
            const userId = socket.handshake.auth.userId;
            socket.join(`user_${userId}`);
            console.log(`🏠 User ${userId} joined their private room.`);
        }

        socket.on('disconnect', () => {
            console.log('🏃 User Disconnected');
        });
    });
};