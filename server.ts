import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { paystackRouter } from './server/routes/paystackRoutes';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // 1. JSON body parser with rawBody capture for Paystack Webhook HMAC verification
  app.use(express.json({
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
      },
    });
  });

  // 4. Mount Paystack & Premium Subscriptions Routes
  app.use('/api/paystack', paystackRouter);
  app.use('/api/premium', paystackRouter);

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
