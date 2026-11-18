import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const JSZip = require('jszip');

function addDirectoryToZip(zip, dirPath, rootPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, '/');

    if (entry.name.endsWith('.zip')) {
      continue;
    }
    if (relativePath === 'assets/aistudio' || relativePath.startsWith('assets/aistudio/')) {
      continue;
    }

    if (entry.isDirectory()) {
      addDirectoryToZip(zip, fullPath, rootPath);
    } else if (entry.isFile()) {
      const fileData = fs.readFileSync(fullPath);
      zip.file(relativePath, fileData, { binary: true, createFolders: false });
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

  console.log('Packing dist into Windows/LWS DOS-compatible zip...');
  const zip = new JSZip();
  addDirectoryToZip(zip, distDir, distDir);

  const content = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
    platform: 'DOS',
  });

  fs.writeFileSync(targetZipPath1, content);
  fs.writeFileSync(targetZipPath2, content);
  fs.writeFileSync(distZipPath1, content);
  fs.writeFileSync(distZipPath2, content);

  const sizeMb = (content.length / (1024 * 1024)).toFixed(2);
  console.log(`Successfully generated Windows/LWS DOS-compatible packs:`);
  console.log(`- ${targetZipPath1} (${sizeMb} MB)`);
  console.log(`- ${targetZipPath2} (${sizeMb} MB)`);
}

createLwsZip().catch((err) => {
  console.error('Error generating LWS zip:', err);
  process.exit(1);
});
