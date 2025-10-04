import type { AgentAction } from './llm/planner.js';
export interface MemoryEntry {
    instruction: string;
    action: AgentAction;
    result: string;
    timestamp: Date;
}
export declare class Memory {
    private history;
    private maxEntries;
    addEntry(instruction: string, action: AgentAction, result: string): void;
    getContext(): string;
    getLastEntry(): MemoryEntry | null;
    clear(): void;
}
//# sourceMappingURL=memory.d.ts.map