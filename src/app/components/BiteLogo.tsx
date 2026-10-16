/**
 * Inline SVG Bite logo — no background square, renders cleanly on any surface.
 * Pass `light` for white version (on dark backgrounds) or default for purple.
 */
export function BiteWordmark({ height = 32, light = false }: { height?: number; light?: boolean }) {
  const purple = light ? "#ffffff" : "#6b21d9";
  const accent = light ? "rgba(255,255,255,0.85)" : "#9b4aff";

  return (
    <svg
      height={height}
      viewBox="0 0 110 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {/* b — stylised with Bite arc */}
      <g>
        {/* Stem */}
        <rect x="2" y="4" width="5" height="28" rx="2.5" fill={purple} />
        {/* Bowl circle */}
        <circle cx="16" cy="24" r="9" fill={purple} />
        {/* Bite arc cut-out */}
        <path
          d="M16 15 A9 9 0 0 1 23.5 20.5 Q20 17 16 18 Q12 17 12 21 A9 9 0 0 1 16 15Z"
          fill={accent}
          opacity="0.55"
        />
        {/* Inner white hole */}
        <circle cx="16" cy="24" r="4.5" fill="white" opacity={light ? "0.2" : "1"} />
      </g>

      {/* i */}
      <rect x="32" y="14" width="5" height="18" rx="2.5" fill={purple} />
      <circle cx="34.5" cy="9" r="3" fill={accent} />

      {/* t */}
      <rect x="43" y="8" width="5" height="24" rx="2.5" fill={purple} />
      <rect x="38" y="14" width="15" height="4.5" rx="2.25" fill={purple} />

      {/* e */}
      <circle cx="67" cy="23" r="9" fill={purple} />
      <circle cx="67" cy="23" r="4.5" fill="white" opacity={light ? "0.2" : "1"} />
      {/* e notch — flat right */}
      <rect x="67" y="19" width="10" height="4.5" rx="0" fill="white" opacity={light ? "0.2" : "1"} />
    </svg>
  );
}

/** Compact icon mark only (no text) — for app icons, splash, etc. */
export function BiteIcon({ size = 40, light = false }: { size?: number; light?: boolean }) {
  const fg = light ? "#ffffff" : "#6b21d9";
  const accent = light ? "rgba(255,255,255,0.7)" : "#9b4aff";
  const bg = "transparent";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <rect width="40" height="40" rx="10" fill={bg} />
      {/* Stem */}
      <rect x="6" y="5" width="6" height="30" rx="3" fill={fg} />
      {/* Bowl */}
      <circle cx="23" cy="26" r="11" fill={fg} />
      {/* Bite notch */}
      <path
        d="M23 15 A11 11 0 0 1 32 21 Q28 17.5 23 19 Q18 17.5 18 22 A11 11 0 0 1 23 15Z"
        fill={accent}
        opacity="0.5"
      />
      {/* Inner hole */}
      <circle cx="23" cy="26" r="5.5" fill="white" opacity={light ? "0.25" : "1"} />
      {/* Smile */}
      <path
        d="M19.5 27 Q23 30 26.5 27"
        stroke={fg}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
