# GitHub Workflows

This directory contains the CI/CD workflows for the logger project.

## Active Workflows

### `ci.yml`
- **Trigger**: Push/PR to main or develop branches
- **Purpose**: Runs tests, linting, type checking, security audits, and builds
- **Matrix**: Tests on Node.js 18.x, 20.x, 22.x

### `auto-release.yml`
- **Trigger**: Push to main branch
- **Purpose**: Automatically handles releases when code is merged to main
- **Permissions**: ✅ Configured with `contents: write`, `packages: write`, `pull-requests: write`
- **Features**:
  - Determines version bump type from commit messages
  - Updates package.json version
  - Generates and updates CHANGELOG.md
  - Creates Git tags
  - Publishes to npm (if version doesn't exist)
  - Creates GitHub releases

## Version Bump Types

The `auto-release.yml` workflow determines the version bump type based on commit messages:

- **Major**: Contains `[major]` or `BREAKING CHANGE`
- **Minor**: Contains `[minor]`, `feat:`, or `feature:`
- **Patch**: All other commits (default)

## Repository Settings Required

To use the auto-release workflow, ensure:

1. **Actions Permissions**: Go to Settings > Actions > General
   - Set "Workflow permissions" to "Read and write permissions"
   - Check "Allow GitHub Actions to create and approve pull requests"

2. **NPM Token**: Add `NPM_TOKEN` to repository secrets
   - Go to Settings > Secrets and variables > Actions
   - Add new repository secret named `NPM_TOKEN`

## Usage

1. Merge your feature branch into `main`
2. The auto-release workflow will automatically:
   - Run all CI checks
   - Bump the version based on commit messages
   - Update the changelog with recent commits
   - Create a release and publish to npm

## Troubleshooting

**Fixed: 403 Permission Error** 🛠️
The workflow now includes proper permissions configuration to prevent the previous 403 error:
```yaml
permissions:
  contents: write
  packages: write  
  pull-requests: write
```

If you still get a 403 error when pushing:
- Check that workflow permissions are set correctly in repository settings
- Ensure the repository allows Actions to write to the repository
- Verify that the GITHUB_TOKEN has the necessary permissions
