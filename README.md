# 🌀 Tazz CLI (DEMO PROTOTYPE)

> AI-powered task orchestrator with git worktrees, tmux sessions, and MCP integration

Tazz CLI is a sophisticated development orchestrator that combines the power of AI agents (Claude) with robust session management, git worktrees, and intelligent codebase analysis to create isolated, resumable development environments.

## ✨ Features

### 🧠 Intelligent Initialization
- **Automatic codebase analysis** - Understands your project structure, technologies, and patterns
- **MCP Integration** - Seamlessly connects with your existing Claude Code MCP servers
- **Smart rules generation** - Creates project-specific coding standards and quality gates
- **Testing strategy setup** - Configures appropriate test templates and coverage targets

### 🌪️ Session Management
- **Git worktree isolation** - Each task gets its own isolated git worktree
- **Tmux integration** - Multi-pane terminal sessions for organized development
- **Resumable sessions** - Sessions survive reboots and can be resumed anytime
- **Context-aware environments** - Sessions remember their state and context

### 🔗 MCP & Jira Integration
- **Jira ticket integration** - Automatically fetches ticket context and creates tasks
- **GitHub PR management** - Tracks related pull requests and feedback
- **SonarCloud quality gates** - Integrates code quality metrics and analysis
- **Multi-agent orchestration** - Coordinate multiple AI agents across sessions

### 🎯 Development Workflow
- **Tornado animations** - Delightful CLI experience with custom animations
- **Quality gates** - Automated testing, linting, and coverage checks
- **Hook system** - Claude Code hooks for automated workflows
- **Task management** - Markdown-based task tracking with agent integration

## 🚀 Quick Start

### Installation

```bash
npm install -g tazz-cli
```

### Initialize Tazz in your project

```bash
cd your-project
tazz make
```

This will:
- Analyze your codebase and detect technologies
- Set up MCP integration with your Claude Code configuration
- Generate intelligent rules and coding standards
- Create specialized AI agents (validation-engineer, software-architect, e2e-engineer, etc.)
- Copy complete Claude Code configuration with subagents
- Configure testing strategies and templates
- Create hook scripts for automated workflows

### Start a new development session

```bash
# For Jira tickets (auto-fetches context)
tazz start JIRA-123

# For general features
tazz start feature-authentication

# With custom tasks
tazz start bugfix-login --tasks "fix auth bug, add tests, update docs"
```

### Manage sessions

```bash
# List all sessions
tazz list

# Attach to existing session
tazz attach JIRA-123

# Stop session (keeps worktree)
tazz stop JIRA-123

# Delete session and worktree
tazz delete JIRA-123
```

### Detached console mode

```bash
# Start interactive tornado console
tazz -d
```

## 🛠️ Configuration

Tazz automatically configures itself based on your project. Configuration is stored centrally in `~/.tazz/projects/<project-hash>/config.json` while project-specific settings are in `.claude/settings.json`:

```json
{
  "maxConcurrentSessions": 10,
  "defaultBranch": "main",
  "tmuxPrefix": "tazz_",
  "qualityGates": {
    "enabled": true,
    "coverage": 80
  },
  "agents": {
    "claude": {
      "enabled": true,
      "model": "claude-3-sonnet-20240229"
    }
  }
}
```

## 🔧 MCP Integration

Tazz automatically detects and integrates with your existing Claude Code MCP servers:

- **Git MCP** - Repository analysis and operations
- **Atlassian MCP** - Jira ticket integration
- **GitHub MCP** - Pull request management
- **SonarCloud MCP** - Code quality analysis
- **Playwright MCP** - E2E test generation

## 📁 Project Structure

After initialization, Tazz creates:

