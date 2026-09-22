<?php
/**
 * OZI Webtoon Studio - LWS Upload Backend
 * Handles image and audio uploads to ozibd.net CDN storage
 */

// Allow Cross-Origin Requests from OZI applications
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header("Content-Type: application/json; charset=UTF-8");

// Only POST is allowed for upload
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Méthode non autorisée. Utilisez POST."]);
    exit();
}

// Check if file was provided
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $errorCode = isset($_FILES['file']) ? $_FILES['file']['error'] : 'NO_FILE';
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Erreur lors du transfert du fichier (Code: " . $errorCode . ")"]);
    exit();
}

$category = isset($_POST['category']) ? trim($_POST['category']) : 'covers';
$allowedCategories = ['covers', 'banners', 'chapters', 'audio'];
if (!in_array($category, $allowedCategories)) {
    $category = 'covers';
}

// Compute target directory on server
// Root is public directory where index.html and api/ reside
$rootDir = dirname(__DIR__);
$targetDir = $rootDir . '/uploads/' . $category . '/';

if (!file_exists($targetDir)) {
    if (!mkdir($targetDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Impossible de créer le dossier de destination sur le serveur LWS."]);
        exit();
    }
}

$originalName = $_FILES['file']['name'];
$extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

// Allowed extensions
$allowedExtensions = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'mp3', 'ogg', 'wav'];
if (!in_array($extension, $allowedExtensions)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Extension de fichier non autorisée."]);
    exit();
}

// Sanitize filename
$baseName = pathinfo($originalName, PATHINFO_FILENAME);
$cleanBaseName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $baseName);
$fileName = $cleanBaseName . '_' . time() . '.' . $extension;
$targetFilePath = $targetDir . $fileName;

if (move_uploaded_file($_FILES['file']['tmp_name'], $targetFilePath)) {
    // Generate public URL
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'ozibd.net';
    $publicUrl = $protocol . $host . '/uploads/' . $category . '/' . $fileName;

    echo json_encode([
        "success" => true,
        "url" => $publicUrl,
        "path" => 'htdocs/uploads/' . $category . '/' . $fileName,
        "name" => $fileName,
        "size" => filesize($targetFilePath),
        "category" => $category,
        "uploadedAt" => date('c')
    ]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Échec de l'écriture du fichier sur le serveur."]);
}
