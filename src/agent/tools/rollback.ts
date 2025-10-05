import * as fs from 'fs'
import * as path from 'path'
import { logInfo, logSuccess, logError, logWarning } from '../../utils/io.js'

interface BackupEntry {
  originalPath: string
  backupPath: string
  timestamp: string
}

class RollbackManager {
  private static instance: RollbackManager
  private backups: BackupEntry[] = []
  
  static getInstance(): RollbackManager {
    if (!RollbackManager.instance) {
      RollbackManager.instance = new RollbackManager()
    }
    return RollbackManager.instance
  }
  
  addBackup(originalPath: string, backupPath: string): void {
    this.backups.push({
      originalPath,
      backupPath,
      timestamp: new Date().toISOString()
    })
    
    // Keep only last 10 backups
    if (this.backups.length > 10) {
      const oldBackup = this.backups.shift()
      if (oldBackup && fs.existsSync(oldBackup.backupPath)) {
        fs.unlinkSync(oldBackup.backupPath)
      }
    }
  }
  
  getLastBackup(): BackupEntry | null {
    return this.backups.length > 0 ? this.backups[this.backups.length - 1] ?? null : null
  }
  
  removeBackup(backupPath: string): void {
    this.backups = this.backups.filter(b => b.backupPath !== backupPath)
  }
}

export async function rollback(): Promise<void> {
  logInfo('Rolling back last change...')
  
  const rollbackManager = RollbackManager.getInstance()
  const lastBackup = rollbackManager.getLastBackup()
  
  if (!lastBackup) {
    logWarning('No backup found to rollback to')
    throw new Error('No backup available for rollback')
  }
  
  if (!fs.existsSync(lastBackup.backupPath)) {
    logError(`Backup file not found: ${lastBackup.backupPath}`)
    throw new Error('Backup file missing')
  }
  
  try {
    // Restore the backup
    const backupContent = fs.readFileSync(lastBackup.backupPath, 'utf8')
    fs.writeFileSync(lastBackup.originalPath, backupContent, 'utf8')
    
    // Clean up the backup file
    fs.unlinkSync(lastBackup.backupPath)
    rollbackManager.removeBackup(lastBackup.backupPath)
    
    logSuccess(`Rolled back ${lastBackup.originalPath} to version from ${lastBackup.timestamp}`)
  } catch (error) {
    logError(`Failed to rollback: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

// Export the manager for use in other tools
export { RollbackManager }
