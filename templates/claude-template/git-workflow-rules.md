# Git Workflow Rules

## Overview
Comprehensive git workflow rules for teams using Tazz with MCP server integration for GitHub/GitLab automation.

## Branch Strategy

### Branch Types
- **main/master**: Production-ready code, always deployable
- **develop**: Integration branch for features (if using GitFlow)
- **feature/***: Feature development branches
- **hotfix/***: Critical production fixes
- **release/***: Release preparation branches

### Branch Naming Convention
```
feature/TICKET-123-user-authentication
hotfix/TICKET-456-critical-login-bug
release/v2.1.0
chore/update-dependencies
docs/api-documentation
```

**Format**: `type/TICKET-ID-short-description`
- **type**: feature, hotfix, release, chore, docs, test
- **TICKET-ID**: Jira/GitHub issue number (if applicable)
- **description**: Brief kebab-case description

## Commit Message Standards

### Conventional Commits Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **ci**: CI/CD changes
- **build**: Build system changes

### Examples
```
feat(auth): add OAuth2 integration with Google

Implement OAuth2 flow for user authentication using Google provider.
Includes login, logout, and token refresh functionality.

Closes #123
Breaking-change: Removes legacy session-based auth
```

```
fix(api): resolve timeout issues in user service

Increase connection timeout from 5s to 30s and add retry logic
for failed database connections.

Fixes #456
```

## Pre-commit Quality Gates

### Automated Checks (Must Pass)
1. **Linting**: ESLint, Prettier, language-specific linters
2. **Type Checking**: TypeScript compilation, static analysis
3. **Unit Tests**: All unit tests must pass
4. **Security Scan**: Check for secrets, vulnerabilities
5. **Code Coverage**: Maintain minimum coverage threshold
6. **Dependency Check**: Audit for known vulnerabilities

### Pre-commit Hook Configuration
```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "🔍 Running pre-commit checks..."

# Run linter
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Linting failed"
  exit 1
fi

# Run type check
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ Type check failed"
  exit 1
fi

# Run unit tests
npm run test:unit
if [ $? -ne 0 ]; then
  echo "❌ Unit tests failed"
  exit 1
fi

# Check for secrets
npm run check-secrets
if [ $? -ne 0 ]; then
  echo "❌ Secret detection failed"
  exit 1
fi

echo "✅ All pre-commit checks passed"
```

## Pull Request Workflow

### PR Creation Checklist
- [ ] Branch is up to date with target branch
- [ ] All tests pass locally
- [ ] Code follows project standards
- [ ] Documentation updated
- [ ] Breaking changes documented
- [ ] Security review completed (if applicable)

### PR Template
```markdown
## Summary
Brief description of changes and why they were made.

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Chore (maintenance, refactoring, etc.)

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] Performance testing (if applicable)

## Screenshots/Videos
(If UI changes) Add screenshots or videos demonstrating the changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is properly commented
- [ ] Documentation updated
- [ ] Tests added for new functionality
- [ ] All tests pass
- [ ] No breaking changes (or properly documented)
- [ ] Security considerations addressed

## Related Issues
Closes #123
Fixes #456
Related to #789
```

## MCP Server Integration

### GitHub/GitLab MCP Commands
When MCP servers are available, use these automated workflows:

#### Creating Pull Requests
```bash
# Tazz will automatically:
# 1. Push branch to remote
# 2. Create PR with template
# 3. Add appropriate labels
# 4. Request reviews from team
# 5. Link to related issues

tazz pr create
# or
tazz pr create --draft --reviewers "team-lead,senior-dev"
```

#### PR Management
```bash
# Get PR feedback and suggestions
tazz pr feedback

# Apply suggested changes automatically
tazz pr apply-suggestions

# Merge PR after approvals
tazz pr merge --strategy squash
```

#### Issue Management
```bash
# Create issue from branch/commits
tazz issue create --from-branch

# Link current work to existing issue
tazz issue link TICKET-123

# Update issue status
tazz issue update --status "In Review"
```

## Quality Gates Pipeline

### Pre-Push Checks
Before pushing code, run comprehensive quality gates:

```bash
# Automated via tazz
tazz quality-check
```

This runs:
1. **Linting & Formatting**
   - ESLint/TSLint
   - Prettier
   - Language-specific linters

2. **Type Safety**
   - TypeScript compilation
   - Static analysis

3. **Testing**
   - Unit tests (100% of modified code)
   - Integration tests
   - Performance tests (if applicable)

4. **Security**
   - Secret scanning
   - Dependency vulnerability check
   - OWASP security scan

5. **Code Quality**
   - SonarCloud analysis
   - Code coverage check
   - Complexity analysis
   - Duplication detection

### SonarCloud Integration
```yaml
# sonar-project.properties
sonar.projectKey=tazz-project
sonar.organization=your-org
sonar.sources=src
sonar.tests=tests
sonar.typescript.lcov.reportPaths=coverage/lcov.info
sonar.coverage.exclusions=**/*.test.ts,**/*.spec.ts
```

**Quality Gate Requirements:**
- Coverage ≥ 80%
- Duplicated Lines < 3%
- Maintainability Rating ≤ A
- Reliability Rating ≤ A
- Security Rating ≤ A
- Security Hotspots = 0

## Release Workflow

### Semantic Versioning
- **MAJOR**: Breaking changes (v2.0.0)
- **MINOR**: New features, backwards compatible (v1.1.0)
- **PATCH**: Bug fixes, backwards compatible (v1.0.1)

### Release Process
1. **Create Release Branch**
   ```bash
   git checkout -b release/v1.2.0
   ```

2. **Update Version**
   ```bash
   npm version minor  # or major/patch
   ```

3. **Run Full Test Suite**
   ```bash
   npm run test:all
   npm run test:e2e
   npm run test:performance
   ```

4. **Generate Changelog**
   ```bash
   npm run changelog
   ```

5. **Create Release PR**
   ```bash
   tazz pr create --type release
   ```

6. **Deploy to Staging**
   ```bash
   tazz deploy staging
   ```

7. **Merge and Tag**
   ```bash
   git tag v1.2.0
   git push origin v1.2.0
   ```

## Hotfix Workflow

### Emergency Bug Fixes
1. **Create Hotfix Branch from Main**
   ```bash
   git checkout -b hotfix/URGENT-123-critical-bug
   ```

2. **Implement Fix**
   - Minimal changes only
   - Include test for the bug

3. **Fast-track Review**
   ```bash
   tazz pr create --urgent --reviewers "tech-lead"
   ```

4. **Deploy Immediately**
   ```bash
   tazz deploy production --hotfix
   ```

## Team Collaboration

### Code Review Guidelines
- **Review Size**: Keep PRs small (< 400 lines changed)
- **Response Time**: Review within 24 hours
- **Approval**: At least 1 approval required, 2 for critical changes
- **Constructive Feedback**: Focus on code improvement, not personal criticism

### Review Checklist
- [ ] Code logic is correct
- [ ] Error handling is appropriate
- [ ] Performance impact considered
- [ ] Security implications reviewed
- [ ] Tests are adequate
- [ ] Documentation is accurate
- [ ] Breaking changes are documented

### Merge Strategies
- **Squash Merge**: For feature branches (clean history)
- **Merge Commit**: For important milestones (preserve branch history)
- **Fast-forward**: For hotfixes (linear history)

## Automation & Tools

### Required Tools
- **Git Hooks**: husky, lint-staged
- **Linting**: ESLint, Prettier
- **Testing**: Jest, Cypress, Playwright
- **Security**: npm audit, Snyk
- **Quality**: SonarCloud, CodeClimate

### CI/CD Integration
```yaml
# .github/workflows/quality-check.yml
name: Quality Check
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

## Troubleshooting

### Common Issues
1. **Merge Conflicts**: Use `git mergetool` or VS Code merge editor
2. **Failed Tests**: Fix tests before pushing
3. **Large PRs**: Break into smaller, focused changes
4. **Revert Changes**: Use `git revert` instead of force push

### Best Practices
- **Atomic Commits**: One logical change per commit
- **Frequent Commits**: Commit early and often
- **Clear Messages**: Write descriptive commit messages
- **Clean History**: Rebase feature branches before merging
- **Backup Work**: Push work-in-progress branches regularly