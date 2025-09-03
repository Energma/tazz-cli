# Quality Gates & Automation

## Overview
Automated quality gates that must pass before code reaches production. These rules enforce code quality, security, and reliability standards.

## Pre-Commit Quality Gates

### 1. Code Formatting & Linting
**Tools**: ESLint, Prettier, TSLint, StyleLint

**Configuration Example:**
```json
{
  "scripts": {
    "lint": "eslint src/ --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint src/ --ext .ts,.tsx,.js,.jsx --fix",
    "format": "prettier --write src/",
    "format:check": "prettier --check src/"
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss,json,md}": [
      "prettier --write"
    ]
  }
}
```

**Quality Criteria:**
- [ ] Zero linting errors
- [ ] Code formatted consistently
- [ ] No unused imports/variables
- [ ] Consistent naming conventions
- [ ] No console.log statements in production code

### 2. Type Safety (TypeScript)
**Tools**: TypeScript compiler, ts-node

**Configuration:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

**Quality Criteria:**
- [ ] Zero TypeScript compilation errors
- [ ] Strict type checking enabled
- [ ] No `any` types (use unknown instead)
- [ ] Proper null/undefined handling
- [ ] Generic types used appropriately

### 3. Unit Testing
**Tools**: Jest, Vitest, Mocha, Jasmine

**Quality Criteria:**
- [ ] Minimum 80% code coverage
- [ ] All new code has accompanying tests
- [ ] Critical business logic has 100% coverage
- [ ] Tests follow AAA pattern (Arrange, Act, Assert)
- [ ] No skipped tests without justification

**Test Quality Standards:**
```typescript
// Good test example
describe('UserService', () => {
  let userService: UserService;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    mockDb = {
      findUser: jest.fn(),
      saveUser: jest.fn(),
      deleteUser: jest.fn()
    };
    userService = new UserService(mockDb);
  });

  describe('createUser', () => {
    it('should create user successfully with valid data', async () => {
      // Arrange
      const userData = { name: 'John', email: 'john@test.com' };
      const expectedUser = { id: '1', ...userData };
      mockDb.saveUser.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockDb.saveUser).toHaveBeenCalledWith(userData);
    });

    it('should throw ValidationError for invalid email', async () => {
      // Arrange
      const invalidData = { name: 'John', email: 'invalid-email' };

      // Act & Assert
      await expect(userService.createUser(invalidData))
        .rejects.toThrow(ValidationError);
      expect(mockDb.saveUser).not.toHaveBeenCalled();
    });
  });
});
```

## Pre-Push Quality Gates

### 4. Integration Testing
**Tools**: Supertest, TestContainers, Docker Compose

**Quality Criteria:**
- [ ] All API endpoints tested
- [ ] Database integration tested
- [ ] External service integration mocked/tested
- [ ] Error handling tested
- [ ] Authentication/authorization tested

**Example:**
```typescript
describe('User API Integration', () => {
  let app: Application;
  let database: Database;

  beforeAll(async () => {
    // Start test database
    database = await startTestDatabase();
    app = createApp({ database });
  });

  afterAll(async () => {
    await database.close();
  });

  it('POST /users should create new user', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: userData.name,
      email: userData.email
    });

    // Verify in database
    const user = await database.findUserById(response.body.id);
    expect(user).toBeTruthy();
  });
});
```

### 5. Security Scanning
**Tools**: npm audit, Snyk, OWASP ZAP, CodeQL

**Quality Criteria:**
- [ ] No high/critical vulnerability dependencies
- [ ] Secrets scanning passes (no API keys, passwords)
- [ ] Security headers configured
- [ ] Input validation implemented
- [ ] SQL injection prevention

**Security Scan Configuration:**
```bash
#!/bin/bash
# security-scan.sh

echo "🔒 Running security scans..."

# Dependency vulnerability scan
npm audit --audit-level=high
if [ $? -ne 0 ]; then
  echo "❌ High/critical vulnerabilities found in dependencies"
  exit 1
fi

# Secret scanning
git secrets --scan
if [ $? -ne 0 ]; then
  echo "❌ Secrets detected in code"
  exit 1
fi

# OWASP security scan
zap-baseline.py -t http://localhost:3000
if [ $? -ne 0 ]; then
  echo "❌ Security vulnerabilities detected"
  exit 1
fi

echo "✅ Security scans passed"
```

### 6. Performance Testing
**Tools**: Artillery, k6, Lighthouse CI

**Quality Criteria:**
- [ ] API response times < 200ms (95th percentile)
- [ ] Memory leaks detected and fixed
- [ ] Bundle size within limits
- [ ] Database query performance optimized
- [ ] Lighthouse score > 90 for web apps

**Performance Test Example:**
```javascript
// artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
  processor: './performance-processor.js'

scenarios:
  - name: 'Create User Flow'
    weight: 50
    flow:
      - post:
          url: '/api/users'
          json:
            name: 'Test User'
            email: 'test{{ $randomNumber(0,99999) }}@example.com'
          capture:
            - json: $.id
              as: userId
      - get:
          url: '/api/users/{{ userId }}'

  - name: 'Get Users List'
    weight: 50
    flow:
      - get:
          url: '/api/users?limit=10'
```

## Pre-Release Quality Gates

### 7. End-to-End Testing
**Tools**: Playwright, Cypress, Selenium WebDriver

**Quality Criteria:**
- [ ] Critical user journeys tested
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness tested
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Performance in production-like environment

