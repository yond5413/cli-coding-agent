import { LLMClient } from './llm/client.js'
import type { AgentAction } from './llm/planner.js'
import { logInfo, printHeader, printSeparator } from '../utils/io.js'

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

  constructor() {
    this.llm = new LLMClient()
  }

  async createPlan(instruction: string, context: string): Promise<ExecutionPlan> {
    const systemPrompt = `You are an expert coding assistant that creates detailed execution plans.

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

Context from previous actions:
${context}

Rules:
- Break complex tasks into logical steps
- Each step should be atomic and focused
- Include dependencies between steps
- For simple tasks, create a single step
- For complex tasks, create 3-7 steps maximum
- Always include reasoning for each step`

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
    // Use direct stdin/stdout to avoid readline conflicts
    process.stdout.write('\n🤔 Proceed with this plan? (y/N): ')
    
    return new Promise((resolve) => {
      const onData = (data: Buffer) => {
        const answer = data.toString().trim()
        process.stdin.removeListener('data', onData)
        process.stdin.pause()
        resolve(answer.toLowerCase().startsWith('y'))
      }
      
      process.stdin.resume()
      process.stdin.once('data', onData)
    })
  }
}
