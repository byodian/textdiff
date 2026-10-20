import React, { useId } from 'react';

interface TextDiffLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  withBackground?: boolean;
}

export function TextDiffLogo({
  size = 32,
  className = '',
  withBackground = true,
  ...props
}: TextDiffLogoProps) {
  const id = useId();
  const bgId = `${id}-bg`;
  const rimId = `${id}-rim`;
  const roseId = `${id}-rose`;
  const emeraldId = `${id}-emerald`;
  const skyId = `${id}-sky`;
  const glowRoseId = `${id}-glow-rose`;
  const glowEmeraldId = `${id}-glow-emerald`;
  const glowCyanId = `${id}-glow-cyan`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      {...props}
    >
      <defs>
        {/* Background Gradient */}
        <linearGradient id={bgId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#090e1a" />
          <stop offset="50%" stopColor="#0d1527" />
          <stop offset="100%" stopColor="#131e33" />
        </linearGradient>

        {/* Border / Rim Gradient */}
        <linearGradient id={rimId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
          <stop offset="45%" stopColor="#1e293b" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
        </linearGradient>

        {/* Left Bracket: Rose Red Gradient (Deletions / Previous Version) */}
        <linearGradient id={roseId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="40%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>

        {/* Right Bracket: Emerald Green Gradient (Additions / Current Version) */}
        <linearGradient id={emeraldId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="40%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Center Node / Sky Blue Gradient */}
        <linearGradient id={skyId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Glow Filters */}
        <filter id={glowRoseId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="14" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id={glowEmeraldId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="14" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id={glowCyanId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Squircle Base (optional when embedded in icon button) */}
      {withBackground && (
        <rect
          x="20"
          y="20"
          width="472"
          height="472"
          rx="112"
          fill={`url(#${bgId})`}
          stroke={`url(#${rimId})`}
          strokeWidth="4"
        />
      )}

      {/* Ambient light glow pools */}
      <circle cx="152" cy="256" r="110" fill="#f43f5e" fillOpacity="0.08" />
      <circle cx="360" cy="256" r="110" fill="#10b981" fillOpacity="0.08" />
      <circle cx="256" cy="256" r="70" fill="#38bdf8" fillOpacity="0.08" />

      {/* Center Split Seam (Diff gutter divider) */}
      <line
        x1="256"
        y1="76"
        x2="256"
        y2="436"
        stroke="#38bdf8"
        strokeWidth="4"
        strokeDasharray="10 10"
        strokeLinecap="round"
        strokeOpacity="0.35"
      />

      {/* Central Revision / Compare Node */}
      <circle
        cx="256"
        cy="256"
        r="18"
        fill="#090e1a"
        stroke={`url(#${skyId})`}
        strokeWidth="4.5"
        filter={`url(#${glowCyanId})`}
      />
      <circle cx="256" cy="256" r="6.5" fill="#38bdf8" />

      {/* LEFT: Rose Code Bracket < (Original / Deletion) */}
      <g filter={`url(#${glowRoseId})`}>
        <path
          d="M 194 144 L 84 256 L 194 368"
          fill="none"
          stroke={`url(#${roseId})`}
          strokeWidth="30"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      {/* Minus Sign (-) */}
      <rect x="122" y="244" width="56" height="24" rx="12" fill="#ffffff" />

      {/* RIGHT: Emerald Code Bracket > (Modified / Addition) */}
      <g filter={`url(#${glowEmeraldId})`}>
        <path
          d="M 318 144 L 428 256 L 318 368"
          fill="none"
          stroke={`url(#${emeraldId})`}
          strokeWidth="30"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      {/* Plus Sign (+) */}
      <path
        d="M 366 226 L 366 286 M 336 256 L 396 256"
        fill="none"
        stroke="#ffffff"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
