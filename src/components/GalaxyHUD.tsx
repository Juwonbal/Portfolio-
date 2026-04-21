interface GalaxyHUDProps {
  visible: boolean
  galaxyId: 'cyber' | 'software'
  planetCount: number
  onBack: () => void
}

/**
 * DOM overlay HUD for the galaxy/solar-system state.
 * Shows sector badge, planet count, coordinates, and back button.
 */
export function GalaxyHUD({ visible, galaxyId, planetCount, onBack }: GalaxyHUDProps) {
  if (!visible) return null

  const isCyber = galaxyId === 'cyber'
  const sectorLabel = isCyber ? 'SECTOR NYX' : 'SECTOR HELIOS'
  const accentColor = isCyber ? '#ff6030' : '#22d3ee'
  const coords = isCyber ? "RA 04h 35m // DEC -05° 27'" : "RA 18h 12m // DEC +22° 14'"

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 20,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      {/* Top left — sector badge */}
      <div
        className="animate-sector-badge-in"
        style={{
          position: 'absolute', top: 20, left: 24,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}
      >
        <div className="flex items-center" style={{ gap: 8 }}>
          <div
            className="animate-glow-pulse"
            style={{
              width: 8, height: 8, borderRadius: '50%',
              background: accentColor,
              boxShadow: `0 0 10px 2px ${accentColor}`,
            }}
          />
          <span
            className="font-mono font-bold uppercase"
            style={{
              fontSize: 13, letterSpacing: '0.28em',
              color: accentColor,
            }}
          >
            {sectorLabel}
          </span>
        </div>
        <span
          className="font-mono text-10 uppercase"
          style={{ letterSpacing: '0.16em', color: 'rgba(255,255,255,0.40)', marginLeft: 16 }}
        >
          {planetCount} Planetary Bodies Charted
        </span>
      </div>

      {/* Top right — coordinates */}
      <div
        style={{
          position: 'absolute', top: 20, right: 24,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
        }}
      >
        <span
          className="font-mono text-9 uppercase"
          style={{ letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)' }}
        >
          {coords}
        </span>
        <span
          className="font-mono text-9 uppercase animate-coords-tick"
          style={{ letterSpacing: '0.18em', color: accentColor + '66' }}
        >
          ORBIT TRACKING ACTIVE
        </span>
      </div>

      {/* Back button */}
      <button
        className="pointer-events-auto focus-outline"
        style={{
          position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          zIndex: 20,
        }}
        onClick={onBack}
        aria-label="Return to overview"
      >
        <div
          className="flex items-center font-mono uppercase"
          style={{
            gap: 8, padding: '10px 20px', fontSize: 10, letterSpacing: '0.26em',
            borderRadius: 3,
            color: accentColor,
            border: `1px solid ${accentColor}55`,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `0 0 20px 3px ${accentColor}44`
            e.currentTarget.style.borderColor = accentColor
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none'
            e.currentTarget.style.borderColor = accentColor + '55'
          }}
        >
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
            <path
              d="M12 4H0M3 1L0 4l3 3"
              stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
          Return to Overview
        </div>
      </button>

      {/* Corner brackets */}
      {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
        <svg
          key={corner}
          className="absolute"
          width="24" height="24" viewBox="0 0 24 24"
          aria-hidden="true"
          style={{
            top: corner.startsWith('t') ? 16 : undefined,
            bottom: corner.startsWith('b') ? 16 : undefined,
            left: corner.endsWith('l') ? 16 : undefined,
            right: corner.endsWith('r') ? 16 : undefined,
          }}
        >
          <path
            d={
              corner === 'tl' ? 'M12 2 H2 V12' :
              corner === 'tr' ? 'M12 2 H22 V12' :
              corner === 'bl' ? 'M12 22 H2 V12' :
                                'M12 22 H22 V12'
            }
            fill="none"
            stroke={accentColor}
            strokeWidth="1.2"
            strokeOpacity="0.45"
          />
        </svg>
      ))}
    </div>
  )
}
