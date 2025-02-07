const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

let users = {}; // Store connected users

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('register', (data) => {
        users[data.deviceId] = socket.id;
    });

    socket.on('track_request', (data) => {
        const receiverSocketId = users[data.receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('track_start', { senderId: data.senderId });
        }
    });

    socket.on('sendLocation', (data) => {
        const receiverSocketId = users[data.receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('receiveLocation', data);
        }
    });

    socket.on('disconnect', () => {
        let userKey = Object.keys(users).find(key => users[key] === socket.id);
        if (userKey) {
            delete users[userKey];
        }
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`WebSocket Server running on port ${PORT}`);
});
