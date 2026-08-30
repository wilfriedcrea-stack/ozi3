import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

async function addFolderToZip(zip, folderPath, rootPath) {
  const items = fs.readdirSync(folderPath);
  for (const item of items) {
    const fullPath = path.join(folderPath, item);
    const relativePath = path.relative(rootPath, fullPath);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      await addFolderToZip(zip, fullPath, rootPath);
    } else {
      const content = fs.readFileSync(fullPath);
      zip.file(relativePath, content);
    }
  }
}

async function createZip() {
  const distDir = path.resolve('dist');
  if (!fs.existsSync(distDir)) {
    console.error('Dist directory does not exist!');
    return;
  }
  const zip = new JSZip();
  await addFolderToZip(zip, distDir, distDir);

  const outputZipPath = path.resolve('public', 'ozibd-lws-dist.zip');
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(outputZipPath, buffer);
  console.log(`Successfully created ${outputZipPath} (${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`);
}

createZip().catch(console.error);
