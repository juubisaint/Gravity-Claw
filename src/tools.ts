
/**
 * src/tools.ts
 * This file defines the tools (functions) that the AI can call to perform real-world actions.
 */

export const tools = [
    {
        type: 'function',
        function: {
            name: 'get_current_time',
            description: 'Get the current time and date.',
            parameters: {
                type: 'object',
                properties: {},
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_weather',
            description: 'Get the current weather for a specific location.',
            parameters: {
                type: 'object',
                properties: {
                    location: {
                        type: 'string',
                        description: 'The city and state/country, e.g. San Francisco, CA',
                    },
                },
                required: ['location'],
            },
        },
    }
];

/**
 * Executes the requested tool and returns the result as a string.
 */
export async function executeTool(name: string, args: any): Promise<string> {
    console.log(`🛠️ Executing tool: ${name}`, args);

    switch (name) {
        case 'get_current_time':
            return new Date().toLocaleString();

        case 'get_weather':
            // For now, we'll return a placeholder or mock response.
            // In a real scenario, you'd fetch from a weather API.
            return `The weather in ${args.location} is currently sunny with a temperature of 22°C (mock data).`;

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}
