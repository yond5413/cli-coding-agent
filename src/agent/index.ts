import { Planner } from './llm/planner.js'
import { Executor } from './llm/executor.js'
import { Memory } from './memory.js'
import { MultiStepPlanner } from './planner.js'
import { logProcessing, logPlanned, logCompleted, logError, showLoadingSpinner, showThinkingIndicator, logInfo } from '../utils/io.js'
import { Interface as ReadlineInterface } from 'readline'

export class CodingAgent {
  private planner: Planner
  private multiStepPlanner: MultiStepPlanner
  private executor: Executor
  private memory: Memory
  // Shared readline interface for all user interactions
  // This prevents stdin conflicts between different components
  private rl?: ReadlineInterface

  constructor(rl?: ReadlineInterface) {
    this.planner = new Planner()
    // Pass the shared readline interface to components that need user input
    this.multiStepPlanner = new MultiStepPlanner(rl)
    this.executor = new Executor(rl)
    this.memory = new Memory()
    // Store reference for use in this class's methods
    if (rl) {
      this.rl = rl
    }
  }

  async processInstruction(instruction: string): Promise<void> {
    logProcessing(instruction)
    
    try {
      // Get context from memory
      const context = this.memory.getContext()
      
      // Determine if this needs multi-step planning
      const needsPlanning = this.shouldUsePlanningMode(instruction)
      
      if (needsPlanning) {
        await this.executeWithPlanning(instruction, context)
      } else {
        await this.executeSingleStep(instruction, context)
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logError(`Error processing "${instruction}": ${errorMessage}`)
      
      // Still store failed attempts in memory for context
      this.memory.addEntry(instruction, { type: 'read', reasoning: 'Failed attempt' }, errorMessage)
      
      // Don't throw error - let the CLI continue running
      console.log('\n🔄 Ready for next command...')
    }
  }

  private shouldUsePlanningMode(instruction: string): boolean {
    const planningKeywords = [
      'create', 'build', 'implement', 'develop', 'setup', 'configure',
      'refactor', 'optimize', 'fix bug', 'add feature', 'integrate',
      'deploy', 'test', 'debug', 'migrate', 'update'
    ]
    
    const complexityIndicators = [
      'and', 'then', 'also', 'additionally', 'furthermore',
      'multiple', 'several', 'various', 'different'
    ]
    
    const lowerInstruction = instruction.toLowerCase()
    
    return planningKeywords.some(keyword => lowerInstruction.includes(keyword)) &&
           (complexityIndicators.some(indicator => lowerInstruction.includes(indicator)) ||
            instruction.length > 50)
  }

  private async executeWithPlanning(instruction: string, context: string): Promise<void> {
    // Show thinking indicator while creating plan
    const stopThinking = showThinkingIndicator('Creating execution plan...')
    
    // Create multi-step plan
    const plan = await this.multiStepPlanner.createPlan(instruction, context)
    stopThinking()
    
    // Display the plan
    this.multiStepPlanner.displayPlan(plan)
    
    // Ask for confirmation
    const confirmed = await this.multiStepPlanner.confirmPlan(plan)
    
    if (!confirmed) {
      logInfo('Plan cancelled by user')
      return
    }
    
    // Execute each step
    for (const step of plan.steps) {
      logInfo(`Executing Step ${step.step}: ${step.description}`)
      
      const stopLoading = showLoadingSpinner(`Step ${step.step}...`)
      
      try {
        const result = await this.executor.execute(step.action, context)
        stopLoading()
        
        // Store step in memory
        this.memory.addEntry(`Step ${step.step}: ${step.description}`, step.action, result)
        
        logInfo(`✅ Step ${step.step} completed`)
        
      } catch (error) {
        stopLoading()
        logError(`Step ${step.step} failed: ${error instanceof Error ? error.message : String(error)}`)
        
        // Ask if user wants to continue with remaining steps
        const continueExecution = await this.askContinueAfterError()
        if (!continueExecution) {
          logInfo('Execution stopped by user')
          return
        }
      }
    }
    
    logCompleted(`Multi-step plan: ${plan.goal}`)
  }

  private async executeSingleStep(instruction: string, context: string): Promise<void> {
    // Show thinking indicator while planning
    const stopThinking = showThinkingIndicator('Analyzing your request...')
    
    // Plan the action
    const action = await this.planner.parseIntent(instruction, context)
    stopThinking()
    
    logPlanned(action.type, action.reasoning || 'No reasoning provided')
    
    // Show loading indicator while executing
    const stopLoading = showLoadingSpinner('Executing action...')
    
    // Execute the action
    const result = await this.executor.execute(action, context)
    stopLoading()
    
    // Store in memory
    this.memory.addEntry(instruction, action, result)
    
    logCompleted(instruction)
  }

  private async askContinueAfterError(): Promise<boolean> {
    // Use the shared readline interface for consistent user interaction
    // This prevents stdin conflicts that would occur with direct stdin access
    if (this.rl) {
      return new Promise((resolve) => {
        this.rl!.question('\n⚠️ Step failed. Continue with remaining steps? (y/N): ', (answer) => {
          resolve(answer.toLowerCase().startsWith('y'))
        })
      })
    }
    
    // Fallback for non-interactive mode when no readline interface is available
    return false
  }

  getMemory(): Memory {
    return this.memory
  }
}
