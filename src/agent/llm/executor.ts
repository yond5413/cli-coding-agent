import type { AgentAction } from './planner.js'
import { readFile } from '../tools/readFile.js'
import { writeFile } from '../tools/writeFile.js'
import { runCommand } from '../tools/runCommand.js'
import { rollback } from '../tools/rollback.js'
import { LLMClient } from '../llm/client.js'

export async function chat(message: string, context: string): Promise<string> {
  console.log(`💬 Having conversation about: ${message}`)
  
  const llm = new LLMClient()
  
  const systemPrompt = `You are a helpful coding assistant. The user is asking you a question or wants to have a conversation. 

Context from recent actions:
${context}

Provide a helpful, conversational response. If they're asking about code, files, or technical topics, give detailed explanations. Be friendly and informative.`

  const response = await llm.chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message }
  ])

  console.log(`🤖 Response: ${response}`)
  return response
}

export class Executor {
  async execute(action: AgentAction): Promise<string> {
    console.log(`🎯 Executing: ${action.type} - ${action.reasoning}`)
    
    switch (action.type) {
      case 'read':
        if (!action.target) throw new Error('Read action requires target')
        return await readFile(action.target)
        
      case 'write':
        if (!action.target || !action.content) throw new Error('Write action requires target and content')
        await writeFile(action.target, action.content)
        return `Written to ${action.target}`
        
      case 'run':
        if (!action.command) throw new Error('Run action requires command')
        return await runCommand(action.command)
        
      case 'rollback':
        await rollback()
        return 'Rollback completed'
        
      case 'chat':
        if (!action.message) throw new Error('Chat action requires message')
        return await chat(action.message, 'context here')
        
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }
}
