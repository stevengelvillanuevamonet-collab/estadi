import type { CompanionMood } from "@/lib/data/companion";

const FUR = "#C89B6C";
const FUR_DARK = "#B5834D";
const FUR_LIGHT = "#E8D0AA";
const INK = "#3A2A1A";
const INK_SOFT = "#4A3222";
const HIGHLIGHT = "#F5F0E6";
const LEAF = "#7FA65C";

export function Capybara({
  stage,
  mood,
  equipped,
  hasBird,
  size = 200,
}: {
  stage: number; // 0-7, matches RANKS index
  mood: CompanionMood;
  equipped: Record<string, string>;
  hasBird: boolean;
  size?: number;
}) {
  const scale = stage <= 1 ? 0.68 : stage <= 3 ? 0.84 : 1;
  const tx = 100 * (1 - scale);
  const ty = 130 * (1 - scale);
  const eyesClosed = mood === "content";
  const alert = mood === "watchful";
  const showWhiskers = stage >= 2;
  const showGlow = stage >= 5;
  const showGarden = stage >= 5;
  const seat = equipped.seat === "book_throne" || stage >= 6 ? "books" : stage >= 4 ? "pad" : "shadow";

  return (
    <svg width={size} height={(size * 290) / 200} viewBox="0 0 200 290" role="img" aria-label="Your companion">
      {showGarden && (
        <>
          <path d="M20 260 Q10 240 25 225 Q35 245 20 260 Z" fill={LEAF} opacity={0.35} />
          <path d="M180 255 Q192 235 178 218 Q166 240 180 255 Z" fill={LEAF} opacity={0.35} />
          <circle cx="30" cy="200" r="4" fill="#D9735A" opacity={0.5} />
          <circle cx="172" cy="195" r="3.5" fill="#D9735A" opacity={0.5} />
        </>
      )}

      <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
        {seat === "pad" && <ellipse cx="100" cy="255" rx="70" ry="14" fill={LEAF} />}
        {seat === "shadow" && <ellipse cx="100" cy="250" rx="50" ry="10" fill="#00000014" />}
        {seat === "books" && (
          <>
            <rect x="60" y="248" width="46" height="12" rx="3" fill="#B5533C" />
            <rect x="63" y="236" width="40" height="12" rx="3" fill="#5B7FA6" />
            <rect x="58" y="224" width="44" height="12" rx="3" fill={LEAF} />
          </>
        )}

        {equipped.neck === "scarf" && (
          <path d="M62 178 Q100 200 138 178 L134 195 Q100 212 66 195 Z" fill="#B5533C" />
        )}

        <ellipse cx="100" cy="190" rx="65" ry="50" fill={FUR} />
        <ellipse cx="65" cy="95" rx="14" ry="18" fill={FUR_DARK} />
        <ellipse cx="135" cy="95" rx="14" ry="18" fill={FUR_DARK} />
        <circle cx="100" cy="130" r="48" fill={FUR} />
        <ellipse cx="100" cy="150" rx="30" ry="20" fill={FUR_LIGHT} />
        <circle cx="90" cy="148" r="2.5" fill={INK_SOFT} />
        <circle cx="110" cy="148" r="2.5" fill={INK_SOFT} />

        {showWhiskers && (
          <>
            <circle cx="72" cy="150" r="1" fill={FUR_DARK} />
            <circle cx="72" cy="156" r="1" fill={FUR_DARK} />
            <circle cx="128" cy="150" r="1" fill={FUR_DARK} />
            <circle cx="128" cy="156" r="1" fill={FUR_DARK} />
          </>
        )}

        {eyesClosed ? (
          <>
            <path d="M78 118 Q85 112 92 118" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M108 118 Q115 112 122 118" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={alert ? 86 : 87} cy="118" r={alert ? 5.5 : 4.5} fill={INK} />
            <circle cx={alert ? 114 : 113} cy="118" r={alert ? 5.5 : 4.5} fill={INK} />
            <circle cx="88.5" cy="116.5" r="1" fill={HIGHLIGHT} />
            <circle cx="114.5" cy="116.5" r="1" fill={HIGHLIGHT} />
          </>
        )}

        <path d="M88 168 Q100 173 112 168" stroke={INK_SOFT} strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {equipped.face === "reading_glasses" && (
          <>
            <circle cx="87" cy="118" r="13" fill="none" stroke={INK} strokeWidth="2.5" />
            <circle cx="113" cy="118" r="13" fill="none" stroke={INK} strokeWidth="2.5" />
            <line x1="74" y1="118" x2="61" y2="112" stroke={INK} strokeWidth="2" />
            <line x1="126" y1="118" x2="139" y2="112" stroke={INK} strokeWidth="2" />
          </>
        )}

        {equipped.head === "graduation_cap" && (
          <>
            <rect x="70" y="68" width="60" height="8" rx="1" fill={INK} transform="rotate(-3 100 72)" />
            <path d="M100 76 L136 88 L100 100 L64 88 Z" fill={INK} />
            <line x1="136" y1="88" x2="136" y2="106" stroke={INK} strokeWidth="1.5" />
            <circle cx="136" cy="108" r="3" fill="#C97B2E" />
          </>
        )}

        {equipped.outfit === "seasonal_outfit" && (
          <rect x="60" y="175" width="16" height="55" rx="4" fill="#7C5CC9" transform="rotate(18 68 200)" opacity={0.85} />
        )}

        <ellipse cx="68" cy="235" rx="13" ry="10" fill={FUR_DARK} />
        <ellipse cx="132" cy="235" rx="13" ry="10" fill={FUR_DARK} />

        {showGlow && (
          <>
            <circle cx="35" cy="130" r="2" fill="#F0B865" opacity={0.8} />
            <circle cx="165" cy="140" r="2.5" fill="#F0B865" opacity={0.7} />
            <circle cx="150" cy="90" r="1.5" fill="#F0B865" opacity={0.9} />
          </>
        )}

        {hasBird && (
          <g transform="translate(112 55)">
            <ellipse cx="0" cy="8" rx="9" ry="7" fill="#5B7FA6" />
            <circle cx="8" cy="4" r="5" fill="#5B7FA6" />
            <path d="M13 4 L18 3 L13 6 Z" fill="#E0A343" />
            <circle cx="10" cy="3" r="0.8" fill={INK} />
            <path d="M-6 5 Q-10 8 -6 11" stroke="#3A5A7A" strokeWidth="1.5" fill="none" />
          </g>
        )}
      </g>
    </svg>
  );
}
