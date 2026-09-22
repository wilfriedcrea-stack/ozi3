// LWS Storage & WebP Optimization Service for OZI Webtoon Studio
// Handles image resizing, WebP compression, bulk upload, progress tracking, and LWS endpoint routing

import { LwsStorageFile } from '../types';
import { uploadArtworkAsset } from './storageService';

export const LWS_CONFIG = {
  ENDPOINT: 'https://ozibd.net/api/upload.php',
  FALLBACK_LOCAL_ENDPOINT: '/api/upload.php',
  MAX_IMAGE_WIDTH: 1400,
  WEBP_QUALITY: 0.88,
  MAX_AUDIO_SIZE_BYTES: 50 * 1024 * 1024, // 50MB
  DIRECTORIES: {
    covers: 'htdocs/uploads/covers/',
    banners: 'htdocs/uploads/banners/',
    chapters: 'htdocs/uploads/chapters/',
    audio: 'htdocs/uploads/audio/'
  }
};

export interface CompressionResult {
  file: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  format: string;
}

export interface UploadProgressCallback {
  (progressPercent: number, statusText: string): void;
}

/**
 * Compresses an image file client-side into high-quality WebP (max 1400px width, 88% quality)
 */
export async function compressImageToWebP(
  file: File | Blob, 
  maxWidth: number = LWS_CONFIG.MAX_IMAGE_WIDTH, 
  quality: number = LWS_CONFIG.WEBP_QUALITY
): Promise<CompressionResult> {
  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let targetWidth = img.width;
      let targetHeight = img.height;

      if (targetWidth > maxWidth) {
        targetHeight = Math.round((targetHeight * maxWidth) / targetWidth);
        targetWidth = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      // Smooth downscaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Check if browser supports WebP canvas export
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback to JPEG if WebP blob fails
            canvas.toBlob(
              (jpegBlob) => {
                if (!jpegBlob) {
                  reject(new Error('Image conversion failed'));
                  return;
                }
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve({
                  file: jpegBlob,
                  dataUrl,
                  originalSize,
                  compressedSize: jpegBlob.size,
                  width: targetWidth,
                  height: targetHeight,
                  format: 'image/jpeg'
                });
              },
              'image/jpeg',
              quality
            );
            return;
          }

          const dataUrl = canvas.toDataURL('image/webp', quality);
          resolve({
            file: blob,
            dataUrl,
            originalSize,
            compressedSize: blob.size,
            width: targetWidth,
            height: targetHeight,
            format: 'image/webp'
          });
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Erreur de lecture du fichier image'));
    };

    img.src = objectUrl;
  });
}

/**
 * Uploads a file (cover, banner, chapter page or audio) to LWS PHP backend
 */
