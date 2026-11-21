<?php
/**
 * OZI Webtoon Studio - LWS Studio Data Persistence & Auth API (ozibd.net)
 * Permet d'enregistrer durablement les artistes, bannières, artbooks et paramètres
 * directement sur l'hébergeur LWS avec session Studio authentifiée (sans exiger Google/email).
 */

$origin = isset($_SERVER['HTTP_ORIGIN']) ? trim((string)$_SERVER['HTTP_ORIGIN']) : '';
$host = isset($_SERVER['HTTP_HOST']) ? trim((string)$_SERVER['HTTP_HOST']) : '';

// Autoriser uniquement les origines de confiance (même domaine / ozibd.net / localhost)
$isAllowedOrigin = false;
if ($origin !== '') {
    $parsedOriginHost = parse_url($origin, PHP_URL_HOST);
    $parsedServerHost = explode(':', $host)[0];
    if ($parsedOriginHost && (
        strcasecmp($parsedOriginHost, $parsedServerHost) === 0 ||
        preg_match('/(^|\.)ozibd\.net$/i', $parsedOriginHost) ||
        $parsedOriginHost === 'localhost' ||
        $parsedOriginHost === '127.0.0.1'
    )) {
        $isAllowedOrigin = true;
    }
}

if ($isAllowedOrigin) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
    header("Vary: Origin");
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");

$rootDir = dirname(__DIR__);
$dataDir = $rootDir . '/data';
$dataFile = $dataDir . '/studio-data.json';
$authFile = $dataDir . '/studio-auth.json';
$secretFile = $dataDir . '/studio-secret.key';

if (!file_exists($dataDir)) {
    if (!@mkdir($dataDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Impossible de créer le répertoire de données LWS."]);
        exit();
    }
}

// Protéger /data contre tout accès HTTP direct
$htaccessPath = $dataDir . '/.htaccess';
if (!file_exists($htaccessPath)) {
    @file_put_contents($htaccessPath, "<IfModule mod_authz_core.c>\n    Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n    Order allow,deny\n    Deny from all\n</IfModule>\n");
}

function getOrCreateSigningSecret(string $secretFile): string {
    if (file_exists($secretFile)) {
        $existing = trim((string)@file_get_contents($secretFile));
        if (strlen($existing) >= 32) {
            return $existing;
        }
    }
    $generated = bin2hex(random_bytes(32));
    @file_put_contents($secretFile, $generated, LOCK_EX);
    @chmod($secretFile, 0600);
    return $generated;
}

function getAuthConfig(string $authFile): array {
    $defaultHash = 'b7a12a3eff6c697a84d40b3eaded800533543e621c32cbc2f3dc65c7da11c1f7';
    $defaultUsers = ['admin', 'wilfriedcrea@gmail.com', 'wilfried', 'ozi', 'ozibd'];
    if (file_exists($authFile)) {
        $raw = @file_get_contents($authFile);
        $decoded = json_decode((string)$raw, true);
        if (is_array($decoded) && !empty($decoded['passwordHash'])) {
            return [
                'passwordHash' => strtolower((string)$decoded['passwordHash']),
                'allowedUsernames' => is_array($decoded['allowedUsernames'] ?? null) ? $decoded['allowedUsernames'] : $defaultUsers,
            ];
        }
    }
    return [
        'passwordHash' => $defaultHash,
        'allowedUsernames' => $defaultUsers,
    ];
}

function verifyStudioPassword(string $password, string $storedHash): bool {
    $clean = trim($password);
    if ($clean === '') return false;
    $salted = hash('sha256', "OZI_SALT_PW_{$clean}_SECURE_2026");
    if (hash_equals(strtolower($storedHash), strtolower($salted))) {
        return true;
    }
    $unsalted = hash('sha256', $clean);
    if (hash_equals(strtolower($storedHash), strtolower($unsalted))) {
        return true;
    }
    return false;
}

function issueSignedToken(string $username, string $secret, int $ttlSeconds = 86400): string {
    $now = time();
    $payload = json_encode([
        'u' => strtolower(trim($username)),
        'i' => $now,
        'e' => $now + $ttlSeconds,
        'n' => bin2hex(random_bytes(8)),
    ]);
    $payloadB64 = rtrim(strtr(base64_encode((string)$payload), '+/', '-_'), '=');
    $sig = hash_hmac('sha256', $payloadB64, $secret);
    return "ozi_srv_v1.{$payloadB64}.{$sig}";
}

function verifySignedToken(?string $token, string $secret): bool {
    if (!$token || strpos($token, 'ozi_srv_v1.') !== 0) return false;
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    [, $payloadB64, $providedSig] = $parts;
    $expectedSig = hash_hmac('sha256', $payloadB64, $secret);
    if (!hash_equals($expectedSig, $providedSig)) return false;

    $padded = str_pad(strtr($payloadB64, '-_', '+/'), strlen($payloadB64) + (4 - strlen($payloadB64) % 4) % 4, '=');
    $decoded = json_decode((string)base64_decode($padded), true);
    if (!is_array($decoded) || empty($decoded['e'])) return false;
    return time() <= (int)$decoded['e'];
}

function extractRequestToken(): ?string {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', trim((string)$authHeader), $m)) {
        return trim($m[1]);
    }
    if (!empty($_COOKIE['ozi_studio_session'])) {
        return trim((string)$_COOKIE['ozi_studio_session']);
    }
    return null;
}

