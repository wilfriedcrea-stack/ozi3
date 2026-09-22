import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const JSZip = require('jszip');

async function addDirectoryToZip(zip, dirPath, rootPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, '/');

    if (entry.name.endsWith('.zip')) {
      // Skip any zip files to avoid recursion
      continue;
    }

    if (entry.isDirectory()) {
      await addDirectoryToZip(zip, fullPath, rootPath);
    } else if (entry.isFile()) {
      const fileData = fs.readFileSync(fullPath);
      zip.file(relativePath, fileData);
    }
  }
}

async function createLwsZip() {
  const distDir = path.resolve('dist');
  const publicDir = path.resolve('public');
  const targetZipPath1 = path.join(publicDir, 'ozibd-lws-dist.zip');
  const targetZipPath2 = path.join(publicDir, 'ozi-lws-dist.zip');
  const distZipPath1 = path.join(distDir, 'ozibd-lws-dist.zip');
  const distZipPath2 = path.join(distDir, 'ozi-lws-dist.zip');

  if (!fs.existsSync(distDir)) {
    console.error('Dist directory does not exist. Run npm run build first.');
    process.exit(1);
  }

  console.log('Packing dist into zip...');
  const zip = new JSZip();

  // Add all files recursively from dist
  await addDirectoryToZip(zip, distDir, distDir);

  // Generate the zip buffer
  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  fs.writeFileSync(targetZipPath1, content);
  fs.writeFileSync(targetZipPath2, content);
  fs.writeFileSync(distZipPath1, content);
  fs.writeFileSync(distZipPath2, content);

  console.log(`Successfully generated LWS packs:`);
  console.log(`- ${targetZipPath1} (${(content.length / (1024 * 1024)).toFixed(2)} MB)`);
  console.log(`- ${targetZipPath2} (${(content.length / (1024 * 1024)).toFixed(2)} MB)`);
}

createLwsZip().catch(err => {
  console.error('Error generating LWS zip:', err);
  process.exit(1);
});
