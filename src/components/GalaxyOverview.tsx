import { useEffect, useRef, useState } from 'react'

interface GalaxyCluster {
  id: 'cyber' | 'software'
  label: string
  sublabel: string
  planetCount: number
  coords: string
  coreColor: string
  armColor: string
  rimColor: string
  accentText: string
  hoverBorder: string
  hudColor: string
}

const CLUSTERS: GalaxyCluster[] = [
  {
    id: 'cyber',
    label: 'SECTOR NYX',
    sublabel: 'Cybersecurity Division',
    planetCount: 9,
    coords: "RA 04h 35m // DEC −05° 27'",
    coreColor: 'rgba(255,80,30,0.85)',
    armColor: 'rgba(220,50,20,0.4)',
    rimColor: 'rgba(255,140,60,0.25)',
    accentText: '#ff6a30',
    hoverBorder: 'rgba(255,100,40,0.7)',
    hudColor: '#ff6030',
  },
  {
    id: 'software',
    label: 'SECTOR HELIOS',
    sublabel: 'Software Development Division',
    planetCount: 2,
    coords: "RA 18h 12m // DEC +22° 14'",
    coreColor: 'rgba(0,200,255,0.85)',
    armColor: 'rgba(0,160,230,0.4)',
    rimColor: 'rgba(80,210,255,0.25)',
    accentText: '#22d3ee',
    hoverBorder: 'rgba(34,211,238,0.7)',
    hudColor: '#22d3ee',
  },
]

// ─── Galaxy Canvas (animated spiral) ─────────────────────────────────────────

function GalaxyCanvas({ cluster, hovered }: { cluster: GalaxyCluster; hovered: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2

    const armStars: { x: number; y: number; r: number; op: number; color: string }[] = []
    let seed = cluster.id === 'cyber' ? 1337 : 7654
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff
      return (seed >>> 0) / 4294967296
    }

    const armCount = cluster.id === 'cyber' ? 3 : 2
    const starsPerArm = cluster.id === 'cyber' ? 55 : 45

    for (let a = 0; a < armCount; a++) {
      for (let i = 0; i < starsPerArm; i++) {
        const t = i / starsPerArm
        const angle = (a * (Math.PI * 2)) / armCount + t * Math.PI * 2.8 + rand() * 0.5
        const dist = t * (W * 0.44) + rand() * 18
        const scatter = (1 - t * 0.5) * 14 * rand()
        armStars.push({
          x: cx + Math.cos(angle) * dist + (rand() - 0.5) * scatter * 2,
          y: cy + Math.sin(angle) * dist * 0.55 + (rand() - 0.5) * scatter,
          r: rand() * 1.3 + 0.3,
          op: rand() * 0.55 + 0.2,
          color: cluster.id === 'cyber'
            ? rand() > 0.6 ? '#ffb090' : rand() > 0.3 ? '#ff8060' : '#ffe0c0'
            : rand() > 0.6 ? '#90d8ff' : rand() > 0.3 ? '#60c0ff' : '#c0eeff',
        })
      }
    }

    for (let i = 0; i < 60; i++) {
      const angle = rand() * Math.PI * 2
      const dist = rand() * W * 0.15
      armStars.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist * 0.55,
        r: rand() * 0.8 + 0.2, op: rand() * 0.7 + 0.25, color: '#ffffff',
      })
    }

    let t = 0

    function draw() {
      t += 0.004
      ctx!.clearRect(0, 0, W, H)

      const haloScale = hovered ? 1.08 : 1
      const outerGlow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, W * 0.52 * haloScale)
      outerGlow.addColorStop(0, cluster.coreColor.replace('0.85', hovered ? '0.12' : '0.07'))
      outerGlow.addColorStop(0.5, cluster.rimColor)
      outerGlow.addColorStop(1, 'transparent')
      ctx!.fillStyle = outerGlow
      ctx!.beginPath()
      ctx!.ellipse(cx, cy, W * 0.52 * haloScale, H * 0.38 * haloScale, 0, 0, Math.PI * 2)
      ctx!.fill()

      ctx!.save()
      ctx!.translate(cx, cy)
      ctx!.rotate(t * 0.08)
      const armCount2 = cluster.id === 'cyber' ? 3 : 2
      for (let a = 0; a < armCount2; a++) {
        ctx!.save()
        ctx!.rotate((a * Math.PI * 2) / armCount2)
        const armGrad = ctx!.createRadialGradient(W * 0.14, 0, 0, W * 0.14, 0, W * 0.3)
        armGrad.addColorStop(0, cluster.armColor.replace('0.4', '0.55'))
        armGrad.addColorStop(0.6, cluster.armColor)
        armGrad.addColorStop(1, 'transparent')
        ctx!.fillStyle = armGrad
        ctx!.scale(1, 0.45)
        ctx!.beginPath()
        ctx!.ellipse(W * 0.14, 0, W * 0.3, W * 0.12, 0, 0, Math.PI * 2)
        ctx!.fill()
        ctx!.restore()
      }
      ctx!.restore()

      ctx!.save()
      ctx!.translate(cx, cy)
      ctx!.rotate(t * 0.08)
      for (const s of armStars) {
        const twinkle = 0.7 + Math.sin(t * 3.2 + s.x * 0.1) * 0.3
        ctx!.globalAlpha = s.op * twinkle
        ctx!.fillStyle = s.color
        ctx!.beginPath()
        ctx!.arc(s.x - cx, (s.y - cy) * 0.55, s.r, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.restore()
      ctx!.globalAlpha = 1

      const coreSize = W * (hovered ? 0.085 : 0.072)
      const coreGlow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, coreSize)
      coreGlow.addColorStop(0, '#ffffff')
      coreGlow.addColorStop(0.15, cluster.coreColor)
      coreGlow.addColorStop(0.55, cluster.coreColor.replace('0.85', '0.3'))
      coreGlow.addColorStop(1, 'transparent')
      ctx!.fillStyle = coreGlow
      ctx!.beginPath()
      ctx!.arc(cx, cy, coreSize, 0, Math.PI * 2)
      ctx!.fill()

      ctx!.fillStyle = '#ffffff'
      ctx!.globalAlpha = 0.95
      ctx!.beginPath()
      ctx!.arc(cx, cy, 2.5, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.globalAlpha = 1

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [cluster, hovered])

  return (
    <canvas
      ref={canvasRef} width={320} height={220}
      style={{ pointerEvents: 'none', userSelect: 'none' }} aria-hidden="true"
    />
  )
}

