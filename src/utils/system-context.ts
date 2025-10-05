import os from 'os'
import path from 'path'
import fs from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface SystemContext {
  os: string
  platform: string
  shell: string
  cwd: string
  homeDir: string
  architecture: string
  nodeVersion: string
}

export interface FileTreeNode {
  name: string
  type: 'file' | 'directory'
  path: string
  children?: FileTreeNode[]
}

/**
 * Get comprehensive system context for the LLM
 * This helps the LLM understand what OS and environment it's working in
 */
export async function getSystemContext(): Promise<SystemContext> {
  const platform = os.platform()
  let shell = 'unknown'
  
  // Detect shell based on platform
  if (platform === 'win32') {
    shell = process.env.SHELL || 'powershell.exe'
  } else if (platform === 'darwin' || platform === 'linux') {
    shell = process.env.SHELL || '/bin/bash'
  }
  
  return {
    os: getOSName(platform),
    platform,
    shell: path.basename(shell),
    cwd: process.cwd(),
    homeDir: os.homedir(),
    architecture: os.arch(),
    nodeVersion: process.version
  }
}

/**
 * Get human-readable OS name
 */
function getOSName(platform: string): string {
  switch (platform) {
    case 'win32':
      return 'Windows'
    case 'darwin':
      return 'macOS'
    case 'linux':
      return 'Linux'
    default:
      return platform
  }
}

/**
 * Generate a file tree for workspace awareness
 * This gives the LLM visibility into the project structure
 */
