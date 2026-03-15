/**
 * app.js — SkinCard Designer
 * Handles: card style selection, form input, OpenAI generation, card rendering, PNG download.
 * OpenAI key is entered at runtime and stored in sessionStorage only (never committed to repo).
 */

// ── Constants ────────────────────────────────────────────────────────────────

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL    = "gpt-4o-mini";

const SESSION_KEY = "oai_key";

// ── DOM refs ─────────────────────────────────────────────────────────────────

const card           = document.getElementById("card-preview");
const btnGenerate    = document.getElementById("btn-generate");
const generateLabel  = document.getElementById("generate-label");
const generateSpinner = document.getElementById("generate-spinner");
const btnDownload    = document.getElementById("btn-download");
const btnReset       = document.getElementById("btn-reset");
const genError       = document.getElementById("gen-error");

// Form inputs
const inputName    = document.getElementById("skin-name");
const inputTier    = document.getElementById("skin-tier");
const inputType    = document.getElementById("skin-type");
const inputTheme   = document.getElementById("skin-theme");
const inputColors  = document.getElementById("skin-colors");
const inputWear    = document.getElementById("skin-wear");

// Card display fields
const cardSkinName   = document.getElementById("card-skin-name");
const cardWeaponType = document.getElementById("card-weapon-type");
const cardTierBadge  = document.getElementById("card-tier-badge");
const cardWear       = document.getElementById("card-wear");
const cardFloat      = document.getElementById("card-float");
const cardPattern    = document.getElementById("card-pattern");
const cardDescription = document.getElementById("card-description");
const cardNumber     = document.getElementById("card-number");
const cardArtArea    = document.getElementById("card-art-area");

// API key UI
const apiKeyBadge   = document.getElementById("api-key-badge");
const apiKeyStatus  = document.getElementById("api-key-status");
const apiKeyModal   = document.getElementById("api-key-modal");
const apiKeyInput   = document.getElementById("api-key-input");
const btnSaveKey    = document.getElementById("btn-save-key");
const btnCancelKey  = document.getElementById("btn-cancel-key");
const modalError    = document.getElementById("modal-error");

// Style buttons
const styleBtns = document.querySelectorAll(".style-btn");

// ── State ────────────────────────────────────────────────────────────────────

let currentStyle = "standard";

// ── API Key management ───────────────────────────────────────────────────────

function getApiKey() {
  return sessionStorage.getItem(SESSION_KEY) || "";
}

function saveApiKey(key) {
  sessionStorage.setItem(SESSION_KEY, key.trim());
  updateKeyBadge();
}

function updateKeyBadge() {
  const key = getApiKey();
  if (key) {
    apiKeyStatus.textContent = "🔑 API Key set";
    apiKeyBadge.classList.add("key-set");
  } else {
    apiKeyStatus.textContent = "🔑 No API Key";
    apiKeyBadge.classList.remove("key-set");
  }
}

function showApiKeyModal(required = false) {
  modalError.style.display = "none";
  apiKeyInput.value = getApiKey();
  apiKeyModal.style.display = "flex";
  // If required (no key present), hide cancel button
  btnCancelKey.style.display = required ? "none" : "block";
  setTimeout(() => apiKeyInput.focus(), 50);
}

function hideApiKeyModal() {
  apiKeyModal.style.display = "none";
}

function checkApiKey() {
  if (!getApiKey()) {
    showApiKeyModal(true);
  }
  updateKeyBadge();
}

// ── Card style ───────────────────────────────────────────────────────────────

const STYLE_CLASSES = ["card-standard", "card-black", "card-gold", "card-holographic"];

function setCardStyle(style) {
  currentStyle = style;
  STYLE_CLASSES.forEach(c => card.classList.remove(c));
  card.classList.add(`card-${style}`);
  styleBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.style === style);
  });
}

// ── Card number generator ────────────────────────────────────────────────────

function generateCardNumber() {
  const groups = Array.from({ length: 4 }, () =>
    String(Math.floor(Math.random() * 9000) + 1000)
  );
  return groups.join(" ");
}

// ── Tier badge class ─────────────────────────────────────────────────────────

const TIER_CLASS_MAP = {
  "Consumer Grade":  "tier-consumer",
  "Industrial Grade":"tier-industrial",
  "Mil-Spec":        "tier-milspec",
  "Restricted":      "tier-restricted",
  "Classified":      "tier-classified",
  "Covert":          "tier-covert",
  "Contraband":      "tier-contraband",
  "Legendary":       "tier-legendary",
};

