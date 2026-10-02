<?php
header('Content-Type: text/html; charset=utf-8');

$title = isset($_GET['title']) && trim($_GET['title']) !== '' ? trim($_GET['title']) : '';
$slug = isset($_GET['oeuvre']) && trim($_GET['oeuvre']) !== '' ? trim($_GET['oeuvre']) : (isset($_GET['series']) ? trim($_GET['series']) : '');
$author = isset($_GET['author']) ? trim($_GET['author']) : '';
$cover = isset($_GET['cover']) ? trim($_GET['cover']) : '';

// Fallback title from slug if empty
if (empty($title) && !empty($slug)) {
    $title = ucwords(str_replace(['-', '_'], ' ', $slug));
}
if (empty($title)) {
    $title = "cette œuvre";
}

$shareTitle = 'Allez découvrir "' . $title . '" sur OZI !';
$shareDesc = 'Lisez "' . $title . '"' . ($author ? ' de ' . $author : '') . ' en haute définition sur la plateforme officielle OZI.';

// Determine full target URL (hash route inside OZI SPA)
$host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'ozibd.net';
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443) ? 'https://' : 'https://';
$targetUrl = $protocol . $host . '/#/oeuvre/' . rawurlencode($slug ?: 'malick');

// Default fallback image if none provided
if (empty($cover)) {
    $cover = $protocol . $host . '/images/ozi-logo.png';
} elseif (strpos($cover, 'http') !== 0) {
    $cover = $protocol . $host . '/' . ltrim($cover, '/');
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= htmlspecialchars($shareTitle) ?></title>
  <meta name="description" content="<?= htmlspecialchars($shareDesc) ?>">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="book">
  <meta property="og:site_name" content="OZI">
  <meta property="og:title" content="<?= htmlspecialchars($shareTitle) ?>">
  <meta property="og:description" content="<?= htmlspecialchars($shareDesc) ?>">
  <meta property="og:image" content="<?= htmlspecialchars($cover) ?>">
  <meta property="og:image:alt" content="<?= htmlspecialchars($title) ?>">
  <meta property="og:url" content="<?= htmlspecialchars($targetUrl) ?>">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@OZI_BD">
  <meta name="twitter:title" content="<?= htmlspecialchars($shareTitle) ?>">
  <meta name="twitter:description" content="<?= htmlspecialchars($shareDesc) ?>">
  <meta name="twitter:image" content="<?= htmlspecialchars($cover) ?>">

  <!-- Immediate Browser Redirect to the work -->
  <meta http-equiv="refresh" content="0;url=<?= htmlspecialchars($targetUrl) ?>">
  <link rel="canonical" href="<?= htmlspecialchars($targetUrl) ?>">
</head>
<body style="background:#07080c;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;text-align:center;">
  <script>
    window.location.replace("<?= addslashes($targetUrl) ?>");
  </script>
  <div style="max-width:420px;padding:32px;background:#10111a;border:1px solid #232536;border-radius:24px;box-shadow:0 12px 30px rgba(0,0,0,0.5);">
    <div style="width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,#ff8679,#ffa296);display:flex;align-items:center;justify-content:center;margin:0 auto 16px auto;font-weight:900;font-size:24px;color:#07080c;">OZI</div>
    <h1 style="font-size:18px;font-weight:800;margin:0 0 8px 0;color:#ffffff;"><?= htmlspecialchars($shareTitle) ?></h1>
    <p style="font-size:13px;color:#94a3b8;margin:0 0 20px 0;line-height:1.5;">Redirection vers l'œuvre en cours...</p>
    <a href="<?= htmlspecialchars($targetUrl) ?>" style="display:inline-block;padding:10px 20px;border-radius:999px;background:#ff8679;color:#07080c;font-weight:700;font-size:13px;text-decoration:none;">Accéder à <?= htmlspecialchars($title) ?></a>
  </div>
</body>
</html>
