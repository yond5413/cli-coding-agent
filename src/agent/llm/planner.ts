import { LLMClient } from './client.js'

export interface AgentAction {
  type: 'read' | 'write' | 'run' | 'rollback' | 'chat'
  target?: string
  content?: string
  command?: string
  reasoning?: string
  message?: string
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
- {"type": "chat", "message": "user question", "reasoning": "why"} - Have a conversation/provide explanation

Context from previous actions:
${context}

Rules:
- Always include reasoning field
- For write actions, generate complete file content
- For run actions, use safe commands
- Respond ONLY with valid JSON
- If unsure about the action type, default to "chat"`

    const response = await this.llm.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: instruction }
    ])

    try {
      // Handle empty or invalid responses
      if (!response || response.trim() === '') {
        return {
          type: 'chat',
          message: instruction,
          reasoning: 'Empty LLM response, defaulting to chat'
        }
      }
      
      const parsed = JSON.parse(response)
      
      // Validate required fields
      if (!parsed.type) {
        return {
          type: 'chat',
          message: instruction,
          reasoning: 'Invalid action type, defaulting to chat'
        }
      }
      
      return parsed
    } catch (error) {
      // If JSON parsing fails, default to chat
      return {
        type: 'chat',
        message: instruction,
        reasoning: `Failed to parse LLM response, defaulting to chat. Original response: ${response?.substring(0, 100)}...`
      }
    }
  }
}
