# Contributing to Software Entropy

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/software-entropy.git`
3. Install dependencies: `npm install`
4. Build the project: `npm run build`
5. Run tests: `npm test`

## Development Workflow

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Write/update tests
4. Ensure tests pass: `npm test`
5. Build and verify: `npm run build`
6. Commit with clear messages
7. Push and create a pull request

## Code Style

- TypeScript with strict mode enabled
- Follow existing code patterns
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and small

## Adding New Rules

Rules are the core of Software Entropy. To add a new rule:

1. Create a new file in `src/rules/` (e.g., `MyNewRule.ts`)
2. Extend `BaseRule`:
```typescript
import { BaseRule } from './Rule';
import { RuleContext, CodeSmell } from '../types';

export class MyNewRule extends BaseRule {
  name = 'my-new-rule';
  description = 'Detects my code smell';

  run(context: RuleContext): CodeSmell[] {
    const smells: CodeSmell[] = [];
    // Your detection logic here
    return smells;
  }
}
```

3. Register in `src/rules/index.ts`
4. Add tests in `src/rules/__tests__/MyNewRule.test.ts`
5. Update documentation

## Priority Contribution Areas

### High Priority
- **Security Rules**: SQL injection, XSS, hardcoded secrets, authentication flaws
- **Code Quality Rules**: Duplicate code, complexity metrics, dead code
- **AST Parsing**: TypeScript/JavaScript AST support for deeper analysis
- **Performance**: Parallel processing, caching, optimization

### Medium Priority
- **Language Support**: Python AST, Go, Rust, Ruby
- **Dependency Scanning**: Package.json, requirements.txt parsing
- **More Reporters**: HTML, Markdown, PDF output
- **IDE Integration**: VS Code extension, JetBrains plugin

### Low Priority
- **Web Dashboard**: Optional web UI
- **Enterprise Features**: Team management, compliance reporting
- **Advanced Analysis**: Cross-file taint analysis, architectural smells

## Writing Tests

- Use Jest for testing
- Test files: `src/**/__tests__/**/*.test.ts`
- Aim for >80% code coverage
- Test both positive and negative cases
- Mock external dependencies (git, file system)

Example:
```typescript
describe('MyNewRule', () => {
  it('should detect the code smell', () => {
    const rule = new MyNewRule();
    const context: RuleContext = {
      file: 'test.js',
      content: 'code here',
      lines: ['line1', 'line2']
    };
    const smells = rule.run(context);
    expect(smells).toHaveLength(1);
  });
});
```

## Documentation

- Update README.md for user-facing features
- Add JSDoc comments for public APIs
- Update ARCHITECTURE.md for architectural changes
- Keep examples up-to-date

## Pull Request Process

1. **Title**: Clear, descriptive title
2. **Description**: Explain what and why
3. **Tests**: All tests must pass
4. **Coverage**: Maintain or improve test coverage
5. **Documentation**: Update relevant docs
6. **Breaking Changes**: Clearly document any breaking changes

## Code Review

- Be respectful and constructive
- Focus on code quality and maintainability
- Ask questions if something is unclear
- Suggest improvements, don't just point out problems

## Questions?

- Open an issue for bugs or feature requests
- Check existing issues and discussions
- Review documentation in `/docs`

Thank you for contributing to Software Entropy! 🎉

