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

/**
 * Persist the entire investigation analysis bundle to Cloud Firestore.
 * Conforms to the structured data model:
 * - investigations/
 * - evidence_metadata/
 * - entities/
 * - knowledge_graphs/
 * - conflicts/
 * - reliability_scores/
 * - audit_logs/
 *
 * NOTE: Original evidence files are NEVER uploaded or saved to Firestore.
 */
export async function saveAnalysisBundleToFirestore(
  userId: string,
  investigationId: number | string,
  bundle: any
): Promise<void> {
  if (!db || !userId) return;

  const invStr = String(investigationId);

  // 1. Update investigation document
  try {
    const invRef = doc(db, 'investigations', `${userId}_${invStr}`);
    await setDoc(invRef, {
      investigationId: invStr,
      userId,
      ownerId: userId,
      title: bundle.investigation?.title || 'Investigation',
      description: bundle.investigation?.description || '',
      caseCode: bundle.investigation?.case_code || `INV-${invStr}`,
      status: bundle.investigation?.status || 'ACTIVE',
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore investigations sync warning:', err);
  }

  // 2. Save Evidence Metadata (NO binary files)
  if (Array.isArray(bundle.evidence_metadata)) {
    for (const ev of bundle.evidence_metadata) {
      try {
        const evRef = doc(db, 'evidence_metadata', `${userId}_${invStr}_${ev.id || ev.evidence_code}`);
        await setDoc(evRef, {
          fileId: String(ev.id || ev.evidence_code),
          investigationId: invStr,
          userId,
          filename: ev.filename,
          fileType: ev.file_type,
          fileSize: ev.file_size_bytes || 0,
          uploadedAt: ev.uploaded_at || new Date().toISOString(),
          processingStatus: ev.status || 'COMPLETED',
          sha256Hash: ev.sha256_hash || '',
          sourceAttribution: ev.source_attribution || '',
          ocrApplied: Boolean(ev.ocr_applied),
          adversarialFlagged: Boolean(ev.adversarial_flagged),
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore evidence_metadata sync warning:', err);
      }
    }
  }

  // 3. Save Entities
  if (Array.isArray(bundle.entities)) {
    for (const ent of bundle.entities) {
      try {
        const entRef = doc(db, 'entities', `${userId}_${invStr}_${ent.id || ent.normalized_name}`);
        await setDoc(entRef, {
          entityId: String(ent.id || ent.normalized_name),
          investigationId: invStr,
          userId,
          name: ent.name,
          normalizedName: ent.normalized_name,
          entityType: ent.entity_type,
          mentionCount: ent.mention_count || 1,
          reviewStatus: ent.review_status || 'PENDING_REVIEW',
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore entities sync warning:', err);
      }
    }
  }

  // 4. Save Knowledge Graph
  if (bundle.knowledge_graph) {
    try {
      const graphRef = doc(db, 'knowledge_graphs', `${userId}_${invStr}`);
      await setDoc(graphRef, {
        graphId: `${userId}_${invStr}`,
        investigationId: invStr,
        userId,
        nodes: bundle.knowledge_graph.nodes || [],
        edges: bundle.knowledge_graph.edges || [],
        stats: bundle.knowledge_graph.stats || {},
        generatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore knowledge_graphs sync warning:', err);
    }
  }

  // 5. Save Conflicts
  if (Array.isArray(bundle.conflicts)) {
    for (const conf of bundle.conflicts) {
      try {
        const confRef = doc(db, 'conflicts', `${userId}_${invStr}_${conf.id || conf.conflict_code}`);
        await setDoc(confRef, {
          conflictId: String(conf.id || conf.conflict_code),
          investigationId: invStr,
          userId,
          conflictCode: conf.conflict_code,
          conflictType: conf.conflict_type,
          severity: conf.severity,
          classification: conf.classification || 'Confirmed Conflict',
          explanation: conf.explanation,
          discrepancyDetails: conf.discrepancy_details || {},
          verificationStatus: conf.verification_status || 'DETECTED',
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore conflicts sync warning:', err);
      }
    }
  }

  // 6. Save Reliability Scores
  if (Array.isArray(bundle.reliability)) {
    for (const rel of bundle.reliability) {
      try {
        const relRef = doc(db, 'reliability_scores', `${userId}_${invStr}_${rel.evidence_id || rel.filename}`);
        await setDoc(relRef, {
          scoreId: String(rel.evidence_id || rel.filename),
          investigationId: invStr,
          userId,
          fileId: String(rel.evidence_id || ''),
          filename: rel.filename || '',
          score: rel.score,
          category: rel.category,
          provenanceNotes: rel.provenance_notes || '',
          authenticityIndicators: rel.authenticity_indicators || [],
          riskFactors: rel.risk_factors || [],
          missingVerification: rel.missing_verification || [],
          recommendedActions: rel.recommended_actions || [],
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore reliability_scores sync warning:', err);
      }
    }
  }

  // 7. Save Audit Log
  try {
    const logRef = doc(db, 'audit_logs', `${userId}_${invStr}_${Date.now()}`);
    await setDoc(logRef, {
      logId: `${userId}_${invStr}_${Date.now()}`,
      investigationId: invStr,
      userId,
      action: 'EVIDENCE_PROCESSED_TEMPORARY_PURGED',
      details: {
        timestamp: new Date().toISOString(),
        filesCount: bundle.evidence_metadata?.length || 0,
        temporaryPurged: true,
      },
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Firestore audit_logs sync warning:', err);
  }
}

/**
 * Record an AI Assistant answer in Firestore `ai_answers` collection.
 */
export async function saveAIAssistantAnswerToFirestore(
  userId: string,
  investigationId: number | string,
  answerData: {
    query: string;
    answer: string;
    reasoningMode: string;
    citations?: any[];
    isSufficient?: boolean;
    confidenceScore?: number;
  }
): Promise<void> {
  if (!db || !userId) return;
  try {
    const invStr = String(investigationId);
    const ansRef = doc(db, 'ai_answers', `${userId}_${invStr}_${Date.now()}`);
    await setDoc(ansRef, {
      answerId: `${userId}_${invStr}_${Date.now()}`,
      investigationId: invStr,
      userId,
      query: answerData.query,
      answer: answerData.answer,
      reasoningMode: answerData.reasoningMode,
      citations: answerData.citations || [],
      isSufficient: answerData.isSufficient ?? true,
      confidenceScore: answerData.confidenceScore ?? 1.0,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Firestore ai_answers sync warning:', err);
  }
}

