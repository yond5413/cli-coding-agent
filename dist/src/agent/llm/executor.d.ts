import type { AgentAction } from './planner.js';
import { Interface as ReadlineInterface } from 'readline';
export declare class Executor {
    private rl?;
    constructor(rl?: ReadlineInterface);
    execute(action: AgentAction, context?: string): Promise<string>;
}
//# sourceMappingURL=executor.d.ts.map