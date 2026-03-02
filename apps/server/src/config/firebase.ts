import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars first
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ─── Firebase Credential Resolution ──────────────────────────────────────────
// Priority 1: FIREBASE_SERVICE_ACCOUNT  – full service-account JSON as a string
// Priority 2: Individual env vars       – FIREBASE_PROJECT_ID + CLIENT_EMAIL + PRIVATE_KEY
// No file-system lookups so this works identically on Render and locally.

let credential: admin.credential.Credential;

try {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT || '';
  const projectId          = process.env.FIREBASE_PROJECT_ID      || '';
  const clientEmail        = process.env.FIREBASE_CLIENT_EMAIL    || '';
  const privateKey         = (process.env.FIREBASE_PRIVATE_KEY    || '').replace(/\\n/g, '\n');

  if (serviceAccountJson) {
    // Full JSON blob stored as env var (recommended for Render)
    const parsed = JSON.parse(serviceAccountJson);
    credential = admin.credential.cert(parsed as admin.ServiceAccount);
    console.log('🔑 Firebase: using FIREBASE_SERVICE_ACCOUNT env var');
  } else if (projectId && clientEmail && privateKey) {
    // Individual credential fields
    credential = admin.credential.cert({ projectId, clientEmail, privateKey } as admin.ServiceAccount);
    console.log('🔑 Firebase: using individual credential env vars');
  } else {
    throw new Error(
      'Firebase credentials not configured. ' +
      'Set FIREBASE_SERVICE_ACCOUNT (full JSON string) ' +
      'or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.'
    );
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log('✅ Firebase Admin Initialized Successfully');
  }
} catch (error) {
  console.error('❌ Firebase Admin Initialization Failed:', error);
  process.exit(1);
}

export const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
export const auth    = admin.auth();
export const storage = admin.storage();
