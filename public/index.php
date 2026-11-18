<?php
/**
 * Point d'entrée PHP de sécurité pour l'hébergement LWS (ozibd.net).
 * Garantit qu'Apache sert toujours l'application officielle OZI (index.html)
 * même si index.php est prioritaire sur index.html dans la configuration serveur.
 */

// 1. Si un paramètre de partage d'œuvre est présent, déléguer à share.php
if (isset($_GET['oeuvre']) && trim((string) $_GET['oeuvre']) !== '') {
    $shareFile = __DIR__ . '/share.php';
    if (file_exists($shareFile)) {
        require $shareFile;
        exit;
    }
}

// 2. Empêcher la mise en cache d'une ancienne page HTML (ex: ancien site ou cache CDN)
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// 3. Servir directement index.html (OZI) sans redirection
$indexHtml = __DIR__ . '/index.html';
if (file_exists($indexHtml)) {
    readfile($indexHtml);
    exit;
}

http_response_code(404);
echo '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>OZI — Chargement</title></head><body style="background:#07080c;color:#fff;font-family:sans-serif;text-align:center;padding:40px;"><h1>OZI — Webtoons, Mangas &amp; BD</h1><p>Le fichier index.html est introuvable à la racine de htdocs.</p></body></html>';
