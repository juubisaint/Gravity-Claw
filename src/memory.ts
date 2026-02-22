import pg from 'pg';
const { Pool } = pg;
import { config } from './config.js';

// Initialize PostgreSQL Connection Pool
if (!config.databaseUrl) {
    console.warn('⚠️ DATABASE_URL is missing! Cloud memory will not work. Defaulting to localhost (likely to fail).');
} else {
    const maskedUrl = config.databaseUrl.replace(/:([^:@]+)@/, ':****@');
    console.log(`🔌 Initializing Postgres Pool with: ${maskedUrl}`);
}

export const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: {
        rejectUnauthorized: false // Required for Supabase/Render to allow SSL connections
    }
});

pool.on('connect', () => {
    console.log('✅ Cloud Persistent Memory (Postgres) connected.');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle Postgres client:', err);
});

// Test the connection immediately on startup
async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('🔌 Successfully established connection to Postgres.');
        client.release();
    } catch (err) {
        console.error('❌ Failed to connect to Postgres database!', err);
        if (err instanceof Error && err.message.includes('ECONNREFUSED')) {
            console.error('💡 TIP: If you are seeing ECONNREFUSED, your network might be blocking port 5432 or you might need to use the Supabase Pooler URL (usually port 6543).');
        }
    }
}

testConnection();

async function initSchema() {
    try {
        // We store the role (user or assistant), the content of the message, and when it happened.
        // PostgreSQL schema is slightly different but follows the same logic.
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                userId TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Database schema verified.');
    } catch (err) {
        console.error('❌ Error initializing database schema:', err);
    }
}

// Run schema initialization
initSchema().catch(err => console.error('🔴 Critical: Failed to initialize schema on startup.', err));

// Save a new message to the database
export async function saveMessage(userId: string, role: 'user' | 'assistant', content: string): Promise<void> {
    try {
        await pool.query(
            'INSERT INTO messages (userId, role, content) VALUES ($1, $2, $3)',
            [userId, role, content]
        );
    } catch (err) {
        console.error('❌ Database Save Error:', err instanceof Error ? err.message : String(err));
        // We catch but don't re-throw to prevent the bot from crashing on memory failures
        // The bot will still respond but won't "remember" this specific message
    }
}

// Get the last N messages to provide context to the LLM
export async function getRecentContext(userId: string, limit: number = 20): Promise<{ role: string, content: string }[]> {
    try {
        // Fetch latest messages (ordered by newest first)
        const res = await pool.query(
            'SELECT role, content FROM messages WHERE userId = $1 ORDER BY timestamp DESC LIMIT $2',
            [userId, limit]
        );

        // Reverse the array so it's in chronological order for the LLM
        return res.rows.reverse().map(row => ({
            role: row.role,
            content: row.content
        }));
    } catch (err) {
        console.error('❌ Database Context Retrieval Error:', err instanceof Error ? err.message : String(err));
        // Return empty context if database fails so the bot can still reply (even with amnesia)
        return [];
    }
}
