import { writeFile as fsWriteFile, readFile as fsReadFile } from 'fs/promises'
import { createTwoFilesPatch } from 'diff'
import { createInterface } from 'readline'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

const execAsync = promisify(exec)

export async function writeFile(filepath: string, content: string): Promise<void> {
  try {
    // Read existing file for diff
    let existingContent = ''
    try {
      existingContent = await fsReadFile(filepath, 'utf-8')
    } catch (error) {
      console.log(`📝 Creating new file: ${filepath}`)
    }

    // Show diff if file exists
    if (existingContent) {
      await showDiffInEditor(filepath, existingContent, content)
    } else {
      console.log(`📝 New file content for ${filepath}:`)
      console.log('--- Content Preview ---')
      console.log(content.length > 500 ? content.substring(0, 500) + '...' : content)
      console.log('--- End Preview ---')
    }

    // Ask for confirmation
    const confirmed = await askConfirmation('Apply these changes?')
    
    if (confirmed) {
      await fsWriteFile(filepath, content, 'utf-8')
      console.log(`✅ Written to ${filepath}`)
    } else {
      console.log('❌ Changes cancelled')
      return // Don't throw error - just return gracefully
    }
  } catch (error) {
    const errorMsg = `Failed to write ${filepath}: ${error instanceof Error ? error.message : String(error)}`
    console.error(`❌ ${errorMsg}`)
    throw new Error(errorMsg)
  }
}

async function showDiffInEditor(filepath: string, oldContent: string, newContent: string): Promise<void> {
  try {
    // Create temporary files for diff viewing
    const tempDir = path.join(process.cwd(), '.temp-diffs')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    const timestamp = Date.now()
    const oldFile = path.join(tempDir, `${path.basename(filepath)}.old.${timestamp}`)
    const newFile = path.join(tempDir, `${path.basename(filepath)}.new.${timestamp}`)
    
    // Write temporary files
    await fsWriteFile(oldFile, oldContent, 'utf-8')
    await fsWriteFile(newFile, newContent, 'utf-8')
    
    console.log(`📝 Opening diff in editor for ${filepath}...`)
    console.log(`💡 Compare: ${oldFile} vs ${newFile}`)
    
    // Try to open in VS Code, then fall back to system default
    try {
      await execAsync(`code --diff "${oldFile}" "${newFile}"`)
      console.log('✅ Opened diff in VS Code')
    } catch (error) {
      // Fallback to system default editor or just show file paths
      console.log('⚠️ Could not open in VS Code, files created for manual comparison:')
      console.log(`   Original: ${oldFile}`)
      console.log(`   Modified: ${newFile}`)
    }
    
    // Clean up temp files after a delay
    setTimeout(() => {
      try {
        fs.unlinkSync(oldFile)
        fs.unlinkSync(newFile)
      } catch (error) {
        // Ignore cleanup errors
      }
    }, 30000) // 30 seconds
    
  } catch (error) {
    console.error('❌ Failed to create diff view:', error)
    // Fallback to terminal diff
    const patch = createTwoFilesPatch(filepath, filepath, oldContent, newContent)
    console.log(`📝 Changes to ${filepath}:`)
    console.log(patch)
  }
}

async function askConfirmation(question: string): Promise<boolean> {
  // Use process.stdout.write and process.stdin directly to avoid readline conflicts
  process.stdout.write(`${question} (y/N): `)
  
  return new Promise((resolve) => {
    const onData = (data: Buffer) => {
      const answer = data.toString().trim()
      process.stdin.removeListener('data', onData)
      process.stdin.pause()
      resolve(answer.toLowerCase().startsWith('y'))
    }
    
    process.stdin.resume()
    process.stdin.once('data', onData)
  })
}
