import type { AgentAction } from './llm/planner.js'

export interface MemoryEntry {
  instruction: string
  action: AgentAction
  result: string
  timestamp: Date
}

export class Memory {
  private history: MemoryEntry[] = []
  private maxEntries = 5

  addEntry(instruction: string, action: AgentAction, result: string): void {
    this.history.push({
      instruction,
      action,
      result,
      timestamp: new Date()
    })

    // Keep only recent entries
    if (this.history.length > this.maxEntries) {
      this.history = this.history.slice(-this.maxEntries)
    }
  }

  getContext(): string {
    if (this.history.length === 0) return 'No previous context'
    
    return this.history.slice(-3).map(entry => 
      `Instruction: "${entry.instruction}" -> Action: ${entry.action.type}(${entry.action.target || entry.action.command}) -> Result: ${entry.result.substring(0, 100)}...`
    ).join('\n')
  }

  getLastEntry(): MemoryEntry | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] ?? null : null
  }

  clear(): void {
    this.history = []
  }
}
