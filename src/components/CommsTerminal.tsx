import { PROFILE_DATA } from '../data/profile'

interface CommsTerminalProps {
  onClose: () => void
}

export function CommsTerminal({ onClose }: CommsTerminalProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 100, pointerEvents: 'all', padding: '40px' }}
    >
      {/* Dark backdrop blur */}
      <div 
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(16px)' }}
        onClick={onClose}
      />
      
      {/* The Floating Content (No background box) */}
      <div 
        className="relative flex flex-col animate-overview-in"
        style={{ width: '100%', height: '100%', overflowY: 'auto', scrollbarWidth: 'none' }}
      >
        {/* Header Ribbon */}
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <h2 className="font-mono uppercase font-bold" style={{ fontSize: 16, letterSpacing: '0.15em', color: '#ffffff' }}>
              [ DECRYPTED TRANSMISSION: FAWAZ BALOGUN ]
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="font-mono uppercase transition-colors"
            style={{ fontSize: 14, letterSpacing: '0.1em', color: '#ffffff', background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', padding: '4px 12px', cursor: 'pointer' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            [ CLOSE CHANNEL ]
          </button>
        </div>

        {/* Content Container */}
        <div className="flex flex-col gap-6" style={{ marginTop: '20px' }}>
          
          {/* Bio Section */}
          <section className="flex flex-col gap-4">
            {PROFILE_DATA.bio.map((p, i) => (
              <p key={i} className="font-sans leading-relaxed" style={{ fontSize: 16, color: '#ffffff', margin: 0 }}>
                {p}
              </p>
            ))}
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '20px' }}>
            {/* Certifications Section */}
            <section className="flex flex-col gap-4">
              <h3 className="font-mono uppercase font-bold" style={{ margin: 0, fontSize: 14, letterSpacing: '0.1em', color: '#ffffff' }}>
                SECURITY CLEARANCES // CERTIFICATIONS
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, listStyle: 'none', padding: 0, margin: 0 }}>
                {PROFILE_DATA.certifications.map((cert, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span style={{ color: '#ffffff', fontSize: 16, lineHeight: 1 }}>•</span>
                    <span className="font-sans" style={{ fontSize: 14, color: '#ffffff' }}>{cert}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Comms/Links Section */}
            <section className="flex flex-col gap-4">
              <h3 className="font-mono uppercase font-bold" style={{ margin: 0, fontSize: 14, letterSpacing: '0.1em', color: '#ffffff' }}>
                ESTABLISH CONNECTION // CONTACT LINKS
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                {Object.entries(PROFILE_DATA.contacts).map(([platform, link]) => (
                  <a
                    key={platform}
                    href={link.startsWith('http') ? link : `mailto:${link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono uppercase"
                    style={{ fontSize: 14, letterSpacing: '0.1em', color: '#ffffff', textDecoration: 'none' }}
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
