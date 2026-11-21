import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import JSZip from 'jszip';
import { paystackRouter } from './server/routes/paystackRoutes';
import { studioDataRouter } from './server/routes/studioDataRoutes';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function addDistDirToZip(zip: JSZip, dirPath: string, rootPath: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, '/');
    if (entry.name.endsWith('.zip')) continue;
    if (relativePath === 'assets/aistudio' || relativePath.startsWith('assets/aistudio/')) continue;
    if (entry.isDirectory()) {
      addDistDirToZip(zip, fullPath, rootPath);
    } else if (entry.isFile()) {
      zip.file(relativePath, fs.readFileSync(fullPath), { binary: true, createFolders: false });
    }
  }
}

async function createServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // 1. JSON body parser with rawBody capture for Paystack Webhook HMAC verification
  app.use(express.json({
    limit: '15mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));

  // 3. Health & Diagnostic Check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'online',
      service: 'OZIBD Full-Stack Server',
      serverTime: new Date().toISOString(),
      modules: {
        paystack: true,
        subscriptions: true,
        premiumAccessControl: true,
        studioDataPersistence: true,
      },
    });
  });

  // 4. Mount Studio Persistence & Paystack Routes
  app.use('/api', studioDataRouter);
  app.use('/api/paystack', paystackRouter);
  app.use('/api/premium', paystackRouter);
  app.use('/api/artbooks', paystackRouter);

  // 4b. Direct LWS Pack ZIP Download Endpoint (generates fresh Windows/LWS DOS ZIP from dist/)
  app.get('/api/lws-pack/download', async (_req, res) => {
    try {
      const distDir = path.join(__dirname, 'dist');
      if (fs.existsSync(path.join(distDir, 'index.html'))) {
        const zip = new JSZip();
        addDistDirToZip(zip, distDir, distDir);
        const buffer = await zip.generateAsync({
          type: 'nodebuffer',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
          platform: 'DOS',
        });
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="ozibd-lws-dist.zip"');
        res.setHeader('Content-Length', String(buffer.length));
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).send(buffer);
      }

      const fallbackZip = path.join(__dirname, 'public', 'ozibd-lws-dist.zip');
      if (fs.existsSync(fallbackZip)) {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="ozibd-lws-dist.zip"');
        res.setHeader('Cache-Control', 'no-store');
        return res.sendFile(fallbackZip);
      }

      return res.status(404).json({ error: 'Pack LWS introuvable. Veuillez exécuter npm run build.' });
    } catch (err: any) {
      console.error('[OZIBD Server] Error generating LWS pack:', err);
      return res.status(500).json({ error: err?.message || 'Erreur génération ZIP' });
    }
  });

  // 5. OpenGraph Share Card Handler (/share.php) for social media previews
  app.get('/share.php', (req, res) => {
    const title = (req.query.title as string) || (req.query.oeuvre as string) || 'cette œuvre';
    const slug = (req.query.oeuvre as string) || (req.query.series as string) || 'malick';
    const author = (req.query.author as string) || '';
    const desc = (req.query.desc as string) || '';
    const rawCover = (req.query.cover as string) || 'https://ozibd.net/REF.png';
    const cover = rawCover.startsWith('data:') ? 'https://ozibd.net/REF.png' : rawCover;
    const shareTitle = `Allez découvrir "${title}"`;
    const shareDesc = desc
      ? `Allez découvrir "${title}" — ${desc}`
      : `Allez découvrir "${title}"${author ? ` de ${author}` : ''} sur la plateforme officielle OZI Webtoons, Mangas & BD !`;
    const targetUrl = `/#/oeuvre/${encodeURIComponent(slug)}`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${shareTitle.replace(/"/g, '&quot;')}</title>
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="OZI — Webtoons, Mangas & BD">
  <meta property="og:title" content="${shareTitle.replace(/"/g, '&quot;')}">
  <meta property="og:description" content="${shareDesc.replace(/"/g, '&quot;')}">
  <meta property="og:image" content="${cover.replace(/"/g, '&quot;')}">
</head>
<body style="background:#07080c;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <script>window.location.replace("${targetUrl}");</script>
</body>
</html>`);
  });

  // 6. Mode Vite Dev vs Production
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OZIBD Server] 🚀 Serveur Full-Stack démarré sur http://0.0.0.0:${PORT}`);
    console.log(`[OZIBD Server] 💳 Modules Paystack & Abonnements Premium actifs.`);
  });
}

createServer().catch((err) => {
  console.error('[OZIBD Server] Fatal error starting server:', err);
  process.exit(1);
});
