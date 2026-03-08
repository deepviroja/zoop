import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load env vars first. Support both ts-node (src) and compiled dist runtime.
const envPathCandidates = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
];

for (const envPath of envPathCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

// ─── Firebase Credential Resolution ──────────────────────────────────────────
// Priority 1: FIREBASE_SERVICE_ACCOUNT  – full service-account JSON as a string
// Priority 2: Individual env vars       – FIREBASE_PROJECT_ID + CLIENT_EMAIL + PRIVATE_KEY
// Priority 3: Local service-account.json in apps/server for local development.

let credential: admin.credential.Credential | undefined;

try {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT || '';
  const projectId          = process.env.FIREBASE_PROJECT_ID      || '';
  const clientEmail        = process.env.FIREBASE_CLIENT_EMAIL    || '';
  const privateKey         = (process.env.FIREBASE_PRIVATE_KEY    || '').replace(/\\n/g, '\n');
  const localServiceAccountCandidates = [
    path.resolve(__dirname, '../../service-account.json'),
    path.resolve(__dirname, '../../../service-account.json'),
  ];

  if (serviceAccountJson) {
    try {
      // Full JSON blob stored as env var (recommended for Render)
      const parsed = JSON.parse(serviceAccountJson);
      credential = admin.credential.cert(parsed as admin.ServiceAccount);
      console.log('🔑 Firebase: using FIREBASE_SERVICE_ACCOUNT env var');
    } catch (error) {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT is set but invalid JSON. Falling back to other credential sources.');
    }
  }

  if (!credential && projectId && clientEmail && privateKey) {
    // Individual credential fields
    credential = admin.credential.cert({ projectId, clientEmail, privateKey } as admin.ServiceAccount);
    console.log('🔑 Firebase: using individual credential env vars');
  }

  if (!credential) {
    const localServiceAccountPath = localServiceAccountCandidates.find((candidate) =>
      fs.existsSync(candidate),
    );
    if (localServiceAccountPath) {
      const parsed = JSON.parse(fs.readFileSync(localServiceAccountPath, 'utf8'));
      credential = admin.credential.cert(parsed as admin.ServiceAccount);
      console.log('🔑 Firebase: using local service-account.json');
    } else {
      throw new Error(
        'Firebase credentials not configured. ' +
        'Set FIREBASE_SERVICE_ACCOUNT (full JSON string) ' +
        'or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY, ' +
        'or add apps/server/service-account.json for local development.'
      );
    }
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
