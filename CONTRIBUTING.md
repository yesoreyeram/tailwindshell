# Contributing to Tailwindshell

Thank you for your interest in contributing to Tailwindshell! This document provides guidelines and instructions for contributing.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm, yarn, or pnpm
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/tailwindshell.git
   cd tailwindshell
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running in Development Mode

```bash
npm run dev
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check
```

### Building

```bash
npm run build
```

## Contribution Guidelines

### Code Style

- Follow the existing code style
- Use TypeScript for all code
- Write meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Commit Messages

Use conventional commit format:

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process or tooling changes

Example:
```
feat(parser): add support for background execution operator

Implements the _bg_ operator for running commands in background.
Includes tests and documentation updates.

Closes #123
```

### Pull Request Process

1. Update documentation for any changed functionality
2. Add tests for new features
3. Ensure all tests pass
4. Update the README if needed
5. Follow the PR template
6. Request review from maintainers

### Testing Requirements

- Unit tests for all new functionality
- Integration tests for complex features
- Maintain or improve code coverage
- All tests must pass before merging

### Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Include code examples
- Update type definitions

## Project Structure

```
tailwindshell/
├── src/
│   ├── index.ts              # Main export
│   ├── Shell.tsx             # Shell component
│   ├── parser/               # Command parser
│   ├── executor/             # Command executor
│   ├── features/             # Advanced features
│   ├── types/                # TypeScript types
│   └── utils/                # Utility functions
├── tests/                    # Test files
├── examples/                 # Example applications
├── docs/                     # Documentation
└── package.json
```

## Security

### Reporting Security Issues

Please report security vulnerabilities to security@tailwindshell.dev rather than using the public issue tracker.

### Security Guidelines

- Never execute untrusted user input
- Always use security policies
- Validate and sanitize all inputs
- Follow principle of least privilege
- Keep dependencies updated

## Adding New Features

1. Open an issue to discuss the feature
2. Get approval from maintainers
3. Implement the feature
4. Add comprehensive tests
5. Update documentation
6. Submit a pull request

## Bug Reports

When reporting bugs, please include:

- Description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node version, etc.)
- Code samples if applicable

## Feature Requests

Feature requests are welcome! Please:

- Search existing issues first
- Provide a clear use case
- Explain why the feature is valuable
- Include examples if possible

## Questions

For questions:

- Check the documentation
- Search existing issues
- Ask in GitHub Discussions
- Join our Discord community

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Project website

Thank you for contributing to Tailwindshell!
