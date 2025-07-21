const { execSync } = require('node:child_process');

// console.info('🔍 Debugging Quality Check Failures...');

const steps = [
  { cmd: 'pnpm install', name: 'Install dependencies' },
  { cmd: 'pnpm clean', name: 'Clean build artifacts' },
  { cmd: 'pnpm lint', name: 'Lint code' },
  { cmd: 'pnpm format', name: 'Format code' },
  { cmd: 'pnpm type-check', name: 'Type check' },
  { cmd: 'pnpm build', name: 'Build project' },
  { cmd: 'pnpm test', name: 'Run tests' },
];

for (const step of steps) {
  try {
    // console.info(`\n📋 ${step.name}...`);
    const output = execSync(step.cmd, { encoding: 'utf8', stdio: 'pipe' });
    // console.info(`✅ ${step.name} - SUCCESS`);
    if (output.trim()) {
      // console.info(output);
    }
  } catch (error) {
    console.error(`❌ ${step.name} - FAILED`);
    console.error('Error output:');
    console.error(error.stdout || error.stderr || error.message);
    console.error('\n💡 This step failed. Fix the issues above and try again.');
    process.exit(1);
  }
}

// console.info('\n🎉 All quality checks passed!');
