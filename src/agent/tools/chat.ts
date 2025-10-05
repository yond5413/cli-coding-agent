import { LLMClient } from '../llm/client.js'
import { generateSystemPromptContext } from '../../utils/system-context.js'

let systemContextCache: string | undefined

export async function chat(message: string, context: string): Promise<string> {
  console.log(`💬 Having conversation about: ${message}`)
  
  const llm = new LLMClient()
  
  // Get system context for full awareness
  if (!systemContextCache) {
    systemContextCache = await generateSystemPromptContext()
  }
  
  const systemPrompt = `You are a helpful coding assistant with full awareness of the system environment and project structure.

${systemContextCache}

# Context from Recent Actions

${context || 'No previous context'}

# Your Role

Provide helpful, conversational responses. When discussing:
- **Code**: Give detailed explanations referencing actual files from the project structure
- **Commands**: Suggest OS-appropriate commands based on the detected platform
- **Files**: Reference files that exist in the project structure above
- **Technical topics**: Be accurate and detailed while remaining friendly

Always consider the system environment and project context when answering.`

  const response = await llm.chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message }
  ])

  console.log(`🤖 Response: ${response}`)
  return response
}
