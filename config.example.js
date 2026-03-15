// config.example.js — Copy this to config.js and fill in your values.
// config.js is in .gitignore and will NEVER be committed to the repo.

export const FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// OpenAI key is entered by the user at runtime (stored in sessionStorage).
// You do NOT need to put anything here — leave it empty.
// export const OPENAI_API_KEY = ""; // not used
