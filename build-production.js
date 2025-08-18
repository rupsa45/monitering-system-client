const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build...');

// Remove build artifacts
const buildDirs = ['dist', 'node_modules/.tmp', '.vite'];
buildDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`Removing ${dir}...`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
});

try {
  // Skip TypeScript compilation and go straight to Vite build
  console.log('📦 Building with Vite (skipping TypeScript checks)...');
  execSync('npx vite build --mode production', { 
    stdio: 'inherit',
    env: { ...process.env, SKIP_PREFLIGHT_CHECK: 'true' }
  });
  
  console.log('✅ Production build successful!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