**E2E Test Example:**
```typescript
// tests/e2e/user-registration.spec.ts
import { test, expect } from '@playwright/test';

test('User can register and login successfully', async ({ page }) => {
  // Navigate to registration page
  await page.goto('/register');

  // Fill registration form
  await page.fill('[data-testid=name-input]', 'John Doe');
  await page.fill('[data-testid=email-input]', 'john@example.com');
  await page.fill('[data-testid=password-input]', 'SecurePassword123!');

  // Submit form
  await page.click('[data-testid=register-button]');

  // Verify success
  await expect(page.locator('[data-testid=success-message]')).toBeVisible();
  await expect(page).toHaveURL('/dashboard');

  // Verify user can logout and login again
  await page.click('[data-testid=logout-button]');
  await page.goto('/login');
  await page.fill('[data-testid=email-input]', 'john@example.com');
  await page.fill('[data-testid=password-input]', 'SecurePassword123!');
  await page.click('[data-testid=login-button]');
  
  await expect(page).toHaveURL('/dashboard');
});
```

### 8. Code Quality Analysis
**Tools**: SonarCloud, CodeClimate, DeepCode

**Quality Gate Requirements:**
- [ ] Maintainability Rating ≤ A
- [ ] Reliability Rating ≤ A  
- [ ] Security Rating ≤ A
- [ ] Coverage ≥ 80%
- [ ] Duplicated Lines < 3%
- [ ] Technical Debt Ratio < 5%
- [ ] Cognitive Complexity ≤ 15 per function

**SonarCloud Configuration:**
```properties
# sonar-project.properties
sonar.projectKey=tazz-project
sonar.organization=your-org
sonar.sources=src
sonar.tests=tests
sonar.test.inclusions=**/*.test.ts,**/*.spec.ts
sonar.typescript.lcov.reportPaths=coverage/lcov.info
sonar.coverage.exclusions=**/*.test.ts,**/*.spec.ts,**/mocks/**
sonar.cpd.exclusions=**/*.test.ts,**/*.spec.ts

# Quality gate thresholds
sonar.qualitygate.wait=true
```

## Production Deployment Gates

### 9. Infrastructure & Environment Validation
**Tools**: Terraform, Ansible, Kubernetes

**Quality Criteria:**
- [ ] Infrastructure as Code validated
- [ ] Environment configuration verified
- [ ] Health checks passing
- [ ] Monitoring and alerting configured
- [ ] Rollback plan tested

### 10. Smoke Testing
**Quality Criteria:**
- [ ] Application starts successfully
- [ ] Database connections work
- [ ] External API integrations functional
- [ ] Authentication system working
- [ ] Critical features operational

**Smoke Test Script:**
```bash
#!/bin/bash
# smoke-test.sh

BASE_URL=${1:-"https://api.example.com"}

echo "🚭 Running smoke tests against $BASE_URL"

# Health check
curl -f "$BASE_URL/health" || exit 1
echo "✅ Health check passed"

# Database connectivity
curl -f "$BASE_URL/health/db" || exit 1
echo "✅ Database connectivity verified"

# Authentication
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}' \
  | jq -r '.token')

if [ "$TOKEN" = "null" ]; then
  echo "❌ Authentication failed"
  exit 1
fi
echo "✅ Authentication working"

# API functionality
curl -f -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/users/me" || exit 1
echo "✅ API functionality verified"

echo "🎉 All smoke tests passed"
```

## Quality Gate Automation

### CI/CD Pipeline Integration
```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates

on: [push, pull_request]

jobs:
  lint-and-format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run type-check

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:integration

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit --audit-level=high
      - uses: securecodewarrior/github-action-add-sarif@v1
        with:
          sarif-file: 'security-scan-results.sarif'

  sonarcloud:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e

  deploy-staging:
    needs: [lint-and-format, type-check, unit-tests, integration-tests, security-scan]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: echo "Deploying to staging environment"

  smoke-tests:
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - run: ./scripts/smoke-test.sh https://staging.example.com
```

### Tazz Integration Commands

These quality gates are integrated into Tazz CLI:

```bash
# Run all quality checks before push
tazz quality-check

# Run specific quality gate
tazz lint
tazz test --coverage
tazz security-scan
tazz performance-test

# Pre-release validation
tazz validate-release

# Health check production deployment
tazz health-check production
```

## Quality Gate Overrides

### Emergency Situations
In critical production issues, quality gates can be bypassed with:
- **Approval**: Technical lead approval required
- **Documentation**: Reason and remediation plan documented
- **Follow-up**: Technical debt ticket created
- **Timeline**: Fix quality issues within 48 hours

### Override Process
```bash
# Emergency deployment with override
tazz deploy production --override-quality-gates \
  --reason "Critical security patch" \
  --approver "tech-lead@example.com" \
  --remediation-ticket "TASK-789"
```

## Metrics & Reporting

### Quality Metrics Dashboard
- **Build Success Rate**: % of builds passing all quality gates
- **Test Coverage Trend**: Coverage percentage over time
- **Security Vulnerability Count**: Number of security issues
- **Technical Debt Ratio**: Percentage of technical debt
- **Performance Metrics**: Response times and throughput
- **Quality Gate Bypass Rate**: Frequency of overrides

### Regular Reviews
- **Weekly**: Team review of quality metrics
- **Monthly**: Process improvement discussions
- **Quarterly**: Quality gate effectiveness review
- **Annually**: Tool and standard updates