function validateSameOriginForCookieAuth(): bool {
    $xrw = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
    if (strcasecmp($xrw, 'OziStudio') !== 0) {
        return false;
    }
    return true;
}

$action = isset($_GET['action']) ? trim((string)$_GET['action']) : '';
$secret = getOrCreateSigningSecret($secretFile);
$forwardedProto = strtolower(trim(explode(',', (string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''))[0]));
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? '') == 443) || $forwardedProto === 'https';

// GET: Session check ou données publiques du catalogue studio
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'session') {
        $token = extractRequestToken();
        $isBearer = !empty($_SERVER['HTTP_AUTHORIZATION']) || !empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
        $ok = (bool)($token && verifySignedToken($token, $secret) && ($isBearer || validateSameOriginForCookieAuth()));
        echo json_encode(["success" => true, "authenticated" => $ok]);
        exit();
    }

    if (!file_exists($dataFile)) {
        echo json_encode([
            "success" => true,
            "data" => [
                "artists" => [],
                "deletedArtistIds" => [],
                "artbooks" => [],
                "deletedArtbookIds" => [],
                "updatedAt" => null
            ]
        ]);
        exit();
    }
    $raw = @file_get_contents($dataFile);
    $parsed = json_decode((string)$raw, true);
    if (!is_array($parsed)) {
        $parsed = [];
    }
    echo json_encode(["success" => true, "data" => $parsed]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Méthode non autorisée."]);
    exit();
}

$rawBody = file_get_contents('php://input');
$body = json_decode((string)$rawBody, true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Corps JSON invalide."]);
    exit();
}

// Login Studio -> génère un jeton signé + cookie HttpOnly
if ($action === 'login') {
    $username = strtolower(trim((string)($body['username'] ?? '')));
    $password = (string)($body['password'] ?? '');
    $authCfg = getAuthConfig($authFile);

    $allowed = in_array($username, array_map('strtolower', $authCfg['allowedUsernames']), true)
        || strpos($username, 'wilfried') !== false
        || in_array($username, ['admin', 'ozi', 'ozibd'], true);

    if (!$allowed || !verifyStudioPassword($password, $authCfg['passwordHash'])) {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Identifiants Studio invalides."]);
        exit();
    }

    $token = issueSignedToken($username, $secret, 86400);
    if (PHP_VERSION_ID >= 70300) {
        setcookie('ozi_studio_session', $token, [
            'expires' => time() + 86400,
            'path' => '/',
            'secure' => $isHttps,
            'httponly' => true,
            'samesite' => $isHttps ? 'None' : 'Lax',
        ]);
    }
    echo json_encode(["success" => true, "token" => $token]);
    exit();
}

if ($action === 'logout') {
    if (PHP_VERSION_ID >= 70300) {
        setcookie('ozi_studio_session', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'secure' => $isHttps,
            'httponly' => true,
            'samesite' => $isHttps ? 'None' : 'Lax',
        ]);
    }
    echo json_encode(["success" => true]);
    exit();
}

// Vérification d'authentification obligatoire pour toute écriture
$token = extractRequestToken();
$isBearer = !empty($_SERVER['HTTP_AUTHORIZATION']) || !empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
if (!$token || !verifySignedToken($token, $secret) || (!$isBearer && !validateSameOriginForCookieAuth())) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Session administrateur non authentifiée."]);
    exit();
}

if ($action === 'change-password') {
    $newHash = strtolower(trim((string)($body['passwordHash'] ?? '')));
    if (!preg_match('/^[a-f0-9]{64}$/', $newHash)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Empreinte de mot de passe invalide."]);
        exit();
    }
    $cfg = getAuthConfig($authFile);
    $cfg['passwordHash'] = $newHash;
    $cfg['updatedAt'] = date('c');
    @file_put_contents($authFile, json_encode($cfg, JSON_PRETTY_PRINT), LOCK_EX);
    echo json_encode(["success" => true]);
    exit();
}

// Écriture des données du Studio (fusion propre des champs autorisés)
$currentData = [];
if (file_exists($dataFile)) {
    $decoded = json_decode((string)@file_get_contents($dataFile), true);
    if (is_array($decoded)) {
        $currentData = $decoded;
    }
}

$allowedKeys = [
    'artists',
    'deletedArtistIds',
    'artbooks',
    'deletedArtbookIds',
    'series',
    'deletedSeriesIds',
    'heroSlides',
    'articles',
    'teasers',
    'pressReleases',
    'siteBannerUrl',
    'appVersion'
];

foreach ($allowedKeys as $key) {
    if (array_key_exists($key, $body)) {
        $currentData[$key] = $body[$key];
    }
}
$currentData['updatedAt'] = date('c');

$encoded = json_encode($currentData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($encoded === false || @file_put_contents($dataFile, $encoded, LOCK_EX) === false) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Échec d'enregistrement sur LWS."]);
    exit();
}

echo json_encode([
    "success" => true,
    "updatedAt" => $currentData['updatedAt']
]);
