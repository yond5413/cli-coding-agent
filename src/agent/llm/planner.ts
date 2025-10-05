import { LLMClient } from './client.js'
import { generateSystemPromptContext } from '../../utils/system-context.js'

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
  private systemContextCache?: string

  constructor() {
    this.llm = new LLMClient()
  }

  /**
   * Get or generate system context (cached for performance)
   */
  private async getSystemContext(): Promise<string> {
    if (!this.systemContextCache) {
      this.systemContextCache = await generateSystemPromptContext()
    }
    return this.systemContextCache
  }

  async parseIntent(instruction: string, context: string): Promise<AgentAction> {
    // Get system context for OS and file tree awareness
    const systemContext = await this.getSystemContext()
    
    const systemPrompt = `You are a coding assistant with full awareness of the system environment and project structure.

${systemContext}

# Action Types

You must parse user instructions into JSON actions:

- {"type": "read", "target": "filepath", "reasoning": "why"} - Read a file
- {"type": "write", "target": "filepath", "content": "code", "reasoning": "why"} - Write/modify a file  
- {"type": "run", "command": "shell command", "reasoning": "why"} - Execute a command
- {"type": "rollback", "reasoning": "why"} - Undo last change
- {"type": "chat", "message": "user question", "reasoning": "why"} - Have a conversation/provide explanation

# Context from Previous Actions

${context || 'No previous context'}

# Critical Rules

1. **OS Awareness**: Always use commands appropriate for the detected operating system
2. **File Paths**: Use correct path separators for the OS
3. **Project Structure**: Reference files that exist in the project structure shown above
4. **Shell Commands**: Follow the shell command guidelines for the current platform
5. **JSON Format**: Respond ONLY with valid JSON
6. **Reasoning**: Always include a reasoning field explaining your choice
7. **Safety**: For run actions, verify commands are safe and appropriate for the OS
8. **Fallback**: If unsure about the action type, default to "chat"

# Examples

Good Windows command: {"type": "run", "command": "dir", "reasoning": "List files on Windows"}
Bad Windows command: {"type": "run", "command": "ls", "reasoning": "..."} ❌

Good file path: {"type": "read", "target": "src/agent/index.ts", "reasoning": "File exists in project"}
Bad file path: {"type": "read", "target": "nonexistent.ts", "reasoning": "..."} ❌`

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
