import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updateProfile, 
  signOut, 
  User 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { ReaderProfile } from '../types';

/**
 * Maps Firebase Auth error codes to user-friendly messages in French
 */
export function mapAuthError(err: unknown): string {
  if (!err || typeof err !== 'object') {
    return 'Une erreur inattendue est survenue. Veuillez réessayer.';
  }

  const code = (err as { code?: string }).code || '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'Cette adresse e-mail est déjà associée à un compte OZI. Essayez de vous connecter.';
    case 'auth/invalid-email':
      return 'Format d\'adresse e-mail invalide.';
    case 'auth/weak-password':
      return 'Le mot de passe doit comporter au moins 6 caractères.';
    case 'auth/wrong-password':
      return 'Mot de passe incorrect.';
    case 'auth/user-not-found':
      return 'Aucun compte OZI ne correspond à cette adresse e-mail.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Identifiants invalides. Veuillez vérifier votre e-mail et votre mot de passe.';
    case 'auth/popup-closed-by-user':
      return 'La fenêtre de connexion Google a été fermée avant la validation.';
    case 'auth/popup-blocked':
      return 'Le navigateur a bloqué la fenêtre de connexion Google. Veuillez autoriser les pop-ups pour OZI.';
    case 'auth/network-request-failed':
      return 'Connexion réseau impossible. Veuillez vérifier votre connexion Internet.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives infructueuses. Veuillez patienter quelques instants avant de réessayer.';
    case 'auth/user-disabled':
      return 'Ce compte a été désactivé par l\'équipe de modération.';
    case 'auth/operation-not-allowed':
      return 'Ce mode de connexion n\'est pas encore activé dans la console Firebase.';
    default: {
      const message = (err as { message?: string }).message;
      return message || 'Une erreur est survenue lors de l\'authentification.';
    }
  }
}

/**
 * Fetches existing reader profile from Firestore /users/{uid} or creates it on first login
 */
export async function fetchOrCreateReaderProfile(user: User, fallbackDisplayName?: string): Promise<ReaderProfile> {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  const now = new Date().toISOString();

  if (userSnap.exists()) {
    const data = userSnap.data();
    const profile: ReaderProfile = {
      uid: user.uid,
      displayName: data.displayName || user.displayName || fallbackDisplayName || user.email?.split('@')[0] || 'Lecteur OZI',
      email: data.email || user.email || '',
      photoURL: data.photoURL || user.photoURL || '',
      role: 'reader',
      createdAt: data.createdAt || now,
      updatedAt: now,
      bio: data.bio || ''
    };

    // Keep last active timestamp updated
    try {
      await updateDoc(userRef, { updatedAt: now });
    } catch {
      // Ignore background timestamp update error
    }

    return profile;
  }

  // Create new profile document for first-time reader
  const newProfile: ReaderProfile = {
    uid: user.uid,
    displayName: user.displayName || fallbackDisplayName || user.email?.split('@')[0] || 'Lecteur OZI',
    email: user.email || '',
    photoURL: user.photoURL || '',
    role: 'reader',
    createdAt: now,
    updatedAt: now,
    bio: ''
  };

  await setDoc(userRef, newProfile);
  return newProfile;
}

/**
 * Signs in with Google Popup
 */
export async function signInReaderWithGoogle(): Promise<{ success: boolean; profile?: ReaderProfile; error?: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const profile = await fetchOrCreateReaderProfile(result.user);
    return { success: true, profile };
  } catch (err) {
    return { success: false, error: mapAuthError(err) };
  }
}

/**
 * Signs in with Email and Password
 */
export async function signInReaderWithEmail(email: string, pass: string): Promise<{ success: boolean; profile?: ReaderProfile; error?: string }> {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const profile = await fetchOrCreateReaderProfile(result.user);
    return { success: true, profile };
  } catch (err) {
    return { success: false, error: mapAuthError(err) };
  }
}

/**
 * Registers a new reader with Email and Password + Pseudonym
 */
export async function signUpReaderWithEmail(displayName: string, email: string, pass: string): Promise<{ success: boolean; profile?: ReaderProfile; error?: string }> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const cleanName = displayName.trim() || 'Lecteur OZI';

    // Update Firebase Auth profile
    try {
      await updateProfile(result.user, { displayName: cleanName });
    } catch {}

    // Create Firestore document
    const profile = await fetchOrCreateReaderProfile(result.user, cleanName);
    return { success: true, profile };
  } catch (err) {
    return { success: false, error: mapAuthError(err) };
  }
}

/**
 * Sends a password reset email
 */
export async function sendReaderPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true };
  } catch (err) {
    return { success: false, error: mapAuthError(err) };
  }
}

/**
 * Signs out the current reader
 */
export async function signOutReader(): Promise<void> {
  await signOut(auth);
}

/**
 * Updates editable fields of reader profile in Firestore
 */
export async function updateReaderProfileInDb(uid: string, updates: { displayName?: string; bio?: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = doc(db, 'users', uid);
    const now = new Date().toISOString();
    const payload: Record<string, any> = { updatedAt: now };

    if (updates.displayName !== undefined) {
      payload.displayName = updates.displayName.trim();
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: updates.displayName.trim() });
      }
    }

    if (updates.bio !== undefined) {
      payload.bio = updates.bio.trim();
    }

    await updateDoc(userRef, payload);
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Impossible de mettre à jour le profil.' };
  }
}
