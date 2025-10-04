import { LLMClient } from './client.js'

export interface AgentAction {
  type: 'read' | 'write' | 'run' | 'rollback'
  target?: string
  content?: string
  command?: string
  reasoning?: string
}

export class Planner {
  private llm: LLMClient

  constructor() {
    this.llm = new LLMClient()
  }

  async parseIntent(instruction: string, context: string): Promise<AgentAction> {
    const systemPrompt = `You are a coding assistant. Parse user instructions into JSON actions.

Available actions:
- {"type": "read", "target": "filepath", "reasoning": "why"} - Read a file
- {"type": "write", "target": "filepath", "content": "code", "reasoning": "why"} - Write/modify a file  
- {"type": "run", "command": "shell command", "reasoning": "why"} - Execute a command
- {"type": "rollback", "reasoning": "why"} - Undo last change

Context from previous actions:
${context}

Rules:
- Always include reasoning field
- For write actions, generate complete file content
- For run actions, use safe commands
- Respond ONLY with valid JSON`

    const response = await this.llm.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: instruction }
    ])

    try {
      return JSON.parse(response)
    } catch (error) {
      throw new Error(`Failed to parse LLM response: ${response}`)
    }
  }
}
