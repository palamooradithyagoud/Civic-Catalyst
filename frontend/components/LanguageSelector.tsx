"use client";

import { useEffect, useState, useRef } from "react";
import { Globe, Check, ChevronDown, Sparkles } from "lucide-react";
import {
  SUPPORTED_LANGUAGES,
  changeGoogleTranslateLanguage,
  getCurrentLanguage,
} from "@/lib/googleTranslate";

interface LanguageSelectorProps {
  variant?: "topbar" | "landing" | "compact";
  className?: string;
  onLanguageChange?: (langCode: string) => void;
}

export function LanguageSelector({
  variant = "topbar",
  className = "",
  onLanguageChange,
}: LanguageSelectorProps) {
  const [currentLang, setCurrentLang] = useState<string>("en");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial sync from localStorage / cookies
    const lang = getCurrentLanguage();
    setCurrentLang(lang);

    // Listen to custom language switch events across windows/components
    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ lang: string }>;
      if (customEvent.detail?.lang) {
        setCurrentLang(customEvent.detail.lang);
      }
    };

    window.addEventListener("civicLanguageChanged", handleLangChange);
    return () => {
      window.removeEventListener("civicLanguageChanged", handleLangChange);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectLanguage = (code: string) => {
    setCurrentLang(code);
    setIsOpen(false);
    changeGoogleTranslateLanguage(code);
    if (onLanguageChange) {
      onLanguageChange(code);
    }
  };

  const selectedLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) ||
    SUPPORTED_LANGUAGES[0];

  return (
    <div
      ref={dropdownRef}
      className={`notranslate relative inline-block text-left ${className}`}
      style={{ zIndex: 1001 }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Select Screen Language (Google Translation)"
        className={`flex items-center gap-2 transition-all duration-150 ${
          variant === "landing"
            ? "px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 font-semibold text-xs shadow-sm cursor-pointer"
            : variant === "compact"
            ? "px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-semibold cursor-pointer"
            : "px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold shadow-xs cursor-pointer"
        }`}
        style={{
          boxShadow: isOpen ? "0 0 0 2px rgba(4, 120, 87, 0.2)" : undefined,
        }}
      >
        <Globe
          className={`h-4 w-4 shrink-0 ${
            variant === "landing" ? "text-emerald-700" : "text-emerald-700"
          }`}
        />
        <span className="flex items-center gap-1.5">
          <span className="text-sm">{selectedLangObj.flag}</span>
          <span className="font-bold tracking-tight">
            {selectedLangObj.nativeLabel}
          </span>
          {selectedLangObj.code !== "en" && (
            <span className="text-[10px] text-slate-500 font-medium">
              ({selectedLangObj.label})
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-2xl border border-slate-200 py-2 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden"
          style={{
            zIndex: 99999,
            maxHeight: "360px",
            overflowY: "auto",
            boxShadow: "0 20px 35px -5px rgba(0, 0, 0, 0.25), 0 10px 15px -5px rgba(0, 0, 0, 0.12)",
          }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              <span>Google Translation</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
              Live Screen
            </span>
          </div>

          {/* Language Options List */}
          <div className="py-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLang;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full text-left px-3.5 py-2 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-emerald-50 text-emerald-900 font-bold"
                      : "text-slate-700 hover:bg-slate-100 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <div className="flex flex-col">
                      <span
                        className={`text-xs ${
                          isSelected ? "text-emerald-900 font-bold" : "text-slate-900 font-semibold"
                        }`}
                      >
                        {lang.nativeLabel}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {lang.label}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
