import { useEffect, useRef } from 'react'

interface Star {
  x: number; y: number; r: number
  baseOpacity: number; twinkleSpeed: number; twinkleOffset: number
  color: string
}

interface NebulaDust {
  x: number; y: number; rx: number; ry: number
  angle: number; color: string; opacity: number
}

const STAR_COLORS = ['#ffffff', '#e8eeff', '#ffd6a5', '#c8d8ff', '#ffcccc', '#ccffee']

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 4294967296
  }
}

export function SpaceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0, H = 0
    let stars: Star[] = []
    let milkyWayDust: NebulaDust[] = []

    function resize() {
      W = canvas!.width = window.innerWidth
      H = canvas!.height = window.innerHeight
      build()
    }

    function build() {
      const rng = seededRandom(42)
      stars = []
      milkyWayDust = []

      for (let i = 0; i < 1800; i++) {
        const temp = rng()
        stars.push({
          x: rng() * W, y: rng() * H,
          r: rng() < 0.85 ? rng() * 0.8 + 0.2 : rng() * 1.4 + 0.8,
          baseOpacity: rng() * 0.5 + 0.15,
          twinkleSpeed: rng() * 0.003 + 0.0008,
          twinkleOffset: rng() * Math.PI * 2,
          color: STAR_COLORS[Math.floor(temp * STAR_COLORS.length)],
        })
      }

      const bandAngle = -0.28
      const bandCX = W * 0.5, bandCY = H * 0.5
      for (let i = 0; i < 260; i++) {
        const t = (i / 260) * W * 1.6 - W * 0.3
        milkyWayDust.push({
          x: bandCX + t * Math.cos(bandAngle),
          y: bandCY + t * Math.sin(bandAngle) + (rng() - 0.5) * H * 0.18,
          rx: rng() * 90 + 40, ry: rng() * 22 + 10,
          angle: bandAngle + (rng() - 0.5) * 0.4,
          color: rng() > 0.5 ? 'rgba(160,180,255,' : 'rgba(200,210,255,',
          opacity: rng() * 0.028 + 0.008,
        })
      }
    }

    function drawBackground() {
      const bg = ctx!.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.72)
      bg.addColorStop(0, 'rgba(8,6,24,1)')
      bg.addColorStop(0.45, 'rgba(4,4,16,1)')
      bg.addColorStop(1, 'rgba(2,2,10,1)')
      ctx!.fillStyle = bg
      ctx!.fillRect(0, 0, W, H)
    }

    function drawMilkyWay() {
      ctx!.save()
      for (const d of milkyWayDust) {
        ctx!.save()
        ctx!.translate(d.x, d.y)
        ctx!.rotate(d.angle)
        const grad = ctx!.createRadialGradient(0, 0, 0, 0, 0, d.rx)
        grad.addColorStop(0, d.color + d.opacity * 3.5 + ')')
        grad.addColorStop(0.5, d.color + d.opacity * 1.2 + ')')
        grad.addColorStop(1, d.color + '0)')
        ctx!.fillStyle = grad
        ctx!.scale(1, d.ry / d.rx)
        ctx!.beginPath()
        ctx!.arc(0, 0, d.rx, 0, Math.PI * 2)
        ctx!.fill()
        ctx!.restore()
      }
      ctx!.restore()
    }

    function drawStars(t: number) {
      for (const s of stars) {
        const twinkle = Math.sin(t * s.twinkleSpeed * 1000 + s.twinkleOffset)
        const opacity = s.baseOpacity + twinkle * s.baseOpacity * 0.45
        ctx!.globalAlpha = Math.max(0.04, Math.min(1, opacity))
        ctx!.fillStyle = s.color

        if (s.r > 1.5) {
          const glow = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4)
          glow.addColorStop(0, s.color)
          glow.addColorStop(0.4, s.color.replace(')', ', 0.3)').replace('rgb', 'rgba'))
          glow.addColorStop(1, 'transparent')
          ctx!.globalAlpha = opacity * 0.25
          ctx!.fillStyle = glow
          ctx!.beginPath()
          ctx!.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2)
          ctx!.fill()
          ctx!.globalAlpha = opacity
          ctx!.fillStyle = s.color
        }

        ctx!.beginPath()
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1
    }

    function drawBrightStars(t: number) {
      const brightStars = [
        { x: W * 0.12, y: H * 0.15, r: 2.8, color: '#fff8e8' },
        { x: W * 0.88, y: H * 0.08, r: 2.4, color: '#e8f0ff' },
        { x: W * 0.75, y: H * 0.82, r: 2.6, color: '#fff0f0' },
        { x: W * 0.22, y: H * 0.78, r: 2.2, color: '#e8fff4' },
        { x: W * 0.55, y: H * 0.06, r: 2.0, color: '#fffff0' },
        { x: W * 0.05, y: H * 0.5,  r: 2.3, color: '#f0e8ff' },
      ]
      for (const s of brightStars) {
        const pulse = 1 + Math.sin(t * 0.0009 + s.x) * 0.12
        const hex = s.color.replace('#', '')
        const cr = parseInt(hex.slice(0, 2), 16)
        const cg = parseInt(hex.slice(2, 4), 16)
        const cb = parseInt(hex.slice(4, 6), 16)

        const corona = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 14 * pulse)
        corona.addColorStop(0, `rgba(${cr},${cg},${cb},0.18)`)
        corona.addColorStop(1, 'transparent')
        ctx!.globalAlpha = 1
        ctx!.fillStyle = corona
        ctx!.beginPath()
        ctx!.arc(s.x, s.y, s.r * 14 * pulse, 0, Math.PI * 2)
        ctx!.fill()

        const spikeLen = s.r * 22 * pulse
        ctx!.strokeStyle = s.color
        ctx!.lineWidth = 0.6
        for (let a = 0; a < 4; a++) {
          const angle = (a * Math.PI) / 2
          const grad = ctx!.createLinearGradient(
            s.x, s.y,
            s.x + Math.cos(angle) * spikeLen,
            s.y + Math.sin(angle) * spikeLen
          )
          grad.addColorStop(0, s.color)
          grad.addColorStop(0.3, `rgba(${cr},${cg},${cb},0.5)`)
          grad.addColorStop(1, 'transparent')
          ctx!.globalAlpha = 0.7
          ctx!.strokeStyle = grad
          ctx!.beginPath()
          ctx!.moveTo(s.x, s.y)
          ctx!.lineTo(s.x + Math.cos(angle) * spikeLen, s.y + Math.sin(angle) * spikeLen)
          ctx!.stroke()
          ctx!.beginPath()
          ctx!.moveTo(s.x, s.y)
          ctx!.lineTo(s.x - Math.cos(angle) * spikeLen, s.y - Math.sin(angle) * spikeLen)
          ctx!.stroke()
        }

        ctx!.globalAlpha = 1
        ctx!.fillStyle = s.color
        ctx!.beginPath()
        ctx!.arc(s.x, s.y, s.r * pulse, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1
    }

    function drawVignette() {
      const vg = ctx!.createRadialGradient(W * 0.5, H * 0.5, H * 0.3, W * 0.5, H * 0.5, Math.max(W, H) * 0.75)
      vg.addColorStop(0, 'transparent')
      vg.addColorStop(1, 'rgba(0,0,8,0.72)')
      ctx!.fillStyle = vg
      ctx!.fillRect(0, 0, W, H)
    }

    let lastTime = 0
    function frame(ts: number) {
      if (ts - lastTime < 40) {
        rafRef.current = requestAnimationFrame(frame)
        return
      }
      lastTime = ts
      drawBackground()
      drawMilkyWay()
      drawStars(ts)
      drawBrightStars(ts)
      drawVignette()
      rafRef.current = requestAnimationFrame(frame)
    }

    resize()
    window.addEventListener('resize', resize)
    rafRef.current = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas ref={canvasRef} className="space-canvas" aria-hidden="true" />
  )
}
