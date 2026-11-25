import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './config';

export interface UserProfileData {
  userId: string;
  fullName: string;
  email: string;
  username?: string;
  accountCreationDate: Timestamp | string;
  profileInformation: {
    role: string;
    organization: string;
    photoURL: string | null;
    authProvider: string;
    emailVerified: boolean;
    lastLoginAt: Timestamp | string;
  };
}

export interface FirestoreInvestigation {
  investigationId: string;
  userId: string;
  investigationName: string;
  uploadedEvidenceReferences: string[];
  creationDate: Timestamp | string;
  investigationStatus: string;
}

/**
 * Derive a clean lowercase username from full name or email prefix.
 */
function deriveUsername(email: string, fullName?: string): string {
  const base = (fullName || email.split('@')[0] || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');
  return base || 'user';
}

/**
 * Save or update authenticated user profile in Cloud Firestore (`users` collection).
 * Passwords are NEVER stored in Firestore.
 */
export async function syncUserProfileToFirestore(
  user: User,
  extra?: { fullName?: string; username?: string; authProvider?: string }
): Promise<UserProfileData | null> {
  if (!db) return null;

  const userRef = doc(db, 'users', user.uid);
  const existingSnap = await getDoc(userRef);

  const resolvedName =
    extra?.fullName?.trim() ||
    user.displayName ||
    user.email?.split('@')[0] ||
    'Investigator';

  const resolvedEmail = user.email || '';
  const resolvedProvider =
    extra?.authProvider ||
    user.providerData?.[0]?.providerId ||
    'password';

  if (!existingSnap.exists()) {
    const username =
      extra?.username?.toLowerCase().trim() ||
      deriveUsername(resolvedEmail, resolvedName);

    const newProfile: Record<string, any> = {
      userId: user.uid,
      fullName: resolvedName,
      email: resolvedEmail,
      username,
      accountCreationDate: serverTimestamp(),
      profileInformation: {
        role: 'Lead Investigator',
        organization: 'CERBERUS-X Intelligence',
        photoURL: user.photoURL || null,
        authProvider: resolvedProvider,
        emailVerified: user.emailVerified,
        lastLoginAt: serverTimestamp(),
      },
    };

    await setDoc(userRef, newProfile);

    // Save lightweight username -> email index for "Email or Username" login
    if (username && resolvedEmail) {
      try {
        await setDoc(doc(db, 'usernames', username), {
          userId: user.uid,
          email: resolvedEmail,
        });
      } catch {
        // Non-blocking if username is already claimed
      }
    }

    return {
      ...newProfile,
      accountCreationDate: new Date().toISOString(),
      profileInformation: {
        ...newProfile.profileInformation,
        lastLoginAt: new Date().toISOString(),
      },
    } as UserProfileData;
  } else {
    const existingData = existingSnap.data() as UserProfileData;
    await updateDoc(userRef, {
      'profileInformation.lastLoginAt': serverTimestamp(),
      'profileInformation.emailVerified': user.emailVerified,
      ...(user.photoURL && !existingData.profileInformation?.photoURL
        ? { 'profileInformation.photoURL': user.photoURL }
        : {}),
    });
    return existingData;
  }
}

/**
 * Retrieve user profile document from Firestore `users` collection.
 */
export async function getUserProfileFromFirestore(
  uid: string
): Promise<UserProfileData | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfileData) : null;
}

/**
 * Update user's full name / role in Cloud Firestore `users` collection.
 */
export async function updateUserProfileInFirestore(
  uid: string,
  updates: { fullName?: string; role?: string }
): Promise<void> {
  if (!db || !uid) return;
  const userRef = doc(db, 'users', uid);
  const payload: Record<string, any> = {};
  if (updates.fullName?.trim()) {
    payload.fullName = updates.fullName.trim();
  }
  if (updates.role?.trim()) {
    payload['profileInformation.role'] = updates.role.trim();
  }
  if (Object.keys(payload).length > 0) {
    await updateDoc(userRef, payload);
  }
}

/**
 * Look up an email address from a username in the `usernames` collection.
 */
export async function resolveEmailFromUsername(
  usernameOrEmail: string
): Promise<string> {
  const trimmed = usernameOrEmail.trim();
  if (trimmed.includes('@') || !db) {
    return trimmed;
  }

  const usernameDoc = await getDoc(doc(db, 'usernames', trimmed.toLowerCase()));
  if (usernameDoc.exists()) {
    const data = usernameDoc.data();
    if (data?.email) {
      return data.email as string;
    }
  }
  return trimmed;
}

/**
 * Save or update an investigation record owned by the authenticated user in `investigations` collection.
 */
export async function saveInvestigationToFirestore(
  userId: string,
  investigation: {
    investigationId: string;
    investigationName: string;
    uploadedEvidenceReferences?: string[];
    investigationStatus?: string;
  }
): Promise<void> {
  if (!db || !userId) return;

  const docId = `${userId}_${investigation.investigationId}`;
  const ref = doc(db, 'investigations', docId);
  const existing = await getDoc(ref);

  if (!existing.exists()) {
    await setDoc(ref, {
      investigationId: investigation.investigationId,
      userId,
      investigationName: investigation.investigationName,
      uploadedEvidenceReferences: investigation.uploadedEvidenceReferences || [],
      creationDate: serverTimestamp(),
      investigationStatus: investigation.investigationStatus || 'ACTIVE',
    });
  } else {
    await updateDoc(ref, {
      investigationName: investigation.investigationName,
      ...(investigation.uploadedEvidenceReferences
        ? { uploadedEvidenceReferences: investigation.uploadedEvidenceReferences }
        : {}),
      ...(investigation.investigationStatus
        ? { investigationStatus: investigation.investigationStatus }
        : {}),
    });
  }
}

/**
 * Fetch all investigations belonging strictly to the authenticated user from Firestore.
 */
export async function getUserInvestigationsFromFirestore(
  userId: string
): Promise<FirestoreInvestigation[]> {
  if (!db || !userId) return [];

  const q = query(
    collection(db, 'investigations'),
    where('userId', '==', userId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((d) => d.data() as FirestoreInvestigation);
}
