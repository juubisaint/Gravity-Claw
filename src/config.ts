import dotenv from 'dotenv';
import { env } from 'process';

// Load variables from .env file into process.env
dotenv.config();

function getEnvVar(name: string, required: boolean = true): string {
    const value = env[name];
    if (required && !value) {
        throw new Error(`Environment variable ${name} is missing.`);
    }
    return value || '';
}

export const config = {
    discord: {
        botToken: getEnvVar('DISCORD_BOT_TOKEN'),
        allowedUserId: getEnvVar('ALLOWED_DISCORD_USER_ID'), // Discord IDs are typically strings
    },
    ai: {
        openRouterApiKey: getEnvVar('OPENROUTER_API_KEY', false),
        elevenLabsApiKey: getEnvVar('ELEVENLABS_API_KEY', false),
        model: getEnvVar('AI_MODEL', false) || 'meta-llama/llama-3.3-70b-instruct',
        systemPrompt: getEnvVar('AI_SYSTEM_PROMPT', false) || `You are Gravity Claw, a personal AI agent running securely and locally.
You help your user manage tasks, write code, and act as a reliable assistant.
Be concise, helpful, and speak natively.

## Tool Usage Rules:
1. ONLY use tools if they are directly relevant to the user's request.
2. If the user is just greeting you (e.g. "hey", "hello", "hi"), respond naturally without calling any tools.
3. After using a tool, provide a clear, helpful verbal summary of the results to the user.`
    },
    databaseUrl: getEnvVar('DATABASE_URL', false),
};
