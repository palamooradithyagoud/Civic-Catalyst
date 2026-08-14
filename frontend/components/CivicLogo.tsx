"use client";

import React from "react";

interface CivicLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero" | number;
  className?: string;
  glow?: boolean;
}

const SIZE_MAP: Record<string, number> = {
  sm: 32,
  md: 40,
  lg: 52,
  xl: 72,
  hero: 88,
};

export function CivicLogo({
  size = "md",
  className = "",
  glow = true,
}: CivicLogoProps) {
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size] || 40;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    >
      {/* Soft Radial Ambient Glow */}
      {glow && (size === "hero" || size === "xl" || size === "lg") && (
        <div
          className="absolute -inset-2 rounded-3xl opacity-75 blur-xl transition-all duration-300 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.45) 0%, rgba(6, 182, 212, 0.25) 60%, transparent 100%)",
          }}
        />
      )}

      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative transform transition-transform hover:scale-105 duration-200"
      >
        <defs>
          {/* Background Squircle Gradient */}
          <linearGradient id="c-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#042d20" />
            <stop offset="50%" stopColor="#064e3b" />
            <stop offset="100%" stopColor="#0d5c46" />
          </linearGradient>

          {/* Border Metallic Outline */}
          <linearGradient id="c-border-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.25)" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.7" />
          </linearGradient>

          {/* Catalyst Spark Bolt Gradient */}
          <linearGradient id="spark-bolt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#67e8f9" />
            <stop offset="70%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          {/* Inner Ring Glow Gradient */}
          <linearGradient id="inner-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Drop Shadow Filter */}
          <filter id="c-shadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#011b14" floodOpacity="0.5" />
          </filter>

          {/* Spark Bolt Glow Filter */}
          <filter id="bolt-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#22d3ee" floodOpacity="0.7" />
          </filter>
        </defs>

        {/* 1. Base Squircle Container */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="24"
          fill="url(#c-bg-grad)"
          filter="url(#c-shadow)"
        />

        {/* 2. Metallic Border Ring */}
        <rect
          x="5"
          y="5"
          width="90"
          height="90"
          rx="23"
          fill="none"
          stroke="url(#c-border-grad)"
          strokeWidth="2"
        />

        {/* 3. Glass Highlight Reflection Arc */}
        <path
          d="M 20 30 C 20 18, 26 14, 40 14 L 60 14 C 74 14, 80 18, 80 30"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="1.25"
          strokeLinecap="round"
          fill="none"
        />

        {/* ── 4. OUTER BOLD 'C' GEOMETRIC ARC ── */}
        <path
          d="M 68 31 A 27 27 0 1 0 68 69"
          stroke="#ffffff"
          strokeWidth="6.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* ── 5. INNER ACCENT 'C' RING ── */}
        <path
          d="M 62 37 A 19 19 0 1 0 62 63"
          stroke="url(#inner-ring-grad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />

        {/* ── 6. CENTRAL CATALYST SPARK LIGHTNING BOLT ── */}
        <path
          d="M 54 26 L 44 47 L 50 47 L 45 74 L 59 49 L 52 49 Z"
          fill="url(#spark-bolt-grad)"
          filter="url(#bolt-glow)"
        />

        {/* ── 7. SPARK STAR CORE GLOW (Top Point Node) ── */}
        <circle cx="54" cy="26" r="2.25" fill="#ffffff" />
      </svg>
    </div>
  );
}

export default CivicLogo;


