const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors()); // ✅ Fix CORS Issues

let clients = {}; // Stores active devices

// ✅ Health Check Route (Prevents Render.com from shutting down)
app.get("/health", (req, res) => {
    res.status(200).send("WebSocket Server is Running ✅");
});

wss.on("connection", (ws) => {
    let deviceId = null;

    ws.on("message", (message) => {
        try {
            let data = JSON.parse(message);

            switch (data.type) {
                case "register":
                    deviceId = data.deviceId;
                    clients[deviceId] = ws;
                    console.log(`✅ Device Registered: ${deviceId}`);
                    break;

                case "track_request":
                    if (clients[data.receiverId]) {
                        clients[data.receiverId].send(JSON.stringify({
                            type: "start_webrtc",
                            senderId: data.senderId
                        }));
                    } else {
                        console.log(`❌ Device ${data.receiverId} is not online.`);
                    }
                    break;
            }
        } catch (error) {
            console.error("❌ Error processing WebSocket message:", error);
        }
    });

    ws.on("close", () => {
        if (deviceId) {
            delete clients[deviceId];
            console.log(`❌ Device Disconnected: ${deviceId}`);
        }
    });

    ws.on("error", (err) => {
        console.error("⚠️ WebSocket Error:", err);
    });
});

// ✅ Keep WebSocket connections alive (Prevents Render inactivity shutdown)
setInterval(() => {
    Object.keys(clients).forEach(deviceId => {
        if (clients[deviceId].readyState !== WebSocket.OPEN) {
            delete clients[deviceId]; // Remove disconnected clients
            console.log(`⚠️ Removed inactive device: ${deviceId}`);
        } else {
            clients[deviceId].send(JSON.stringify({ type: "ping" })); // Keep connection alive
        }
    });
}, 30000); // Runs every 30 seconds

// ✅ Start WebSocket server on Render's dynamic port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 WebSocket Server Running on ws://localhost:${PORT}`);
});
