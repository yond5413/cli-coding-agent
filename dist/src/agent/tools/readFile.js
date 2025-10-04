import { readFile as fsReadFile } from 'fs/promises';
export async function readFile(filepath) {
    try {
        console.log(`📖 Reading: ${filepath}`);
        const content = await fsReadFile(filepath, 'utf-8');
        console.log(`✅ Read ${content.length} characters`);
        // Show preview for large files
        if (content.length > 1000) {
            console.log('--- File Preview (first 500 chars) ---');
            console.log(content.substring(0, 500) + '...');
        }
        else {
            console.log('--- File Content ---');
            console.log(content);
        }
        console.log('--- End ---');
        return content;
    }
    catch (error) {
        const errorMsg = `Failed to read ${filepath}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
    }
}
//# sourceMappingURL=readFile.js.map