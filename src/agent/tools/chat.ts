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
