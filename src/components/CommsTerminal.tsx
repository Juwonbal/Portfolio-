import { PROFILE_DATA } from '../data/profile'

interface CommsTerminalProps {
  onClose: () => void
}

export function CommsTerminal({ onClose }: CommsTerminalProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ zIndex: 100, pointerEvents: 'all' }}
    >
      {/* Dark backdrop blur */}
      <div 
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      />
      
      {/* The Terminal Modal */}
      <div 
        className="relative flex flex-col overflow-hidden animate-overview-in"
        style={{
          width: '100%',
          maxWidth: '800px',
          background: 'rgba(3, 7, 18, 0.95)',
          border: '1px solid rgba(0, 255, 204, 0.3)',
          boxShadow: '0 0 30px rgba(0, 255, 204, 0.15)',
          clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)'
        }}
      >
        {/* Header Ribbon */}
        <div className="flex justify-between items-center px-6 py-4" style={{ background: 'rgba(0, 255, 204, 0.1)', borderBottom: '1px solid rgba(0, 255, 204, 0.2)' }}>
          <div className="flex items-center gap-3">
            <div className="animate-glow-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ffcc' }} />
            <h2 className="font-mono uppercase" style={{ fontSize: 14, letterSpacing: '0.2em', color: '#00ffcc', margin: 0 }}>
              [ DECRYPTED TRANSMISSION: FAWAZ BALOGUN ]
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="font-mono uppercase transition-colors"
            style={{ fontSize: 12, letterSpacing: '0.14em', color: 'rgba(0, 255, 204, 0.7)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#00ffcc'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(0, 255, 204, 0.7)'}
          >
            [ CLOSE CHANNEL ]
          </button>
        </div>

        {/* Content Container */}
        <div className="flex flex-col gap-6" style={{ padding: '32px', maxHeight: '75vh', overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#00ffcc transparent' }}>
          
          {/* Bio Section */}
          <section className="flex flex-col gap-3 relative">
            <div className="absolute" style={{ left: '-12px', top: 0, bottom: 0, width: 2, background: 'rgba(0, 255, 204, 0.3)' }} />
            {PROFILE_DATA.bio.map((p, i) => (
              <p key={i} className="font-sans leading-relaxed" style={{ fontSize: 15, color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
                {p}
              </p>
            ))}
          </section>

          {/* Certifications Section */}
          <section className="flex flex-col gap-4">
            <h3 className="font-mono uppercase" style={{ margin: 0, fontSize: 12, letterSpacing: '0.14em', color: 'rgba(255, 255, 255, 0.5)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 8 }}>
              SECURITY CLEARANCES // CERTIFICATIONS
            </h3>
            <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, listStyle: 'none', padding: 0, margin: 0 }}>
              {PROFILE_DATA.certifications.map((cert, i) => (
                <li 
                  key={i} 
                  className="flex items-start gap-3"
                  style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: 12, clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                >
                  <span style={{ color: '#00ffcc', fontSize: 18, lineHeight: 1 }}>▹</span>
                  <span className="font-sans" style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.9)' }}>{cert}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Comms/Links Section */}
          <section className="flex flex-col gap-4">
            <h3 className="font-mono uppercase" style={{ margin: 0, fontSize: 12, letterSpacing: '0.14em', color: 'rgba(255, 255, 255, 0.5)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 8 }}>
              ESTABLISH CONNECTION // CONTACT LINKS
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {Object.entries(PROFILE_DATA.contacts).map(([platform, link]) => (
                <a
                  key={platform}
                  href={link.startsWith('http') ? link : `mailto:${link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex flex-col items-center justify-center transition-all"
                  style={{ padding: '16px 0', background: 'rgba(0, 255, 204, 0.05)', border: '1px solid rgba(0, 255, 204, 0.2)', clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)', textDecoration: 'none' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 255, 204, 0.2)';
                    const span = e.currentTarget.querySelector('span');
                    if (span) span.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 255, 204, 0.05)';
                    const span = e.currentTarget.querySelector('span');
                    if (span) span.style.transform = 'scale(1)';
                  }}
                >
                  <span className="font-mono uppercase transition-all" style={{ fontSize: 11, letterSpacing: '0.14em', color: '#00ffcc' }}>
                    {platform}
                  </span>
                  {/* Subtle corner bracket indicators */}
                  <div className="absolute" style={{ top: 4, left: 4, width: 8, height: 8, borderTop: '1px solid rgba(0, 255, 204, 0.4)', borderLeft: '1px solid rgba(0, 255, 204, 0.4)' }} />
                  <div className="absolute" style={{ bottom: 4, right: 4, width: 8, height: 8, borderBottom: '1px solid rgba(0, 255, 204, 0.4)', borderRight: '1px solid rgba(0, 255, 204, 0.4)' }} />
                </a>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
