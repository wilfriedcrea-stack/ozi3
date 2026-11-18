import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    build: {
      assetsDir: '',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
              if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('jszip')) return 'vendor-pdf';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('motion')) return 'vendor-motion';
              if (id.includes('react')) return 'vendor-react';
            }
          },
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'share-php-dev-middleware',
        configureServer(server) {
          server.middlewares.use('/share.php', (req, res) => {
            const reqUrl = new URL(req.url || '', 'http://localhost:3000');
            const title = reqUrl.searchParams.get('title') || reqUrl.searchParams.get('oeuvre') || 'cette œuvre';
            const slug = reqUrl.searchParams.get('oeuvre') || reqUrl.searchParams.get('series') || 'malick';
            const author = reqUrl.searchParams.get('author') || '';
            const desc = reqUrl.searchParams.get('desc') || '';
            const rawCover = reqUrl.searchParams.get('cover') || 'https://ozibd.net/REF.png';
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
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
