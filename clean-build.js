const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning build cache...');

// Remove build artifacts
const buildDirs = [
  'dist',
  'node_modules/.tmp',
  '.vite'
];

buildDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`Removing ${dir}...`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
});

// Clear TypeScript cache
const tsCacheDir = path.join(__dirname, 'node_modules', '.tmp');
if (fs.existsSync(tsCacheDir)) {
  console.log('Removing TypeScript cache...');
  fs.rmSync(tsCacheDir, { recursive: true, force: true });
}

console.log('✅ Clean complete. Running build...');

try {
  execSync('pnpm run build', { stdio: 'inherit' });
  console.log('✅ Build successful!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
