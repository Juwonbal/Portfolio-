import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

// ─── Crawl Paragraphs ────────────────────────────────────────────────────────

const CRAWL_PARAGRAPHS = [
  'HI, I AM FAWAZ BALOGUN.',
  'A RESULT-DRIVEN CYBERSECURITY ANALYST AND SOFTWARE ENGINEER.',
  'WITH DEMONSTRATED EXPERTISE IN NETWORK SECURITY, THREAT DETECTION, AND INCIDENT RESPONSE, I SECURE VIRTUALIZED ENVIRONMENTS AND BUILD RESILIENT SYSTEMS.',
  'ADEPT AT LEVERAGING PYTHON FOR AUTOMATION AND CRAFTING DEFENSIVE MEASURES, MY MISSION IS TO MAINTAIN SECURE INFRASTRUCTURES AND MITIGATE EVOLVING CYBER THREATS.',
  'WELCOME TO MY UNIVERSE.',
]

// ─── Props ───────────────────────────────────────────────────────────────────

interface IntroCrawlProps {
  onComplete: () => void
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SCROLL_RANGE = 2800          // Total scroll distance (px equivalent)
const AUTO_SPEED = 1.1             // Pixels per frame at 60fps (~66px/s auto-scroll)
const WHEEL_MULTIPLIER = 1.2       // How much mouse wheel input contributes
const TOUCH_MULTIPLIER = 2.5       // Touch amplification for mobile
const INITIAL_DELAY_MS = 500       // Wait before auto-scroll starts
const COMPLETION_DELAY_MS = 800    // Delay after crawl ends before calling onComplete

// ─── Component ───────────────────────────────────────────────────────────────

export function IntroCrawl({ onComplete }: IntroCrawlProps) {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [textVisible, setTextVisible] = useState(false)
  const [completed, setCompleted] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const doneRef = useRef(false)
  const scrollAccumRef = useRef(0)
  const userBoostRef = useRef(0)      // Extra speed from mouse wheel
  const autoStartedRef = useRef(false)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef(0)

  // ─── Stable star positions (memoized to avoid re-randomizing on re-render) ─

  const stars = useMemo(() =>
    Array.from({ length: 100 }).map(() => ({
      size: Math.random() * 2.5 + 0.5,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 2,
    })),
  [])

  // ─── Fade text in after mount ────────────────────────────────────────────

  useEffect(() => {
    const t = setTimeout(() => setTextVisible(true), 300)
    return () => clearTimeout(t)
  }, [])

  // ─── Auto-scroll animation loop ─────────────────────────────────────────

  useEffect(() => {
    // Delay before auto-scroll begins
    const startTimer = setTimeout(() => {
      autoStartedRef.current = true
      lastTimeRef.current = performance.now()
    }, INITIAL_DELAY_MS)

    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick)

      if (doneRef.current || !autoStartedRef.current) return

      // Delta time for frame-rate independence
      const dt = Math.min(now - lastTimeRef.current, 50) // cap at 50ms
      lastTimeRef.current = now

      // Base auto-scroll + any user boost that decays over time
      const autoIncrement = AUTO_SPEED * (dt / 16.67) // normalize to 60fps
      const boostIncrement = userBoostRef.current * (dt / 16.67)

      // Decay user boost smoothly
      userBoostRef.current *= 0.92

      scrollAccumRef.current += autoIncrement + boostIncrement
      scrollAccumRef.current = Math.max(0, Math.min(SCROLL_RANGE, scrollAccumRef.current))

      const progress = scrollAccumRef.current / SCROLL_RANGE
      setScrollProgress(progress)

      if (progress >= 1 && !doneRef.current) {
        doneRef.current = true
        setCompleted(true)
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      clearTimeout(startTimer)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // ─── Wheel listener (boosts auto-scroll speed) ──────────────────────────

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (doneRef.current) return

      // Add user delta as a speed boost (positive = faster)
      const delta = Math.abs(e.deltaY) > 0 ? e.deltaY : e.deltaX
      userBoostRef.current += delta * WHEEL_MULTIPLIER * 0.02

      // Also directly move scroll for immediate response
      scrollAccumRef.current += delta * WHEEL_MULTIPLIER
      scrollAccumRef.current = Math.max(0, Math.min(SCROLL_RANGE, scrollAccumRef.current))
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // ─── Touch listeners ────────────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let lastTouchY = 0

    const onTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0].clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (doneRef.current) return

      const currentY = e.touches[0].clientY
      const delta = lastTouchY - currentY
      lastTouchY = currentY

      userBoostRef.current += delta * 0.05
      scrollAccumRef.current += delta * TOUCH_MULTIPLIER
      scrollAccumRef.current = Math.max(0, Math.min(SCROLL_RANGE, scrollAccumRef.current))
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  // ─── Fire onComplete after completion ────────────────────────────────────

  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!completed) return
    const t = setTimeout(() => onCompleteRef.current(), COMPLETION_DELAY_MS)
    return () => clearTimeout(t)
  }, [completed])

  // ─── Derived transforms ──────────────────────────────────────────────────

  // Map scrollProgress [0..1] → translateY from bottom to far above
  const translateY = 60 - scrollProgress * 160 // vh units

  // Fade out progressively in the last 20% of scroll
  const fadeMultiplier = scrollProgress > 0.8
    ? 1 - ((scrollProgress - 0.8) / 0.2)
    : 1

  // Text fade-in at the very start
  const textOpacity = textVisible
    ? fadeMultiplier
    : 0

  return (
    <div
      ref={containerRef}
      className="intro-crawl-container"
      style={{
        // Container stays fully opaque throughout — the parent backdrop handles transitions
        opacity: 1,
      }}
    >
      {/* Starfield background */}
      <div className="intro-crawl-stars" aria-hidden="true">
        {stars.map((star, i) => (
          <div
            key={i}
            className="intro-crawl-star"
            style={{
              width: star.size,
              height: star.size,
              left: `${star.x}%`,
              top: `${star.y}%`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Top gradient fade (fading into "distance") */}
      <div className="intro-crawl-top-fade" aria-hidden="true" />

      {/* Bottom gradient fade */}
      <div className="intro-crawl-bottom-fade" aria-hidden="true" />

      {/* 3D Perspective viewport */}
      <div className="intro-crawl-perspective">
        <div
          className="intro-crawl-text"
          style={{
            transform: `rotateX(25deg) translateY(${translateY}vh)`,
            opacity: textOpacity,
            transition: textVisible ? 'opacity 0.3s ease' : 'opacity 1.2s ease-in',
          }}
        >
          {CRAWL_PARAGRAPHS.map((para, i) => (
            <p key={i} className="intro-crawl-paragraph">
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* Scroll prompt — fades once scrolling begins */}
      <div
        className="intro-crawl-prompt"
        style={{
          opacity: scrollProgress < 0.03 && textVisible ? 1 : 0,
        }}
      >
        <div className="intro-crawl-prompt-icon">
          <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
            <rect x="1" y="1" width="18" height="26" rx="9" stroke="rgba(255,232,31,0.5)" strokeWidth="1.5" />
            <circle className="intro-crawl-scroll-dot" cx="10" cy="8" r="2" fill="#FFE81F" />
          </svg>
        </div>
        <span className="intro-crawl-prompt-text">SCROLL TO SPEED UP</span>
      </div>
    </div>
  )
}
