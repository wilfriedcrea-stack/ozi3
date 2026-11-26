import { uploadArtworkAsset } from './storageService';

export interface AvatarPreset {
  id: string;
  label: string;
  dataUrl: string;
}

const makeSvgAvatar = (bg1: string, bg2: string, accent: string, hair: string, visor: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${bg1}"/>
        <stop offset="100%" stop-color="${bg2}"/>
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="64" fill="url(#g)"/>
    <circle cx="64" cy="116" r="38" fill="${accent}" opacity="0.92"/>
    <circle cx="64" cy="54" r="24" fill="#f2c6a0"/>
    <path d="M36 56c0-18 12-30 28-30s28 12 28 30c-4-12-13-18-28-18s-24 6-28 18z" fill="${hair}"/>
    <rect x="44" y="47" width="40" height="12" rx="6" fill="${visor}"/>
    <circle cx="54" cy="53" r="2.2" fill="#ffffff"/>
    <circle cx="74" cy="53" r="2.2" fill="#ffffff"/>
    <path d="M57 66c4 4 10 4 14 0" stroke="#7c3f2c" stroke-width="3" stroke-linecap="round" fill="none"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'ozi-kamina',
    label: 'Corail OZI',
    dataUrl: makeSvgAvatar('#1e1b2e', '#ff8679', '#ff8679', '#141418', '#1f2937'),
  },
  {
    id: 'ozi-cyber',
    label: 'Néon Dakar',
    dataUrl: makeSvgAvatar('#0f172a', '#2563eb', '#38bdf8', '#090d16', '#0ea5e9'),
  },
  {
    id: 'ozi-kemet',
    label: 'Or Kemet',
    dataUrl: makeSvgAvatar('#27170e', '#d97706', '#f59e0b', '#1c1917', '#451a03'),
  },
  {
    id: 'ozi-sakura',
    label: 'Brume Ébène',
    dataUrl: makeSvgAvatar('#1f1229', '#c026d3', '#e879f9', '#18181b', '#3b0764'),
  },
  {
    id: 'ozi-emerald',
    label: 'Jade Manga',
    dataUrl: makeSvgAvatar('#0b1f1a', '#059669', '#34d399', '#111827', '#064e3b'),
  },
];

const MAX_RAW_AVATAR_BYTES = 10 * 1024 * 1024;
const AVATAR_SIZE_PX = 256;

/**
 * Crops any uploaded image into a centered 256x256 square and compresses it to WebP/JPEG.
 * Attempts Firebase Storage upload when uid is known, and safely falls back to a compact data URL
 * so profile photo customization works reliably regardless of external storage rules.
 */
export async function processAndUploadAvatar(
  file: File,
  uid?: string
): Promise<{ photoURL: string }> {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (file.type && !allowed.includes(file.type)) {
    throw new Error('Format non supporté. Utilisez une image JPG, PNG, WEBP ou GIF.');
  }
  if (file.size > MAX_RAW_AVATAR_BYTES) {
    throw new Error('Image trop lourde (maximum 10 Mo).');
  }

  const { blob, dataUrl } = await compressSquareAvatar(file);

  if (uid) {
    try {
      const ext = blob.type === 'image/jpeg' ? 'jpg' : 'webp';
      const storagePath = `avatars/${uid}/avatar_${Date.now()}.${ext}`;
      const res = await uploadArtworkAsset(blob, storagePath);
      if (res?.downloadUrl) {
        return { photoURL: res.downloadUrl };
      }
    } catch {
      // Fallback to compact WebP dataUrl stored inside Firestore user profile
    }
  }

  if (dataUrl.length > 105000) {
    throw new Error('L\'image compressée reste trop volumineuse. Choisissez une image plus légère.');
  }

  return { photoURL: dataUrl };
}

function compressSquareAvatar(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const side = Math.min(img.width, img.height);
      const sx = Math.max(0, Math.floor((img.width - side) / 2));
      const sy = Math.max(0, Math.floor((img.height - side) / 2));

      const canvas = document.createElement('canvas');
      canvas.width = AVATAR_SIZE_PX;
      canvas.height = AVATAR_SIZE_PX;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Impossible de traiter l\'image sur cet appareil.'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE_PX, AVATAR_SIZE_PX);

      const exportWithFormat = (mime: 'image/webp' | 'image/jpeg', quality: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              if (mime === 'image/webp') {
                exportWithFormat('image/jpeg', 0.82);
                return;
              }
              reject(new Error('Échec de la compression de l\'avatar.'));
              return;
            }
            const dataUrl = canvas.toDataURL(mime, quality);
            resolve({ blob, dataUrl });
          },
          mime,
          quality
        );
      };

      exportWithFormat('image/webp', 0.82);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Impossible de lire le fichier image sélectionné.'));
    };

    img.src = objectUrl;
  });
}
