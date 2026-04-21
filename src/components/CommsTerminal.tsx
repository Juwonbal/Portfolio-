import { PROFILE_DATA } from '../data/profile'

interface CommsTerminalProps {
  onClose: () => void
}

export function CommsTerminal({ onClose }: CommsTerminalProps) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 100, pointerEvents: 'all' }}
    >
      {/* Dark backdrop blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* The Terminal Modal */}
      <div 
        className="relative w-full max-w-2xl bg-[#030712]/90 border border-[#00ffcc]/30 shadow-[0_0_30px_rgba(0,255,204,0.15)] flex flex-col overflow-hidden animate-overview-in"
        style={{
          clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)'
        }}
      >
        {/* Header Ribbon */}
        <div className="bg-[#00ffcc]/10 border-b border-[#00ffcc]/20 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#00ffcc] animate-pulse" />
            <h2 className="font-mono text-sm tracking-[0.2em] uppercase text-[#00ffcc]">
              [ DECRYPTED TRANSMISSION: FAWAZ BALOGUN ]
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="font-mono text-xs tracking-widest text-[#00ffcc]/70 hover:text-[#00ffcc] transition-colors"
          >
            [ CLOSE CHANNEL ]
          </button>
        </div>

        {/* Content Container */}
        <div className="p-6 md:p-8 flex flex-col gap-8 max-h-[75vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#00ffcc transparent' }}>
          
          {/* Bio Section */}
          <section className="flex flex-col gap-3 relative">
            <div className="absolute -left-3 top-0 bottom-0 w-[2px] bg-[#00ffcc]/30" />
            {PROFILE_DATA.bio.map((p, i) => (
              <p key={i} className="font-sans text-[15px] leading-relaxed text-white/80">
                {p}
              </p>
            ))}
          </section>

          {/* Certifications Section */}
          <section className="flex flex-col gap-4">
            <h3 className="font-mono text-xs uppercase tracking-widest text-white/50 border-b border-white/10 pb-2">
              SECURITY CLEARANCES // CERTIFICATIONS
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PROFILE_DATA.certifications.map((cert, i) => (
                <li 
                  key={i} 
                  className="bg-white/[0.03] border border-white/5 p-3 flex items-start gap-3"
                  style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                >
                  <span className="text-[#00ffcc] text-lg leading-none">▹</span>
                  <span className="font-sans text-sm text-white/90">{cert}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Comms/Links Section */}
          <section className="flex flex-col gap-4">
            <h3 className="font-mono text-xs uppercase tracking-widest text-white/50 border-b border-white/10 pb-2">
              ESTABLISH CONNECTION // CONTACT LINKS
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(PROFILE_DATA.contacts).map(([platform, link]) => (
                <a
                  key={platform}
                  href={link.startsWith('http') ? link : `mailto:${link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex flex-col items-center justify-center py-4 bg-[#00ffcc]/5 border border-[#00ffcc]/20 hover:bg-[#00ffcc]/20 transition-all duration-300"
                  style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                >
                  <span className="font-mono text-11 uppercase tracking-widest text-[#00ffcc] group-hover:scale-105 transition-transform duration-300">
                    {platform}
                  </span>
                  {/* Subtle corner bracket indicators */}
                  <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-[#00ffcc]/40" />
                  <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[#00ffcc]/40" />
                </a>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
