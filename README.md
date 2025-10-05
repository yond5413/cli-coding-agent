# Coding Agent CLI 🤖

An intelligent terminal-based coding assistant with **full system and project awareness**. Built with TypeScript, powered by OpenRouter LLMs, and inspired by Claude Code and Gemini CLI.

## ✨ Key Features

### 🎯 System-Aware AI
- **OS Detection**: Automatically detects Windows, macOS, or Linux
- **Smart Commands**: Suggests OS-appropriate terminal commands
- **Shell Awareness**: Understands PowerShell, bash, zsh, etc.
- **No More Crashes**: Commands work on your actual system!

### 📁 Project Intelligence
- **File Tree Awareness**: Knows your entire project structure
- **Smart File Navigation**: References actual files that exist
- **Git Integration**: Understands your current branch and changes
- **Package Manager Detection**: Knows if you have npm, yarn, pnpm, or bun

### 🚀 Powerful Capabilities
- **Natural Language Instructions**: Just tell it what you want in plain English
- **Multi-Step Planning**: Breaks complex tasks into logical steps
- **Context Memory**: Remembers previous actions in your session
- **Interactive Mode**: Real-time chat with your codebase

## 📦 Installation

### Prerequisites
- Node.js v20 or higher
- An OpenRouter API key ([Get one here](https://openrouter.ai/keys))

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd coding-agent-cli
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   OPENROUTER_API_KEY=your_api_key_here
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Run the CLI**
   ```bash
   npm start
   ```

## 🎮 Usage

### Interactive Mode

Start the CLI in interactive mode:
```bash
npm start
```

Then type natural language commands:

```
> create a new TypeScript file with a hello world function
> read the package.json file
> run npm install
> explain what the main agent file does
```

### Slash Commands

Special commands to control the CLI:

- `/help` - Show available commands
- `/context` - View system and project context (NEW! 🔥)
- `/memory` - Show conversation history
- `/clear` - Clear the terminal
- `/exit` - Quit the application

### Single Command Mode

Execute a single instruction:
```bash
npm start "create a fibonacci function in utils.ts"
```

## 🆕 What's New: System Context Awareness

### The `/context` Command

See exactly what your AI assistant knows about your system:

```
> /context

# System Environment
Operating System: Windows (win32)
Shell: powershell.exe
Current Working Directory: C:\Users\...\coding-agent-cli
Available Package Managers: npm, yarn

# Project Structure
├── 📁 src
│   ├── 📁 agent
│   │   ├── 📄 index.ts
│   │   └── 📁 tools
│   ├── 📁 utils
│   └── 📄 cli.ts
├── 📄 package.json
└── 📄 tsconfig.json

# Git Information
Current branch: main
Working directory clean
```

### OS-Appropriate Commands

**On Windows:**
```
> list files in current directory
🤖 Running: dir
✅ Success!
```

**On macOS/Linux:**
```
> list files in current directory
🤖 Running: ls -la
✅ Success!
```

### Smart File Navigation

```
> read the main agent file
🔍 I can see src/agent/index.ts in your project structure
📖 Reading: src/agent/index.ts
✅ Here's the content...
```

## 🏗️ Architecture

### System Context Module
The core innovation that provides system awareness:

```typescript
// Automatically detects your environment
- OS and platform (Windows/Mac/Linux)
- Shell type (PowerShell/bash/zsh)
- Current working directory
- Project file tree structure
- Git repository status
- Available package managers
```

### Agent Architecture

```
┌─────────────────────────────────┐
│   User Instruction              │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│   Planner (with System Context) │
│   • Knows OS                    │
│   • Knows project structure     │
│   • Suggests appropriate cmds   │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│   Executor                      │
│   • Runs commands safely        │
│   • Uses correct tools          │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│   Result → Success! ✅          │
└─────────────────────────────────┘
```

## 📚 Available Actions

The AI can perform these actions:

### Read Files
```
> read src/agent/index.ts
```

### Write/Modify Files
```
> create a new file utils/helpers.ts with utility functions
> modify the package.json to add a new script
```

### Run Commands
```
> run npm test
> execute git status
```

### Chat/Explain
```
> explain what the planner does
> how does the agent system work?
```

### Multi-Step Plans
For complex tasks, the AI creates a plan first:
```
> create a new feature with tests and documentation

📋 Execution Plan:
├─ Step 1: Create feature file
├─ Step 2: Write implementation
├─ Step 3: Create test file
├─ Step 4: Write tests
└─ Step 5: Update documentation

Proceed? (y/N)
```

## 🛠️ Development

### Project Structure

```
coding-agent-cli/
├── src/
│   ├── agent/
│   │   ├── index.ts          # Main agent orchestrator
│   │   ├── planner.ts        # Multi-step planning
│   │   ├── memory.ts         # Context memory
│   │   ├── llm/
│   │   │   ├── client.ts     # LLM client (OpenRouter)
│   │   │   ├── planner.ts    # Single-step planner
│   │   │   └── executor.ts   # Action executor
│   │   └── tools/
│   │       ├── readFile.ts   # File reading
│   │       ├── writeFile.ts  # File writing
│   │       ├── runCommand.ts # Command execution
│   │       └── chat.ts       # Conversational responses
│   ├── utils/
│   │   ├── io.ts             # Terminal I/O utilities
│   │   └── system-context.ts # System awareness (NEW! 🔥)
│   ├── cli.ts                # CLI entry point
│   └── index.ts              # Main export
├── bin/
│   └── index.ts              # Executable entry
└── dist/                     # Compiled output
```

### Building

```bash
# Development build
npm run build

# Watch mode (auto-rebuild)
npm run build -- --watch
```

### Testing

```bash
# Run the CLI
npm start

# Test system context
npm start
> /context

# Run specific command
npm start "list project files"
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```bash
# Required
OPENROUTER_API_KEY=your_key_here

# Optional (coming soon)
# OPENROUTER_MODEL=openai/gpt-4
# MAX_FILE_TREE_DEPTH=3
```

### Ignored Directories

By default, these are excluded from file tree:
- `node_modules`
- `.git`
- `dist`, `build`, `out`
- `.next`, `.nuxt`
- `coverage`
- `.idea`, `.vscode`
- `__pycache__`, `.pytest_cache`
- `venv`, `env`

## 🎯 Roadmap

- [x] OS detection and awareness
- [x] File tree generation
- [x] Git integration
- [x] Multi-step planning
- [x] Context memory
- [x] System context command
- [ ] Custom ignore patterns (.gitignore support)
- [ ] Context refresh command
- [ ] Custom slash commands
- [ ] Plugin system
- [ ] Settings file support
- [ ] Multiple LLM provider support

## 🤝 Inspiration

This project is inspired by:
- **Claude Code** - Natural language coding automation
- **Gemini CLI** - Workspace context and configuration
- Built with patterns from both to create a powerful, context-aware CLI

## 📖 Documentation

- [`SYSTEM-CONTEXT-FIX.md`](SYSTEM-CONTEXT-FIX.md) - Technical details of system awareness
- [`TESTING-GUIDE.md`](TESTING-GUIDE.md) - How to test the new features
- [`prd.md`](prd.md) - Original product requirements
- [`docs/`](docs/) - Reference documentation for Claude Code and Gemini CLI

## 🐛 Troubleshooting

### Commands Crashing
**Problem:** Terminal commands fail
**Solution:** 
1. Check `/context` to verify OS detection
2. Ensure latest build: `npm run build`
3. Restart the CLI

### File Not Found
**Problem:** Can't locate project files
**Solution:**
1. Run `/context` to see detected project structure
2. Check if file is in ignored directory
3. Use exact paths from file tree

### API Errors
**Problem:** LLM requests failing
**Solution:**
1. Verify `OPENROUTER_API_KEY` is set in `.env`
2. Check your API key is valid at [OpenRouter](https://openrouter.ai)
3. Ensure internet connection

## 📝 License

MIT

## 🙏 Acknowledgments

- OpenRouter for LLM API access
- Claude Code for inspiration
- Gemini CLI for workspace context patterns
- The Headstarter community

---

**Built with ❤️ and TypeScript**

Need help? Check the [Testing Guide](TESTING-GUIDE.md) or open an issue!

