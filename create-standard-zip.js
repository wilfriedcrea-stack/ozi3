import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

async function createStandardZip() {
  const distDir = path.resolve('dist');
  const outputZipPath = path.resolve('public', 'ozibd-lws-dist.zip');
  
  if (!fs.existsSync(distDir)) {
    console.error('dist directory does not exist');
    return;
  }

  const output = fs.createWriteStream(outputZipPath);
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Standard Deflate compatible with cPanel / LWS unzip
    forceZip64: false
  });

  output.on('close', () => {
    console.log(`Standard ZIP created: ${outputZipPath} (${(archive.pointer() / (1024 * 1024)).toFixed(2)} MB)`);
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);
  // append all files from dist directory to root of zip
  archive.directory(distDir, false);
  await archive.finalize();
}

createStandardZip().catch(console.error);
