import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createInterface } from 'readline';
import { CodingAgent } from './agent/index.js';
import { printWelcome, printSeparator, logError, logInfo, printHeader } from './utils/io.js';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });
// Slash command handlers
function handleSlashCommand(command, agent) {
    const cmd = command.toLowerCase().trim();
    switch (cmd) {
        case '/help':
            printHeader('Available Commands');
            console.log(`
🤖 Natural Language Instructions:
   • "create a Python function for sorting"
   • "read the package.json file"  
   • "run npm install"
   • "explain this code"

⚡ Slash Commands:
   • /help     - Show this help message
   • /clear    - Clear the terminal screen
   • /memory   - Show conversation history
   • /exit     - Quit the application

💡 Examples:
   • "create utils.py with a fibonacci function"
   • "modify the function to handle edge cases"
   • "run python utils.py to test it"
`);
            printSeparator();
            return true;
        case '/clear':
            console.clear();
            printWelcome();
            return true;
        case '/memory':
            printHeader('Conversation History');
            const memory = agent.getMemory();
            const context = memory.getContext();
            console.log(context);
            printSeparator();
            return true;
        case '/exit':
            console.log('\n👋 Goodbye!');
            process.exit(0);
        default:
            logError(`Unknown command: ${command}`);
            logInfo('Type /help to see available commands');
            return true;
    }
}
async function runInteractiveMode() {
    // Check for API key
    if (!process.env.OPENROUTER_API_KEY) {
        logError('OPENROUTER_API_KEY not found in environment');
        logInfo('Create a .env file with: OPENROUTER_API_KEY=your_key_here');
        process.exit(1);
    }
    const agent = new CodingAgent();
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });
    // Clear screen and show welcome
    console.clear();
    printWelcome();
    const askQuestion = () => {
        return new Promise((resolve) => {
            rl.question('\n\x1b[96m\x1b[1m❯\x1b[0m \x1b[37mmy-agent\x1b[0m\x1b[90m>\x1b[0m ', (answer) => {
                resolve(answer.trim());
            });
        });
    };
    while (true) {
        try {
            const instruction = await askQuestion();
            // Handle exit commands
            if (['exit', 'quit', 'q'].includes(instruction.toLowerCase())) {
                console.log('\n👋 Goodbye!');
                break;
            }
            // Skip empty inputs
            if (!instruction) {
                continue;
            }
            // Handle slash commands
            if (instruction.startsWith('/')) {
                handleSlashCommand(instruction, agent);
                continue;
            }
            // Process the instruction
            await agent.processInstruction(instruction);
        }
        catch (error) {
            logError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    rl.close();
}
async function main() {
    const args = hideBin(process.argv);
    // If no arguments provided, run interactive mode
    if (args.length === 0) {
        await runInteractiveMode();
        return;
    }
    // Otherwise use yargs for single command mode
    yargs(args)
        .scriptName('my-agent')
        .command('$0 <instruction>', 'Execute natural language coding instruction', (yargs) => {
        return yargs
            .positional('instruction', {
            describe: 'Natural language instruction for the AI agent',
            type: 'string'
        });
    }, async (argv) => {
        // Check for API key
        if (!process.env.OPENROUTER_API_KEY) {
            console.error('❌ OPENROUTER_API_KEY not found in environment');
            console.error('💡 Create a .env file with: OPENROUTER_API_KEY=your_key_here');
            process.exit(1);
        }
        const agent = new CodingAgent();
        await agent.processInstruction(argv.instruction);
    })
        .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'Run with verbose logging'
    })
        .help()
        .parse();
}
main().catch(console.error);
//# sourceMappingURL=cli.js.map