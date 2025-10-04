📝 Product Requirements Document (PRD)

Product: Terminal AI Coding Agent CLI
Version: 1.0
Timeline: < 24 hours
Author: Yonathan Daniel
Date: 2025-10-04

1. Problem Statement

Developers often switch between IDEs and GUIs to leverage AI for coding tasks. There is a gap for a terminal-first AI coding agent that can:

Accept natural language instructions

Generate or modify code

Execute code safely

Maintain context across multiple commands

Goal: Reduce friction and accelerate coding workflows directly from the CLI.

2. Objectives

Accept natural-language instructions and parse them into structured code actions.

Safely execute generated code in a sandboxed environment (Daytona).

Maintain memory/context for multi-turn workflows.

Show diffs and require user confirmation before modifying files.

Provide rollback/versioning for safe experimentation.

3. Target Users

Terminal-focused developers

AI-assisted coding enthusiasts

Educators/demo users

4. Core Features
Feature	Description	Priority
NL → Intent Parsing	Convert user instructions into actionable code tasks	P0
Agent Memory	Maintain context (last file, last function, last command)	P0
File Operations	Read, write, edit, rollback code files	P0
Safe Execution	Run code in a Daytona sandbox, capture stdout/stderr	P0
Diff Preview	Show changes and request confirmation	P0
CLI UX	Clean logs, color-coded outputs, human-friendly prompts	P0
Command History	Optional rerun/rollback previous commands	P1
5. Architecture Overview
my-coding-agent/
├── bin/index.js          # CLI entrypoint (import dist/cli.js)
├── src/
│   ├── cli.ts            # Main CLI logic (yarg)
│   ├── agent/
│   │   ├── index.ts      # Orchestrates LLM + tools + memory
│   │   ├── memory.ts     # Context store for multi-turn
|   |   |── llm/
|            |──planner.ts
             |──executor.ts
             |──client.ts            
│   │   └── tools/
│   │       ├── readFile.ts
│   │       ├── writeFile.ts
│   │       ├── runCommand.ts
│   │       └── rollback.ts
│   └── utils/
│       ├── io.ts         # Logging, diffing
│       └── sandbox.ts    # Daytona sandbox integration
├── dist/                 # Compiled TS → JS
├── package.json
├── tsconfig.json
└── .env                  # API keys (Openrouter + Daytona)


Flow:

User inputs natural language command via CLI.

agent/index.ts parses the instruction using LLM → intent JSON.

The agent determines which tool to use (read/write/run/rollback).

For code execution, it runs in a Daytona sandbox and captures output.

For file edits, it shows a diff and asks for confirmation.

Memory/context is updated for multi-turn workflow.

6. Tech Stack
Component	Choice	Reason
CLI	Commander	Lightweight, easy argument parsing
AI	OPENROUTER hosted model for	Natural-language to code translation (via open ai sdk)
Sandbox	Daytona SDK	Safe, ephemeral code execution
Language	TypeScript / Node.js	Async support, easy packaging, TS safety
Diffing	diff npm	Show human-readable changes
Prompts	Inline templates	Simplifies LLM calls
7. Milestones / Timeline (24h)
Time	Task
0–2h	Repo setup, CLI skeleton, env loading
2–6h	Implement LLM parsing & intent JSON stub
6–10h	Tools: read/write/run/rollback
10–14h	Daytona integration, stdout/stderr capture
14–18h	Memory context & multi-turn workflow
18–22h	CLI UX polish: colors, logs, diffs
22–24h	Demo recording, captions, wrap-up
8. Risks & Mitigation
Risk	Mitigation
Sandbox errors	Test Daytona early with simple commands
API latency	Cache recent responses, minimize repeated calls
Code corruption	Always preview diff + require confirmation
Multi-turn memory bloat	Keep only last N actions; persist essential context
9. Demo Plan

Intro: “AI coding in terminal — type commands, get live code output.”

Demo Commands:

my-agent "create utils.py with Fibonacci function"

my-agent "modify it to handle negative numbers"

my-agent "run python utils.py"

my-agent "rollback last change"

Highlight: Daytona sandbox, memory context, diff preview.