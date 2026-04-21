import { PROFILE_DATA } from '../data/profile'
import { useEffect, useState } from 'react'

interface CommsTerminalProps {
  onClose: () => void
}

export function CommsTerminal({ onClose }: CommsTerminalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ 
        zIndex: 100, 
        pointerEvents: 'all', 
        padding: '40px',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.4s ease-out'
      }}
    >
      {/* Dark backdrop blur - reduced intensity */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: 'rgba(0, 0, 0, 0.60)', 
          backdropFilter: mounted ? 'blur(6px)' : 'blur(0px)',
          transition: 'backdrop-filter 0.4s ease-out, background 0.4s ease-out'
        }}
        onClick={onClose}
      />
      
      {/* The Floating Content with subtle structure */}
      <div 
        className="relative flex flex-col"
        style={{ 
          width: '100%', 
          maxWidth: '1200px',
          height: '100%', 
          overflowY: 'auto', 
          scrollbarWidth: 'none',
          transform: mounted ? 'translateY(0)' : 'translateY(15px)',
          transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        {/* Header Ribbon */}
        <div className="flex justify-between items-center py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', marginBottom: '32px' }}>
          <div className="flex items-center gap-3">
            <h2 className="font-mono uppercase font-bold" style={{ fontSize: 16, letterSpacing: '0.15em', color: '#ffffff', margin: 0 }}>
              [ DECRYPTED TRANSMISSION: FAWAZ BALOGUN ]
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="font-mono uppercase transition-colors"
            style={{ fontSize: 14, letterSpacing: '0.1em', color: '#ffffff', background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', padding: '6px 14px', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = '#ffffff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
          >
            [ CLOSE CHANNEL ]
          </button>
        </div>

        {/* Content Container */}
        <div className="flex flex-col gap-12">
          
          {/* Bio Section - Added subtle left border to give structure without boxing it in */}
          <section className="flex flex-col gap-4" style={{ paddingLeft: '20px', borderLeft: '2px solid rgba(255,255,255,0.3)' }}>
            {PROFILE_DATA.bio.map((p, i) => (
              <p key={i} className="font-sans leading-relaxed" style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', margin: 0, maxWidth: '1000px' }}>
                {p}
              </p>
            ))}
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px' }}>
            {/* Certifications Section */}
            <section className="flex flex-col gap-4">
              <h3 className="font-mono uppercase font-bold" style={{ margin: 0, fontSize: 14, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)' }}>
                SECURITY CLEARANCES // CERTIFICATIONS
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, listStyle: 'none', padding: 0, margin: 0 }}>
                {PROFILE_DATA.certifications.map((cert, i) => (
                  <li key={i} className="flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                    <span style={{ color: '#ffffff', fontSize: 16, lineHeight: 1 }}>•</span>
                    <span className="font-sans" style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{cert}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Comms/Links Section */}
            <section className="flex flex-col gap-4">
              <h3 className="font-mono uppercase font-bold" style={{ margin: 0, fontSize: 14, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)' }}>
                ESTABLISH CONNECTION // CONTACT LINKS
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {Object.entries(PROFILE_DATA.contacts).map(([platform, link]) => (
                  <a
                    key={platform}
                    href={link.startsWith('http') ? link : `mailto:${link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono uppercase flex items-center justify-center"
                    style={{ fontSize: 14, letterSpacing: '0.1em', color: '#ffffff', textDecoration: 'none', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '4px', transition: 'all 0.2s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  >
                    {platform}
                  </a>
                ))}
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  )
}