```
your-project/
├── .tazz/
│   └── tazz-todo.md        # User collaboration file (only file in .tazz)
├── .claude/                # Complete Claude Code configuration
│   ├── agents/            # Specialized AI agent configurations
│   │   ├── validation-engineer.md     # Testing & QA specialist
│   │   ├── software-architect.md      # Architecture & design expert
│   │   ├── e2e-engineer.md           # End-to-end testing specialist
│   │   ├── devops-engineer.md        # CI/CD & infrastructure expert
│   │   ├── frontend-engineer.md      # Frontend development specialist
│   │   └── backend-engineer.md       # Backend development specialist
│   ├── code-quality-rules.md         # Code quality standards
│   ├── engineering-practices.md      # Development practices
│   ├── git-workflow-rules.md         # Git workflow guidelines
│   ├── quality-gates.md              # Quality gate definitions
│   ├── settings.json                 # Claude Code settings (includes MCP)
│   ├── settings.local.json           # Local overrides
│   ├── hooks/                        # Claude Code hook scripts
│   └── rules/                        # Generated coding rules
├── ~/.tazz/projects/<project-hash>/  # Centralized configuration
│   ├── config.json                   # Tazz configuration
│   ├── sessions.json                 # Active sessions
│   ├── analysis.json                 # Codebase analysis results
│   ├── templates/                    # Test templates
│   └── logs/                         # Session logs
└── .gitignore                        # Updated to ignore Tazz files
```

## 🤖 Specialized AI Agents

Tazz includes pre-configured specialized AI agents that are automatically set up in your `.claude/agents/` directory:

### 🧪 Validation Engineer
- **Focus**: Testing strategies, test automation, QA processes
- **Expertise**: TDD, BDD, unit/integration/E2E testing, test coverage
- **Tools**: Jest, Vitest, Playwright, Cypress, testing frameworks

### 🏗️ Software Architect  
- **Focus**: System design, architectural patterns, technical decisions
- **Expertise**: SOLID principles, DDD, Clean Architecture, CQRS, design patterns
- **Tools**: Architecture analysis, code structure optimization

### 🌐 E2E Engineer
- **Focus**: End-to-end testing, user workflow validation
- **Expertise**: Playwright, cross-browser testing, accessibility testing
- **Tools**: Browser automation, visual regression testing

### 🚀 DevOps Engineer
- **Focus**: Infrastructure automation, CI/CD pipelines, deployment
- **Expertise**: Docker, Kubernetes, Terraform, GitHub Actions, monitoring
- **Tools**: Infrastructure as Code, deployment strategies

### 💻 Frontend Engineer
- **Focus**: Modern web development, UI/UX implementation  
- **Expertise**: React/Vue/Angular, state management, performance optimization
- **Tools**: Component libraries, build tools, responsive design

### ⚙️ Backend Engineer
- **Focus**: Server-side development, APIs, databases
- **Expertise**: Node.js/Express, database design, authentication, microservices
- **Tools**: API development, database optimization, security

### Agent Commands

```bash
# Run tasks in parallel across multiple sessions
tazz agent run --tasks "fix bug, write tests, update docs" --parallel

# Target specific sessions
tazz agent run --tasks "review code" --sessions "JIRA-123,JIRA-456"
```

## 🎯 Advanced Usage

### Custom Branch Naming
```bash
tazz start JIRA-123 --branch feature/JIRA-123-custom-auth
```

### Skip Integrations During Init
```bash
tazz make --skip-mcp --skip-analysis --skip-hooks
```

### Force Reinitialize
```bash
tazz make --force
```

## 🧪 Testing

Tazz includes comprehensive testing with:

- **Unit tests** with Vitest
- **Integration tests** for MCP services
- **E2E tests** for CLI workflows
- **90%+ code coverage** target

```bash
npm test
npm run test:coverage
npm run test:e2e
```

## 🚢 Development

### Build from source

```bash
git clone https://github.com/tazz-dev/tazz-cli.git
cd tazz-cli
npm install
npm run build
npm link
```

### Project Architecture

```
src/
├── cli/                    # CLI commands and UI
├── core/
│   ├── services/          # Business logic
│   ├── storage/           # Data persistence
│   └── types/             # TypeScript definitions
├── agents/                # AI agent integration
└── utils/                 # Utilities and helpers
```

## 📋 Requirements

- **Node.js** 18+ 
- **Git** (for worktree support)
- **tmux** (for session management)
- **Claude Code** (for MCP integration)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT © Tazz Development Team

## 🙏 Acknowledgments

- **Anthropic** for Claude and the MCP ecosystem
- **Claude Code** for hooks and development environment integration
- The open-source community for the excellent tools and libraries

---

<div align="center">

**[Website](https://tazz.dev)** • **[Documentation](https://docs.tazz.dev)** • **[Issues](https://github.com/tazz-dev/tazz-cli/issues)** • **[Discord](https://discord.gg/tazz)**

</div>
