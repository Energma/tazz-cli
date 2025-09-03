# 🌀 Tazz CLI - Local Installation Guide

## Quick Start (Local Testing)

### 1. Install Dependencies
```bash
cd /home/energma/projects/energma/tazz-cli
npm install
```

### 2. Build the CLI
```bash
npm run build
```

### 3. Link for Global Usage
```bash
npm link
```

Now you can use `tazz` from anywhere on your system!

## 🚀 First Steps

### Initialize Tazz in a Project
```bash
cd your-project
tazz make
```

This will:
- 🧠 Analyze your codebase automatically
- 🔌 Detect your Claude Code MCP servers  
- 📝 Generate intelligent coding rules
- 🤖 Create specialized AI agents (validation-engineer, software-architect, etc.)
- 🪝 Create Claude Code hooks
- 📊 Setup testing strategies
- 📁 Copy complete Claude Code configuration

### Create Your First Session
```bash
# For Jira tickets (auto-fetches context)
tazz start JIRA-123

# For general features  
tazz start feature-authentication

# With custom tasks
tazz start bugfix-login --tasks "fix auth bug, add tests, update docs"
```

### Manage Sessions
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

### Detached Console Mode
```bash
# Start interactive tornado console
tazz -d
```

## 📋 Requirements

- **Node.js** 18+ 
- **Git** (for worktree support)
- **tmux** (for session management)
- **Claude Code** (for MCP integration)

### Install tmux (if not installed):
```bash
# Ubuntu/Debian
sudo apt install tmux

# macOS
brew install tmux

# Arch Linux  
sudo pacman -S tmux
```

## 🔧 Troubleshooting

### "Command not found: tazz"
```bash
# Re-link the package
npm unlink
npm link
```

### "MCP servers not detected"
Make sure you have Claude Code installed with MCP servers configured in `~/.claude/settings.json`

### "Git worktree errors"
Ensure you're in a git repository:
```bash
git init  # if needed
git add .
git commit -m "initial commit"
```

## 🎯 Example Workflow

```bash
# 1. Initialize in your project
cd my-awesome-project
tazz make

# 2. Start working on a Jira ticket
tazz start PROJ-123

# 3. Tazz creates:
#    - Git worktree: ../PROJ-123  
#    - Tmux session: tazz_PROJ-123
#    - Agent environment with Claude
#    - Task list from Jira ticket

# 4. Work in the session (tmux opens automatically)
#    - Pane 1: Development shell
#    - Pane 2: Test watcher  
#    - Pane 3: Claude agent console

# 5. When done, detach but keep session alive
#    Ctrl+B, D (tmux detach)

# 6. Later, resume exactly where you left off
tazz attach PROJ-123
```

## 🌟 Advanced Features

### Agent Commands (Coming Soon)
```bash
# Run tasks with AI agents in parallel
tazz agent run --tasks "fix bug, write tests, update docs" --parallel
```

### Quality Gates
Tazz automatically sets up quality gates based on your project:
- Code formatting (Prettier/Black)  
- Linting (ESLint/Pylint)
- Testing (Jest/Vitest/Pytest)
- Coverage thresholds

### Hook Integration
Tazz creates Claude Code hooks that automatically:
- Format code after edits
- Run tests after changes
- Validate commits
- Update task progress

## 🆘 Need Help?

- Check logs: `~/.tazz/logs/tazz.log`
- View config: `cat .tazz/config.json`
- Reset everything: `rm -rf .tazz .claude`

---

**Ready to supercharge your development workflow!** 🚀