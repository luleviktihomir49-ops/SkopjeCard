/**
 * auth.js — Firebase redirect-based authentication
 * Uses signInWithRedirect (not popup) for GitHub Pages compatibility.
 * Session is persisted via browserLocalPersistence (IndexedDB).
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { FIREBASE_CONFIG } from "./config.js";

// ── Init ────────────────────────────────────────────────────────────────────

const app  = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);

// Export auth instance so app.js can use it if needed
export { auth };

// ── DOM refs ────────────────────────────────────────────────────────────────

const loginScreen   = document.getElementById("login-screen");
const appScreen     = document.getElementById("app-screen");
const btnGoogle     = document.getElementById("btn-google");
const btnFacebook   = document.getElementById("btn-facebook");
const btnLogout     = document.getElementById("btn-logout");
const authError     = document.getElementById("auth-error");
const userAvatar    = document.getElementById("user-avatar");
const userName      = document.getElementById("user-name");

// ── Screen helpers ───────────────────────────────────────────────────────────

function showLoginScreen() {
  loginScreen.style.display = "flex";
  appScreen.style.display   = "none";
}

function showAppScreen(user) {
  loginScreen.style.display = "none";
  appScreen.style.display   = "flex";

  // Populate user info in header
  if (user.photoURL) {
    userAvatar.src = user.photoURL;
    userAvatar.style.display = "block";
  } else {
    userAvatar.style.display = "none";
  }
  userName.textContent = user.displayName || user.email || "User";

  // Notify app.js
  window.dispatchEvent(new CustomEvent("userLoggedIn", { detail: { user } }));
}

// ── Error handler ────────────────────────────────────────────────────────────

function handleAuthError(error) {
  const messages = {
    "auth/popup-blocked":           "Popup was blocked. Please allow popups for this site.",
    "auth/popup-closed-by-user":    "Login was cancelled.",
    "auth/cancelled-popup-request": "Another login is already in progress.",
    "auth/account-exists-with-different-credential":
      "An account already exists with a different sign-in method.",
    "auth/network-request-failed":  "Network error. Check your connection.",
    "auth/unauthorized-domain":
      "This domain is not authorized in Firebase. Add it in Firebase Console → Auth → Authorized Domains.",
  };

  const msg = messages[error.code] || `Auth error: ${error.message}`;
  authError.textContent = msg;
  authError.style.display = "block";
  console.error("Auth error:", error.code, error.message);
}

// ── Redirect result ──────────────────────────────────────────────────────────

async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.log("Logged in via redirect:", result.user.displayName);
      // onAuthStateChanged will fire and handle showAppScreen
    }
  } catch (error) {
    handleAuthError(error);
  }
}

// ── Login functions ──────────────────────────────────────────────────────────

async function loginWithGoogle() {
  authError.style.display = "none";
  try {
    await setPersistence(auth, browserLocalPersistence);
    const provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");
    signInWithRedirect(auth, provider);
    // Page navigates away — execution stops here.
    // On return, handleRedirectResult() picks up the result.
  } catch (error) {
    handleAuthError(error);
  }
}

async function loginWithFacebook() {
  authError.style.display = "none";
  try {
    await setPersistence(auth, browserLocalPersistence);
    const provider = new FacebookAuthProvider();
    provider.addScope("email");
    signInWithRedirect(auth, provider);
    // Page navigates away — execution stops here.
  } catch (error) {
    handleAuthError(error);
  }
}

async function logout() {
  try {
    await signOut(auth);
    showLoginScreen();
  } catch (error) {
    console.error("Logout error:", error);
  }
}

// ── onAuthStateChanged ───────────────────────────────────────────────────────
// Fires on every page load. This is the authoritative source for login state.

onAuthStateChanged(auth, (user) => {
  if (user) {
    showAppScreen(user);
  } else {
    showLoginScreen();
  }
});

// ── Init (called on DOMContentLoaded) ────────────────────────────────────────

async function initAuth() {
  // Set persistence first
  await setPersistence(auth, browserLocalPersistence);

  // Check if returning from a redirect login
  await handleRedirectResult();

  // Wire up buttons
  btnGoogle.addEventListener("click", loginWithGoogle);
  btnFacebook.addEventListener("click", loginWithFacebook);
  btnLogout.addEventListener("click", logout);
}

// Start
document.addEventListener("DOMContentLoaded", initAuth);
