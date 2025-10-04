import { writeFile as fsWriteFile, readFile as fsReadFile } from 'fs/promises'
import { createTwoFilesPatch } from 'diff'
import { createInterface } from 'readline'

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
      const patch = createTwoFilesPatch(filepath, filepath, existingContent, content)
      console.log(`📝 Changes to ${filepath}:`)
      console.log(patch)
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
      throw new Error('User cancelled file write')
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'User cancelled file write') throw error
    
    const errorMsg = `Failed to write ${filepath}: ${error instanceof Error ? error.message : String(error)}`
    console.error(`❌ ${errorMsg}`)
    throw new Error(errorMsg)
  }
}

async function askConfirmation(question: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(`${question} (y/N): `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase().startsWith('y'))
    })
  })
}
