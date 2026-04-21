import { useState, useEffect } from 'react'
import { X, FileText } from 'lucide-react'
import type { ProjectData } from '@/data/types'

// ─── Crosshair SVG ───────────────────────────────────────────────────────────

function Crosshair({ pos, color, size = 18 }: { pos: 'tl' | 'tr' | 'bl' | 'br'; color: string; size?: number }) {
  const style: React.CSSProperties = {
    position: 'absolute', width: size, height: size, pointerEvents: 'none',
    ...(pos === 'tl' ? { top: 6, left: 6 } : {}),
    ...(pos === 'tr' ? { top: 6, right: 6 } : {}),
    ...(pos === 'bl' ? { bottom: 6, left: 6 } : {}),
    ...(pos === 'br' ? { bottom: 6, right: 6 } : {}),
  }
  const rotMap = { tl: 0, tr: 90, bl: 270, br: 180 }

  return (
    <svg style={style} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <g transform={`rotate(${rotMap[pos]} 9 9)`} stroke={color} strokeWidth="1" strokeLinecap="round">
        <line x1="1" y1="1" x2="6" y2="1" opacity="0.9" />
        <line x1="1" y1="1" x2="1" y2="6" opacity="0.9" />
        <circle cx="1" cy="1" r="0.8" fill={color} stroke="none" opacity="0.7" />
        <line x1="9" y1="1" x2="9" y2="3" opacity="0.35" />
        <line x1="1" y1="9" x2="3" y2="9" opacity="0.35" />
      </g>
    </svg>
  )
}

// ─── Efficiency Dial ─────────────────────────────────────────────────────────

function EfficiencyDial({ pct = 99, color }: { pct?: number; color: string }) {
  const r = 28
  const circumference = 2 * Math.PI * r
  const filled = (pct / 100) * circumference

  return (
    <div className="dial-container">
      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * 2 * Math.PI - Math.PI / 2
          return (
            <line
              key={i}
              x1={36 + (r + 5) * Math.cos(angle)} y1={36 + (r + 5) * Math.sin(angle)}
              x2={36 + (r + 8) * Math.cos(angle)} y2={36 + (r + 8) * Math.sin(angle)}
              stroke={color} strokeWidth="1" opacity={i / 20 < pct / 100 ? 0.6 : 0.12}
            />
          )
        })}
        <circle
          cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="2.5"
          strokeLinecap="butt" strokeDasharray={`${filled} ${circumference}`}
          strokeDashoffset={circumference * 0.25}
          style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1)' }}
        />
        <circle cx="36" cy="36" r={r - 7} fill="none" stroke={color} strokeWidth="0.5" opacity="0.18" strokeDasharray="2 4" />
      </svg>
      <div className="dial-center">
        <span className="font-mono font-bold leading-none text-15" style={{ color, textShadow: `0 0 10px ${color}` }}>{pct}%</span>
        <span className="font-mono uppercase mt-05" style={{ fontSize: 7, letterSpacing: '0.14em', color, opacity: 0.55 }}>EFF</span>
      </div>
    </div>
  )
}

// ─── Load Bar ────────────────────────────────────────────────────────────────

function LoadBar({ pct = 99, color }: { pct?: number; color: string }) {
  const total = 24
  const filled = Math.round((pct / 100) * total)

  return (
    <div className="load-bar">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i} className="load-segment"
          style={{
            background: i < filled ? color : 'rgba(255,255,255,0.06)',
            boxShadow: i < filled ? `0 0 4px ${color}` : 'none',
            opacity: i < filled ? (0.5 + (i / total) * 0.5) : 1,
            transitionDelay: `${i * 30}ms`,
          }}
        />
      ))}
    </div>
  )
}

// ─── CRT Overlay ─────────────────────────────────────────────────────────────

function CrtOverlay() {
  return (
    <>
      <div className="scanline-overlay" aria-hidden="true" />
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', pointerEvents: 'none', zIndex: 10 }} aria-hidden="true">
        <div className="scanline-beam" />
      </div>
    </>
  )
}

// ─── Spec Cell ───────────────────────────────────────────────────────────────

function SpecCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="spec-cell">
      <span className="font-mono uppercase leading-none" style={{ fontSize: 8.5, letterSpacing: '0.18em', color }}>[{label}]</span>
      <span className="font-mono leading-tight text-11 mt-05" style={{ color: 'rgba(255,255,255,0.85)' }}>{value}</span>
    </div>
  )
}

// ─── Stat Row ────────────────────────────────────────────────────────────────

