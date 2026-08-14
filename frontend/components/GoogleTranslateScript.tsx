"use client";

import { useEffect } from "react";
import Script from "next/script";
import { getCurrentLanguage, changeGoogleTranslateLanguage } from "@/lib/googleTranslate";

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

export function GoogleTranslateScript() {
  useEffect(() => {
    // Define the global callback function for Google Translate
    window.googleTranslateElementInit = () => {
      try {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: "en,hi,te,ta,kn,mr,bn,gu,ml,pa,ur,or",
              autoDisplay: false,
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            },
            "google_translate_element"
          );

          // Once initialized, if a non-English language was saved, ensure combo is synced
          const currentLang = getCurrentLanguage();
          if (currentLang && currentLang !== "en") {
            const checkComboInterval = setInterval(() => {
              const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
              if (combo) {
                clearInterval(checkComboInterval);
                if (combo.value !== currentLang) {
                  combo.value = currentLang;
                  combo.dispatchEvent(new Event("change", { bubbles: true }));
                }
              }
            }, 300);

            // Timeout after 6 seconds to avoid endless polling
            setTimeout(() => clearInterval(checkComboInterval), 6000);
          }
        }
      } catch (err) {
        console.warn("Google Translate initialization notice:", err);
      }
    };
  }, []);

  return (
    <>
      <div
        id="google_translate_element"
        style={{
          position: "absolute",
          top: -9999,
          left: -9999,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
        aria-hidden="true"
      />
      <Script
        id="google-translate-script"
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}
