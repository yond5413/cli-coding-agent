import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { createInterface } from 'readline'
import { CodingAgent } from './agent/index.js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env' })
dotenv.config({ path: '.env.local' })

// Environment variables loaded successfully

async function runInteractiveMode() {
  // Check for API key
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found in environment')
    console.error('💡 Create a .env file with: OPENROUTER_API_KEY=your_key_here')
    process.exit(1)
  }

  const agent = new CodingAgent()
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  console.log('🤖 Coding Agent CLI - Interactive Mode')
  console.log('💡 Type your instructions or "exit" to quit')
  console.log('📝 Example: "read package.json" or "create utils.py with hello world"')
  console.log('─'.repeat(50))

  const askQuestion = (): Promise<string> => {
    return new Promise((resolve) => {
      rl.question('\n🔵 my-agent> ', (answer) => {
        resolve(answer.trim())
      })
    })
  }

  while (true) {
    try {
      const instruction = await askQuestion()
      
      // Handle exit commands
      if (['exit', 'quit', 'q'].includes(instruction.toLowerCase())) {
        console.log('👋 Goodbye!')
        break
      }
      
      // Skip empty inputs
      if (!instruction) {
        continue
      }
      
      // Process the instruction
      await agent.processInstruction(instruction)
      
    } catch (error) {
      console.error(`❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  rl.close()
}

async function main() {
  const args = hideBin(process.argv)
  
  // If no arguments provided, run interactive mode
  if (args.length === 0) {
    await runInteractiveMode()
    return
  }

  // Otherwise use yargs for single command mode
  yargs(args)
    .scriptName('my-agent')
    .command('$0 <instruction>', 'Execute natural language coding instruction', (yargs) => {
      return yargs
        .positional('instruction', {
          describe: 'Natural language instruction for the AI agent',
          type: 'string'
        })
    }, async (argv) => {
      // Check for API key
      if (!process.env.OPENROUTER_API_KEY) {
        console.error('❌ OPENROUTER_API_KEY not found in environment')
        console.error('💡 Create a .env file with: OPENROUTER_API_KEY=your_key_here')
        process.exit(1)
      }
      
      const agent = new CodingAgent()
      await agent.processInstruction(argv.instruction as string)
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Run with verbose logging'
    })
    .help()
    .parse()
}

main().catch(console.error)