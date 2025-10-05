import { Memory } from './memory.js';
export declare class CodingAgent {
    private planner;
    private multiStepPlanner;
    private executor;
    private memory;
    constructor();
    processInstruction(instruction: string): Promise<void>;
    private shouldUsePlanningMode;
    private executeWithPlanning;
    private executeSingleStep;
    private askContinueAfterError;
    getMemory(): Memory;
}
//# sourceMappingURL=index.d.ts.map