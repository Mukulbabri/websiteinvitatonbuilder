import { useMemo } from "react";

const EMOJIS = ["🌸", "🌺", "🌼", "🌿", "🌸", "🦋", "🌸", "🦋", "✨", "🦋"];

const BUTTERFLY_GRADIENTS = [
  { id: "goldGrad", color1: "#FCD34D", color2: "#FBBF24", color3: "#F59E0B", body: "#D97706" },
  { id: "pinkGrad", color1: "#F472B6", color2: "#F472B6", color3: "#EC4899", body: "#BE185D" },
  { id: "cyanGrad", color1: "#38BDF8", color2: "#60A5FA", color3: "#3B82F6", body: "#1D4ED8" }
];

const AnimatedButterfly = ({ size, variant = 0 }: { size: number; variant?: number }) => {
  const grad = BUTTERFLY_GRADIENTS[variant % BUTTERFLY_GRADIENTS.length];
  const gradId = `bFlyGrad_${variant}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className="inline-block"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={grad.color1} />
          <stop offset="50%" stopColor={grad.color2} />
          <stop offset="100%" stopColor={grad.color3} />
        </linearGradient>
      </defs>
      <g>
        {/* Left Wing */}
        <path
          d="M 24 20 C 10 4, 2 16, 8 28 C 12 36, 20 32, 24 24 Z"
          fill={`url(#${gradId})`}
          stroke="none"
          className="animate-wing-left"
        />
        {/* Right Wing */}
        <path
          d="M 24 20 C 38 4, 46 16, 40 28 C 36 36, 28 32, 24 24 Z"
          fill={`url(#${gradId})`}
          stroke="none"
          className="animate-wing-right"
        />
        {/* Body & Antennae */}
        <ellipse cx="24" cy="22" rx="1.5" ry="7" fill={grad.body} />
        <path d="M 24 15 Q 21 9 18 8 M 24 15 Q 27 9 30 8" stroke={grad.body} strokeWidth="0.8" fill="none" />
      </g>
    </svg>
  );
};

export function FloatingPetals({ count = 20 }: { count?: number }) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 95,
        size: 10 + Math.random() * 8,
        duration: 12 + Math.random() * 12,
        delay: Math.random() * 8,
        emoji: EMOJIS[i % EMOJIS.length],
        variant: i % 3,
        rotation: (Math.random() - 0.5) * 30,
      })),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
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
              transform: `rotate(${p.rotation}deg)`,
              opacity: 0.85,
              filter: "none",
            }}
          >
            <AnimatedButterfly size={p.size + 4} variant={p.variant} />
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
              opacity: 0.75,
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