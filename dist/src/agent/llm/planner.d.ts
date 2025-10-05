export interface AgentAction {
    type: 'read' | 'write' | 'run' | 'rollback' | 'chat';
    target?: string;
    content?: string;
    command?: string;
    reasoning?: string;
    message?: string;
}
export declare class Planner {
    private llm;
    constructor();
    parseIntent(instruction: string, context: string): Promise<AgentAction>;
}
//# sourceMappingURL=planner.d.ts.map