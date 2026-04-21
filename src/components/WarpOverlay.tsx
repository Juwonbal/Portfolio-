interface WarpOverlayProps {
  active: boolean
  color: string
}

const WARP_LINES = Array.from({ length: 22 }, (_, i) => ({
  top: `${(i / 21) * 100}%`,
  left: `${10 + (i % 4) * 20}%`,
  width: `${30 + (i % 7) * 10}%`,
  delay: `${(i % 5) * 0.04}s`,
}))

export function WarpOverlay({ active, color }: WarpOverlayProps) {
  if (!active) return null

  return (
    <div className="warp-overlay" aria-hidden="true">
      {/* Radial flash */}
      <div
        className="absolute inset-0 animate-warp-flash"
        style={{ background: `radial-gradient(ellipse at center, ${color}55 0%, ${color}11 50%, transparent 80%)` }}
      />
      {/* Speed lines */}
      {WARP_LINES.map((l, i) => (
        <div
          key={i}
          className="warp-line animate-warp-flash"
          style={{
            top: l.top, left: l.left, width: l.width,
            background: `linear-gradient(90deg, transparent, ${color}99, transparent)`,
            animationDelay: l.delay, animationDuration: '0.6s',
          }}
        />
      ))}
      {/* Centre label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-mono text-xs uppercase animate-warp-flash"
          style={{ letterSpacing: '0.5em', color, animationDuration: '0.65s', textShadow: `0 0 20px ${color}` }}
        >
          WARPING...
        </span>
      </div>
    </div>
  )
}
