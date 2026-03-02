
const admin = require('firebase-admin');
const path = require('path');

// NOTE: You must download your Service Account Key from Firebase Console
// Project Settings -> Service Accounts -> Generate New Private Key
// Save the file as 'serviceAccountKey.json' in 'backend/config/' folder
// OR set a GOOGLE_APPLICATION_CREDENTIALS environment variable.

let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
} catch (error) {
  console.warn("Service Account Key not found in config/serviceAccountKey.json. ensure you have set it up or use env vars.");
  // Fallback or just warn - in production you might use environment variables
}

if (serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin Initialized with Service Account");
} else {
   // Try default strategy (env vars)
   if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
       admin.initializeApp();
       console.log("Firebase Admin Initialized with GOOGLE_APPLICATION_CREDENTIALS");
   } else {
       console.error("Firebase Admin NOT Initialized: No serviceAccountKey.json or env var found.");
   }
}

module.exports = admin;


