// A little animated chef tossing food in a pan over a flame (used in the "Share your table" card)
export function ChefScene() {
  return (
    <svg className="cs" viewBox="0 0 240 180" role="img" aria-label="">
      {/* stove + flame */}
      <rect x="118" y="152" width="112" height="12" rx="6" fill="#2a1553" />
      <rect x="150" y="146" width="52" height="8" rx="4" fill="#3b1a78" />
      <g className="cs-flame">
        <path d="M164 146c-2-7 3-9 2-15 6 4 7 9 5 15z" fill="#ff7aa8" />
        <path d="M174 146c-3-9 4-12 3-19 7 5 9 12 6 19z" fill="#ffb86b" />
        <path d="M185 146c-2-6 3-8 2-13 5 4 6 8 4 13z" fill="#ff7aa8" />
      </g>

      {/* arm + pan toss together around the shoulder */}
      <g className="cs-toss">
        <path d="M86 104c10 8 16 16 22 24" stroke="#fffdf6" strokeWidth="13" strokeLinecap="round" fill="none" />
        <circle cx="108" cy="128" r="6.5" fill="#f3c9a8" />
        <path d="M108 128l36 4" stroke="#1c0d3d" strokeWidth="5" strokeLinecap="round" />
        <path d="M142 128h66a2 2 0 0 1 2 2c0 8-15 13-35 13s-35-5-35-13a2 2 0 0 1 2-2z" fill="#1c0d3d" />
        <ellipse cx="175" cy="129" rx="34" ry="5" fill="#3b1a78" />
        {/* food flying out of the pan */}
        <circle className="cs-food f1" cx="165" cy="124" r="5" fill="#ff5a6e" />
        <path className="cs-food f2" d="M176 121c5-5 11-2 11 3-5 2-9 1-11-3z" fill="#4fd18b" />
        <circle className="cs-food f3" cx="186" cy="125" r="4" fill="#ffd36b" />
      </g>

      {/* steam */}
      <g className="cs-steam" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round">
        <path d="M168 104c-4-5 4-8 0-13" />
        <path className="s2" d="M180 100c-4-5 4-8 0-13" />
      </g>

      {/* chef */}
      <g className="cs-chef">
        <path d="M40 176c0-38 13-70 34-70s34 32 34 70z" fill="#fffdf6" />
        <path d="M60 108l14 14 14-14" fill="#9b4aff" />
        <circle cx="74" cy="134" r="2.4" fill="#c9b8e8" />
        <circle cx="74" cy="148" r="2.4" fill="#c9b8e8" />
        <circle cx="74" cy="162" r="2.4" fill="#c9b8e8" />
        <circle cx="74" cy="80" r="22" fill="#f3c9a8" />
        <path d="M65 78q3-3 6 0M78 78q3-3 6 0" stroke="#3b1a78" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M67 88q7 7 14 0" stroke="#3b1a78" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <circle cx="62" cy="86" r="3" fill="#ffb3c7" opacity="0.7" />
        <circle cx="86" cy="86" r="3" fill="#ffb3c7" opacity="0.7" />
        {/* toque */}
        <g className="cs-hat">
          <rect x="56" y="54" width="36" height="10" rx="3" fill="#fffdf6" />
          <circle cx="62" cy="46" r="11" fill="#fffdf6" />
          <circle cx="74" cy="40" r="13" fill="#fffdf6" />
          <circle cx="86" cy="46" r="11" fill="#fffdf6" />
        </g>
      </g>

      {/* sparkles */}
      <g className="cs-spark" fill="#ffd36b">
        <path d="M214 92l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
        <path className="k2" d="M130 92l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" />
      </g>
    </svg>
  );
}
