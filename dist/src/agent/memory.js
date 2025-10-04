export class Memory {
    constructor() {
        this.history = [];
        this.maxEntries = 5;
    }
    addEntry(instruction, action, result) {
        this.history.push({
            instruction,
            action,
            result,
            timestamp: new Date()
        });
        // Keep only recent entries
        if (this.history.length > this.maxEntries) {
            this.history = this.history.slice(-this.maxEntries);
        }
    }
    getContext() {
        if (this.history.length === 0)
            return 'No previous context';
        return this.history.slice(-3).map(entry => `Instruction: "${entry.instruction}" -> Action: ${entry.action.type}(${entry.action.target || entry.action.command}) -> Result: ${entry.result.substring(0, 100)}...`).join('\n');
    }
    getLastEntry() {
        return this.history.length > 0 ? this.history[this.history.length - 1] ?? null : null;
    }
    clear() {
        this.history = [];
    }
}
//# sourceMappingURL=memory.js.map