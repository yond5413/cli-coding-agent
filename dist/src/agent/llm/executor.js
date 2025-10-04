import { readFile } from '../tools/readFile.js';
import { writeFile } from '../tools/writeFile.js';
import { runCommand } from '../tools/runCommand.js';
import { rollback } from '../tools/rollback.js';
export class Executor {
    async execute(action) {
        console.log(`🎯 Executing: ${action.type} - ${action.reasoning}`);
        switch (action.type) {
            case 'read':
                if (!action.target)
                    throw new Error('Read action requires target');
                return await readFile(action.target);
            case 'write':
                if (!action.target || !action.content)
                    throw new Error('Write action requires target and content');
                await writeFile(action.target, action.content);
                return `Written to ${action.target}`;
            case 'run':
                if (!action.command)
                    throw new Error('Run action requires command');
                return await runCommand(action.command);
            case 'rollback':
                await rollback();
                return 'Rollback completed';
            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
    }
}
//# sourceMappingURL=executor.js.map