interface BackupEntry {
    originalPath: string;
    backupPath: string;
    timestamp: string;
}
declare class RollbackManager {
    private static instance;
    private backups;
    static getInstance(): RollbackManager;
    addBackup(originalPath: string, backupPath: string): void;
    getLastBackup(): BackupEntry | null;
    removeBackup(backupPath: string): void;
}
export declare function rollback(): Promise<void>;
export { RollbackManager };
//# sourceMappingURL=rollback.d.ts.map