function setTierBadge(tier) {
  cardTierBadge.textContent = tier || "—";
  Object.values(TIER_CLASS_MAP).forEach(c => cardTierBadge.classList.remove(c));
  if (tier && TIER_CLASS_MAP[tier]) {
    cardTierBadge.classList.add(TIER_CLASS_MAP[tier]);
  }
}

// ── Render card from data ────────────────────────────────────────────────────

function renderCard(data) {
  cardSkinName.textContent  = data.name        || "SKIN NAME";
  cardWeaponType.textContent = data.weaponType || "—";
  cardDescription.textContent = data.description || "";
  cardWear.textContent      = data.wear        || "—";
  cardFloat.textContent     = data.floatValue  || "—";
  cardPattern.textContent   = data.patternIndex || "—";
  cardNumber.textContent    = generateCardNumber();

  setTierBadge(data.tier || "");

  // Art area: show gradient or emoji based on theme
  if (data.artEmoji) {
    cardArtArea.innerHTML = `<div style="font-size:48px;text-align:center;">${data.artEmoji}</div>`;
  } else {
    const colors = (data.artColors || ["#1a1a2e", "#16213e"]).join(", ");
    cardArtArea.innerHTML = `
      <div style="
        width:100%; height:100%;
        background: linear-gradient(135deg, ${colors});
        display:flex; align-items:center; justify-content:center;
        font-size:11px; color:rgba(255,255,255,0.3); font-style:italic;
      ">${data.artCaption || ""}</div>
    `;
  }
}

// ── OpenAI generation ────────────────────────────────────────────────────────

async function generateCard() {
  const key = getApiKey();
  if (!key) {
    showApiKeyModal(true);
    return;
  }

  const name   = inputName.value.trim();
  const tier   = inputTier.value;
  const type   = inputType.value;
  const theme  = inputTheme.value.trim();
  const colors = inputColors.value.trim();
  const wear   = inputWear.value;

  if (!name) {
    showGenError("Please enter a skin name.");
    inputName.focus();
    return;
  }

  setGenerating(true);
  hideGenError();

  const prompt = buildPrompt({ name, tier, type, theme, colors, wear });

  try {
    const response = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a creative CS2 skin lore writer and trading card designer. " +
              "Respond ONLY with valid JSON matching the requested schema. No markdown, no explanation.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.85,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err.error?.message || `HTTP ${response.status}`;
      if (response.status === 401) {
        sessionStorage.removeItem(SESSION_KEY);
        updateKeyBadge();
        throw new Error("Invalid API key. Please re-enter your OpenAI key.");
      }
      throw new Error(msg);
    }

    const data   = await response.json();
    const raw    = data.choices?.[0]?.message?.content?.trim() || "{}";
    const parsed = parseJsonSafe(raw);

    renderCard({
      name:         parsed.name         || name,
      tier:         parsed.tier         || tier,
      weaponType:   parsed.weaponType   || type,
      wear:         parsed.wear         || wear,
      floatValue:   parsed.floatValue   || randomFloat(wear),
      patternIndex: parsed.patternIndex || String(Math.floor(Math.random() * 999) + 1),
      description:  parsed.description  || "",
      artEmoji:     parsed.artEmoji     || null,
      artColors:    parsed.artColors    || defaultArtColors(currentStyle),
      artCaption:   parsed.artCaption   || name,
    });

  } catch (error) {
    showGenError(error.message || "Generation failed. Check your API key and try again.");
  } finally {
    setGenerating(false);
  }
}

function buildPrompt({ name, tier, type, theme, colors, wear }) {
  return `Create a CS2 trading card for this skin:
Name: "${name}"
Tier: "${tier || "Unknown"}"
Weapon: "${type || "Unknown"}"
Theme: "${theme || "none"}"
Colors: "${colors || "any"}"
Wear: "${wear || "any"}"

Return ONLY this JSON (no markdown):
{
  "name": "exact skin name",
  "tier": "rarity tier",
  "weaponType": "weapon or item type",
  "wear": "wear condition",
  "floatValue": "e.g. 0.0312",
  "patternIndex": "e.g. 417",
  "description": "1-2 sentence atmospheric lore description (max 120 chars)",
  "artEmoji": "single emoji that best represents this skin visually, or null",
  "artColors": ["#hex1", "#hex2", "#hex3"],
  "artCaption": "short 2-3 word visual caption"
}`;
}

