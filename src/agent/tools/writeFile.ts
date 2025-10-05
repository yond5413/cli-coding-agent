import { writeFile as fsWriteFile, readFile as fsReadFile } from 'fs/promises'
import { diffLines } from 'diff'
import type { Change } from 'diff'
import { Interface as ReadlineInterface } from 'readline'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

const execAsync = promisify(exec)

export async function writeFile(filepath: string, content: string, rl?: ReadlineInterface): Promise<void> {
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
      showInlineDiff(filepath, existingContent, content)
    } else {
      console.log(`\n📝 New file content for ${filepath}:`)
      console.log('\x1b[2m╭─────────────────────────────────────────────────────────────╮\x1b[0m')
      const lines = content.split('\n')
      const previewLines = lines.slice(0, 20)
      previewLines.forEach((line, idx) => {
        const lineNum = String(idx + 1).padStart(4)
        console.log(`\x1b[32m+ ${lineNum}\x1b[0m | ${line}`)
      })
      if (lines.length > 20) {
        console.log(`\x1b[2m   ... (${lines.length - 20} more lines)\x1b[0m`)
      }
      console.log('\x1b[2m╰─────────────────────────────────────────────────────────────╯\x1b[0m')
    }

    // Ask for confirmation
    const confirmed = await askConfirmation('Apply these changes?', rl)
    
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

function showInlineDiff(filepath: string, oldContent: string, newContent: string): void {
  const changes = diffLines(oldContent, newContent)
  
  console.log(`\n📝 Changes to \x1b[1m${filepath}\x1b[0m:`)
  console.log('\x1b[2m╭─────────────────────────────────────────────────────────────╮\x1b[0m')
  
  let oldLineNum = 1
  let newLineNum = 1
  let changeCount = 0
  const maxLines = 50 // Limit display to avoid overwhelming output
  
  for (const change of changes) {
    const lines = change.value.split('\n')
    // Remove empty last line from split
    if (lines[lines.length - 1] === '') lines.pop()
    
    for (const line of lines) {
      if (changeCount >= maxLines) break
      
      if (change.added) {
        // Green for added lines
        const lineNum = String(newLineNum).padStart(4)
        console.log(`\x1b[32m+ ${lineNum}\x1b[0m | \x1b[32m${line}\x1b[0m`)
        newLineNum++
        changeCount++
      } else if (change.removed) {
        // Red for removed lines
        const lineNum = String(oldLineNum).padStart(4)
        console.log(`\x1b[31m- ${lineNum}\x1b[0m | \x1b[31m${line}\x1b[0m`)
        oldLineNum++
        changeCount++
      } else {
        // Gray for unchanged context lines (show limited context)
        if (changeCount < 3 || changeCount > changes.length - 3) {
          const lineNum = String(oldLineNum).padStart(4)
          console.log(`\x1b[2m  ${lineNum}\x1b[0m | \x1b[2m${line}\x1b[0m`)
        }
        oldLineNum++
        newLineNum++
      }
    }
    
    if (changeCount >= maxLines) {
      console.log(`\x1b[2m   ... (diff truncated, showing first ${maxLines} changes)\x1b[0m`)
      break
    }
  }
  
  console.log('\x1b[2m╰─────────────────────────────────────────────────────────────╯\x1b[0m')
  
  // Summary
  const addedCount = changes.filter(c => c.added).reduce((acc, c) => acc + c.count!, 0)
  const removedCount = changes.filter(c => c.removed).reduce((acc, c) => acc + c.count!, 0)
  console.log(`\x1b[32m+${addedCount} lines\x1b[0m | \x1b[31m-${removedCount} lines\x1b[0m\n`)
}

async function askConfirmation(question: string, rl?: ReadlineInterface): Promise<boolean> {
  if (rl) {
    return new Promise((resolve) => {
      rl.question(`${question} (y/N): `, (answer) => {
        resolve(answer.toLowerCase().startsWith('y'))
      })
    })
  }
  
  // Fallback for non-interactive mode
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
