import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

export interface DiffOptions {
  showLineNumbers: boolean
  colorize: boolean
  contextLines: number
}

// ANSI color codes - Enhanced palette inspired by gemini-cli
const colors = {
  reset: '\x1b[0m',
  // Basic colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  // Bright colors
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
  // Text styles
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  strikethrough: '\x1b[9m'
}

export function showDiff(oldContent: string, newContent: string, filename: string, options: DiffOptions = {
  showLineNumbers: true,
  colorize: true,
  contextLines: 3
}): string {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')
  
  let diff = ''
  
  if (options.colorize) {
    diff += `${colors.cyan}--- ${filename} (original)${colors.reset}\n`
    diff += `${colors.cyan}+++ ${filename} (modified)${colors.reset}\n`
  } else {
    diff += `--- ${filename} (original)\n`
    diff += `+++ ${filename} (modified)\n`
  }
  
  const maxLines = Math.max(oldLines.length, newLines.length)
  
  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i] || ''
    const newLine = newLines[i] || ''
    
    if (oldLine === newLine) {
      // Unchanged line
      const lineNum = options.showLineNumbers ? `${(i + 1).toString().padStart(4)} ` : ''
      diff += `${options.colorize ? colors.gray : ''}${lineNum} ${oldLine}${options.colorize ? colors.reset : ''}\n`
    } else {
      // Changed line
      if (oldLine && oldLines[i] !== undefined) {
        const lineNum = options.showLineNumbers ? `${(i + 1).toString().padStart(4)} ` : ''
        diff += `${options.colorize ? colors.red : ''}${lineNum}-${oldLine}${options.colorize ? colors.reset : ''}\n`
      }
      if (newLine && newLines[i] !== undefined) {
        const lineNum = options.showLineNumbers ? `${(i + 1).toString().padStart(4)} ` : ''
        diff += `${options.colorize ? colors.green : ''}${lineNum}+${newLine}${options.colorize ? colors.reset : ''}\n`
      }
    }
  }
  
  return diff
}

export async function promptUserConfirmation(message: string): Promise<boolean> {
  // Use direct stdin/stdout to avoid readline conflicts
  process.stdout.write(`${colors.yellow}${message} (y/N): ${colors.reset}`)
  
  return new Promise((resolve) => {
    const onData = (data: Buffer) => {
      const answer = data.toString().trim()
      process.stdin.removeListener('data', onData)
      process.stdin.pause()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    }
    
    process.stdin.resume()
    process.stdin.once('data', onData)
  })
}

// Enhanced logging functions with better aesthetics
export function logInfo(message: string): void {
  console.log(`${colors.brightBlue}${colors.bold}ℹ${colors.reset} ${colors.cyan}${message}${colors.reset}`)
}

export function logSuccess(message: string): void {
  console.log(`${colors.brightGreen}${colors.bold}✅${colors.reset} ${colors.green}${message}${colors.reset}`)
}

export function logError(message: string): void {
  console.log(`${colors.brightRed}${colors.bold}❌${colors.reset} ${colors.red}${message}${colors.reset}`)
}

export function logWarning(message: string): void {
  console.log(`${colors.brightYellow}${colors.bold}⚠️${colors.reset} ${colors.yellow}${message}${colors.reset}`)
}

export function logProcessing(message: string): void {
  console.log(`\n${colors.brightMagenta}${colors.bold}🤖${colors.reset} ${colors.brightWhite}${colors.bold}Processing:${colors.reset} ${colors.white}"${message}"${colors.reset}`)
}

export function logPlanned(actionType: string, reasoning: string): void {
  console.log(`${colors.brightCyan}${colors.bold}📋${colors.reset} ${colors.cyan}Planned action:${colors.reset} ${colors.brightWhite}${actionType}${colors.reset} ${colors.gray}- ${reasoning}${colors.reset}`)
}

