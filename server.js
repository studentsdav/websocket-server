const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app); // Create HTTP server for WebSocket
const wss = new WebSocket.Server({ server });

let clients = {}; // Stores connected clients

wss.on("connection", (ws) => {
    ws.on("message", (message) => {
        let data = JSON.parse(message);

        switch (data.type) {
            case "register":
                clients[data.deviceId] = ws;
                console.log(`Device ${data.deviceId} registered.`);
                break;

            case "track_request":
                if (clients[data.receiverId]) {
                    clients[data.receiverId].send(JSON.stringify({ type: "start_tracking", senderId: data.senderId }));
                }
                break;

            case "send_location":
                if (clients[data.receiverId]) {
                    clients[data.receiverId].send(JSON.stringify({ type: "receive_location", location: data.location }));
                }
                break;
        }
    });

    ws.on("close", () => {
        for (let key in clients) {
            if (clients[key] === ws) {
                delete clients[key];
                break;
            }
        }
    });
});

// Use Render-assigned PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
});
