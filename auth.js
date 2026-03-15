import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, FacebookAuthProvider,
  signInWithRedirect, getRedirectResult, signOut,
  onAuthStateChanged, browserLocalPersistence, setPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { FIREBASE_CONFIG } from "./config.js";

const app  = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
export { auth };

function showLoginScreen() {
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("app-screen").style.display   = "none";
}

function showAppScreen(user) {
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app-screen").style.display   = "block";
  const avatar = document.getElementById("user-avatar");
  const name   = document.getElementById("user-name");
  if (avatar) { avatar.src = user.photoURL || ""; avatar.style.display = user.photoURL ? "block" : "none"; }
  if (name)   { name.textContent = user.displayName || user.email || "User"; }
  window.dispatchEvent(new CustomEvent("userLoggedIn", { detail: { user } }));
}

function handleAuthError(error) {
  const messages = {
    "auth/unauthorized-domain": "Domain not authorized. Check Firebase Console.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/account-exists-with-different-credential": "Account exists with different provider.",
  };
  const el = document.getElementById("auth-error");
  if (el) { el.textContent = messages[error.code] || error.message; el.style.display = "block"; }
  console.error("Auth error:", error.code, error.message);
}

async function loginWithGoogle() {
  const el = document.getElementById("auth-error");
  if (el) el.style.display = "none";
  await setPersistence(auth, browserLocalPersistence);
  signInWithRedirect(auth, new GoogleAuthProvider());
}

async function loginWithFacebook() {
  const el = document.getElementById("auth-error");
  if (el) el.style.display = "none";
  await setPersistence(auth, browserLocalPersistence);
  signInWithRedirect(auth, new FacebookAuthProvider());
}

async function logout() {
  await signOut(auth);
  showLoginScreen();
}

onAuthStateChanged(auth, (user) => {
  if (user) { showAppScreen(user); } else { showLoginScreen(); }
});

document.addEventListener("DOMContentLoaded", async () => {
  await setPersistence(auth, browserLocalPersistence);
  try {
    const result = await getRedirectResult(auth);
    if (result) console.log("Redirect login:", result.user.displayName);
  } catch (e) { handleAuthError(e); }

  const g = document.getElementById("btn-google");
  const f = document.getElementById("btn-facebook");
  const l = document.getElementById("btn-logout");
  if (g) g.addEventListener("click", loginWithGoogle);
  if (f) f.addEventListener("click", loginWithFacebook);
  if (l) l.addEventListener("click", logout);
});
