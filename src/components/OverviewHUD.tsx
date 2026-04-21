interface OverviewHUDProps {
  visible: boolean
}

/**
 * DOM overlay for the overview state.
 * Shows the hero identity badge and navigation metadata.
 */
export function OverviewHUD({ visible }: OverviewHUDProps) {
  if (!visible) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 20,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}
    >
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        padding: '20px 24px',
      }}>
        <div className="flex flex-col" style={{ gap: 2 }}>
          <span className="font-mono text-10 uppercase" style={{ letterSpacing: '0.22em', color: 'rgba(255,255,255,0.30)' }}>
            Portfolio Navigation
          </span>
          <span className="font-mono text-11 uppercase" style={{ letterSpacing: '0.18em', color: 'rgba(255,255,255,0.60)' }}>
            Select a Sector to Explore
          </span>
        </div>
        <div className="flex flex-col items-end" style={{ gap: 2 }}>
          <span className="font-mono text-9 uppercase animate-coords-tick" style={{ letterSpacing: '0.14em', color: 'rgba(255,255,255,0.25)' }}>
            SYS ONLINE
          </span>
        </div>
      </div>

      {/* Hero identity */}
      <div style={{
        position: 'absolute', top: 60, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
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
        <p className="font-mono uppercase" style={{
          fontSize: 9.5, letterSpacing: '0.3em',
          color: 'rgba(0,255,160,0.55)',
          textShadow: '0 0 6px rgba(0,255,160,0.2)',
        }}>
          Cybersecurity Engineer &nbsp;•&nbsp; Software Architect
        </p>
      </div>

      {/* Bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px 16px',
      }}>
        <span className="font-mono text-9 uppercase" style={{ letterSpacing: '0.2em', color: 'rgba(255,255,255,0.20)' }}>
          TWO SECTORS DETECTED
        </span>
        <span className="font-mono text-9 uppercase" style={{ letterSpacing: '0.2em', color: 'rgba(255,255,255,0.20)' }}>
          NAVIGATION SYSTEMS ONLINE
        </span>
      </div>
    </div>
  )
}
