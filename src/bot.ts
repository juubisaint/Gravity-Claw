import { Client, GatewayIntentBits, Events } from 'discord.js';
import OpenAI from 'openai';
import { config } from './config.js';
import { saveMessage, getRecentContext } from './memory.js';
import { tools, executeTool } from './tools.js';

// Initialize OpenRouter/OpenAI client
export const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: config.ai.openRouterApiKey,
});

// Initialize Discord Client with necessary intents
// We need Guilds (servers), GuildMessages, and MessageContent to read messages
export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
});

// Event: When the bot successfully logs in
client.once(Events.ClientReady, (readyClient) => {
    console.log(`✅ Gravity Claw successfully connected as ${readyClient.user.tag}`);
});

// Level 5: Persistence - Handle reconnections and shards
client.on(Events.ShardReady, (id) => {
    console.log(`💎 Shard ${id} is ready.`);
});

client.on(Events.ShardReconnecting, (id) => {
    console.warn(`🔄 Shard ${id} is reconnecting...`);
});

client.on(Events.ShardDisconnect, (event, id) => {
    console.error(`❌ Shard ${id} disconnected:`, event);
});

// Event: Handle incoming messages
client.on(Events.MessageCreate, async (message) => {
    // Ignore messages from other bots
    if (message.author.bot) return;

    // Handle a simple ping test command
    if (message.content.trim() === '!ping' || message.content.trim() === '/start') {
        await message.reply('🚀 Gravity Claw initialized. Ready for commands.');
        return;
    }

    // UX: Show the bot is "typing" while it fetches context and calls the LLM
    await message.channel.sendTyping();

    try {
        // 1. Save the user's message to the persistent memory
        await saveMessage(message.author.id, 'user', message.content);

        // 2. Retrieve recent conversation history (last 10 messages)
        const context = await getRecentContext(message.author.id, 10);

        // 3. Build the initial payload for the LLM
        let messages: any[] = [
            { role: 'system', content: config.ai.systemPrompt },
            ...context
        ];

        // 4. Initial LLM Call with Tools enabled
        console.log(`📡 Sending ${messages.length} messages to LLM (${config.ai.model})...`);
        let response = await openai.chat.completions.create({
            model: config.ai.model,
            messages: messages,
            tools: tools as any,
            tool_choice: 'auto',
        });

        let responseMessage = response.choices[0].message;
        console.log("📥 LLM Response:", JSON.stringify(responseMessage));

        // 5. Handle Tool Calls
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
            console.log(`🛠️ Tool calls detected: ${responseMessage.tool_calls.length}`);
            messages.push(responseMessage); // Add assistant's tool call message to history

            for (const toolCall of responseMessage.tool_calls) {
                const functionName = toolCall.function.name;
                let functionArgs: any = {};

                try {
                    functionArgs = JSON.parse(toolCall.function.arguments);
                } catch (jsonError) {
                    console.warn(`⚠️ Failed to parse arguments for tool ${functionName}:`, toolCall.function.arguments);
                    // Continue with empty args if parsing fails
                }

                try {
                    const toolResult = await executeTool(functionName, functionArgs);

                    messages.push({
                        tool_call_id: toolCall.id,
                        role: 'tool',
                        name: functionName,
                        content: toolResult,
                    });
                } catch (toolError) {
                    console.error(`Error executing tool ${functionName}:`, toolError);
                    messages.push({
                        tool_call_id: toolCall.id,
                        role: 'tool',
                        name: functionName,
                        content: `Error: ${toolError instanceof Error ? toolError.message : String(toolError)}`,
                    });
                }
            }

            // 6. Get a final response from the LLM after providing tool results
            console.log(`📡 Sending ${messages.length} messages for final response...`);
            response = await openai.chat.completions.create({
                model: config.ai.model,
                messages: messages,
            });
            responseMessage = response.choices[0].message;
            console.log("📥 Final LLM Response:", JSON.stringify(responseMessage));
        }

        let agentReply = responseMessage.content || "";

        // If content is still empty but there's a tool call (re-request), we should warn
        if (!agentReply && responseMessage.tool_calls) {
            console.warn("⚠️ LLM requested more tools, but we only support one level for now.");
            agentReply = "I'm still thinking... (too many tool calls)";
        } else if (!agentReply) {
            console.warn("⚠️ LLM returned completely empty content. Response:", JSON.stringify(responseMessage));
            agentReply = "I processed your request, but I'm having trouble phrasing a response right now.";
        }

        // 7. Save the agent's final reply to memory
        await saveMessage(message.author.id, 'assistant', agentReply);

        // 8. Send the reply back to Discord
        if (agentReply.length > 2000) {
            await message.reply(agentReply.substring(0, 1990) + '... (truncated)');
        } else {
            await message.reply(agentReply);
        }
    } catch (error) {
        console.error("Error generating response:", error);
        await message.reply("There was an error processing your request. Please check the local logs.");
    }
});

// Error handling
client.on(Events.Error, (error) => {
    console.error('Discord Client Error:', error);
});
