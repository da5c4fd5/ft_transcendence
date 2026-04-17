import { useState, useRef } from 'preact/hooks';
import { Sparkles, Heart } from 'lucide-preact';
import type { TreeVisualProps, StageData } from './TreeVisual.types';

function getStageData(health: number): StageData {
  if (health >= 88) return { stage: 8, color: '#FF8EAA', accent: '#FF6B9D', message: 'Absolutely magnificent!', mood: 'ecstatic' };
  if (health >= 76) return { stage: 7, color: '#FFB3C6', accent: '#FF8EAA', message: 'Your tree is flourishing!', mood: 'happy'   };
  if (health >= 63) return { stage: 6, color: '#FFAA80', accent: '#FF8A5B', message: 'Beautiful growth!',         mood: 'happy'   };
  if (health >= 51) return { stage: 5, color: '#FFD6A5', accent: '#FFB870', message: 'Growing steadily!',         mood: 'content' };
  if (health >= 38) return { stage: 4, color: '#FFE66D', accent: '#F0D348', message: 'Keep nurturing!',           mood: 'content' };
  if (health >= 26) return { stage: 3, color: '#C9A0FF', accent: '#B07DFF', message: 'Give it some love!',        mood: 'neutral' };
  if (health >= 13) return { stage: 2, color: '#A0D2FF', accent: '#74CCFF', message: 'Just beginning...',         mood: 'neutral' };
  return               { stage: 1, color: '#D6C5B3', accent: '#C4B5A0', message: 'Time to wake up!',          mood: 'sleeping' };
}