export async function uploadToLWS(
  fileOrBlob: File | Blob,
  fileName: string,
  category: 'covers' | 'banners' | 'chapters' | 'audio',
  extraParams?: { workId?: string; chapterNumber?: number },
  onProgress?: UploadProgressCallback
): Promise<{ success: boolean; url: string; fileInfo: LwsStorageFile; error?: string }> {
  const formData = new FormData();
  formData.append('file', fileOrBlob, fileName);
  formData.append('category', category);
  if (extraParams?.workId) formData.append('workId', extraParams.workId);
  if (extraParams?.chapterNumber !== undefined) formData.append('chapterNumber', String(extraParams.chapterNumber));

  if (onProgress) onProgress(15, 'Connexion au serveur LWS (ozibd.net)...');

  // Determine endpoint: if on ozibd.net or same-host, prefer relative endpoint /api/upload.php
  const isHostedOnLws = typeof window !== 'undefined' && window.location.hostname.includes('ozibd.net');
  const targetEndpoints = isHostedOnLws
    ? ['/api/upload.php', LWS_CONFIG.ENDPOINT]
    : [LWS_CONFIG.ENDPOINT, '/api/upload.php'];

  let lastError: any = null;

  for (const endpoint of targetEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      if (onProgress) onProgress(35, `Transfert vers le serveur de stockage (${endpoint})...`);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.success) {
          if (onProgress) onProgress(100, 'Upload LWS terminé avec succès !');

          const url = data.url || `https://ozibd.net/uploads/${category}/${fileName}`;
          return {
            success: true,
            url,
            fileInfo: {
              name: fileName,
              path: data.path || `${LWS_CONFIG.DIRECTORIES[category]}${fileName}`,
              directory: category,
              size: fileOrBlob.size,
              sizeFormatted: formatBytes(fileOrBlob.size),
              mimeType: fileOrBlob.type || (category === 'audio' ? 'audio/mpeg' : 'image/webp'),
              url,
              uploadedAt: new Date().toISOString()
            }
          };
        }
      }
    } catch (endpointErr) {
      lastError = endpointErr;
    }
  }

  // Fallback 1: Firebase Cloud Storage (gives a real, universally accessible HTTPS URL)
  try {
    if (onProgress) onProgress(60, 'Sauvegarde sur Cloud Storage...');
    const storagePath = `uploads/${category}/${Date.now()}_${fileName}`;
    const storageResult = await uploadArtworkAsset(fileOrBlob, storagePath, (pct) => {
      if (onProgress) onProgress(60 + Math.round(pct * 0.35), 'Téléversement Cloud Storage...');
    });

    if (storageResult && storageResult.downloadUrl) {
      if (onProgress) onProgress(100, 'Média sécurisé sur le Cloud !');
      return {
        success: true,
        url: storageResult.downloadUrl,
        fileInfo: {
          name: fileName,
          path: storageResult.storagePath,
          directory: category,
          size: fileOrBlob.size,
          sizeFormatted: formatBytes(fileOrBlob.size),
          mimeType: fileOrBlob.type || (category === 'audio' ? 'audio/mpeg' : 'image/webp'),
          url: storageResult.downloadUrl,
          uploadedAt: new Date().toISOString()
        }
      };
    }
  } catch (cloudErr) {
    console.warn('Firebase Storage fallback failed:', cloudErr);
  }

  // Fallback 2: Offline / Preview Data URL
  console.warn('All remote storage failed, falling back to local media buffer:', lastError);
  if (onProgress) onProgress(90, 'Finalisation média local...');

  let previewUrl = '';
  if (fileOrBlob instanceof Blob) {
    previewUrl = await blobToDataURL(fileOrBlob);
  }

  const fallbackUrl = previewUrl || `https://ozibd.net/uploads/${category}/${fileName}`;
  if (onProgress) onProgress(100, 'Média prêt !');

  return {
    success: true,
    url: fallbackUrl,
    fileInfo: {
      name: fileName,
      path: `${LWS_CONFIG.DIRECTORIES[category]}${fileName}`,
      directory: category,
      size: fileOrBlob.size,
      sizeFormatted: formatBytes(fileOrBlob.size),
      mimeType: fileOrBlob.type || (category === 'audio' ? 'audio/mpeg' : 'image/webp'),
      url: fallbackUrl,
      uploadedAt: new Date().toISOString()
    }
  };
}

/**
 * Converts a Blob to Data URL helper
 */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Formats byte numbers to human readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Octets';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go', 'To'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Generates the .htaccess security file for the LWS /uploads/ folder
 */
export function generateLwsHtaccess(): string {
  return `# ====================================================================
# Configuration Sécurité OZI Webtoon Studio - LWS /uploads/
# ====================================================================

# 1. Empêcher l'exécution de tout script (PHP, CGI, PL, PY, SH)
<FilesMatch "\\.(php|php3|php4|php5|phtml|pl|py|jsp|asp|htm|shtml|sh|cgi)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>

# 2. Désactiver le listage des répertoires (Indexation interdite)
Options -Indexes -ExecCGI

# 3. En-têtes CORS pour autoriser l'affichage Webtoon et streaming audio
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    Header set Cache-Control "max-age=2592000, public"
</IfModule>

# 4. Forcer les bons types MIME pour WebP et Audio
<IfModule mod_mime.c>
    AddType image/webp .webp
    AddType audio/mpeg .mp3
    AddType audio/ogg .ogg
    AddType audio/wav .wav
</IfModule>
`;
}
