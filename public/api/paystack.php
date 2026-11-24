<?php
/**
 * OZI Webtoon Studio - LWS Paystack Payment & Config API (ozibd.net)
 * Gère l'enregistrement sécurisé des clés Paystack depuis l'Admin,
 * l'initialisation des paiements, la vérification et les webhooks sur hébergement LWS.
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
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Reader-Uid, X-Paystack-Signature");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");

const PAYSTACK_API_BASE = 'https://api.paystack.co';

$rootDir = dirname(__DIR__);
$dataDir = $rootDir . '/data';
$secretFile = $dataDir . '/studio-secret.key';
$studioDataFile = $dataDir . '/studio-data.json';
$configFile = $dataDir . '/paystack-config.json';
$ledgerFile = $dataDir . '/paystack-ledger.json';

if (!file_exists($dataDir)) {
    if (!@mkdir($dataDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Impossible de créer le répertoire de données LWS."]);
        exit();
    }
}

// Protéger /data contre tout accès HTTP direct (clés, sessions, achats)
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
    return strcasecmp($xrw, 'OziStudio') === 0;
}

function isAdminAuthenticated(string $secret): bool {
    $token = extractRequestToken();
    $isBearer = !empty($_SERVER['HTTP_AUTHORIZATION']) || !empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
    return (bool)($token && verifySignedToken($token, $secret) && ($isBearer || validateSameOriginForCookieAuth()));
}

function requireAdminAuth(string $secret): void {
    if (!isAdminAuthenticated($secret)) {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Session administrateur non authentifiée."]);
        exit();
    }
}

function isPlaceholderKey(string $val): bool {
    $lower = strtolower($val);
    return $val === '' || strpos($lower, 'placeholder') !== false || strpos($lower, 'xxx') !== false || $lower === 'sk_test_ozibd_dev_secret';
}

function isValidSecretKeyFormat(string $val): bool {
    return preg_match('/^sk_(live|test)_[A-Za-z0-9_-]{8,}$/', $val) === 1 && !isPlaceholderKey($val);
}

function isValidPublicKeyFormat(string $val): bool {
    return preg_match('/^pk_(live|test)_[A-Za-z0-9_-]{8,}$/', $val) === 1 && !isPlaceholderKey($val);
}

function maskSecretKey(string $secret): string {
    if ($secret === '') return '';
    if (strlen($secret) <= 12) return substr($secret, 0, 7) . '••••';
    return substr($secret, 0, 8) . '••••••••' . substr($secret, -4);
}

function readPaystackConfig(string $configFile): array {
    if (!file_exists($configFile)) {
        return [];
    }
    $decoded = json_decode((string)@file_get_contents($configFile), true);
    return is_array($decoded) ? $decoded : [];
}

function buildConfigSummary(string $configFile, string $originUrl): array {
    $cfg = readPaystackConfig($configFile);
    $secretKey = trim((string)($cfg['secretKey'] ?? ''));
    $publicKey = trim((string)($cfg['publicKey'] ?? ''));
    $hasSecret = $secretKey !== '' && isValidSecretKeyFormat($secretKey);
    $mode = 'unconfigured';
    if ($hasSecret) {
        $mode = strpos($secretKey, 'sk_live_') === 0 ? 'live' : 'test';
    }
    $cleanBase = rtrim($originUrl !== '' ? $originUrl : 'https://ozibd.net', '/');
    return [
        'configured' => $hasSecret,
        'mode' => $mode,
        'hasSecretKey' => $hasSecret,
        'secretKeyMasked' => $hasSecret ? maskSecretKey($secretKey) : '',
        'publicKey' => $publicKey,
        'source' => $hasSecret ? 'admin' : 'none',
        'webhookUrlSuggested' => $cleanBase . '/api/paystack.php?action=webhook',
        'updatedAt' => $cfg['updatedAt'] ?? null,
    ];
}

function readLedger(string $ledgerFile): array {
    $empty = [
        'subscriptions' => [],
        'artbook_purchases' => [],
        'coin_transactions' => [],
    ];
    if (!file_exists($ledgerFile)) {
        return $empty;
    }
    $raw = @file_get_contents($ledgerFile);
    $decoded = json_decode((string)$raw, true);
    if (!is_array($decoded)) {
        return $empty;
    }
    return [
        'subscriptions' => is_array($decoded['subscriptions'] ?? null) ? $decoded['subscriptions'] : [],
        'artbook_purchases' => is_array($decoded['artbook_purchases'] ?? null) ? $decoded['artbook_purchases'] : [],
        'coin_transactions' => is_array($decoded['coin_transactions'] ?? null) ? $decoded['coin_transactions'] : [],
    ];
}

function updateLedger(string $ledgerFile, callable $mutator) {
    $fp = @fopen($ledgerFile, 'c+');
    if (!$fp) {
        throw new RuntimeException("Impossible d'ouvrir le registre des paiements.");
    }
    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        throw new RuntimeException("Impossible de verrouiller le registre des paiements.");
    }
    try {
        rewind($fp);
        $raw = stream_get_contents($fp);
        $decoded = json_decode((string)$raw, true);
        if (!is_array($decoded)) {
            $decoded = [];
        }
        $ledger = [
            'subscriptions' => is_array($decoded['subscriptions'] ?? null) ? $decoded['subscriptions'] : [],
            'artbook_purchases' => is_array($decoded['artbook_purchases'] ?? null) ? $decoded['artbook_purchases'] : [],
            'coin_transactions' => is_array($decoded['coin_transactions'] ?? null) ? $decoded['coin_transactions'] : [],
        ];

        $result = $mutator($ledger);

        rewind($fp);
        ftruncate($fp, 0);
        fwrite($fp, json_encode($ledger, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
        fflush($fp);
        @chmod($ledgerFile, 0600);
        return $result;
    } finally {
        flock($fp, LOCK_UN);
        fclose($fp);
    }
}

function resolveAuthoritativePrice(string $studioDataFile, string $paymentType, string $targetId, float $fallbackAmount): int {
    if ($paymentType === 'artbook_purchase' && file_exists($studioDataFile)) {
        $decoded = json_decode((string)@file_get_contents($studioDataFile), true);
        $artbooks = is_array($decoded['artbooks'] ?? null) ? $decoded['artbooks'] : [];
        foreach ($artbooks as $artbook) {
            if (!is_array($artbook)) continue;
            if (($artbook['id'] ?? '') === $targetId || ($artbook['slug'] ?? '') === $targetId) {
                $price = isset($artbook['price']) ? (float)$artbook['price'] : 0;
                if ($price > 0) {
                    return (int)round($price);
                }
            }
        }
    }
    return max(100, (int)round($fallbackAmount));
}

function callPaystackApi(string $method, string $path, string $secretKey, ?array $payload = null): array {
    $url = PAYSTACK_API_BASE . $path;
    $headers = [
        'Authorization: Bearer ' . $secretKey,
        'Content-Type: application/json',
        'Accept: application/json',
    ];

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        if (strtoupper($method) === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload ?? []));
        }
        $body = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if ($body === false) {
            return ['ok' => false, 'status' => 0, 'data' => null, 'error' => $curlErr ?: 'Erreur réseau cURL vers Paystack'];
        }
        $json = json_decode((string)$body, true);
        return ['ok' => ($httpCode >= 200 && $httpCode < 300), 'status' => $httpCode, 'data' => is_array($json) ? $json : null, 'error' => null];
    }

    // Fallback sans extension cURL
    $opts = [
        'http' => [
            'method' => strtoupper($method),
            'header' => implode("\r\n", $headers) . "\r\n",
            'timeout' => 20,
            'ignore_errors' => true,
        ],
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
        ],
    ];
    if (strtoupper($method) === 'POST') {
        $opts['http']['content'] = json_encode($payload ?? []);
    }
    $ctx = stream_context_create($opts);
    $body = @file_get_contents($url, false, $ctx);
    $httpCode = 0;
    if (isset($http_response_header) && is_array($http_response_header)) {
        foreach ($http_response_header as $hdr) {
            if (preg_match('/^HTTP\/\S+\s+(\d{3})/', $hdr, $m)) {
                $httpCode = (int)$m[1];
                break;
            }
        }
    }
    if ($body === false) {
        return ['ok' => false, 'status' => $httpCode, 'data' => null, 'error' => 'Impossible de contacter Paystack depuis PHP.'];
    }
    $json = json_decode((string)$body, true);
    return ['ok' => ($httpCode >= 200 && $httpCode < 300), 'status' => $httpCode, 'data' => is_array($json) ? $json : null, 'error' => null];
}

function upsertSubscription(array &$ledger, array $params): array {
    $nowTs = time();
    $nowIso = gmdate('c', $nowTs);
    $expIso = gmdate('c', $nowTs + 30 * 86400);
    $ref = (string)$params['paystackReference'];

    foreach ($ledger['subscriptions'] as $idx => $existing) {
        if (($existing['paystackReference'] ?? '') === $ref) {
            if (($existing['status'] ?? '') === 'active') {
                return $existing;
            }
            $updated = array_merge($existing, [
                'status' => 'active',
                'startDate' => $nowIso,
                'expirationDate' => $expIso,
                'customerEmail' => $params['customerEmail'] ?? ($existing['customerEmail'] ?? ''),
                'updatedAt' => $nowIso,
            ]);
            $ledger['subscriptions'][$idx] = $updated;
            return $updated;
        }
    }

    $record = [
        'subscriptionId' => 'sub_' . bin2hex(random_bytes(8)),
        'uid' => (string)$params['uid'],
        'workId' => (string)$params['workId'],
        'workTitle' => (string)($params['workTitle'] ?? 'Œuvre OZI'),
        'amount' => (int)($params['amount'] ?? 2000),
        'currency' => (string)($params['currency'] ?? 'XOF'),
        'status' => $params['status'] ?? 'active',
        'paystackReference' => $ref,
        'startDate' => $nowIso,
        'expirationDate' => ($params['status'] ?? 'active') === 'active' ? $expIso : $nowIso,
        'customerEmail' => (string)($params['customerEmail'] ?? ''),
        'createdAt' => $nowIso,
        'updatedAt' => $nowIso,
    ];
    array_unshift($ledger['subscriptions'], $record);
    return $record;
}

function upsertArtbookPurchase(array &$ledger, array $params): array {
    $nowIso = gmdate('c');
    $ref = (string)$params['paystackReference'];

    foreach ($ledger['artbook_purchases'] as $existing) {
        if (($existing['paystackReference'] ?? '') === $ref && ($existing['status'] ?? '') === 'active') {
            return $existing;
        }
    }

    $record = [
        'purchaseId' => 'art_' . bin2hex(random_bytes(8)),
        'uid' => (string)$params['uid'],
        'artbookId' => (string)$params['artbookId'],
        'artbookTitle' => (string)($params['artbookTitle'] ?? 'Artbook OZI'),
        'artistName' => (string)($params['artistName'] ?? ''),
        'amount' => (int)($params['amount'] ?? 3500),
        'currency' => (string)($params['currency'] ?? 'XOF'),
        'status' => 'active',
        'paystackReference' => $ref,
        'purchasedAt' => $nowIso,
        'customerEmail' => strtolower(trim((string)($params['customerEmail'] ?? ''))),
        'userName' => (string)($params['userName'] ?? ''),
        'createdAt' => $nowIso,
        'updatedAt' => $nowIso,
    ];
    array_unshift($ledger['artbook_purchases'], $record);
    return $record;
}

function upsertCoinPurchase(array &$ledger, array $params): array {
    $nowIso = gmdate('c');
    $ref = (string)$params['paystackReference'];

    foreach ($ledger['coin_transactions'] as $existing) {
        if (($existing['paystackReference'] ?? '') === $ref) {
            return $existing;
        }
    }

    $record = [
        'transactionId' => 'coin_' . bin2hex(random_bytes(8)),
        'uid' => (string)$params['uid'],
        'packId' => (string)$params['packId'],
        'packName' => (string)($params['packName'] ?? 'Pack Coins'),
        'coinsAmount' => (int)($params['coinsAmount'] ?? 50),
        'amount' => (int)($params['amount'] ?? 1000),
        'currency' => (string)($params['currency'] ?? 'XOF'),
        'status' => 'completed',
        'paystackReference' => $ref,
        'customerEmail' => (string)($params['customerEmail'] ?? ''),
        'createdAt' => $nowIso,
    ];
    array_unshift($ledger['coin_transactions'], $record);
    return $record;
}

function normalizeSubscriptionStatus(array $sub): array {
    if (($sub['status'] ?? '') === 'active' && !empty($sub['expirationDate'])) {
        $expTs = strtotime((string)$sub['expirationDate']);
        if ($expTs !== false && $expTs <= time()) {
            $sub['status'] = 'expired';
        }
    }
    return $sub;
}

$secret = getOrCreateSigningSecret($secretFile);
$forwardedProto = strtolower(trim(explode(',', (string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''))[0]));
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['SERVER_PORT'] ?? '') == 443) || $forwardedProto === 'https';
$scheme = $isHttps ? 'https' : 'http';
$forwardedHost = trim(explode(',', (string)($_SERVER['HTTP_X_FORWARDED_HOST'] ?? ''))[0]);
$effectiveHost = $forwardedHost !== '' ? $forwardedHost : ($host !== '' ? $host : 'ozibd.net');
$originUrl = $scheme . '://' . $effectiveHost;

$action = isset($_GET['action']) ? trim((string)$_GET['action']) : '';
$method = $_SERVER['REQUEST_METHOD'];

// ================= ROUTES ADMIN CONFIG =================
if ($action === 'admin-config') {
    requireAdminAuth($secret);

    if ($method === 'GET') {
        echo json_encode([
            'success' => true,
            'config' => buildConfigSummary($configFile, $originUrl),
        ]);
        exit();
    }

    if ($method === 'POST') {
        $body = json_decode((string)file_get_contents('php://input'), true);
        if (!is_array($body)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Corps JSON invalide.']);
            exit();
        }

        $current = readPaystackConfig($configFile);
        $next = $current;

        if (!empty($body['clearSecret'])) {
            unset($next['secretKey']);
        } elseif (isset($body['secretKey']) && is_string($body['secretKey'])) {
            $trimmedSecret = trim($body['secretKey']);
            if ($trimmedSecret !== '') {
                if (!isValidSecretKeyFormat($trimmedSecret)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Clé secrète Paystack invalide. Elle doit commencer par "sk_live_" ou "sk_test_".',
                    ]);
                    exit();
                }
                $next['secretKey'] = $trimmedSecret;
            }
        }

        if (array_key_exists('publicKey', $body) && is_string($body['publicKey'])) {
            $trimmedPublic = trim($body['publicKey']);
            if ($trimmedPublic === '') {
                unset($next['publicKey']);
            } else {
                if (!isValidPublicKeyFormat($trimmedPublic)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Clé publique Paystack invalide. Elle doit commencer par "pk_live_" ou "pk_test_".',
                    ]);
                    exit();
                }
                $next['publicKey'] = $trimmedPublic;
            }
        }

        $next['updatedAt'] = gmdate('c');
        $written = @file_put_contents($configFile, json_encode($next, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
        if ($written === false) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Impossible d\'enregistrer les clés Paystack sur LWS.']);
            exit();
        }
        @chmod($configFile, 0600);

        echo json_encode([
            'success' => true,
            'config' => buildConfigSummary($configFile, $originUrl),
        ]);
        exit();
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée.']);
    exit();
}

// ================= ADMIN SUBSCRIPTIONS & STATS =================
if ($action === 'admin-subscriptions') {
    requireAdminAuth($secret);
    $ledger = readLedger($ledgerFile);
    $subs = array_map('normalizeSubscriptionStatus', $ledger['subscriptions']);
    echo json_encode([
        'success' => true,
        'subscriptions' => $subs,
        'count' => count($subs),
        'serverTime' => gmdate('c'),
    ]);
    exit();
}

if ($action === 'admin-stats') {
    requireAdminAuth($secret);
    $ledger = readLedger($ledgerFile);
    $subs = array_map('normalizeSubscriptionStatus', $ledger['subscriptions']);
    $artbooks = $ledger['artbook_purchases'];
    $coins = $ledger['coin_transactions'];

    $workPassRevenue = 0;
    $activeCount = 0;
    $expiredCount = 0;
    $pendingCount = 0;
    $byWorkMap = [];
    $byMonthMap = [];

    foreach ($subs as $s) {
        $st = $s['status'] ?? 'pending';
        if ($st === 'active') $activeCount++;
        elseif ($st === 'expired') $expiredCount++;
        elseif ($st === 'pending') $pendingCount++;

        if ($st === 'active' || $st === 'expired') {
            $amt = (int)($s['amount'] ?? 2000);
            $workPassRevenue += $amt;

            $wid = (string)($s['workId'] ?? 'unknown');
            $wtitle = (string)($s['workTitle'] ?? 'Œuvre OZI');
            if (!isset($byWorkMap[$wid])) {
                $byWorkMap[$wid] = ['workId' => $wid, 'workTitle' => $wtitle, 'count' => 0, 'revenueXof' => 0];
            }
            $byWorkMap[$wid]['count']++;
            $byWorkMap[$wid]['revenueXof'] += $amt;

            $month = substr((string)($s['startDate'] ?? $s['createdAt'] ?? gmdate('Y-m')), 0, 7);
            if (!isset($byMonthMap[$month])) {
                $byMonthMap[$month] = ['month' => $month, 'count' => 0, 'revenueXof' => 0];
            }
            $byMonthMap[$month]['count']++;
            $byMonthMap[$month]['revenueXof'] += $amt;
        }
    }

    $artbooksRevenue = 0;
    foreach ($artbooks as $a) {
        $amt = (int)($a['amount'] ?? 3500);
        $artbooksRevenue += $amt;
        $month = substr((string)($a['purchasedAt'] ?? $a['createdAt'] ?? gmdate('Y-m')), 0, 7);
        if (!isset($byMonthMap[$month])) {
            $byMonthMap[$month] = ['month' => $month, 'count' => 0, 'revenueXof' => 0];
        }
        $byMonthMap[$month]['count']++;
        $byMonthMap[$month]['revenueXof'] += $amt;
    }

    $coinsRevenue = 0;
    foreach ($coins as $c) {
        $amt = (int)($c['amount'] ?? 1000);
        $coinsRevenue += $amt;
        $month = substr((string)($c['createdAt'] ?? gmdate('Y-m')), 0, 7);
        if (!isset($byMonthMap[$month])) {
            $byMonthMap[$month] = ['month' => $month, 'count' => 0, 'revenueXof' => 0];
        }
        $byMonthMap[$month]['count']++;
        $byMonthMap[$month]['revenueXof'] += $amt;
    }

    $byWork = array_values($byWorkMap);
    usort($byWork, fn($a, $b) => $b['revenueXof'] <=> $a['revenueXof']);
    $byMonth = array_values($byMonthMap);
    usort($byMonth, fn($a, $b) => strcmp($b['month'], $a['month']));

    $totalRevenue = $workPassRevenue + $artbooksRevenue + $coinsRevenue;

    echo json_encode([
        'success' => true,
        'stats' => [
            'totalRevenueXof' => $totalRevenue,
            'workPassRevenueXof' => $workPassRevenue,
            'artbooksRevenueXof' => $artbooksRevenue,
            'coinsRevenueXof' => $coinsRevenue,
            'activeCount' => $activeCount,
            'expiredCount' => $expiredCount,
            'pendingCount' => $pendingCount,
            'artbooksSalesCount' => count($artbooks),
            'coinsSalesCount' => count($coins),
            'totalTransactionsCount' => count($subs) + count($artbooks) + count($coins),
            'byWork' => $byWork,
            'byMonth' => $byMonth,
            'byType' => [
                ['type' => 'work_pass', 'label' => 'Pass 30 Jours', 'count' => $activeCount + $expiredCount, 'revenueXof' => $workPassRevenue],
                ['type' => 'artbook_purchase', 'label' => 'Artbooks HD', 'count' => count($artbooks), 'revenueXof' => $artbooksRevenue],
                ['type' => 'coin_pack', 'label' => 'Packs de Coins', 'count' => count($coins), 'revenueXof' => $coinsRevenue],
            ],
        ],
        'serverTime' => gmdate('c'),
    ]);
    exit();
}

// ================= ADMIN SIMULATE (BAC À SABLE ADMIN UNIQUEMENT) =================
if ($action === 'simulate-success') {
    requireAdminAuth($secret);
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Méthode non autorisée.']);
        exit();
    }
    $body = json_decode((string)file_get_contents('php://input'), true);
    $uid = trim((string)($body['uid'] ?? ''));
    $workId = trim((string)($body['workId'] ?? ''));
    if ($uid === '' || $workId === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'uid et workId requis.']);
        exit();
    }

    $sub = updateLedger($ledgerFile, function (&$ledger) use ($uid, $workId, $body) {
        return upsertSubscription($ledger, [
            'paystackReference' => 'sim_' . time(),
            'uid' => $uid,
            'workId' => $workId,
            'workTitle' => (string)($body['workTitle'] ?? 'Œuvre OZI'),
            'amount' => (int)($body['amount'] ?? 2000),
            'currency' => 'XOF',
            'status' => 'active',
        ]);
    });

    echo json_encode([
        'success' => true,
        'subscription' => $sub,
        'message' => 'Abonnement test activé côté admin.',
    ]);
    exit();
}

// ================= INITIALIZE PAYMENT =================
if ($action === 'initialize') {
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
        exit();
    }

    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Requête JSON invalide.']);
        exit();
    }

    $uid = trim((string)($body['uid'] ?? ''));
    $rawPaymentType = trim((string)($body['paymentType'] ?? ''));
    $workId = trim((string)($body['workId'] ?? ''));
    $artbookId = trim((string)($body['artbookId'] ?? ''));
    $packId = trim((string)($body['packId'] ?? ''));
    $paymentType = $rawPaymentType !== '' ? $rawPaymentType : ($artbookId !== '' ? 'artbook_purchase' : ($packId !== '' ? 'coin_pack' : 'work_pass'));
    $targetId = trim((string)($body['targetId'] ?? ($workId ?: ($artbookId ?: $packId))));

    if ($uid === '' || $targetId === '') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Identifiant lecteur (uid) et identifiant cible obligatoires.',
        ]);
        exit();
    }

    $cfg = readPaystackConfig($configFile);
    $secretKey = trim((string)($cfg['secretKey'] ?? ''));
    if ($secretKey === '' || !isValidSecretKeyFormat($secretKey)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Le paiement Paystack n\'est pas encore activé. L\'administrateur doit renseigner sa clé secrète Paystack dans le tableau de bord.',
        ]);
        exit();
    }

    $cleanEmail = trim((string)($body['email'] ?? ''));
    if ($cleanEmail === '') {
        $cleanEmail = substr($uid, 0, 10) . '@reader.ozibd.net';
    }
    $fallbackAmount = (float)($body['amount'] ?? ($paymentType === 'work_pass' ? 2000 : 3500));
    $numericAmount = resolveAuthoritativePrice($studioDataFile, $paymentType, $targetId, $fallbackAmount);
    $currency = strtoupper(trim((string)($body['currency'] ?? 'XOF')));
    $title = trim((string)($body['title'] ?? ($body['workTitle'] ?? ($body['artbookTitle'] ?? 'Produit OZI'))));

    $prefix = $paymentType === 'artbook_purchase' ? 'art' : ($paymentType === 'coin_pack' ? 'coin' : 'sub');
    $safeTarget = preg_replace('/[^a-zA-Z0-9_-]/', '', substr($targetId, 0, 18));
    $safeUid = preg_replace('/[^a-zA-Z0-9_-]/', '', substr($uid, 0, 8));
    $reference = "ozi_{$prefix}_{$safeTarget}_{$safeUid}_" . time();

    $callbackUrl = trim((string)($body['callbackUrl'] ?? ''));
    if ($callbackUrl === '') {
        $callbackUrl = $originUrl . '/#/paystack/callback?ref=' . rawurlencode($reference) . '&type=' . rawurlencode($paymentType) . '&target=' . rawurlencode($targetId);
    }

    $apiRes = callPaystackApi('POST', '/transaction/initialize', $secretKey, [
        'email' => $cleanEmail,
        'amount' => $numericAmount * 100,
        'currency' => $currency,
        'reference' => $reference,
        'callback_url' => $callbackUrl,
        'metadata' => [
            'uid' => $uid,
            'paymentType' => $paymentType,
            'targetId' => $targetId,
            'title' => $title,
            'expectedAmount' => $numericAmount,
            'workId' => $workId !== '' ? $workId : ($paymentType === 'work_pass' ? $targetId : ''),
            'workTitle' => (string)($body['workTitle'] ?? ($paymentType === 'work_pass' ? $title : '')),
            'artbookId' => $artbookId !== '' ? $artbookId : ($paymentType === 'artbook_purchase' ? $targetId : ''),
            'artbookTitle' => (string)($body['artbookTitle'] ?? ($paymentType === 'artbook_purchase' ? $title : '')),
            'artistName' => (string)($body['artistName'] ?? ''),
            'packId' => $packId !== '' ? $packId : ($paymentType === 'coin_pack' ? $targetId : ''),
            'coinsAmount' => (int)($body['coinsAmount'] ?? 0),
            'email' => $cleanEmail,
            'customerName' => trim((string)($body['customerName'] ?? ($body['name'] ?? ''))),
        ],
    ]);

    $respData = $apiRes['data'];
    if ($apiRes['ok'] && !empty($respData['status']) && !empty($respData['data']['authorization_url'])) {
        if ($paymentType === 'work_pass') {
            updateLedger($ledgerFile, function (&$ledger) use ($uid, $targetId, $body, $numericAmount, $currency, $respData, $reference, $cleanEmail) {
                upsertSubscription($ledger, [
                    'uid' => $uid,
                    'workId' => $targetId,
                    'workTitle' => (string)($body['workTitle'] ?? 'Œuvre OZI'),
                    'amount' => $numericAmount,
                    'currency' => $currency,
                    'status' => 'pending',
                    'paystackReference' => $respData['data']['reference'] ?? $reference,
                    'customerEmail' => $cleanEmail,
                ]);
            });
        }

        echo json_encode([
            'success' => true,
            'authorizationUrl' => $respData['data']['authorization_url'],
            'accessCode' => $respData['data']['access_code'] ?? '',
            'reference' => $respData['data']['reference'] ?? $reference,
            'message' => 'Paiement Paystack initialisé avec succès',
        ]);
        exit();
    }

    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $respData['message'] ?? $apiRes['error'] ?? 'Erreur lors de l\'initialisation Paystack.',
    ]);
    exit();
}

// ================= WEBHOOK PAYSTACK =================
if ($action === 'webhook') {
    $cfg = readPaystackConfig($configFile);
    $secretKey = trim((string)($cfg['secretKey'] ?? ''));
    $signature = trim((string)($_SERVER['HTTP_X_PAYSTACK_SIGNATURE'] ?? ''));
    $rawBody = (string)file_get_contents('php://input');

    if ($secretKey === '' || !isValidSecretKeyFormat($secretKey) || $signature === '') {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Signature Paystack invalide']);
        exit();
    }

    $computed = hash_hmac('sha512', $rawBody, $secretKey);
    if (!hash_equals($computed, $signature)) {
        http_response_code(401);
        echo json_encode(['status' => 'error', 'message' => 'Signature Paystack invalide']);
        exit();
    }

    $event = json_decode($rawBody, true);
    if (is_array($event) && ($event['event'] ?? '') === 'charge.success') {
        $d = $event['data'] ?? [];
        $meta = is_array($d['metadata'] ?? null) ? $d['metadata'] : [];
        $uid = (string)($meta['uid'] ?? '');
        $paymentType = (string)($meta['paymentType'] ?? (!empty($meta['artbookId']) ? 'artbook_purchase' : (!empty($meta['packId']) ? 'coin_pack' : 'work_pass')));
        $ref = (string)($d['reference'] ?? '');
        $amount = (int)round(((float)($d['amount'] ?? 0)) / 100);
        $currency = (string)($d['currency'] ?? 'XOF');
        $email = (string)($d['customer']['email'] ?? ($meta['email'] ?? ''));

        if ($uid !== '' && $ref !== '') {
            updateLedger($ledgerFile, function (&$ledger) use ($paymentType, $meta, $uid, $ref, $amount, $currency, $email) {
                if ($paymentType === 'artbook_purchase') {
                    $artId = (string)($meta['artbookId'] ?? ($meta['targetId'] ?? ''));
                    if ($artId !== '') {
                        upsertArtbookPurchase($ledger, [
                            'paystackReference' => $ref,
                            'uid' => $uid,
                            'artbookId' => $artId,
                            'artbookTitle' => $meta['artbookTitle'] ?? ($meta['title'] ?? 'Artbook OZI'),
                            'artistName' => $meta['artistName'] ?? '',
                            'amount' => $amount,
                            'currency' => $currency,
                            'customerEmail' => $email,
                            'userName' => (string)($meta['customerName'] ?? ''),
                        ]);
                    }
                } elseif ($paymentType === 'coin_pack') {
                    $packId = (string)($meta['packId'] ?? ($meta['targetId'] ?? ''));
                    if ($packId !== '') {
                        upsertCoinPurchase($ledger, [
                            'paystackReference' => $ref,
                            'uid' => $uid,
                            'packId' => $packId,
                            'packName' => $meta['packName'] ?? ($meta['title'] ?? 'Pack Coins'),
                            'coinsAmount' => (int)($meta['coinsAmount'] ?? 50),
                            'amount' => $amount,
                            'currency' => $currency,
                            'customerEmail' => $email,
                        ]);
                    }
                } else {
                    $workId = (string)($meta['workId'] ?? ($meta['targetId'] ?? ''));
                    if ($workId !== '') {
                        upsertSubscription($ledger, [
                            'paystackReference' => $ref,
                            'uid' => $uid,
                            'workId' => $workId,
                            'workTitle' => $meta['workTitle'] ?? ($meta['title'] ?? 'Œuvre OZI'),
                            'amount' => $amount,
                            'currency' => $currency,
                            'customerEmail' => $email,
                            'status' => 'active',
                        ]);
                    }
                }
            });
        }
    }

    echo json_encode(['status' => 'success']);
    exit();
}

// ================= VERIFY TRANSACTION =================
if ($action === 'verify') {
    $reference = trim((string)($_GET['reference'] ?? ''));
    if ($reference === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'verified' => false, 'message' => 'Référence Paystack requise.']);
        exit();
    }

    $cfg = readPaystackConfig($configFile);
    $secretKey = trim((string)($cfg['secretKey'] ?? ''));
    if ($secretKey === '' || !isValidSecretKeyFormat($secretKey)) {
        echo json_encode([
            'success' => false,
            'verified' => false,
            'status' => 'unconfigured',
            'message' => 'Passerelle Paystack non configurée.',
        ]);
        exit();
    }

    $apiRes = callPaystackApi('GET', '/transaction/verify/' . rawurlencode($reference), $secretKey);
    $respData = $apiRes['data'];
    $d = is_array($respData['data'] ?? null) ? $respData['data'] : null;

    if (!$apiRes['ok'] || empty($respData['status']) || !$d || ($d['status'] ?? '') !== 'success') {
        echo json_encode([
            'success' => false,
            'verified' => false,
            'status' => $d['status'] ?? 'pending',
            'message' => 'Paiement non encore validé ou en attente.',
        ]);
        exit();
    }

    $meta = is_array($d['metadata'] ?? null) ? $d['metadata'] : [];
    $uid = trim((string)($meta['uid'] ?? ($_GET['uid'] ?? ($_SERVER['HTTP_X_READER_UID'] ?? ''))));
    $paymentType = trim((string)($meta['paymentType'] ?? ($_GET['type'] ?? (!empty($meta['artbookId']) ? 'artbook_purchase' : (!empty($meta['packId']) ? 'coin_pack' : 'work_pass')))));
    $targetId = trim((string)($meta['targetId'] ?? ($meta['workId'] ?? ($meta['artbookId'] ?? ($meta['packId'] ?? ($_GET['target'] ?? ($_GET['workId'] ?? '')))))));

    if ($uid === '' || $targetId === '' || $paymentType === '') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'verified' => false,
            'message' => 'Métadonnées de transaction incomplètes.',
        ]);
        exit();
    }

    $paidAmount = (int)round(((float)($d['amount'] ?? 0)) / 100);
    $expectedPrice = resolveAuthoritativePrice($studioDataFile, $paymentType, $targetId, (float)($meta['expectedAmount'] ?? $paidAmount));
    if ($paidAmount < $expectedPrice) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'verified' => false,
            'message' => 'Montant réglé insuffisant pour cet article.',
        ]);
        exit();
    }

    $currency = (string)($d['currency'] ?? 'XOF');
    $customerEmail = (string)($d['customer']['email'] ?? ($meta['email'] ?? ''));

    $activated = updateLedger($ledgerFile, function (&$ledger) use ($paymentType, $reference, $uid, $targetId, $meta, $paidAmount, $currency, $customerEmail) {
        if ($paymentType === 'artbook_purchase') {
            return [
                'key' => 'purchase',
                'record' => upsertArtbookPurchase($ledger, [
                    'paystackReference' => $reference,
                    'uid' => $uid,
                    'artbookId' => $targetId,
                    'artbookTitle' => $meta['artbookTitle'] ?? ($meta['title'] ?? 'Artbook OZI'),
                    'artistName' => $meta['artistName'] ?? '',
                    'amount' => $paidAmount,
                    'currency' => $currency,
                    'customerEmail' => $customerEmail,
                    'userName' => (string)($meta['customerName'] ?? ''),
                ]),
                'message' => 'Artbook débloqué avec succès !',
            ];
        } elseif ($paymentType === 'coin_pack') {
            return [
                'key' => 'coinTx',
                'record' => upsertCoinPurchase($ledger, [
                    'paystackReference' => $reference,
                    'uid' => $uid,
                    'packId' => $targetId,
                    'packName' => $meta['packName'] ?? ($meta['title'] ?? 'Pack Coins'),
                    'coinsAmount' => (int)($meta['coinsAmount'] ?? 50),
                    'amount' => $paidAmount,
                    'currency' => $currency,
                    'customerEmail' => $customerEmail,
                ]),
                'message' => 'Pack de Coins crédité avec succès !',
            ];
        }
        return [
            'key' => 'subscription',
            'record' => upsertSubscription($ledger, [
                'paystackReference' => $reference,
                'uid' => $uid,
                'workId' => $targetId,
                'workTitle' => $meta['workTitle'] ?? ($meta['title'] ?? 'Œuvre OZI'),
                'amount' => $paidAmount,
                'currency' => $currency,
                'customerEmail' => $customerEmail,
                'status' => 'active',
            ]),
            'message' => 'Abonnement 30 jours confirmé et actif !',
        ];
    });

    echo json_encode([
        'success' => true,
        'verified' => true,
        'paymentType' => $paymentType,
        $activated['key'] => $activated['record'],
        'message' => $activated['message'],
    ]);
    exit();
}

// ================= CHECK ACCESS =================
if ($action === 'check-access') {
    $uid = trim((string)($_GET['uid'] ?? ($_SERVER['HTTP_X_READER_UID'] ?? '')));
    $workId = trim((string)($_GET['workId'] ?? ''));
    $artbookId = trim((string)($_GET['artbookId'] ?? ''));
    $ledger = readLedger($ledgerFile);

    if ($workId !== '' && $uid !== '') {
        foreach ($ledger['subscriptions'] as $rawSub) {
            $sub = normalizeSubscriptionStatus($rawSub);
            if (($sub['uid'] ?? '') === $uid && ($sub['workId'] ?? '') === $workId && ($sub['status'] ?? '') === 'active') {
                $expTs = strtotime((string)($sub['expirationDate'] ?? ''));
                $daysRemaining = $expTs ? max(1, (int)ceil(($expTs - time()) / 86400)) : 30;
                echo json_encode([
                    'hasAccess' => true,
                    'subscription' => $sub,
                    'daysRemaining' => $daysRemaining,
                    'serverTime' => gmdate('c'),
                ]);
                exit();
            }
        }
        echo json_encode([
            'hasAccess' => false,
            'reason' => 'no_subscription',
            'serverTime' => gmdate('c'),
        ]);
        exit();
    }

    if ($uid !== '' && $artbookId !== '') {
        foreach ($ledger['artbook_purchases'] as $purchase) {
            if (($purchase['uid'] ?? '') === $uid && ($purchase['artbookId'] ?? '') === $artbookId && ($purchase['status'] ?? '') === 'active') {
                echo json_encode([
                    'hasAccess' => true,
                    'purchase' => $purchase,
                ]);
                exit();
            }
        }
        echo json_encode(['hasAccess' => false]);
        exit();
    }

    echo json_encode(['hasAccess' => false, 'reason' => 'missing_params']);
    exit();
}

// ================= USER SUBSCRIPTIONS & PURCHASES =================
if ($action === 'user-subscriptions') {
    $uid = trim((string)($_GET['uid'] ?? ''));
    if ($uid === '') {
        echo json_encode(['success' => true, 'subscriptions' => []]);
        exit();
    }
    $ledger = readLedger($ledgerFile);
    $subs = [];
    foreach ($ledger['subscriptions'] as $s) {
        if (($s['uid'] ?? '') === $uid) {
            $subs[] = normalizeSubscriptionStatus($s);
        }
    }
    echo json_encode([
        'success' => true,
        'subscriptions' => $subs,
        'serverTime' => gmdate('c'),
    ]);
    exit();
}

if ($action === 'user-purchases') {
    $uid = trim((string)($_GET['uid'] ?? ''));
    if ($uid === '') {
        echo json_encode(['success' => true, 'purchases' => []]);
        exit();
    }
    $ledger = readLedger($ledgerFile);
    $purchases = array_values(array_filter($ledger['artbook_purchases'], fn($p) => ($p['uid'] ?? '') === $uid));
    echo json_encode([
        'success' => true,
        'purchases' => $purchases,
    ]);
    exit();
}

if ($action === 'purchases-by-email') {
    $rawEmail = (string)($_GET['email'] ?? '');
    if ($rawEmail === '' && $method === 'POST') {
        $body = json_decode((string)file_get_contents('php://input'), true);
        if (is_array($body)) {
            $rawEmail = (string)($body['email'] ?? '');
        }
    }
    $cleanEmail = strtolower(trim($rawEmail));
    if ($cleanEmail === '' || !filter_var($cleanEmail, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Veuillez saisir une adresse e-mail valide.',
            'purchases' => [],
        ]);
        exit();
    }

    $ledger = readLedger($ledgerFile);
    $matched = [];
    $seenRefs = [];
    foreach ($ledger['artbook_purchases'] as $p) {
        if (!is_array($p)) continue;
        $pEmail = strtolower(trim((string)($p['customerEmail'] ?? $p['userEmail'] ?? '')));
        $pStatus = strtolower(trim((string)($p['status'] ?? '')));
        if ($pEmail === $cleanEmail && in_array($pStatus, ['active', 'completed'], true)) {
            $dedupKey = (string)($p['paystackReference'] ?? $p['purchaseId'] ?? uniqid('', true));
            if (isset($seenRefs[$dedupKey])) continue;
            $seenRefs[$dedupKey] = true;
            $matched[] = $p;
        }
    }

    echo json_encode([
        'success' => true,
        'purchases' => $matched,
        'count' => count($matched),
    ]);
    exit();
}

http_response_code(400);
echo json_encode(['success' => false, 'error' => 'Action Paystack inconnue.']);
