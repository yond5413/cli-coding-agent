import OpenAI from 'openai'

export class LLMClient {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/coding-agent-cli',
        'X-Title': 'Coding Agent CLI'
      }
    })
  }

  async chat(messages: Array<{role: 'system' | 'user' | 'assistant', content: string}>, model = 'openai/gpt-oss-20b:free'): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model,
      messages: messages as any,
      temperature: 0.1
    })

    return response.choices[0]?.message?.content || ''
  }
}
