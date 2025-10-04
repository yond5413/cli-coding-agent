export interface AgentAction {
    type: 'read' | 'write' | 'run' | 'rollback';
    target?: string;
    content?: string;
    command?: string;
    reasoning?: string;
}
export declare class Planner {
    private llm;
    constructor();
    parseIntent(instruction: string, context: string): Promise<AgentAction>;
}
//# sourceMappingURL=planner.d.ts.map