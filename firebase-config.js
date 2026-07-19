// ─── Firebase Configuration ──────────────────────────────────
// TODO: Replace this configuration with your actual Firebase project config.
// You can find this in your Firebase Console under Project Settings > General > Your apps.

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
let app, auth, db, storage;

try {
  app = firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();
  storage = firebase.storage();
  
  console.log("Firebase initialized successfully.");
} catch (error) {
  console.error("Firebase initialization failed:", error);
  console.warn("Make sure you have replaced the YOUR_* placeholders in firebase-config.js with your actual Firebase config.");
}
