import { useState, useEffect, useRef } from 'react'

// ─── Boot Sequence Lines ─────────────────────────────────────────────────────

const BOOT_LINES = [
  { text: 'SYS.INIT // HELIOS KERNEL v3.7.1', delay: 0 },
  { text: 'LOADING ASTRO-NAVIGATION MODULE...', delay: 150 },
  { text: 'SCANNING SECTOR DATABASES...', delay: 300 },
  { text: 'DECRYPTING PORTFOLIO MANIFEST (RSA-4096)...', delay: 450 },
  { text: '├── SECTOR NYX    [9 BODIES CHARTED]   ✓', delay: 700 },
  { text: '├── SECTOR HELIOS [2 BODIES CHARTED]   ✓', delay: 900 },
  { text: '└── ORBITAL MECHANICS LOADED            ✓', delay: 1050 },
  { text: 'COMM LINK ESTABLISHED — ZERO-KNOWLEDGE VERIFIED', delay: 1300 },
  { text: 'RENDERING PROCEDURAL UNIVERSE...', delay: 1500 },
  { text: 'ALL SYSTEMS NOMINAL // READY', delay: 1800 },
]

interface BootSequenceProps {
  onComplete: () => void
}

export function BootSequence({ onComplete }: BootSequenceProps) {
  const [visibleLines, setVisibleLines] = useState(0)
  const [showHero, setShowHero] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const doneRef = useRef(false)

  useEffect(() => {
    if (doneRef.current) return
    const timers: ReturnType<typeof setTimeout>[] = []

    // Stagger boot lines
    BOOT_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), line.delay))
    })

    // Show hero after lines
    timers.push(setTimeout(() => setShowHero(true), 2200))

    // Start fade out
    timers.push(setTimeout(() => setFadeOut(true), 3800))

    // Complete
    timers.push(setTimeout(() => {
      doneRef.current = true
      onComplete()
    }, 4400))

    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        zIndex: 100,
        background: '#03020e',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.6s ease-out',
      }}
    >
      {/* CRT scanline overlay */}
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          mixBlendMode: 'multiply',
        }}
        aria-hidden="true"
      />

      {/* Boot terminal */}
      <div
        style={{
          position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center',
          maxWidth: 600, width: '100%', padding: '0 24px',
        }}
      >
        {/* Terminal lines */}
        <div
          style={{
            width: '100%', display: 'flex', flexDirection: 'column', gap: 4,
            marginBottom: showHero ? 40 : 0,
            opacity: showHero ? 0.3 : 1,
            transform: showHero ? 'translateY(-12px) scale(0.95)' : 'translateY(0)',
            transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {BOOT_LINES.slice(0, visibleLines).map((line, i) => {
            const isStatus = line.text.includes('✓')
            const isReady = line.text.includes('READY')
            return (
              <div
                key={i}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10.5,
                  letterSpacing: '0.08em',
                  color: isReady ? '#00ffa0' : isStatus ? 'rgba(0,255,160,0.7)' : 'rgba(255,255,255,0.45)',
                  textShadow: isReady ? '0 0 12px rgba(0,255,160,0.5)' : 'none',
                  animation: 'boot-line-in 0.15s ease forwards',
                }}
              >
                <span style={{ color: 'rgba(0,255,160,0.35)', marginRight: 8 }}>&gt;</span>
                {line.text}
              </div>
            )
          })}
          {visibleLines > 0 && visibleLines < BOOT_LINES.length && (
            <span
              className="animate-text-blink"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(0,255,160,0.6)' }}
            >
              ▌
            </span>
          )}
        </div>

        {/* Hero identity reveal */}
        <div
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            opacity: showHero ? 1 : 0,
            transform: showHero ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <div
            style={{
              width: 48, height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(0,255,160,0.5), transparent)',
            }}
            aria-hidden="true"
          />
          <h1
            className="font-bold uppercase"
            style={{
              fontSize: 'clamp(24px, 5vw, 42px)',
              letterSpacing: '0.22em',
              color: 'white',
              textAlign: 'center',
              textShadow: '0 0 40px rgba(255,255,255,0.15)',
              lineHeight: 1.2,
            }}
          >
            FAWAZ BALOGUN
          </h1>
          <p
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: '0.35em',
              color: 'rgba(0,255,160,0.65)',
              textShadow: '0 0 8px rgba(0,255,160,0.3)',
              textAlign: 'center',
            }}
          >
            Cybersecurity Engineer &nbsp;•&nbsp; Software Architect
          </p>
          <div
            style={{
              width: 48, height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(0,255,160,0.5), transparent)',
            }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  )
}
