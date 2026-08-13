import React from "react";

export default function IndianNationalEmblem({
  className = "",
  opacity = 0.05,
  width = 420,
  height = 520,
}: {
  className?: string;
  opacity?: number;
  width?: number | string;
  height?: number | string;
}) {
  return (
    <svg
      viewBox="0 0 400 500"
      width={width}
      height={height}
      fill="currentColor"
      className={className}
      style={{ opacity, pointerEvents: "none" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="none">
        {/* Center Lion Head & Crown */}
        <path d="M 200 40 C 180 40 160 55 160 80 C 160 95 170 110 175 125 C 165 130 155 145 155 165 C 155 185 165 200 175 210 L 225 210 C 235 200 245 185 245 165 C 245 145 235 130 225 125 C 230 110 240 95 240 80 C 240 55 220 40 200 40 Z" />
        {/* Mane details Center Lion */}
        <path d="M 180 85 C 170 95 170 115 180 130 L 220 130 C 230 115 230 95 220 85 Z" />
        <path d="M 170 135 C 160 150 160 175 175 190 L 225 190 C 240 175 240 150 230 135 Z" />

        {/* Left Facing Lion Head */}
        <path d="M 155 70 C 135 65 115 75 105 95 C 95 110 100 130 110 145 C 100 155 95 170 100 190 C 105 205 120 215 135 220 L 165 210 C 155 195 150 170 155 145 C 145 130 145 110 155 95 Z" />

        {/* Right Facing Lion Head */}
        <path d="M 245 70 C 265 65 285 75 295 95 C 305 110 300 130 290 145 C 300 155 305 170 300 190 C 295 205 280 215 265 220 L 235 210 C 245 195 250 170 245 145 C 255 130 255 110 245 95 Z" />

        {/* Mouth, Eyes & Snout details */}
        <circle cx="185" cy="85" r="4" />
        <circle cx="215" cy="85" r="4" />
        <ellipse cx="200" cy="98" rx="8" ry="5" />

        <circle cx="125" cy="100" r="3.5" />
        <ellipse cx="118" cy="110" rx="6" ry="4" />

        <circle cx="275" cy="100" r="3.5" />
        <ellipse cx="282" cy="110" rx="6" ry="4" />

        {/* Abacus Frieze Pedestal Band */}
        <rect x="80" y="225" width="240" height="60" rx="6" />

        {/* Central Ashoka Chakra on Abacus (24 Spokes) */}
        <circle cx="200" cy="255" r="24" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="200" cy="255" r="4" />
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          const rad = (angle * Math.PI) / 180;
          const x2 = 200 + 22 * Math.cos(rad);
          const y2 = 255 + 22 * Math.sin(rad);
          return (
            <line
              key={i}
              x1="200"
              y1="255"
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Left Animal Motif (Bull) */}
        <path d="M 115 245 C 105 245 95 255 100 265 C 105 275 125 275 130 265 C 135 255 125 245 115 245 Z" />

        {/* Right Animal Motif (Galloping Horse) */}
        <path d="M 285 245 C 275 245 265 255 270 265 C 275 275 295 275 300 265 C 305 255 295 245 285 245 Z" />

        {/* Inverted Lotus Pedestal Base */}
        <path d="M 100 285 C 120 330 160 350 200 350 C 240 350 280 330 300 285 Z" />
        <path d="M 120 290 C 140 320 170 335 200 335 C 230 335 260 320 280 290 Z" />

        {/* Lower Stepped Base */}
        <rect x="110" y="355" width="180" height="14" rx="3" />
        <rect x="90" y="373" width="220" height="18" rx="4" />

        {/* Motto: Satyameva Jayate in Devanagari */}
        <text
          x="200"
          y="435"
          textAnchor="middle"
          fontSize="30"
          fontWeight="900"
          fontFamily="serif, 'Mangal', 'Nirmala UI', sans-serif"
          letterSpacing="2"
        >
          सत्यमेव जयते
        </text>

        <text
          x="200"
          y="470"
          textAnchor="middle"
          fontSize="14"
          fontWeight="800"
          letterSpacing="4"
          fill="currentColor"
        >
          SATYAMEVA JAYATE
        </text>
      </g>
    </svg>
  );
}
