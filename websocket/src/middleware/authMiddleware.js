const jwt = require('jsonwebtoken');

module.exports = (socket, next) => {
    // We will just log the token and let the user in for now
    const token = socket.handshake.auth.token;
    console.log("🎟️ Connection attempt with token:", token ? "Token Received" : "No Token");

    // BYPASS: Always call next() so we can test the UI
    next(); 
};