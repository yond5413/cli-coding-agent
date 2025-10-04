import OpenAI from 'openai';
export class LLMClient {
    constructor() {
        this.openai = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: process.env.OPENROUTER_API_KEY,
            defaultHeaders: {
                'HTTP-Referer': 'https://github.com/coding-agent-cli',
                'X-Title': 'Coding Agent CLI'
            }
        });
    }
    async chat(messages, model = 'openai/gpt-oss-20b:free') {
        const response = await this.openai.chat.completions.create({
            model,
            messages: messages,
            temperature: 0.1
        });
        return response.choices[0]?.message?.content || '';
    }
}
//# sourceMappingURL=client.js.map