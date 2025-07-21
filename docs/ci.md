# GitHub Workflows

This repository uses a set of GitHub Actions workflows to automate various aspects of the development and release process.

## Workflow Overview

### 1. **CI** (`ci.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests to `main`/`develop`

Runs the core quality checks:
- ✅ Linting and formatting (Biome)
- ✅ Type checking (TypeScript)
- ✅ Tests with coverage (Jest)
- ✅ Security audit (pnpm audit)
- ✅ Build verification
- ✅ Multi-node version testing (18.x, 20.x, 22.x)

### 2. **Release** (`release.yml`)
**Triggers:** Push to `main` with version tags (e.g., `v1.2.3`)

Handles manual releases:
- Extracts version from git tag
- Updates package.json version
- Publishes to npm
- Creates GitHub release

### 3. **Publish on Merge** (`publish-on-merge.yml`)
**Triggers:** PR merged to `main` with `publish` label

Automatically publishes when PR is merged:
- Checks if version already exists on npm
- Publishes to npm if version is new
- Creates git tag
- Creates GitHub release
- Comments on PR if version already exists

### 4. **Version Bump** (`version-bump.yml`)
**Triggers:** PR merged to `main` with `version-bump` label

Automatically bumps version and updates changelog:
- Bumps version based on PR labels (`major`, `minor`, `patch`)
- Updates CHANGELOG.md
- Commits and pushes changes
- Comments on PR with next steps

### 5. **Dependencies** (`dependencies.yml`)
**Triggers:** Scheduled (weekly), manual, or dependency file changes

Monitors dependencies and security:
- Checks for outdated dependencies
- Runs security audits
- Creates issues for updates/vulnerabilities
- Runs automatically every Monday

## How to Use

### Publishing a New Version

#### Option 1: Manual Release (Recommended for major releases)
1. Create a new branch for your changes
2. Make your changes and commit them
3. Create a PR to `main`
4. Once merged, create a version tag:
   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```
5. The release workflow will automatically publish to npm

#### Option 2: Automatic Release on Merge
1. Create a new branch for your changes
2. Make your changes and commit them
3. Create a PR to `main`
4. Add the `publish` label to the PR
5. Merge the PR - it will automatically publish to npm

### Version Bumping

1. Create a PR with your changes
2. Add one of these labels to the PR:
   - `version-bump` + `major` - for breaking changes
   - `version-bump` + `minor` - for new features
   - `version-bump` + `patch` - for bug fixes
   - `version-bump` only - defaults to patch
3. Merge the PR
4. The version will be automatically bumped and CHANGELOG.md updated

### Dependency Management

The dependencies workflow runs automatically and will:
- Create issues for outdated dependencies
- Create issues for security vulnerabilities
- Run weekly on Mondays
- Can be triggered manually via GitHub Actions

## Labels

Use these labels on your PRs to trigger specific workflows:

- `publish` - Automatically publish to npm when merged
- `version-bump` - Bump version and update changelog
- `major` - Major version bump (breaking changes)
- `minor` - Minor version bump (new features)
- `patch` - Patch version bump (bug fixes)

## Secrets Required

Make sure these secrets are configured in your repository:

- `NPM_TOKEN` - NPM authentication token for publishing
- `GITHUB_TOKEN` - Automatically provided by GitHub

## Example Workflow

Here's a typical workflow for a new feature:

1. **Create feature branch:**
   ```bash
   git checkout -b feature/new-logging-level
   ```

2. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "feat: add new logging level"
   ```

3. **Create PR with labels:**
   - Add `version-bump` and `minor` labels
   - Add `publish` label if you want to publish immediately

4. **Merge PR:**
   - Version will be bumped automatically
   - CHANGELOG.md will be updated
   - If `publish` label was added, it will be published to npm

## Troubleshooting

### Version Already Exists
If you get an error that the version already exists on npm:
1. Update the version in `package.json`
2. Create a new PR with the updated version
3. Add the `publish` label

### Workflow Not Triggering
- Check that the PR is targeting the correct branch (`main`)
- Verify the labels are spelled correctly
- Ensure the workflow files are in the `.github/workflows/` directory

### Publishing Fails
- Check that `NPM_TOKEN` secret is configured
- Verify the package name in `package.json` matches your npm package
- Ensure you have publish permissions on npm
