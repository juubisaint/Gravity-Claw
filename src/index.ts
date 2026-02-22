import { client } from './bot.js';
import { config } from './config.js';
import http from 'http';

// --- Level 5: Heartbeat Server ---
const startHeartbeatServer = () => {
    const port = process.env.PORT || 3000;
    const server = http.createServer((req, res) => {
        const status = client.user ? `Connected as ${client.user.tag}` : 'Connecting...';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            name: "Gravity Claw",
            status: "Online",
            botStatus: status,
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        }));
    });

    server.listen(port, () => {
        console.log(`💓 Heartbeat server listening on port ${port}`);
    });
};

// --- Global Error Handling ---
// Prevent the Node.js process from exiting due to unhandled promise rejections or exceptions.
process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

async function bootstrap() {
    try {
        console.log('Starting Gravity Claw...');

        startHeartbeatServer();

        // Connect to Discord via WebSockets
        await client.login(config.discord.botToken);
    } catch (error) {
        console.error('Failed to start the bot:', error);
        process.exit(1);
    }
}

bootstrap();
