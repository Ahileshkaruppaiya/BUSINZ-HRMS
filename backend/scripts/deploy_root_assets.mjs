import fs from 'fs';
import path from 'path';

const distPath = path.resolve('frontend/dist');
const rootPath = path.resolve('.');
const rootAssetsPath = path.resolve('assets');
const distAssetsPath = path.resolve('frontend/dist/assets');

if (!fs.existsSync(distPath)) {
  console.error('frontend/dist does not exist! Please run npm run build first.');
  process.exit(1);
}

// 1. Copy index.html
fs.copyFileSync(path.join(distPath, 'index.html'), path.join(rootPath, 'index.html'));
console.log('Copied frontend/dist/index.html -> ./index.html');

// 2. Ensure root assets directory exists
if (!fs.existsSync(rootAssetsPath)) {
  fs.mkdirSync(rootAssetsPath, { recursive: true });
}

// 3. Clean old files in root assets/
const existingRootAssets = fs.readdirSync(rootAssetsPath);
for (const file of existingRootAssets) {
  if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.map')) {
    fs.unlinkSync(path.join(rootAssetsPath, file));
  }
}
console.log(`Cleaned ${existingRootAssets.length} previous asset files from ./assets/`);

// 4. Copy new asset files from frontend/dist/assets/
const newDistAssets = fs.readdirSync(distAssetsPath);
for (const file of newDistAssets) {
  fs.copyFileSync(path.join(distAssetsPath, file), path.join(rootAssetsPath, file));
}
console.log(`Copied ${newDistAssets.length} new asset files to ./assets/`);
console.log('Root assets deployment complete!');