function parseJsonSafe(raw) {
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {};
  }
}

function randomFloat(wear) {
  const ranges = {
    "Factory New":    [0.00, 0.07],
    "Minimal Wear":   [0.07, 0.15],
    "Field-Tested":   [0.15, 0.38],
    "Well-Worn":      [0.38, 0.45],
    "Battle-Scarred": [0.45, 1.00],
  };
  const [min, max] = ranges[wear] || [0.00, 1.00];
  return (Math.random() * (max - min) + min).toFixed(4);
}

function defaultArtColors(style) {
  const map = {
    standard:     ["#1a1a2e", "#16213e", "#0f3460"],
    black:        ["#0a0a0a", "#1a1a1a", "#222"],
    gold:         ["#78350f", "#b45309", "#d97706"],
    holographic:  ["#1e1b4b", "#312e81", "#7c3aed"],
  };
  return map[style] || map.standard;
}

// ── UI helpers ───────────────────────────────────────────────────────────────

function setGenerating(on) {
  btnGenerate.disabled      = on;
  generateLabel.style.display  = on ? "none" : "inline";
  generateSpinner.style.display = on ? "inline-block" : "none";
}

function showGenError(msg) {
  genError.textContent    = msg;
  genError.style.display  = "block";
}

function hideGenError() {
  genError.style.display = "none";
}

function resetCard() {
  cardSkinName.textContent   = "SKIN NAME";
  cardWeaponType.textContent = "Weapon Type";
  cardTierBadge.textContent  = "—";
  cardWear.textContent       = "—";
  cardFloat.textContent      = "—";
  cardPattern.textContent    = "—";
  cardNumber.textContent     = "•••• •••• •••• ••••";
  cardDescription.textContent = "Fill in the skin details and click Generate Card to create your trading card.";
  cardArtArea.innerHTML = `<div class="card-art-placeholder"><span>Card art will appear here</span></div>`;
  Object.values(TIER_CLASS_MAP).forEach(c => cardTierBadge.classList.remove(c));
  hideGenError();

  inputName.value   = "";
  inputTier.value   = "";
  inputType.value   = "";
  inputTheme.value  = "";
  inputColors.value = "";
  inputWear.value   = "";
}

// ── Download PNG ─────────────────────────────────────────────────────────────

async function downloadCard() {
  if (typeof html2canvas === "undefined") {
    alert("html2canvas not loaded. Check your internet connection.");
    return;
  }

  try {
    const canvas = await html2canvas(card, {
      scale:           2,
      backgroundColor: null,
      useCORS:         true,
      allowTaint:      false,
      logging:         false,
    });

    const link    = document.createElement("a");
    const name    = cardSkinName.textContent.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    link.download = `skincard_${name}.png`;
    link.href     = canvas.toDataURL("image/png");
    link.click();
  } catch (err) {
    console.error("Download failed:", err);
    alert("PNG export failed. Try again.");
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────

function initApp() {
  // Style buttons
  styleBtns.forEach(btn => {
    btn.addEventListener("click", () => setCardStyle(btn.dataset.style));
  });

  // Generate
  btnGenerate.addEventListener("click", generateCard);

  // Download
  btnDownload.addEventListener("click", downloadCard);

  // Reset
  btnReset.addEventListener("click", resetCard);

  // API key badge → open modal
  apiKeyBadge.addEventListener("click", () => showApiKeyModal(false));

  // Save key
  btnSaveKey.addEventListener("click", () => {
    const val = apiKeyInput.value.trim();
    if (!val.startsWith("sk-")) {
      modalError.textContent = "Key should start with \"sk-\". Please check and try again.";
      modalError.style.display = "block";
      return;
    }
    saveApiKey(val);
    hideApiKeyModal();
  });

  // Cancel key modal
  btnCancelKey.addEventListener("click", hideApiKeyModal);

  // Allow Enter to save key
  apiKeyInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") btnSaveKey.click();
  });

  // Close modal on backdrop click
  apiKeyModal.addEventListener("click", (e) => {
    if (e.target === apiKeyModal && btnCancelKey.style.display !== "none") {
      hideApiKeyModal();
    }
  });

  updateKeyBadge();
  checkApiKey();
}

// Wait for auth before initialising app
document.addEventListener("DOMContentLoaded", () => { window.addEventListener("userLoggedIn", () => initApp(), { once: true }); if (window.__user) initApp(); });
