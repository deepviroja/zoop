import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Ensure env vars are loaded before we try to use them
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const fs = require('fs');

// Find service account file dynamically
const projectRoot = path.resolve(__dirname, '../../');
const files = fs.readdirSync(projectRoot);
const serviceAccountFile = files.find((file: string) => file.endsWith('.json') && file.includes('firebase-adminsdk'));

let credential;
try {
  const projectIdFromEnv = process.env.FIREBASE_PROJECT_ID || '';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || '';
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : '';
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '';

  if (serviceAccountJson) {
    const parsed = JSON.parse(serviceAccountJson);
    credential = admin.credential.cert(parsed as admin.ServiceAccount);
  } else if (clientEmail && privateKey && projectIdFromEnv) {
    credential = admin.credential.cert({
      projectId: projectIdFromEnv,
      clientEmail,
      privateKey,
    } as admin.ServiceAccount);
  }

  let serviceAccountPath;
  if (!credential && serviceAccountFile) {
    serviceAccountPath = path.join(projectRoot, serviceAccountFile);
    console.log(`Loading Firebase credentials from: ${serviceAccountFile}`);
  } else {
    serviceAccountPath = path.join(projectRoot, 'service-account.json');
    if (!credential && fs.existsSync(serviceAccountPath)) {
      console.log('Loading Firebase credentials from service-account.json');
    } else {
       console.log('No service account file found, falling back to application default credentials');
       serviceAccountPath = null;
    }
  }

  if (!credential && serviceAccountPath) {
    const serviceAccount = require(serviceAccountPath);
    credential = admin.credential.cert(serviceAccount);
  } else if (!credential) {
    credential = admin.credential.applicationDefault();
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log('Firebase Admin Initialized Successfully');
  }
} catch (error) {
  console.error('Firebase Admin Initialization Failed:', error);
  process.exit(1); // Exit if critical failure
}

export const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
export const auth = admin.auth();
export const storage = admin.storage();

