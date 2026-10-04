<?php
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$title = isset($_GET['title']) && trim($_GET['title']) !== '' ? trim($_GET['title']) : '';
$slug = isset($_GET['oeuvre']) && trim($_GET['oeuvre']) !== '' ? trim($_GET['oeuvre']) : (isset($_GET['series']) ? trim($_GET['series']) : '');
$author = isset($_GET['author']) ? trim($_GET['author']) : '';
$cover = isset($_GET['cover']) ? trim($_GET['cover']) : '';
$synopsis = isset($_GET['desc']) && trim($_GET['desc']) !== '' ? trim($_GET['desc']) : '';

// Fallback title from slug if empty
if (empty($title) && !empty($slug)) {
    $title = ucwords(str_replace(['-', '_'], ' ', $slug));
}
if (empty($title)) {
    $title = "cette œuvre";
}

// Exact message requested by user: Allez découvrir "Nom de l'oeuvre"
$shareTitle = 'Allez découvrir "' . $title . '"';
$shareDesc = !empty($synopsis)
    ? 'Allez découvrir "' . $title . '" — ' . $synopsis
    : 'Allez découvrir "' . $title . '"' . ($author ? ' de ' . $author : '') . ' sur la plateforme officielle OZI Webtoons, Mangas & BD !';

$host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'ozibd.net';
$protocol = 'https://';

// Target URL for human browsers (SPA hash route)
$targetUrl = $protocol . $host . '/#/oeuvre/' . rawurlencode($slug ?: 'malick');

// IMPORTANT: og:url MUST be the exact current share.php URL (including query string)
// If og:url points to /#/oeuvre/..., Facebook strips the #hash and scrapes index.html instead!
$requestUri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : ('/share.php?oeuvre=' . rawurlencode($slug));
$currentShareUrl = $protocol . $host . $requestUri;

// Validate and normalize cover image URL (ignore data: URIs, force https)
if (empty($cover) || strpos($cover, 'data:') === 0) {
    $cover = $protocol . $host . '/REF.png';
} elseif (strpos($cover, 'http://') === 0) {
    $cover = 'https://' . substr($cover, 7);
} elseif (strpos($cover, 'https://') !== 0) {
    $cover = $protocol . $host . '/' . ltrim($cover, '/');
}

// Detect social media scrapers / bots so we never redirect them away from the Open Graph tags
$userAgent = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
$isSocialBot = (bool) preg_match('/facebookexternalhit|Facebot|Meta-ExternalAgent|Twitterbot|WhatsApp|LinkedInBot|Discordbot|Slackbot|TelegramBot|Pinterest|Googlebot|bingbot/i', $userAgent);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($shareTitle, ENT_QUOTES, 'UTF-8') ?></title>
  <meta name="description" content="<?= htmlspecialchars($shareDesc, ENT_QUOTES, 'UTF-8') ?>">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="OZI — Webtoons, Mangas & BD">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="<?= htmlspecialchars($shareTitle, ENT_QUOTES, 'UTF-8') ?>">
  <meta property="og:description" content="<?= htmlspecialchars($shareDesc, ENT_QUOTES, 'UTF-8') ?>">
  <meta property="og:image" content="<?= htmlspecialchars($cover, ENT_QUOTES, 'UTF-8') ?>">
  <meta property="og:image:secure_url" content="<?= htmlspecialchars($cover, ENT_QUOTES, 'UTF-8') ?>">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="<?= htmlspecialchars($shareTitle, ENT_QUOTES, 'UTF-8') ?>">
  <meta property="og:url" content="<?= htmlspecialchars($currentShareUrl, ENT_QUOTES, 'UTF-8') ?>">

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@OZI_BD">
  <meta name="twitter:title" content="<?= htmlspecialchars($shareTitle, ENT_QUOTES, 'UTF-8') ?>">
  <meta name="twitter:description" content="<?= htmlspecialchars($shareDesc, ENT_QUOTES, 'UTF-8') ?>">
  <meta name="twitter:image" content="<?= htmlspecialchars($cover, ENT_QUOTES, 'UTF-8') ?>">
</head>
<body style="background:#07080c;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;text-align:center;">
<?php if (!$isSocialBot): ?>
  <script>
    window.location.replace("<?= addslashes($targetUrl) ?>");
  </script>
<?php endif; ?>
  <div style="max-width:440px;padding:32px;background:#10111a;border:1px solid #232536;border-radius:24px;box-shadow:0 12px 30px rgba(0,0,0,0.5);">
    <img src="<?= htmlspecialchars($cover, ENT_QUOTES, 'UTF-8') ?>" alt="<?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?>" style="width:100%;max-height:220px;object-fit:cover;border-radius:16px;margin-bottom:16px;">
    <h1 style="font-size:20px;font-weight:800;margin:0 0 8px 0;color:#ffffff;"><?= htmlspecialchars($shareTitle, ENT_QUOTES, 'UTF-8') ?></h1>
    <p style="font-size:13px;color:#94a3b8;margin:0 0 20px 0;line-height:1.5;"><?= htmlspecialchars($shareDesc, ENT_QUOTES, 'UTF-8') ?></p>
    <a href="<?= htmlspecialchars($targetUrl, ENT_QUOTES, 'UTF-8') ?>" style="display:inline-block;padding:12px 24px;border-radius:999px;background:#ff8679;color:#07080c;font-weight:800;font-size:14px;text-decoration:none;">Découvrir <?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?> sur OZI</a>
  </div>
</body>
</html>
