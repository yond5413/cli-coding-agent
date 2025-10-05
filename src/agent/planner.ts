import { LLMClient } from './llm/client.js'
import type { AgentAction } from './llm/planner.js'
import { logInfo, printHeader, printSeparator } from '../utils/io.js'
import { generateSystemPromptContext } from '../utils/system-context.js'
import { Interface as ReadlineInterface } from 'readline'

export interface PlanStep {
  step: number
  description: string
  action: AgentAction
  dependencies?: number[]
  reasoning: string
}

export interface ExecutionPlan {
  goal: string
  steps: PlanStep[]
  estimatedTime: string
  complexity: 'simple' | 'moderate' | 'complex'
}

export class MultiStepPlanner {
  private llm: LLMClient
  private rl?: ReadlineInterface
  private systemContextCache?: string

  constructor(rl?: ReadlineInterface) {
    this.llm = new LLMClient()
    if (rl) {
      this.rl = rl
    }
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

  async createPlan(instruction: string, context: string): Promise<ExecutionPlan> {
    // Get system context for OS and file tree awareness
    const systemContext = await this.getSystemContext()
    
    const systemPrompt = `You are an expert coding assistant that creates detailed execution plans with full system awareness.

${systemContext}

# Planning Task

Given a user instruction, create a comprehensive plan with multiple steps if needed.

Respond with a JSON object in this exact format:
{
  "goal": "Clear description of what we're trying to achieve",
  "complexity": "simple|moderate|complex",
  "estimatedTime": "estimated completion time",
  "steps": [
    {
      "step": 1,
      "description": "Human readable description of this step",
      "action": {
        "type": "read|write|run|chat",
        "target": "filepath or command",
        "content": "file content if write action",
        "command": "shell command if run action", 
        "message": "message if chat action",
        "reasoning": "why this action is needed"
      },
      "dependencies": [previous step numbers this depends on],
      "reasoning": "why this step is necessary"
    }
  ]
}

# Context from Previous Actions

${context || 'No previous context'}

# Critical Planning Rules

1. **OS Awareness**: All shell commands must be appropriate for the detected operating system
2. **File Awareness**: Only reference files that exist in the project structure or that you will create
3. **Step Dependencies**: Clearly mark which steps depend on others
4. **Atomicity**: Each step should be atomic and focused on one task
5. **Complexity**: For simple tasks, create 1-2 steps; for complex tasks, 3-7 steps maximum
6. **Reasoning**: Always explain why each step is necessary
7. **Command Safety**: Verify all commands are safe and OS-appropriate
8. **Path Correctness**: Use correct path separators for the current OS

# Planning Guidelines

- Break complex tasks into logical, sequential steps
- Consider the current project structure when planning file operations
- Use OS-appropriate commands (Windows vs Unix)
- Include verification steps for critical operations
- Always provide clear reasoning for the plan structure`

    const response = await this.llm.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: instruction }
    ])

    try {
      const plan = JSON.parse(response)
      
      // Validate the plan structure
      if (!plan.goal || !plan.steps || !Array.isArray(plan.steps)) {
        throw new Error('Invalid plan structure')
      }

      return plan
    } catch (error) {
      // Fallback to simple single-step plan
      return {
        goal: instruction,
        complexity: 'simple',
        estimatedTime: '1-2 minutes',
        steps: [{
          step: 1,
          description: instruction,
          action: {
            type: 'chat',
            message: instruction,
            reasoning: 'Fallback to chat due to planning error'
          },
          reasoning: 'Single step execution due to planning complexity'
        }]
      }
    }
  }

  displayPlan(plan: ExecutionPlan): void {
    printHeader(`Execution Plan: ${plan.goal}`)
    
    console.log(`🎯 ${plan.goal}`)
    console.log(`⏱️  Estimated time: ${plan.estimatedTime}`)
    console.log(`📊 Complexity: ${plan.complexity}`)
    console.log(`📝 Steps: ${plan.steps.length}`)
    
    printSeparator()
    
    plan.steps.forEach((step, index) => {
      const emoji = this.getStepEmoji(step.action.type)
      console.log(`${emoji} Step ${step.step}: ${step.description}`)
      console.log(`   💭 ${step.reasoning}`)
      
      if (step.dependencies && step.dependencies.length > 0) {
        console.log(`   📋 Depends on: Step ${step.dependencies.join(', ')}`)
      }
      
      if (index < plan.steps.length - 1) {
        console.log('   ↓')
      }
    })
    
    printSeparator()
  }

  private getStepEmoji(actionType: string): string {
    switch (actionType) {
      case 'read': return '📖'
      case 'write': return '✏️'
      case 'run': return '🚀'
      case 'chat': return '💬'
      case 'rollback': return '↩️'
      default: return '⚡'
    }
  }

  async confirmPlan(plan: ExecutionPlan): Promise<boolean> {
    if (this.rl) {
      return new Promise((resolve) => {
        this.rl!.question('\n🤔 Proceed with this plan? (y/N): ', (answer) => {
          resolve(answer.toLowerCase().startsWith('y'))
        })
      })
    }
    
    // Fallback for non-interactive mode
    return false
  }
}
