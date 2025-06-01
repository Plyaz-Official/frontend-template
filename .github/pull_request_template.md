# Pull Request Template

## Jira Ticket

- **Ticket**: [PLYENG-XXX](https://plyaz.atlassian.net/browse/PLYAZ-XXX)
- **Epic**: [PLYENG-XXX](https://plyaz.atlassian.net/browse/PLYAZ-XXX) (if applicable)

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature with API changes or that would cause existing functionality to not work as expected)
- [ ] 🔨 Refactoring (code improvement with no functional changes)
- [ ] 📚 Documentation update
- [ ] 🧪 Test update
- [ ] 🛠️ Build/CI update
- [ ] 🧹 Chore (dependency updates, maintenance tasks, etc.)

## Approval Checklist

All pull requests must satisfy the following criteria before being considered for approval:

### 1. Tests

- [ ] New tests added for all new functionality
- [ ] Minimum 90% test coverage for modified code
- [ ] All existing tests passing without failures
- [ ] Edge cases and error conditions properly tested

### 2. Documentation

- [ ] Code is properly documented with JSDoc comments
- [ ] README files updated if necessary
- [ ] Architecture documentation updated for structural changes before any code written
- [ ] Storybook entries created/updated for UI components
- [ ] API endpoints documented if modified or added
- [ ] Ensure that the architecture has to be updated or created on the respective stack:
  - [Backend](https://plyaz.atlassian.net/wiki/spaces/SD/folder/950466)
  - [Frontend](https://plyaz.atlassian.net/wiki/spaces/SD/folder/655573)
  - [Blockchain](https://plyaz.atlassian.net/wiki/spaces/SD/folder/753881)
  - [Infrastructure](https://plyaz.atlassian.net/wiki/spaces/SD/folder/4096013)

### 3. Quality

- [ ] No linting errors or warnings (ESLint/TSLint)
- [ ] Proper code formatting (Prettier)
- [ ] TypeScript types properly defined and used
- [ ] No code smells or anti-patterns
- [ ] Adherence to project coding standards
- [ ] Responsive design for frontend components

### 4. Review

- [ ] At least one approval from another developer
- [ ] All review comments addressed with changes or explanations
- [ ] Critical changes require architect approval
- [ ] Security-sensitive changes require CTO approval

### 5. Dependencies

- [ ] No unnecessary dependencies added
- [ ] Dependencies audited for security vulnerabilities
- [ ] Package versions follow our version policy
- [ ] Impact on bundle size assessed for frontend dependencies

### 6. Performance

- [ ] No obvious performance issues introduced
- [ ] Database queries optimized for efficiency
- [ ] Frontend components optimized for rendering performance
- [ ] API endpoints respond within expected timeframes