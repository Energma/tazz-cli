# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run build` - Build the project using custom build script
- `npm run dev` - Run in development mode with tsx
- `npm test` - Run unit tests with vitest
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Lint and fix TypeScript files with eslint
- `npm run type-check` - TypeScript type checking
- `npm run clean` - Clean build artifacts

### Testing Commands
- `npm run test:e2e` - End-to-end tests with separate config
- Single test file: `npx vitest src/path/to/test.test.ts`

## Project Architecture

**Tazz CLI** is an AI-powered development orchestrator that integrates Claude Code with git worktrees, tmux sessions, and MCP (Model Context Protocol) servers.

### Core Architecture

```
src/
├── cli/                    # CLI interface and commands
│   ├── commands/          # Individual CLI commands (make, start, stop, etc.)
│   └── ui/               # Terminal UI components (tornado animations)
├── core/                  # Business logic
│   ├── services/         # Core services (MCP integration, codebase analysis)
│   ├── storage/          # Data persistence (sessions, configuration)
│   └── types/           # TypeScript type definitions
└── utils/                # Shared utilities (logger, paths, dependencies)
```

### Key Services

- **CodebaseAnalyzer** (`src/core/services/CodebaseAnalyzer.ts`): Analyzes project structure, technology stack, code patterns, and generates intelligent rules
- **MCPIntegrationService** (`src/core/services/MCPIntegrationService.ts`): Manages MCP server detection, connection, and integration with Claude Code
- **RulesGenerator** (`src/core/services/RulesGenerator.ts`): Creates project-specific coding standards and quality gates
- **SessionStore** (`src/core/storage/SessionStore.ts`): Manages persistent session data

### Command Structure

All CLI commands extend a base command pattern and are organized in `src/cli/commands/`:
- Commands use Commander.js for argument parsing
- Each command has its own class with a `build()` method
- Interactive mode provides a TUI when no command is specified

### MCP Integration

The tool automatically detects and integrates with existing Claude Code MCP servers:
- Reads Claude Code configuration from `~/.claude/claude_desktop_config.json`
- Filters and categorizes relevant MCP servers (git, jira, github, sonar, etc.)
- Generates project-specific configuration in `.claude/settings.json`

### Configuration Management

- **Global config**: `~/.tazz/projects/<project-hash>/config.json`
- **Project config**: `.claude/settings.json` (created by `tazz make`)
- **Session data**: Stored in centralized location with project isolation

### Template System

The `templates/` directory contains Claude Code configuration templates:
- Specialized AI agents (validation-engineer, software-architect, etc.)
- Code quality rules and engineering practices
- Hook scripts for automated workflows

### Development Workflow

1. **Initialization**: `tazz make` analyzes codebase and sets up configuration
2. **Session management**: Git worktrees + tmux sessions for isolated development
3. **Quality gates**: Automated testing, linting, coverage checks
4. **MCP orchestration**: Coordinate multiple AI agents across sessions

## Key Technologies

- **TypeScript** with strict type checking
- **Commander.js** for CLI interface
- **Vitest** for testing (unit + e2e)
- **ESLint** for code quality
- **blessed/ink** for terminal UI
- **execa** for process execution
- **simple-git** for git operations
- **winston** for logging

## Testing Strategy

- Unit tests in `tests/unit/` mirror the `src/` structure
- E2E tests for CLI workflows
- Coverage target: 90%+
- Uses vitest with custom setup in `tests/setup.ts`

## Build Process

Custom build script (`build-simple.js`) handles:
- TypeScript compilation
- Dependency bundling
- Binary generation for `bin/tazz`