function StatRow({ stats, color }: { stats: { label: string; value: string }[]; color: string }) {
  return (
    <div className="stat-row">
      {stats.map((s) => (
        <div key={s.label} className="stat-cell">
          <span className="font-mono font-bold leading-none text-17" style={{ color, textShadow: `0 0 8px ${color}` }}>{s.value}</span>
          <span className="font-mono uppercase leading-none mt-05" style={{ fontSize: 8.5, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.30)' }}>{s.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Project Card ───────────────────────────────────────────────────────

interface ProjectCardProps {
  project: ProjectData
  onClose: () => void
}

export function ProjectCard({ project, onClose }: ProjectCardProps) {
  const [mounted, setMounted] = useState(false)
  const { accent } = project
  const hud = accent.hud

  useEffect(() => {
    setMounted(true)
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="project-card-backdrop" role="dialog" aria-modal="true" aria-labelledby="hud-title">
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(10px)', background: 'rgba(0,4,12,0.78)' }}
        onClick={onClose} aria-hidden="true"
      />

      {/* Terminal Card */}
      <article
        className={`project-card ${mounted ? 'animate-hud-enter animate-crt-flicker' : ''}`}
        style={{ filter: `drop-shadow(0 0 32px ${hud}44) drop-shadow(0 0 80px rgba(0,0,0,0.9))` }}
      >
        <CrtOverlay />
        <Crosshair pos="tl" color={hud} />
        <Crosshair pos="tr" color={hud} size={14} />
        <Crosshair pos="bl" color={hud} size={14} />
        <Crosshair pos="br" color={hud} size={14} />

        {/* Left neon edge */}
        <div
          className="animate-glow-pulse animate-left-edge"
          style={{
            position: 'absolute', top: 0, bottom: 0, left: 0, width: 2, zIndex: 20,
            background: `linear-gradient(180deg, ${hud} 0%, ${hud}aa 60%, transparent 100%)`,
            boxShadow: `0 0 12px 1px ${hud}88`,
          }}
          aria-hidden="true"
        />

        {/* Top neon edge */}
        <div
          className="animate-glow-pulse"
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2, zIndex: 20,
            background: `linear-gradient(90deg, ${hud} 0%, ${hud}cc 40%, ${accent.text}66 100%)`,
            boxShadow: `0 0 10px 1px ${hud}66`,
          }}
          aria-hidden="true"
        />

        {/* Interior grid */}
        <div
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
            backgroundImage: `linear-gradient(${hud}08 1px, transparent 1px), linear-gradient(90deg, ${hud}08 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
          aria-hidden="true"
        />

        {/* Header */}
        <header style={{ position: 'relative', zIndex: 10, padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="animate-glow-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: hud, boxShadow: `0 0 6px ${hud}` }} aria-hidden="true" />
            <p className="font-mono text-9 uppercase animate-crt-flicker" style={{ letterSpacing: '0.22em', color: hud }}>
              SYS.LOC // TARGET LOCKED: {project.id.toUpperCase()}_SLM_ACTIVE
              <span className="animate-text-blink ml-05">_</span>
            </p>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-9 uppercase mb-15" style={{ letterSpacing: '0.25em', color: `${hud}99` }}>
                &gt;&gt; {project.category}
              </p>
              <h2 id="hud-title" className="font-bold uppercase" style={{
                color: 'white', lineHeight: 1.25, letterSpacing: '0.08em',
                fontSize: 'clamp(16px, 3.5vw, 22px)',
                textShadow: '0 0 24px rgba(255,255,255,0.15)', textWrap: 'balance',
              }}>
                {project.title}
              </h2>
              <p className="font-mono text-11 mt-15" style={{ letterSpacing: '0.08em', color: accent.text, textShadow: `0 0 8px ${accent.glow}` }}>
                // {project.subtitle}
              </p>
            </div>
            <EfficiencyDial pct={project.efficiency ?? 99} color={hud} />
          </div>

          <div className="flex items-center gap-3 mt-3">
            <span className="font-mono uppercase shrink-0" style={{ fontSize: 8, letterSpacing: '0.14em', color: `${hud}88` }}>DIAG.LOAD</span>
            <LoadBar pct={project.efficiency ?? 99} color={hud} />
            <span className="font-mono text-9 shrink-0" style={{ color: hud }}>{project.efficiency ?? 99}%</span>
          </div>
        </header>

        {/* Body */}
        <div style={{ position: 'relative', zIndex: 10, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p className="font-mono text-12 leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)', letterSpacing: '0.05em' }}>
            {project.description}
          </p>

          {project.stats && project.stats.length > 0 && (
            <div style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.20)' }}>
              <StatRow stats={project.stats} color={hud} />
            </div>
          )}

          {project.specs && (
            <div>
              <p className="font-mono uppercase mb-15" style={{ fontSize: 8, letterSpacing: '0.22em', color: `${hud}77` }}>// SYSTEM SPECS</p>
              <div className="grid grid-cols-2 gap-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <SpecCell label="INFRA" value={project.specs.infra} color={hud} />
                <SpecCell label="DOMAIN" value={project.specs.domain} color={hud} />
                <SpecCell label="FRAMEWORK" value={project.specs.framework} color={hud} />
                <SpecCell label="HARDWARE" value={project.specs.hardware} color={hud} />
              </div>
            </div>
          )}

          {/* Tech tags */}
          <div className="flex flex-wrap" style={{ gap: 6 }} role="list" aria-label="Tech stack">
            {project.tags.map((tag, i) => (
              <span
                key={tag} role="listitem"
                className="font-mono uppercase animate-tag-slide chamfer-tag"
                style={{
                  display: 'inline-flex', alignItems: 'center', padding: '3px 8px',
                  fontSize: 9.5, letterSpacing: '0.14em',
                  background: `${hud}10`, border: `1px solid ${hud}40`, color: hud,
                  animationDelay: `${i * 45}ms`, animationFillMode: 'both', opacity: 0,
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: `linear-gradient(90deg, ${hud}66 0%, ${hud}22 60%, transparent 100%)` }} aria-hidden="true" />

          {/* Footer */}
          <footer className="flex items-center justify-between flex-wrap" style={{ gap: 12 }}>
            <div className="flex flex-col" style={{ gap: 2 }}>
              <span className="font-mono uppercase" style={{ fontSize: 8, letterSpacing: '0.2em', color: `${hud}55` }}>
                SYS://NODE/{project.id.toUpperCase()} &nbsp;
                <span style={{ color: 'rgba(255,255,255,0.12)' }}>// SECURE CHANNEL</span>
              </span>
              <span className="font-mono" style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>
                CONN: ENCRYPTED &nbsp;|&nbsp; PROTO: TLS 1.3 &nbsp;|&nbsp; AUTH: X.509
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onClose} aria-label="Close project terminal"
                className="font-mono uppercase chamfer-btn transition-fast focus-outline"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                  fontSize: 10, letterSpacing: '0.14em',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.40)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,80,80,0.12)'
                  e.currentTarget.style.borderColor = 'rgba(255,80,80,0.45)'
                  e.currentTarget.style.color = 'rgba(255,100,100,0.90)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.40)'
                }}
              >
                <X style={{ width: 12, height: 12 }} aria-hidden="true" />
                [ DISENGAGE ORBIT ]
              </button>

              <a
                href={project.mediumUrl ?? '#'} target="_blank" rel="noopener noreferrer"
                aria-label="Open Medium article"
                className="font-mono uppercase chamfer-btn-lg transition-fast focus-outline"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                  fontSize: 10, letterSpacing: '0.14em',
                  background: `${hud}18`, border: `1px solid ${hud}80`, color: hud,
                  boxShadow: `0 0 12px ${hud}22, inset 0 0 8px ${hud}0a`,
                  textShadow: `0 0 8px ${hud}`,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.background = hud; el.style.color = '#000'
                  el.style.textShadow = 'none'; el.style.boxShadow = `0 0 24px ${hud}99, 0 0 48px ${hud}44`
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.background = `${hud}18`; el.style.color = hud
                  el.style.textShadow = `0 0 8px ${hud}`; el.style.boxShadow = `0 0 12px ${hud}22, inset 0 0 8px ${hud}0a`
                }}
              >
                <FileText style={{ width: 12, height: 12 }} aria-hidden="true" />
                [ READ ON MEDIUM ]
              </a>
            </div>
          </footer>
        </div>

        {/* Close X button */}
        <button
          onClick={onClose} aria-label="Close"
          className="chamfer-btn-sm transition-fast focus-outline"
          style={{
            position: 'absolute', top: 16, right: 16, zIndex: 30,
            width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
            color: 'rgba(255,255,255,0.28)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(255,80,80,0.9)'
            e.currentTarget.style.borderColor = 'rgba(255,80,80,0.5)'
            e.currentTarget.style.background = 'rgba(255,60,60,0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.28)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          }}
        >
          <X style={{ width: 12, height: 12 }} aria-hidden="true" />
        </button>
      </article>
    </div>
  )
}
