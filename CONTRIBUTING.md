# Contributing to @calphonse/logger

Thank you for your interest in contributing to @calphonse/logger! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.15.0

### Getting Started

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/logger.git
   cd logger
   ```

2. **Install pnpm (if not already installed)**
   ```bash
   npm install -g pnpm
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Set up pre-commit hooks (optional but recommended)**
   ```bash
   pnpm prepare
   ```

## Development Workflow

### Available Scripts

- `pnpm dev` - Start development mode with watch
- `pnpm build` - Build the project
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage
- `pnpm lint` - Check for linting issues
- `pnpm lint:fix` - Fix linting issues automatically
- `pnpm format` - Format code
- `pnpm check` - Run both linting and formatting checks
- `pnpm check:fix` - Fix both linting and formatting issues
- `pnpm type-check` - Run TypeScript type checking
- `pnpm clean` - Clean build artifacts

### Code Quality

This project uses [Biome](https://biomejs.dev/) for linting and formatting. Biome is a fast formatter and linter that replaces ESLint and Prettier.

#### Before Committing

Always run these commands before committing your changes:

```bash
# Fix all linting and formatting issues
pnpm check:fix

# Run tests to ensure nothing is broken
pnpm test

# Type check to ensure TypeScript is happy
pnpm type-check
```

#### IDE Integration

For the best development experience, install the Biome extension for your IDE:

- **VS Code**: [Biome](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
- **Vim/Neovim**: [nvim-biome](https://github.com/EdenEast/nvim-biome)
- **Other editors**: Check the [Biome documentation](https://biomejs.dev/guides/getting-started/)

### Testing

- Write tests for new features and bug fixes
- Ensure all tests pass before submitting a PR
- Aim for good test coverage
- Use descriptive test names

### TypeScript

- All code should be written in TypeScript
- Use strict TypeScript settings
- Provide proper type definitions
- Avoid using `any` type when possible

## Pull Request Guidelines

### Before Submitting a PR

1. **Ensure your code follows the project's style guidelines**
   ```bash
   pnpm check:fix
   ```

2. **Run the full test suite**
   ```bash
   pnpm test
   pnpm test:coverage
   ```

3. **Check TypeScript types**
   ```bash
   pnpm type-check
   ```

4. **Update documentation** if you've added new features or changed existing APIs

### PR Description

Please include:

- A clear description of the changes
- The problem being solved (if applicable)
- Any breaking changes
- Screenshots or examples (if UI-related)
- Related issue numbers

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
- `feat(logger): add support for custom log levels`
- `fix(types): correct return type for logger.child()`
- `docs(readme): update installation instructions`

## Code Style

### General Guidelines

- Use meaningful variable and function names
- Keep functions small and focused
- Add comments for complex logic
- Follow the existing code patterns

### TypeScript Guidelines

- Use interfaces for object shapes
- Prefer `const` over `let` when possible
- Use type guards for runtime type checking
- Avoid type assertions unless necessary

### Logger-Specific Guidelines

- Keep the logger API simple and intuitive
- Maintain backward compatibility when possible
- Consider performance implications
- Ensure proper error handling

## Reporting Issues

When reporting issues, please include:

- Node.js version
- pnpm version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages (if any)
- Code examples (if applicable)

## Getting Help

- Check existing issues and PRs
- Read the documentation
- Ask questions in discussions
- Join the community

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.