export function logCompleted(instruction: string): void {
  console.log(`${colors.brightGreen}${colors.bold}✅${colors.reset} ${colors.green}Completed:${colors.reset} ${colors.white}${instruction}${colors.reset}`)
}

export function logExecuting(actionType: string, reasoning: string): void {
  console.log(`${colors.brightBlue}${colors.bold}⚡${colors.reset} ${colors.blue}Executing:${colors.reset} ${colors.brightWhite}${actionType}${colors.reset} ${colors.gray}- ${reasoning}${colors.reset}`)
}

export function printSeparator(char: string = '─', length: number = 60): void {
  console.log(`${colors.gray}${char.repeat(length)}${colors.reset}`)
}

export function printHeader(title: string): void {
  console.log(`\n${colors.brightCyan}${colors.bold}╭${'─'.repeat(title.length + 2)}╮${colors.reset}`)
  console.log(`${colors.brightCyan}${colors.bold}│ ${title} │${colors.reset}`)
  console.log(`${colors.brightCyan}${colors.bold}╰${'─'.repeat(title.length + 2)}╯${colors.reset}`)
}

export function printWelcome(): void {
  console.log(`${colors.brightMagenta}${colors.bold}
╭─────────────────────────────────────────────────────────────╮
│                    🤖 Coding Agent CLI                      │
│                   Interactive Mode Active                   │
╰─────────────────────────────────────────────────────────────╯${colors.reset}`)
  
  console.log(`\n${colors.brightWhite}${colors.bold}Available Commands:${colors.reset}`)
  console.log(`${colors.cyan}  • ${colors.white}Natural language instructions${colors.reset} ${colors.gray}- "create a Python function"${colors.reset}`)
  console.log(`${colors.cyan}  • ${colors.white}/help${colors.reset} ${colors.gray}- Show available commands${colors.reset}`)
  console.log(`${colors.cyan}  • ${colors.white}/clear${colors.reset} ${colors.gray}- Clear the screen${colors.reset}`)
  console.log(`${colors.cyan}  • ${colors.white}/memory${colors.reset} ${colors.gray}- Show conversation history${colors.reset}`)
  console.log(`${colors.cyan}  • ${colors.white}exit${colors.reset} ${colors.gray}- Quit the application${colors.reset}`)
  
  printSeparator('─', 60)
}

// Loading indicators inspired by gemini-cli
export function showLoadingSpinner(message: string): () => void {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  let i = 0
  
  process.stdout.write(`${colors.brightBlue}${frames[i]}${colors.reset} ${colors.cyan}${message}${colors.reset}`)
  
  const interval = setInterval(() => {
    process.stdout.write(`\r${colors.brightBlue}${frames[i]}${colors.reset} ${colors.cyan}${message}${colors.reset}`)
    i = (i + 1) % frames.length
  }, 100)
  
  return () => {
    clearInterval(interval)
    process.stdout.write(`\r${colors.brightGreen}✓${colors.reset} ${colors.green}${message}${colors.reset}\n`)
  }
}

export function showThinkingIndicator(message: string): () => void {
  const frames = ['🤔', '💭', '🧠', '⚡']
  let i = 0
  
  process.stdout.write(`${frames[i]} ${colors.brightMagenta}${message}${colors.reset}`)
  
  const interval = setInterval(() => {
    process.stdout.write(`\r${frames[i]} ${colors.brightMagenta}${message}${colors.reset}`)
    i = (i + 1) % frames.length
  }, 500)
  
  return () => {
    clearInterval(interval)
    process.stdout.write(`\r${colors.brightGreen}✓${colors.reset} ${colors.green}${message}${colors.reset}\n`)
  }
}

export function createBackup(filePath: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = `${filePath}.backup-${timestamp}`
  
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, backupPath)
    logInfo(`Created backup: ${backupPath}`)
    
    // Register with rollback manager
    const { RollbackManager } = require('../agent/tools/rollback.js')
    RollbackManager.getInstance().addBackup(filePath, backupPath)
  }
  
  return backupPath
}
