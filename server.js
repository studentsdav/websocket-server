const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

let childLocation = null;

wss.on('connection', (ws) => {
    console.log(`✅ New client connected. Total Clients: ${wss.clients.size}`);

    // Broadcast the current number of connected clients
    broadcastClientCount();

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'location') {
                childLocation = data;

                // Print received location
                //  console.log(`📍 Received location: Latitude=${data.latitude}, Longitude=${data.longitude}`);

                // Broadcast location to all connected clients
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'update', location: childLocation }));
                    }
                });
            }
        } catch (error) {
            console.error('❌ Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log(`❌ Client disconnected. Total Clients: ${wss.clients.size - 1}`);

        // Broadcast the new count to all clients
        broadcastClientCount();

        // If no clients are left, reset location data
        if (wss.clients.size === 0) {
            childLocation = null;
            console.log("⚠️ All clients disconnected, stopping tracking.");
        }
    });
});

// Function to broadcast client count to all connected clients
function broadcastClientCount() {
    const clientCount = wss.clients.size;
    console.log(`🔄 Real-time connected clients: ${clientCount}`);

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'client_count', count: clientCount }));
        }
    });
}

app.get('/', (req, res) => {
    res.send('Parent-Child Tracking API is running');
});

server.listen(3000, () => {
    console.log('🚀 Server running on port 3000');
});
