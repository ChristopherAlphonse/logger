# Release Automation Guide

This repository uses **semantic-release** with enterprise-grade automation for publishing to npm and creating GitHub releases.

## How It Works

### Automatic Releases (Minor/Patch)

- Push commits with conventional commit messages to `main`
- CI runs quality checks, tests, and builds
- For `feat:` (minor) and `fix:` (patch) commits, semantic-release automatically:
  - Bumps version in `package.json`
  - Updates `CHANGELOG.md`
  - Publishes to npm
  - Creates GitHub release
  - Commits version bump back to main

### Major Release Review Process

- Push commits with `BREAKING CHANGE` or similar to `main`
- System detects major version bump is needed
- **Automatically creates a PR** for owner review
- PR includes:
  - Breaking changes summary
  - Review checklist
  - Clear approval requirement
- Merge PR to execute the major release

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Examples

**Minor release (new feature):**

```
feat: add colored output support for error messages
```

**Patch release (bug fix):**

```
fix: resolve timestamp formatting issue in logger
```

**Major release (breaking change):**

```
feat!: redesign logger API with new configuration format

BREAKING CHANGE: Logger configuration now requires an options object instead of separate parameters
```

## Enterprise Safeguards

### Quality Gates

- Biome linting and formatting
- TypeScript type checking
- Jest test suite with coverage
- Build verification
- Security audit

### Release Protection

- Major versions require manual PR approval
- Automatic duplicate publish prevention
- Version conflict detection
- Rollback capability via git tags

### Monitoring

- GitHub Actions status checks
- Release notifications
- Build artifact preservation
- Coverage reporting

## Required Setup

### Repository Secrets

Add these in **Settings → Secrets and variables → Actions**:

1. **`NPM_TOKEN`** - npm publish token with access to `@calphonse/logger`

   ```bash
   # Generate at https://www.npmjs.com/settings/tokens
   # Choose "Automation" token type
   ```

### Branch Protection (Recommended)

Enable in **Settings → Branches** for `main`:

- Require a pull request before merging
- Require status checks to pass before merging
- Require up-to-date branches before merging
- Required status checks:
  - `quality` (CI workflow)
  - `security` (CI workflow)

## Development Workflow

1. **Create feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes with conventional commits**

   ```bash
   git commit -m "feat: add new logging level"
   ```

3. **Open PR to main**
   - CI automatically runs quality checks
   - All checks must pass for merge

4. **Merge to main**
   - For minor/patch: Automatic release in ~2-3 minutes
   - For major: PR created for review, merge that PR to release

## Troubleshooting

### Release didn't trigger

- Check commit message follows conventional format
- Verify `NPM_TOKEN` secret is configured
- Check GitHub Actions logs for errors

### Major release PR not created

- Ensure commit contains `BREAKING CHANGE` in footer
- Or use `feat!:` or `fix!:` syntax
- Check semantic-release workflow logs

### Publish failed

- Verify npm token has publish permissions
- Check if version already exists on npm
- Review package.json `name` and `version` fields

## Manual Commands

**Test release locally (dry-run):**

```bash
pnpm install
pnpm build
npx semantic-release --dry-run
```

**Run quality checks:**

```bash
pnpm quality
```

**Emergency manual release:**
Use the "Auto Release (manual)" workflow via GitHub Actions UI for emergency releases outside the normal flow.

---

## Quick Reference

| Commit Type | Version Bump | Auto-Release |
|-------------|--------------|--------------|
| `fix:` | Patch | Yes |
| `feat:` | Minor | Yes |
| `feat!:` or `BREAKING CHANGE` | Major | Creates PR |
| `docs:`, `style:`, `test:` | None | No |

**Remember**: Every commit to `main` is a potential release. Use descriptive, conventional commit messages!
