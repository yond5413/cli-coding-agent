import { Planner } from './llm/planner.js';
import { Executor } from './llm/executor.js';
import { Memory } from './memory.js';
export class CodingAgent {
    constructor() {
        this.planner = new Planner();
        this.executor = new Executor();
        this.memory = new Memory();
    }
    async processInstruction(instruction) {
        console.log(`\n🤖 Processing: "${instruction}"`);
        try {
            // Get context from memory
            const context = this.memory.getContext();
            // Plan the action
            const action = await this.planner.parseIntent(instruction, context);
            console.log(`📋 Planned action: ${action.type} - ${action.reasoning}`);
            // Execute the action
            const result = await this.executor.execute(action);
            // Store in memory
            this.memory.addEntry(instruction, action, result);
            console.log(`✅ Completed: ${instruction}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`❌ Error processing "${instruction}": ${errorMessage}`);
            // Still store failed attempts in memory for context
            this.memory.addEntry(instruction, { type: 'read', reasoning: 'Failed attempt' }, errorMessage);
            throw error;
        }
    }
    getMemory() {
        return this.memory;
    }
}
//# sourceMappingURL=index.js.map