export async function generateFileTree(
  rootPath: string,
  maxDepth: number = 3,
  currentDepth: number = 0,
  ignorePatterns: string[] = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.next',
    '.nuxt',
    'out',
    'target',
    '.idea',
    '.vscode',
    '__pycache__',
    '.pytest_cache',
    'venv',
    'env',
    '.env'
  ]
): Promise<FileTreeNode[]> {
  if (currentDepth >= maxDepth) {
    return []
  }

  try {
    const entries = await fs.readdir(rootPath, { withFileTypes: true })
    const tree: FileTreeNode[] = []

    for (const entry of entries) {
      // Skip ignored patterns
      if (ignorePatterns.some(pattern => entry.name.includes(pattern))) {
        continue
      }

      const fullPath = path.join(rootPath, entry.name)
      const relativePath = path.relative(process.cwd(), fullPath)

      if (entry.isDirectory()) {
        const children = await generateFileTree(
          fullPath,
          maxDepth,
          currentDepth + 1,
          ignorePatterns
        )
        
        const node: FileTreeNode = {
          name: entry.name,
          type: 'directory',
          path: relativePath
        }
        
        if (children.length > 0) {
          node.children = children
        }
        
        tree.push(node)
      } else {
        tree.push({
          name: entry.name,
          type: 'file',
          path: relativePath
        })
      }
    }

    return tree.sort((a, b) => {
      // Directories first, then alphabetical
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  } catch (error) {
    console.error(`Failed to read directory ${rootPath}:`, error)
    return []
  }
}

/**
 * Format file tree as a readable string for the LLM
 */
export function formatFileTree(
  tree: FileTreeNode[],
  prefix: string = '',
  isLast: boolean = true
): string {
  let output = ''
  
  tree.forEach((node, index) => {
    const isLastItem = index === tree.length - 1
    const connector = isLastItem ? '└── ' : '├── '
    const icon = node.type === 'directory' ? '📁 ' : '📄 '
    
    output += prefix + connector + icon + node.name + '\n'
    
    if (node.children && node.children.length > 0) {
      const extension = isLastItem ? '    ' : '│   '
      output += formatFileTree(node.children, prefix + extension, isLastItem)
    }
  })
  
  return output
}

/**
 * Get git information if available
 */
export async function getGitInfo(): Promise<string> {
  try {
    const { stdout: branch } = await execAsync('git branch --show-current', {
      timeout: 5000
    })
    const { stdout: status } = await execAsync('git status --short', {
      timeout: 5000
    })
    
    let info = `Current branch: ${branch.trim()}\n`
    if (status.trim()) {
      info += `Git status:\n${status.trim()}\n`
    } else {
      info += 'Working directory clean\n'
    }
    
    return info
  } catch (error) {
    return 'Not a git repository or git not available'
  }
}

/**
 * Check if a command exists in the system
 */
export async function commandExists(command: string): Promise<boolean> {
  try {
    const checkCmd = os.platform() === 'win32' 
      ? `where ${command}`
      : `which ${command}`
    
    await execAsync(checkCmd, { timeout: 3000 })
    return true
  } catch {
    return false
  }
}

/**
 * Get available package managers
 */
export async function getAvailablePackageManagers(): Promise<string[]> {
  const packageManagers = ['npm', 'yarn', 'pnpm', 'bun']
  const available: string[] = []
  
  for (const pm of packageManagers) {
    if (await commandExists(pm)) {
      available.push(pm)
    }
  }
  
  return available
}

/**
 * Generate comprehensive system prompt context
 */
export async function generateSystemPromptContext(): Promise<string> {
  const sysContext = await getSystemContext()
  const fileTree = await generateFileTree(sysContext.cwd, 2)
  const fileTreeStr = formatFileTree(fileTree)
  const gitInfo = await getGitInfo()
  const packageManagers = await getAvailablePackageManagers()
  
  return `
# System Environment

**Operating System**: ${sysContext.os} (${sysContext.platform})
**Shell**: ${sysContext.shell}
**Architecture**: ${sysContext.architecture}
**Node Version**: ${sysContext.nodeVersion}
**Current Working Directory**: ${sysContext.cwd}
**Available Package Managers**: ${packageManagers.join(', ') || 'none detected'}

# Important Shell Command Guidelines

${getShellGuidelines(sysContext.platform)}

# Project Structure

\`\`\`
${fileTreeStr || '(Empty or unable to read directory)'}
\`\`\`

# Git Information

${gitInfo}

# Instructions

- **CRITICAL**: Use ${sysContext.platform === 'win32' ? 'PowerShell/Windows' : 'bash/Unix'} commands appropriate for ${sysContext.os}
- **File paths**: Use ${sysContext.platform === 'win32' ? 'backslashes (\\) or forward slashes (/)' : 'forward slashes (/)'}
- Always consider the current working directory: ${sysContext.cwd}
- Be aware of the project structure shown above
- Available files and directories are listed in the project structure
`
}

/**
 * Get shell-specific command guidelines
 */
function getShellGuidelines(platform: string): string {
  if (platform === 'win32') {
    return `
**You are on Windows. Use Windows/PowerShell commands:**
- List files: \`dir\` or \`ls\` (if PowerShell Core)
- Copy: \`copy\` or \`Copy-Item\`
- Move: \`move\` or \`Move-Item\`
- Delete: \`del\` or \`Remove-Item\`
- Create directory: \`mkdir\` or \`New-Item -ItemType Directory\`
- Environment variables: \`$env:VARIABLE_NAME\`
- Path separator: backslash (\\) or forward slash (/)
- **AVOID**: Unix commands like \`rm\`, \`cp\`, \`mv\`, \`cat\` unless WSL/Git Bash is explicitly available
`
  } else if (platform === 'darwin') {
    return `
**You are on macOS. Use Unix/bash commands:**
- List files: \`ls\`
- Copy: \`cp\`
- Move: \`mv\`
- Delete: \`rm\`
- Create directory: \`mkdir\`
- Environment variables: \`$VARIABLE_NAME\`
- Path separator: forward slash (/)
`
  } else {
    return `
**You are on Linux. Use Unix/bash commands:**
- List files: \`ls\`
- Copy: \`cp\`
- Move: \`mv\`
- Delete: \`rm\`
- Create directory: \`mkdir\`
- Environment variables: \`$VARIABLE_NAME\`
- Path separator: forward slash (/)
`
  }
}

