import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
export async function runCommand(command) {
    try {
        console.log(`🚀 Running: ${command}`);
        // Security check for dangerous commands
        const dangerousPatterns = [
            'rm -rf /',
            'del /f /s /q',
            'format',
            'shutdown',
            'reboot'
        ];
        if (dangerousPatterns.some(pattern => command.toLowerCase().includes(pattern))) {
            throw new Error('Dangerous command blocked for safety');
        }
        const { stdout, stderr } = await execAsync(command, {
            timeout: 30000,
            maxBuffer: 1024 * 1024, // 1MB
            cwd: process.cwd()
        });
        if (stdout) {
            console.log('📤 STDOUT:');
            console.log(stdout.trim());
        }
        if (stderr) {
            console.log('⚠️ STDERR:');
            console.log(stderr.trim());
        }
        console.log('✅ Command completed');
        return stdout || stderr || 'Command executed successfully';
    }
    catch (error) {
        const errorMsg = `Command failed: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`❌ ${errorMsg}`);
        if (error && typeof error === 'object' && 'stdout' in error)
            console.log('STDOUT:', error.stdout);
        if (error && typeof error === 'object' && 'stderr' in error)
            console.log('STDERR:', error.stderr);
        throw new Error(errorMsg);
    }
}
//# sourceMappingURL=runCommand.js.map