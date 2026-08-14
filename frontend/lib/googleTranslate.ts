export interface SupportedLanguage {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు", flag: "🇮🇳" },
  { code: "hi", label: "Hindi", nativeLabel: "हिंदी", flag: "🇮🇳" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்", flag: "🇮🇳" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी", flag: "🇮🇳" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা", flag: "🇮🇳" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી", flag: "🇮🇳" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം", flag: "🇮🇳" },
  { code: "pa", label: "Punjabi", nativeLabel: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو", flag: "🇮🇳" },
  { code: "or", label: "Odia", nativeLabel: "ଓଡ଼ିଆ", flag: "🇮🇳" },
];

export const GOOGLE_TRANSLATE_STORAGE_KEY = "civic_app_lang";

/**
 * Sets the googtrans cookie and triggers Google Translate select element
 */
export function changeGoogleTranslateLanguage(langCode: string) {
  if (typeof window === "undefined") return;

  try {
    // Save to local storage for persistence
    localStorage.setItem(GOOGLE_TRANSLATE_STORAGE_KEY, langCode);
    localStorage.setItem("citizen_lang", langCode);
    localStorage.setItem("asha_lang", langCode);

    // Set standard Google Translate cookie
    const cookieValue = langCode === "en" ? "/en/en" : `/en/${langCode}`;
    const autoCookieValue = langCode === "en" ? "/auto/en" : `/auto/${langCode}`;

    // Clear previous cookies & set for current domain & path
    document.cookie = `googtrans=${cookieValue}; path=/;`;
    document.cookie = `googtrans=${autoCookieValue}; path=/;`;

    const hostname = window.location.hostname;
    if (hostname) {
      document.cookie = `googtrans=${cookieValue}; path=/; domain=${hostname};`;
      document.cookie = `googtrans=${autoCookieValue}; path=/; domain=${hostname};`;
      document.cookie = `googtrans=${cookieValue}; path=/; domain=.${hostname};`;
      document.cookie = `googtrans=${autoCookieValue}; path=/; domain=.${hostname};`;
    }

    // Try finding the Google Translate combo element
    const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
    if (combo) {
      combo.value = langCode;
      combo.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      // If the combo element is not yet ready or user switched back to English, reload to apply cookie cleanly
      window.location.reload();
    }

    // Notify listeners
    window.dispatchEvent(new CustomEvent("civicLanguageChanged", { detail: { lang: langCode } }));
  } catch (error) {
    console.error("Error setting Google Translation language:", error);
  }
}

/**
 * Gets currently active language from cookies or localStorage
 */
export function getCurrentLanguage(): string {
  if (typeof window === "undefined") return "en";

  try {
    const saved = localStorage.getItem(GOOGLE_TRANSLATE_STORAGE_KEY);
    if (saved) return saved;

    // Check googtrans cookie
    const match = document.cookie.match(/googtrans=\/[a-zA-Z-]+\/([a-zA-Z-]+)/);
    if (match && match[1]) {
      return match[1];
    }
  } catch (err) {
    // ignore
  }

  return "en";
}
