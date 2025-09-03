# Code Quality Rules

## Overview
These rules ensure consistent, maintainable, and high-quality code across all Tazz projects.

## Code Standards

### General Principles
- **SOLID Principles**: Follow Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion
- **DRY (Don't Repeat Yourself)**: Avoid code duplication
- **KISS (Keep It Simple, Stupid)**: Prefer simple, readable solutions
- **YAGNI (You Aren't Gonna Need It)**: Don't implement features until needed

### Naming Conventions
- **Variables**: Use camelCase for variables and functions (`userName`, `calculateTotal`)
- **Constants**: Use UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`, `API_BASE_URL`)
- **Classes**: Use PascalCase (`UserService`, `DatabaseManager`)
- **Files**: Use kebab-case for files (`user-service.ts`, `database-manager.js`)
- **Directories**: Use kebab-case (`src/user-management`, `tests/integration`)

### Code Structure
- **File Size**: Keep files under 300 lines when possible
- **Function Size**: Keep functions under 50 lines
- **Cyclomatic Complexity**: Aim for complexity < 10 per function
- **Nesting Depth**: Limit nesting to 4 levels maximum

## Documentation Requirements

### Code Comments
- **JSDoc**: Use JSDoc for all public functions and classes
- **Inline Comments**: Explain "why" not "what" - code should be self-documenting
- **TODO Comments**: Use TODO comments sparingly and include assignee/date

```typescript
/**
 * Calculates the total price including tax and discounts
 * @param basePrice - The base price before tax and discounts
 * @param taxRate - Tax rate as decimal (0.1 for 10%)
 * @param discount - Discount amount in currency units
 * @returns The final price after tax and discounts
 */
function calculateTotal(basePrice: number, taxRate: number, discount: number): number {
    // Apply discount before tax calculation (business requirement)
    const discountedPrice = basePrice - discount;
    return discountedPrice * (1 + taxRate);
}
```

### README Requirements
Every project must include:
- **Purpose**: Clear description of what the project does
- **Installation**: Step-by-step setup instructions
- **Usage**: Examples of how to use the project
- **Contributing**: Guidelines for contributors
- **License**: License information

## Error Handling

### Exception Management
- **Fail Fast**: Validate inputs early and throw meaningful errors
- **Custom Errors**: Create custom error classes for domain-specific errors
- **Error Context**: Include relevant context in error messages
- **Logging**: Log errors with appropriate severity levels

```typescript
class ValidationError extends Error {
    constructor(field: string, value: any, expected: string) {
        super(`Invalid ${field}: received ${value}, expected ${expected}`);
        this.name = 'ValidationError';
    }
}

function validateAge(age: number): void {
    if (age < 0 || age > 150) {
        throw new ValidationError('age', age, 'number between 0 and 150');
    }
}
```

## Performance Guidelines

### General Performance
- **Avoid Premature Optimization**: Profile first, optimize second
- **Use Appropriate Data Structures**: Choose the right tool for the job
- **Memory Management**: Clean up resources, avoid memory leaks
- **Async Operations**: Use async/await properly, avoid blocking operations

### Database Operations
- **Query Optimization**: Use indexes, limit results, avoid N+1 queries
- **Connection Pooling**: Use connection pools for database connections
- **Transactions**: Use transactions for multi-step operations

## Security Practices

### Input Validation
- **Sanitize Inputs**: Always sanitize and validate user inputs
- **SQL Injection**: Use parameterized queries
- **XSS Prevention**: Escape HTML output
- **CSRF Protection**: Implement CSRF tokens for state-changing operations

### Authentication & Authorization
- **Secure Passwords**: Hash passwords with salt using bcrypt or similar
- **JWT Security**: Use secure JWT practices (short expiration, secure signing)
- **Principle of Least Privilege**: Grant minimum necessary permissions
- **Audit Logging**: Log security-related events

### Environment & Secrets
- **Environment Variables**: Use environment variables for configuration
- **Secret Management**: Never commit secrets to version control
- **Secure Defaults**: Use secure defaults for all configurations

## Testing Requirements

### Test Coverage
- **Minimum Coverage**: 80% code coverage required
- **Critical Path**: 100% coverage for critical business logic
- **Edge Cases**: Test error conditions and edge cases

### Test Structure
```typescript
describe('UserService', () => {
    describe('createUser', () => {
        it('should create user with valid data', async () => {
            // Arrange
            const userData = { name: 'John Doe', email: 'john@example.com' };
            
            // Act
            const user = await userService.createUser(userData);
            
            // Assert
            expect(user.id).toBeDefined();
            expect(user.name).toBe(userData.name);
        });

        it('should throw error for invalid email', async () => {
            // Arrange
            const userData = { name: 'John Doe', email: 'invalid-email' };
            
            // Act & Assert
            await expect(userService.createUser(userData))
                .rejects.toThrow(ValidationError);
        });
    });
});
```

### Test Types
- **Unit Tests**: Test individual functions/methods in isolation
- **Integration Tests**: Test component interactions
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Test performance requirements

## Code Review Checklist

### Before Submitting PR
- [ ] All tests pass locally
- [ ] Code follows project conventions
- [ ] Documentation updated
- [ ] No sensitive data in code
- [ ] Error handling implemented
- [ ] Performance considerations addressed

### During Code Review
- [ ] Code is readable and maintainable
- [ ] Business logic is correct
- [ ] Security concerns addressed
- [ ] Test coverage adequate
- [ ] Documentation accurate
- [ ] Breaking changes documented

## Monitoring & Observability

### Logging
- **Structured Logging**: Use JSON format for logs
- **Log Levels**: Use appropriate levels (DEBUG, INFO, WARN, ERROR)
- **Correlation IDs**: Include correlation IDs for tracing requests
- **Sensitive Data**: Never log sensitive information

### Metrics
- **Key Metrics**: Track response times, error rates, throughput
- **Business Metrics**: Track relevant business KPIs
- **Health Checks**: Implement health check endpoints
- **Alerting**: Set up alerts for critical issues

### Tracing
- **Distributed Tracing**: Use tracing for complex workflows
- **Performance Monitoring**: Monitor application performance
- **User Experience**: Track user-facing metrics

## Continuous Improvement

### Technical Debt
- **Identify Debt**: Regularly identify and document technical debt
- **Prioritize**: Prioritize debt based on impact and effort
- **Refactor**: Allocate time for refactoring in each sprint

### Learning & Development
- **Stay Updated**: Keep up with industry best practices
- **Share Knowledge**: Document learnings and share with team
- **Experiment**: Try new tools and techniques in controlled environments

## Enforcement

These rules are enforced through:
- **Automated Linting**: ESLint, Prettier, and custom rules
- **Pre-commit Hooks**: Quality gates before code commits
- **CI/CD Pipeline**: Automated checks in build process
- **Code Reviews**: Manual review by team members
- **Quality Metrics**: Regular reporting on code quality metrics