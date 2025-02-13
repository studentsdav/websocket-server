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
    console.log('New client connected');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'location') {
                childLocation = data;

                // Print the received location in console
                //   console.log(`Received location: Latitude=${data.latitude}, Longitude=${data.longitude}`);

                // Broadcast location to all connected clients
                wss.clients.forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'update', location: childLocation }));
                    }
                });

                // Check if no clients are listening, then close the connection
                if ([...wss.clients].filter(client => client.readyState === WebSocket.OPEN).length === 0) {
                    console.log("No active listeners, closing connection.");
                    ws.close();
                }
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        // If no clients are left, reset childLocation
        if (wss.clients.size === 0) {
            childLocation = null;
            console.log("All clients disconnected, stopping tracking.");
        }
    });
});

app.get('/', (req, res) => {
    res.send('Parent-Child Tracking API is running');
});

server.listen(3000, () => {
    console.log('Server running on port 3000');
});
