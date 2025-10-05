import { Memory } from './memory.js';
import { Interface as ReadlineInterface } from 'readline';
export declare class CodingAgent {
    private planner;
    private multiStepPlanner;
    private executor;
    private memory;
    private rl?;
    constructor(rl?: ReadlineInterface);
    processInstruction(instruction: string): Promise<void>;
    private shouldUsePlanningMode;
    private executeWithPlanning;
    private executeSingleStep;
    private askContinueAfterError;
    getMemory(): Memory;
}
//# sourceMappingURL=index.d.ts.map