function Face({ cx, cy, mood, isPetting, isDecreasing }: {
  cx: number; cy: number; mood: StageData['mood']; isPetting: boolean; isDecreasing: boolean;
}) {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {/* Blush -> hidden when sad */}
      {!isDecreasing && (
        <>
          <circle cx="-12" cy="4" r="4" fill="#FF6B9D" opacity="0.4" />
          <circle cx="12"  cy="4" r="4" fill="#FF6B9D" opacity="0.4" />
        </>
      )}

      {/* Tears */}
      {isDecreasing && (
        <>
          <ellipse cx="-14" cy="5" rx="1.5" ry="3" fill="#A0D2FF"
            style={{ animation: 'tree-tear 2s ease-in infinite', transformBox: 'fill-box', transformOrigin: 'top center' }} />
          <ellipse cx="14"  cy="5" rx="1.5" ry="3" fill="#A0D2FF"
            style={{ animation: 'tree-tear 2s ease-in 0.9s infinite', transformBox: 'fill-box', transformOrigin: 'top center' }} />
        </>
      )}

      {/* Eyes */}
      <g style={{ animation: isDecreasing ? 'none' : 'tree-blink 3.5s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: 'center' }}>
        {isPetting ? (
          <>
            <path d="M -16 -2 Q -12 -6 -8 -2" fill="none" stroke="#5A4A42" strokeWidth="2" strokeLinecap="round" />
            <path d="M  8 -2 Q  12 -6 16 -2" fill="none" stroke="#5A4A42" strokeWidth="2" strokeLinecap="round" />
          </>
        ) : isDecreasing ? (
          <>
            <circle cx="-12" cy="1" r="2.5" fill="#5A4A42" />
            <circle cx=" 12" cy="1" r="2.5" fill="#5A4A42" />
            {/* Dark circles */}
            <path d="M -15 4 Q -12 6 -9 4" fill="none" stroke="#5A4A42" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
            <path d="M   9 4 Q  12 6 15 4" fill="none" stroke="#5A4A42" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="-12" cy="0" r="2.5" fill="#5A4A42" />
            <circle cx=" 12" cy="0" r="2.5" fill="#5A4A42" />
          </>
        )}
      </g>

      {/* Mouth */}
      {isDecreasing ? (
        <path d="M -4 8 Q 0 5 4 8" fill="none" stroke="#5A4A42" strokeWidth="2" strokeLinecap="round" />
      ) : mood === 'sleeping' ? (
        <ellipse cx="0" cy="6" rx="2" ry="1" fill="#5A4A42" opacity="0.3" />
      ) : mood === 'neutral' ? (
        <path d="M -4 6 L 4 6" fill="none" stroke="#5A4A42" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d={isPetting ? 'M -5 4 Q 0 10 5 4' : 'M -4 4 Q 0 8 4 4'} fill="none" stroke="#5A4A42" strokeWidth="2" strokeLinecap="round" />
      )}
    </g>
  );
}


function StageTree({ s, isPetting, isDecreasing }: { s: StageData; isPetting: boolean; isDecreasing: boolean }) {
  const swayStyle = {
    animation: isPetting
      ? 'tree-pet 0.5s ease-in-out'
      : 'tree-sway 4s ease-in-out infinite',
  };

  if (s.stage === 1) return (
    <>
      {/* Seed shell */}
      <ellipse cx="100" cy="168" rx="20" ry="24" fill="#A6845E" stroke="#8B6F47" strokeWidth="2" />
      <ellipse cx="100" cy="168" rx="16" ry="20" fill={s.color} />
      {/* Shine */}
      <ellipse cx="94" cy="162" rx="6" ry="8" fill="#FFFFFF" opacity="0.15" />
      {/* Crack */}
      <path d="M 100 146 Q 102 158 100 172 Q 98 182 100 192" fill="none" stroke="#8B6F47" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 100 146 Q 98 158 100 172" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.4" strokeLinecap="round" />
      {/* Animated sprout */}
      <g style={{ animation: 'tree-sway 2.5s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: 'bottom center' }}>
        <path d="M 100 146 Q 98 140 100 134" fill="none" stroke="#A6845E" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="97" cy="136" rx="4" ry="6" fill={s.accent} transform="rotate(-30 97 136)" />
        <ellipse cx="103" cy="136" rx="4" ry="6" fill={s.accent} transform="rotate(30 103 136)" />
      </g>
      {/* Sleeping face */}
      <g transform="translate(100, 168)">
        <path d="M -8 -4 Q -6 -8 -4 -4" fill="none" stroke="#5A4A42" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M  4 -4 Q  6 -8  8 -4" fill="none" stroke="#5A4A42" strokeWidth="1.5" strokeLinecap="round" />
        <ellipse cx="0" cy="3" rx="2.5" ry="1.5" fill="#5A4A42" opacity="0.3" />
      </g>
    </>
  );

  if (s.stage === 2) return (
    <>
      <path d="M 98 180 Q 95 165 100 155" fill="none" stroke="#A6845E" strokeWidth="4" strokeLinecap="round" />
      <g style={swayStyle}>
        <path d="M 100 155 Q  85 152  88 142 Q  95 145 100 155" fill={s.color} stroke={s.accent} strokeWidth="1" />
        <path d="M 100 155 Q 115 152 112 142 Q 105 145 100 155" fill={s.color} stroke={s.accent} strokeWidth="1" />
      </g>
      <Face cx={100} cy={170} mood={s.mood} isPetting={isPetting} isDecreasing={isDecreasing} />
    </>
  );

  if (s.stage === 3) return (
    <>
      <path d="M 95 180 Q 90 150 100 125 L 105 125 Q 110 150 105 180 Z" fill="#A6845E" />
      <g style={swayStyle}>
        <circle cx="100" cy="120" r="20" fill={s.color} />
        <circle cx=" 85" cy="130" r="12" fill={s.color} />
        <circle cx="115" cy="130" r="12" fill={s.color} />
      </g>
      <Face cx={100} cy={155} mood={s.mood} isPetting={isPetting} isDecreasing={isDecreasing} />
    </>
  );

  if (s.stage === 4) return (
    <>
      <path d="M 92 180 Q 92 130 100 95 L 107 95 Q 108 130 108 180 Z" fill="#A6845E" />
      <g style={swayStyle}>
        <circle cx="100" cy=" 90" r="28" fill={s.color} />
        <circle cx=" 78" cy="102" r="20" fill={s.color} />
        <circle cx="122" cy="102" r="20" fill={s.color} />
        <circle cx=" 88" cy=" 75" r="16" fill={s.color} />
        <circle cx="112" cy=" 75" r="16" fill={s.color} />
      </g>
      <Face cx={100} cy={140} mood={s.mood} isPetting={isPetting} isDecreasing={isDecreasing} />
    </>
  );

  if (s.stage === 5) return (
    <>
      <path d="M 88 180 Q 94 115 100 75 L 108 75 Q 106 115 112 180 Z" fill="#A6845E" />
      <g style={swayStyle}>
        <circle cx="100" cy=" 75" r="38" fill={s.color} />
        <circle cx=" 72" cy=" 92" r="28" fill={s.color} />
        <circle cx="128" cy=" 92" r="28" fill={s.color} />
        <circle cx=" 82" cy=" 60" r="24" fill={s.color} />
        <circle cx="118" cy=" 60" r="24" fill={s.color} />
      </g>
      <Face cx={100} cy={132} mood={s.mood} isPetting={isPetting} isDecreasing={isDecreasing} />
    </>
  );

  if (s.stage === 6) return (
    <>
      <path d="M 86 180 Q 96 112 98 68 L 106 68 Q 104 112 114 180 Z" fill="#A6845E" />
      <path d="M 100 125 Q  75 108  65 112" fill="none" stroke="#A6845E" strokeWidth="7" strokeLinecap="round" />
      <path d="M 102 105 Q 128  90 138  95" fill="none" stroke="#A6845E" strokeWidth="6" strokeLinecap="round" />
      <g style={swayStyle}>
        <circle cx="100" cy=" 62" r="42" fill={s.color} />
        <circle cx=" 67" cy=" 84" r="32" fill={s.color} />
        <circle cx="133" cy=" 84" r="32" fill={s.color} />
        <circle cx=" 77" cy=" 52" r="28" fill={s.color} />
        <circle cx="123" cy=" 52" r="28" fill={s.color} />
      </g>
      <Face cx={100} cy={138} mood={s.mood} isPetting={isPetting} isDecreasing={isDecreasing} />
    </>
  );

  if (s.stage === 7) return (
    <>
      <path d="M 85 180 Q 95 110  98 70 L 106 70 Q 105 110 115 180 Z" fill="#A6845E" />
      <path d="M 100 120 Q  80 100  70 105" fill="none" stroke="#A6845E" strokeWidth="8" strokeLinecap="round" />
      <path d="M 102 100 Q 125  85 135  90" fill="none" stroke="#A6845E" strokeWidth="7" strokeLinecap="round" />
      <g style={swayStyle}>
        <circle cx="100" cy=" 60" r="45" fill={s.color} />
        <circle cx=" 65" cy=" 85" r="35" fill={s.color} />
        <circle cx="135" cy=" 85" r="35" fill={s.color} />
        <circle cx=" 75" cy=" 50" r="30" fill={s.color} />
        <circle cx="125" cy=" 50" r="30" fill={s.color} />
        {/* Flowers */}
        <circle cx=" 70" cy=" 70" r="6" fill="#FFE66D" />
        <circle cx="120" cy=" 60" r="7" fill="#FFE66D" />
        <circle cx="100" cy=" 35" r="6" fill="#FFE66D" />
        <circle cx="140" cy=" 90" r="5" fill="#FFE66D" />
        <circle cx=" 60" cy="100" r="5" fill="#FFE66D" />
      </g>
      <Face cx={100} cy={140} mood={s.mood} isPetting={isPetting} isDecreasing={isDecreasing} />
    </>
  );

  // stage 8
  return (
    <>
      <path d="M 82 180 Q 94 108  97 65 L 107 65 Q 106 108 118 180 Z" fill="#A6845E" />
      <path d="M  99 125 Q  76 106  64 110" fill="none" stroke="#A6845E" strokeWidth="9" strokeLinecap="round" />
      <path d="M 103  98 Q 128  82 140  87" fill="none" stroke="#A6845E" strokeWidth="8" strokeLinecap="round" />
      <path d="M  98 110 Q  70  95  58 100" fill="none" stroke="#A6845E" strokeWidth="7" strokeLinecap="round" />
      <g style={swayStyle}>
        <circle cx="100" cy=" 55" r="50" fill={s.color} />
        <circle cx=" 62" cy=" 82" r="38" fill={s.color} />
        <circle cx="138" cy=" 82" r="38" fill={s.color} />
        <circle cx=" 72" cy=" 45" r="33" fill={s.color} />
        <circle cx="128" cy=" 45" r="33" fill={s.color} />
        <circle cx="100" cy=" 30" r="25" fill={s.color} />
        {/* Flowers */}
        <circle cx=" 68" cy=" 68" r="7"  fill="#FFE66D" />
        <circle cx="122" cy=" 58" r="8"  fill="#FFE66D" />
        <circle cx="100" cy=" 32" r="7"  fill="#FFE66D" />
        <circle cx="145" cy=" 88" r="6"  fill="#FFE66D" />
        <circle cx=" 55" cy=" 95" r="6"  fill="#FFE66D" />
        <circle cx=" 85" cy=" 40" r="6"  fill="#FFE66D" />
        <circle cx="115" cy=" 42" r="7"  fill="#FFE66D" />
        {/* Fruits */}
        <circle cx=" 78" cy=" 75" r="6"  fill="#FFB3C6" />
        <circle cx="132" cy=" 70" r="7"  fill="#FFB3C6" />
        <circle cx=" 95" cy=" 50" r="6"  fill="#FFB3C6" />
        <circle cx="110" cy=" 65" r="6"  fill="#FFB3C6" />
        <circle cx=" 60" cy=" 85" r="5"  fill="#FFB3C6" />
      </g>
      <Face cx={100} cy={142} mood={s.mood} isPetting={isPetting} isDecreasing={isDecreasing} />
    </>
  );
}

// ─── Particle data ────────────────────────────────────────────────────────────

/** 6 ambient leaves — each with a unique arcing trajectory */
const LEAVES = [
  { anim: 'tree-leaf-1', delay: '0s',    left: '47%', top: '38%' },
  { anim: 'tree-leaf-2', delay: '1.1s',  left: '54%', top: '34%' },
  { anim: 'tree-leaf-3', delay: '2.0s',  left: '51%', top: '42%' },
  { anim: 'tree-leaf-4', delay: '3.2s',  left: '44%', top: '40%' },
  { anim: 'tree-leaf-5', delay: '0.6s',  left: '56%', top: '36%' },
  { anim: 'tree-leaf-6', delay: '1.8s',  left: '49%', top: '44%' },
];

/** Sparkles at diagonal positions, matching reference layout */
const SPARKLES = [
  { delay: '0s',   left: '18%', top: '20%' },
  { delay: '0.7s', left: '76%', top: '30%' },
  { delay: '1.4s', left: '50%', top: '10%' },
];

/** 5 hearts — all burst from center, each with a unique x-drift via keyframe */
const HEARTS = [
  { anim: 'tree-heart-1', delay: '0s',    left: '50%' },
  { anim: 'tree-heart-2', delay: '0.12s', left: '50%' },
  { anim: 'tree-heart-3', delay: '0.06s', left: '50%' },
  { anim: 'tree-heart-4', delay: '0.20s', left: '50%' },
  { anim: 'tree-heart-5', delay: '0.28s', left: '50%' },
];

const PET_LEAVES = [
  { left: '32%', delay: '0s',    anim: 'tree-pet-leaf-1' },
  { left: '40%', delay: '0.08s', anim: 'tree-pet-leaf-2' },
  { left: '48%', delay: '0.04s', anim: 'tree-pet-leaf-3' },
  { left: '56%', delay: '0.12s', anim: 'tree-pet-leaf-4' },
  { left: '64%', delay: '0.06s', anim: 'tree-pet-leaf-5' },
];

const PET_FRUITS = [
  { left: '38%', delay: '0s',    anim: 'tree-pet-fruit-l' },
  { left: '48%', delay: '0.2s',  anim: 'tree-pet-fruit-c' },
  { left: '58%', delay: '0.1s',  anim: 'tree-pet-fruit-r' },
];

const SIZE_PX = { small: 110, medium: 160, large: 220 };

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeartBurst { id: number; x: number; y: number }

// ─── Component ────────────────────────────────────────────────────────────────

export function TreeVisual({ health, size = 'medium', showDetails = false, isDecreasing = false }: TreeVisualProps) {
  const [isPetting,   setIsPetting]   = useState(false);
  const [showLeaves,  setShowLeaves]  = useState(false);
  const [leavesKey,   setLeavesKey]   = useState(0);
  const [showThanks,  setShowThanks]  = useState(false);
  const [bursts,      setBursts]      = useState<HeartBurst[]>([]);

  const burstId    = useRef(0);
  const buttonRef  = useRef<HTMLButtonElement>(null);
  const leavesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thanksTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const s      = getStageData(health);
  const svgPx  = SIZE_PX[size];

  const handlePet = () => {
    // Always spawn a heart burst — rapid clicks accumulate independently.
    const rect = buttonRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width  * 0.5 : window.innerWidth  * 0.5;
    const y = rect ? rect.top  + rect.height * 0.58 : window.innerHeight * 0.5;
    const id = ++burstId.current;
    setBursts(prev => [...prev, { id, x, y }]);
    // Remove this burst after animation completes (2.4s + longest delay 0.28s + margin)
    setTimeout(() => setBursts(prev => prev.filter(b => b.id !== id)), 3000);

    // Petting bounce — only start if not already mid-bounce
    if (!isPetting) {
      setIsPetting(true);
      setTimeout(() => setIsPetting(false), 600);
    }

    // Leaves / fruits — fall near the tree, reset on each pet is fine
    setShowLeaves(true);
    setLeavesKey(k => k + 1);
    if (leavesTimer.current) clearTimeout(leavesTimer.current);
    leavesTimer.current = setTimeout(() => setShowLeaves(false), 2800);

    // "Thanks" text — extends on each pet
    setShowThanks(true);
    if (thanksTimer.current) clearTimeout(thanksTimer.current);
    thanksTimer.current = setTimeout(() => setShowThanks(false), 3600);
  };

  return (
    <div className="flex flex-col items-center gap-4">

      <div className="relative flex items-center justify-center" style={{ width: svgPx, height: svgPx }}>

        {/* Ambient glow halo */}
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-30 pointer-events-none transition-colors duration-1000"
          style={{ backgroundColor: s.color }}
        />

        {/* Tree (interactive) */}
        <button
          ref={buttonRef}
          type="button"
          onClick={handlePet}
          className="relative z-10 w-full h-full cursor-pointer hover:scale-105 transition-transform active:scale-95"
          aria-label="Pet your tree"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
            {/* Ground */}
            <ellipse cx="100" cy="180" rx="45" ry="12" fill="#EAE0D5" />
            <ellipse cx="100" cy="180" rx="35" ry="8"  fill="#D6C5B3" />
            {/* Tree stages */}
            <StageTree s={s} isPetting={isPetting} isDecreasing={isDecreasing} />
          </svg>
        </button>

        {/* Ambient floating leaves (health ≥ 51) */}
        {health >= 51 && LEAVES.map((l, i) => (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{
              width: 10, height: 10,
              borderRadius: '0 8px 0 8px',
              backgroundColor: s.accent,
              left: l.left, top: l.top,
              animation: `${l.anim} 4s ease-out ${l.delay} infinite`,
            }}
          />
        ))}

        {/* Scintillating sparkles (health ≥ 76) */}
        {health >= 76 && SPARKLES.map((sp, i) => (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: sp.left, top: sp.top,
              color: s.accent,
              animation: `tree-sparkle 2s ease-in-out ${sp.delay} infinite`,
            }}
          >
            <Sparkles size={18} />
          </div>
        ))}

        {/* Leaves + fruits burst — absolute, near the tree, resets on each pet */}
        {showLeaves && (
          <div key={leavesKey} className="contents">
            {s.stage >= 3 && PET_LEAVES.map((l, i) => (
              <div
                key={`l${i}`}
                className="absolute pointer-events-none z-20"
                style={{ left: l.left, top: '20%', animation: `${l.anim} 2.2s ease-out ${l.delay} forwards` }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" style={{ filter: `drop-shadow(0 2px 3px ${s.accent}60)` }}>
                  <path d="M 8 2 Q 13 4 14 8 Q 13 13 8 14 Q 3 13 2 8 Q 3 4 8 2 Z" fill={s.color} stroke={s.accent} strokeWidth="0.5" />
                  <path d="M 8 2 L 8 14" stroke={s.accent} strokeWidth="0.5" opacity="0.5" />
                </svg>
              </div>
            ))}
            {s.stage >= 7 && PET_FRUITS.map((f, i) => (
              <div
                key={`f${i}`}
                className="absolute pointer-events-none z-20"
                style={{ left: f.left, top: '18%', animation: `${f.anim} 2s ease-out ${f.delay} forwards` }}
              >
                <div style={{ position: 'relative', width: 20, height: 20 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    backgroundColor: s.stage >= 8 ? '#FFB3C6' : '#FFE66D',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.2), inset -2px -2px 4px rgba(0,0,0,0.08)',
                  }} />
                  <div style={{
                    position: 'absolute', top: 4, left: 4, width: 7, height: 7,
                    borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.6)', filter: 'blur(1px)',
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hearts — position: fixed so they escape the container and travel to viewport top.
          Each burst is independent: rapid clicks accumulate bursts instead of resetting them. */}
      {bursts.map(burst => (
        <div key={burst.id} className="contents">
          {HEARTS.map((h, i) => (
            <div
              key={i}
              className="pointer-events-none"
              style={{
                position: 'fixed',
                // Center the heart icon (22px) on the burst origin
                left: burst.x - 11,
                top:  burst.y - 11,
                zIndex: 9999,
                color: '#FF6B9D',
                animation: `${h.anim} 2.4s ease-out ${h.delay} forwards`,
              }}
            >
              <Heart size={22} fill="#FF6B9D" />
            </div>
          ))}
        </div>
      ))}

      {showDetails && (
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">

          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-sm font-semibold text-darkgrey">{s.message}</span>
          </div>

          {showThanks ? (
            <span className="text-xs font-semibold text-pink italic">*happy tree*</span>
          ) : (
            <span className="text-xs text-mediumgrey flex items-center gap-1">
              <Sparkles size={12} style={{ color: s.accent }} />
              Click to pet your tree!
            </span>
          )}

          <div className="w-full bg-white/50 backdrop-blur-sm rounded-2xl px-4 py-4 shadow-sm">
            <div className="flex items-center justify-between text-sm font-bold text-darkgrey mb-3">
              <span>Life Force</span>
              <span style={{ color: s.accent }}>{health}%</span>
            </div>
            <div className="h-4 bg-black/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${health}%`, backgroundColor: s.color }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
