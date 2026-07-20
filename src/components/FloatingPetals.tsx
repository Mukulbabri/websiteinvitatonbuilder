import { useMemo } from "react";

const EMOJIS = ["🌸", "🌼", "🌿", "🌸", "🌸", "🦋"];

const AnimatedButterfly = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    className="inline-block"
  >
    <defs>
      <linearGradient id="butterflyWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F472B6" />
        <stop offset="50%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
    </defs>
    <g>
      {/* Left Wing */}
      <path
        d="M 24 20 C 10 4, 2 16, 8 28 C 12 36, 20 32, 24 24 Z"
        fill="url(#butterflyWingGrad)"
        stroke="#F472B6"
        strokeWidth="0.8"
        className="animate-wing-left"
      />
      {/* Right Wing */}
      <path
        d="M 24 20 C 38 4, 46 16, 40 28 C 36 36, 28 32, 24 24 Z"
        fill="url(#butterflyWingGrad)"
        stroke="#F472B6"
        strokeWidth="0.8"
        className="animate-wing-right"
      />
      {/* Body & Antennae */}
      <ellipse cx="24" cy="22" rx="1.5" ry="7" fill="#831843" />
      <path d="M 24 15 Q 21 9 18 8 M 24 15 Q 27 9 30 8" stroke="#831843" strokeWidth="0.8" fill="none" />
    </g>
  </svg>
);

export function FloatingPetals({ count = 12 }: { count?: number }) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 14 + Math.random() * 12,
        duration: 15 + Math.random() * 12,
        delay: Math.random() * 10,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      })),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
      {petals.map((p) =>
        p.emoji === "🦋" ? (
          <span
            key={p.id}
            className="absolute animate-float-petal"
            style={{
              left: `${p.left}%`,
              top: "-10vh",
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              opacity: 0.75,
              filter: "none",
            }}
          >
            <AnimatedButterfly size={p.size + 10} />
          </span>
        ) : (
          <span
            key={p.id}
            className="absolute animate-float-petal"
            style={{
              left: `${p.left}%`,
              top: "-10vh",
              fontSize: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              opacity: 0.7,
              filter: "none",
            }}
          >
            {p.emoji}
          </span>
        )
      )}
    </div>
  );
}

export function FallingEnvelopes({ count = 10 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 12 + Math.random() * 10,
        duration: 14 + Math.random() * 14,
        delay: Math.random() * 10,
      })),
    [count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((p) => (
        <span
          key={p.id}
          className="absolute animate-env-fall"
          style={{
            left: `${p.left}%`,
            top: "-10vh",
            fontSize: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: 0.7,
            filter: "none",
          }}
        >
          ✉️
        </span>
      ))}
    </div>
  );
}