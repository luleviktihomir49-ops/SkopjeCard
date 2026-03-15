# SkinCard Designer

AI-powered CS2 skin trading card generator. Built with Firebase Auth + OpenAI + GitHub Pages.

## Live URL
`https://[your-username].github.io/skincard/`

---

## Setup (first time)

### 1. Firebase project
1. Go to [console.firebase.google.com](https://console.firebase.google.com) → New project
2. Enable **Authentication** → Sign-in methods → enable **Google** and **Facebook**
3. Add authorized domains:
   - `localhost`
   - `[your-username].github.io`
4. Copy your Firebase config from Project Settings → General → Your apps → Web

### 2. Facebook App (for Facebook login)
1. Go to [developers.facebook.com](https://developers.facebook.com) → create an app
2. Add product: **Facebook Login**
3. Valid OAuth Redirect URIs → add:
   - `https://[your-firebase-project].firebaseapp.com/__/auth/handler`
4. App Domains → add `[your-username].github.io`

### 3. config.js (local only — never committed)
```bash
cp config.example.js config.js
```
Edit `config.js` and fill in your Firebase values:
```js
export const FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "...",
  appId: "...",
};
```
`config.js` is in `.gitignore` — it will never be pushed to GitHub.

### 4. OpenAI API key
The app asks for your OpenAI key at runtime. It is stored only in `sessionStorage` (cleared when you close the tab) and never saved to the repo or any server.

Get a key at: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

---

## Local development
```bash
# Python (built into macOS)
python3 -m http.server 8080
# Open: http://localhost:8080
```
Firebase has `localhost` as an authorized domain by default.

---

## Deploy to GitHub Pages
```bash
# 1. Create a public GitHub repo named "skincard"
# 2. Clone it and copy all project files in
git clone https://github.com/[username]/skincard.git
cd skincard

# 3. Add your files (config.js is gitignored)
git add .
git commit -m "Initial deploy"
git push origin main

# 4. Go to repo Settings → Pages
#    Source: Deploy from a branch → main → / (root) → Save
# 5. Wait ~60 seconds → live at https://[username].github.io/skincard/
```

---

## File structure
```
skincard/
  index.html          — Main app (login + designer screens)
  style.css           — All styles
  auth.js             — Firebase redirect auth (ES module)
  app.js              — Card designer + OpenAI generation
  config.js           — LOCAL ONLY (in .gitignore) — your Firebase keys
  config.example.js   — Template committed to repo
  .gitignore
  README.md
```

---

## Security notes
- `config.js` is gitignored. **Never commit it.**
- OpenAI key is entered at runtime and stored in `sessionStorage` only.
- Firebase uses `browserLocalPersistence` (IndexedDB) — session survives browser restarts without a password.
- `signInWithRedirect` is used instead of `signInWithPopup` for reliable GitHub Pages support.