// ─── Galaxy Overview ─────────────────────────────────────────────────────────

interface GalaxyOverviewProps {
  onWarp: (galaxy: 'cyber' | 'software') => void
}

export function GalaxyOverview({ onWarp }: GalaxyOverviewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [time, setTime] = useState(0)

  useEffect(() => {
    let frame: number
    let last = 0
    const tick = (ts: number) => {
      if (ts - last > 80) { last = ts; setTime(ts) }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const coordsAnim = Math.sin(time * 0.001) * 0.5 + 0.5

  return (
    <div className="galaxy-overview animate-overview-in">

      {/* HUD top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0', pointerEvents: 'none' }}>
        <div className="flex flex-col" style={{ gap: 2 }}>
          <span className="font-mono text-10 uppercase" style={{ letterSpacing: '0.22em', color: 'rgba(255,255,255,0.30)' }}>Portfolio Navigation</span>
          <span className="font-mono text-11 uppercase" style={{ letterSpacing: '0.18em', color: 'rgba(255,255,255,0.60)' }}>Select a Sector to Warp</span>
        </div>
        <div className="flex flex-col items-end" style={{ gap: 2 }}>
          <span className="font-mono text-9 uppercase" style={{ letterSpacing: '0.14em', color: 'rgba(255,255,255,0.25)' }}>
            COORDS {(coordsAnim * 360).toFixed(2)}° // {(coordsAnim * 90 - 45).toFixed(2)}°
          </span>
          <span className="font-mono text-9 uppercase animate-coords-tick" style={{ letterSpacing: '0.14em', color: 'rgba(255,255,255,0.20)' }}>
            SYS READY
          </span>
        </div>
      </div>

      {/* Hero identity badge */}
      <div
        style={{
          position: 'absolute', top: 60, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 8, pointerEvents: 'none', zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25))' }} />
          <h1
            className="font-bold uppercase"
            style={{
              fontSize: 'clamp(16px, 3vw, 26px)',
              letterSpacing: '0.28em',
              color: 'rgba(255,255,255,0.85)',
              textShadow: '0 0 30px rgba(255,255,255,0.08)',
            }}
          >
            FAWAZ BALOGUN
          </h1>
          <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.25), transparent)' }} />
        </div>
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 9.5, letterSpacing: '0.3em',
            color: 'rgba(0,255,160,0.55)',
            textShadow: '0 0 6px rgba(0,255,160,0.2)',
          }}
        >
          Cybersecurity Engineer &nbsp;•&nbsp; Software Architect
        </p>
      </div>

      {/* Center void divider */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div className="divider-void">
          <div className="divider-line" />
          <span className="font-mono text-9 uppercase" style={{ letterSpacing: '0.4em', color: 'rgba(255,255,255,0.20)' }}>VOID</span>
          <div className="divider-line" />
        </div>
      </div>

      {/* Two galaxies */}
      <div className="flex flex-col items-center justify-center md-flex-row" style={{ gap: 48, width: '100%', maxWidth: 1000, padding: '0 24px', zIndex: 10 }}>
        {CLUSTERS.map((cluster) => {
          const isHovered = hoveredId === cluster.id
          return (
            <button
              key={cluster.id}
              className="galaxy-btn"
              onMouseEnter={() => setHoveredId(cluster.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onWarp(cluster.id)}
              aria-label={`Warp to ${cluster.label}`}
            >
              {/* Outer HUD ring */}
              <div
                style={{
                  position: 'relative', borderRadius: '50%', padding: 3,
                  transition: 'all 0.5s cubic-bezier(0.22,1,0.36,1)',
                  background: isHovered
                    ? `radial-gradient(ellipse at center, ${cluster.coreColor.replace('0.85', '0.08')} 0%, transparent 70%)`
                    : 'transparent',
                }}
              >
                <div
                  style={{
                    position: 'relative', borderRadius: '50%', overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
                    border: `1px solid ${isHovered ? cluster.hoverBorder : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: isHovered
                      ? `0 0 28px 6px ${cluster.coreColor.replace('0.85', '0.25')}, inset 0 0 24px ${cluster.coreColor.replace('0.85', '0.05')}`
                      : 'none',
                  }}
                >
                  <GalaxyCanvas cluster={cluster} hovered={isHovered} />
                </div>

                {/* Tick marks on hover */}
                {isHovered && (
                  <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width="320" height="220" viewBox="0 0 320 220" aria-hidden="true">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                      const rad = (deg * Math.PI) / 180
                      const rx2 = 159, ry2 = 109, cx2 = 160, cy2 = 110
                      return (
                        <line
                          key={deg}
                          x1={cx2 + Math.cos(rad) * rx2} y1={cy2 + Math.sin(rad) * ry2}
                          x2={cx2 + Math.cos(rad) * (rx2 + 8)} y2={cy2 + Math.sin(rad) * (ry2 + 8)}
                          stroke={cluster.accentText} strokeWidth="1" strokeOpacity="0.6"
                        />
                      )
                    })}
                  </svg>
                )}
              </div>

              {/* Label block */}
              <div className="flex flex-col items-center" style={{ gap: 6 }}>
                <div className="flex items-center gap-2">
                  <span
                    className="animate-glow-pulse"
                    style={{ width: 6, height: 6, borderRadius: '50%', background: cluster.accentText, boxShadow: `0 0 6px 1px ${cluster.accentText}` }}
                  />
                  <span
                    className="font-mono text-sm font-bold uppercase animate-galaxy-label-in"
                    style={{ letterSpacing: '0.22em', color: isHovered ? cluster.accentText : 'rgba(255,255,255,0.75)', transition: 'color 0.3s' }}
                  >
                    {cluster.label}
                  </span>
                </div>
                <span className="font-mono text-10 uppercase" style={{ letterSpacing: '0.14em', color: 'rgba(255,255,255,0.40)' }}>
                  {cluster.sublabel}
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span
                    className="font-mono text-9"
                    style={{
                      letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 2,
                      color: cluster.accentText,
                      border: `1px solid ${isHovered ? cluster.hoverBorder : 'rgba(255,255,255,0.1)'}`,
                      background: isHovered ? cluster.coreColor.replace('0.85', '0.08') : 'transparent',
                      transition: 'all 0.3s',
                    }}
                  >
                    {cluster.planetCount} BODIES
                  </span>
                  <span className="font-mono text-9" style={{ letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)' }}>
                    {cluster.coords}
                  </span>
                </div>

                {/* Warp prompt */}
                <div
                  className="flex items-center mt-2"
                  style={{ gap: 6, opacity: isHovered ? 1 : 0, transform: isHovered ? 'translateY(0)' : 'translateY(4px)', transition: 'all 0.3s' }}
                >
                  <span className="font-mono text-9 uppercase" style={{ letterSpacing: '0.3em', color: cluster.accentText }}>
                    CLICK TO WARP
                  </span>
                  <svg width="14" height="8" viewBox="0 0 14 8" fill="none" aria-hidden="true">
                    <path d="M0 4h12M9 1l3 3-3 3" stroke={cluster.accentText} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Bottom HUD bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px 16px', pointerEvents: 'none' }}>
        <span className="font-mono text-9 uppercase" style={{ letterSpacing: '0.2em', color: 'rgba(255,255,255,0.20)' }}>TWO SECTORS DETECTED</span>
        <span className="font-mono text-9 uppercase" style={{ letterSpacing: '0.2em', color: 'rgba(255,255,255,0.20)' }}>NAVIGATION SYSTEMS ONLINE</span>
      </div>
    </div>
  )
}
