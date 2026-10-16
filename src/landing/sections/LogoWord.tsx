// The Bite wordmark drawn with the logo's "b" (tall stem, round belly, smile, bite on the right) + "ite".
// Used by the intro / app transition and by the footer; each passes its own colours and animation classes.

interface Props {
  id: string; // unique prefix for the gradient/mask ids
  top: string; // gradient colours, top → bottom (opaque, so the stem and belly don't show an overlap)
  bottom: string;
  className?: string; // on the <svg>
  bClass?: string; // on the "b" group (pop / shake)
  teethClass?: string; // on the bite circles (chomp)
  iteClass?: string; // on "ite"
}

export function LogoWord({ id, top, bottom, className, bClass, teethClass, iteClass }: Props) {
  return (
    <svg className={className} viewBox="0 0 760 300" role="img" aria-label="Bite">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <linearGradient id={`${id}-gb`} x1="0" y1="0" x2="0" y2="549" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="549" height="549">
          <rect x="0" y="0" width="549" height="549" fill="white" />
          <path d="M190 405q72 62 144 0" fill="none" stroke="black" strokeWidth="26" strokeLinecap="round" />
          <g className={teethClass} fill="black">
            <circle cx="405" cy="198" r="20" />
            <circle cx="434" cy="228" r="22" />
            <circle cx="456" cy="267" r="22" />
            <circle cx="469" cy="311" r="20" />
          </g>
        </mask>
      </defs>
      <g transform="translate(-60 -12) scale(0.6)">
        <g className={bClass}>
          <g mask={`url(#${id}-m)`} fill={`url(#${id}-gb)`}>
            <rect x="107" y="30" width="83" height="330" rx="41.5" />
            <circle cx="285" cy="340" r="178" />
          </g>
        </g>
      </g>
      <text className={iteClass} x="226" y="296" fontSize="330" fontWeight="900" fill={`url(#${id}-g)`} fontFamily="Inter, sans-serif" letterSpacing="-14">ite</text>
    </svg>
  );
}
