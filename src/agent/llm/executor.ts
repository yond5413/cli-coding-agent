import type { AgentAction } from './planner.js'
import { readFile } from '../tools/readFile.js'
import { writeFile } from '../tools/writeFile.js'
import { runCommand } from '../tools/runCommand.js'
import { rollback } from '../tools/rollback.js'
import { chat } from '../tools/chat.js'

import { logExecuting, logError } from '../../utils/io.js'
import { Interface as ReadlineInterface } from 'readline'

export class Executor {
  private rl?: ReadlineInterface

  constructor(rl?: ReadlineInterface) {
    if (rl) {
      this.rl = rl
    }
  }

  async execute(action: AgentAction, context?: string): Promise<string> {
    logExecuting(action.type, action.reasoning || 'No reasoning provided')
    
    try {
      switch (action.type) {
        case 'read':
          if (!action.target) throw new Error('Read action requires target')
          return await readFile(action.target)
          
        case 'write':
          if (!action.target || !action.content) throw new Error('Write action requires target and content')
          await writeFile(action.target, action.content, this.rl)
          return `Written to ${action.target}`
          
        case 'run':
          if (!action.command) throw new Error('Run action requires command')
          return await runCommand(action.command)
          
        case 'rollback':
          await rollback()
          return 'Rollback completed'
          
        case 'chat':
          if (!action.message) throw new Error('Chat action requires message')
          return await chat(action.message, context || 'No context available')
          
        default:
          throw new Error(`Unknown action type: ${(action as any).type}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logError(`Failed to execute ${action.type}: ${errorMessage}`)
      throw error
    }
  }
}
