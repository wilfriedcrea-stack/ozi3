import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

export interface UploadProgressCallback {
  (progressPercent: number, statusText: string): void;
}

export async function uploadArtworkAsset(
  file: File | Blob,
  path: string,
  onProgress?: UploadProgressCallback
): Promise<{ downloadUrl: string; storagePath: string }> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/mpeg', 'audio/mp3'];
  if (file.type && !allowedTypes.includes(file.type)) {
    throw new Error(`Format non supporté (${file.type}). Utilisez JPG, PNG, WEBP ou MP3.`);
  }

  const maxSizeBytes = 20 * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`Fichier trop volumineux (${(file.size / (1024 * 1024)).toFixed(1)} Mo). Maximum : 20 Mo.`);
  }

  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type || 'image/webp',
    cacheControl: 'public,max-age=31536000'
  });

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) {
          onProgress(progress, `Téléversement : ${progress}%`);
        }
      },
      (error) => {
        reject(new Error(`Échec du téléversement Storage : ${error.message}`));
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({ downloadUrl, storagePath: path });
      }
    );
  });
}

export async function deleteStorageAsset(storagePath: string): Promise<void> {
  if (!storagePath) return;
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn(`Asset Storage introuvable ou déjà supprimé : ${storagePath}`, err);
  }
}
