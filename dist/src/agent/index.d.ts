import { Memory } from './memory.js';
export declare class CodingAgent {
    private planner;
    private executor;
    private memory;
    constructor();
    processInstruction(instruction: string): Promise<void>;
    getMemory(): Memory;
}
//# sourceMappingURL=index.d.ts.map