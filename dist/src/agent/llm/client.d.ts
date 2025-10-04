export declare class LLMClient {
    private openai;
    constructor();
    chat(messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>, model?: string): Promise<string>;
}
//# sourceMappingURL=client.d.ts.map