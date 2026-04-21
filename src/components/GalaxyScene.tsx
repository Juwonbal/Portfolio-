import { useEffect, useRef, useState, useCallback } from 'react'
import { ProjectCard } from './ProjectCard'
import type { ProjectData, PlanetVisual, OrbitConfig, PlanetConfig } from '@/data/types'

// ─── Seeded PRNG ─────────────────────────────────────────────────────────────

function makePRNG(seed: number) {
  let s = seed | 0
  return () => {
    s = Math.imul(s ^ (s >>> 15), s | 1)
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61)
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296
  }
}

function parseColor(c: string): [number, number, number, number] {
  if (c.startsWith('#')) {
    const h = c.slice(1)
    if (h.length === 3) return [parseInt(h[0]+h[0],16), parseInt(h[1]+h[1],16), parseInt(h[2]+h[2],16), 255]
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16), 255]
  }
  const m = c.match(/[\d.]+/g)
  if (!m) return [128,128,128,255]
  return [parseFloat(m[0]), parseFloat(m[1]), parseFloat(m[2]), m[3] !== undefined ? Math.round(parseFloat(m[3])*255) : 255]
}

function lerpColor(a: [number,number,number,number], b: [number,number,number,number], t: number): [number,number,number,number] {
  return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t, a[3]+(b[3]-a[3])*t]
}

function samplePalette(colors: string[], t: number): [number,number,number,number] {
  const parsed = colors.map(parseColor)
  const seg = t * (parsed.length - 1)
  const lo = Math.floor(seg)
  const hi = Math.min(lo + 1, parsed.length - 1)
  return lerpColor(parsed[lo], parsed[hi], seg - lo)
}

function smoothNoise(rng: () => number, tableSize: number) {
  const table = Array.from({ length: tableSize }, () => rng())
  return (x: number, y: number) => {
    const xi = Math.floor(x) % tableSize, yi = Math.floor(y) % tableSize
    const xf = x - Math.floor(x), yf = y - Math.floor(y)
    const x1 = (xi + 1) % tableSize, y1 = (yi + 1) % tableSize
    const v00 = table[(xi*57+yi) % tableSize], v10 = table[(x1*57+yi) % tableSize]
    const v01 = table[(xi*57+y1) % tableSize], v11 = table[(x1*57+y1) % tableSize]
    const ux = xf*xf*(3-2*xf), uy = yf*yf*(3-2*yf)
    return v00*(1-ux)*(1-uy) + v10*ux*(1-uy) + v01*(1-ux)*uy + v11*ux*uy
  }
}

// ─── Planet Canvas Renderer ──────────────────────────────────────────────────

function drawPlanet(ctx: CanvasRenderingContext2D, cx: number, cy: number, v: PlanetVisual, time: number, seed: number) {
  const r = v.radius
  const rng = makePRNG(seed)
  const noise = smoothNoise(rng, 64)
  const tiltRad = (v.tiltDeg * Math.PI) / 180

  // Atmosphere outer glow
  const atmoR = r * (1 + v.atmoThickness * 1.8)
  const atmoOuter = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, atmoR)
  const [ar, ag, ab] = parseColor(v.atmoColor)
  const gi = v.glowIntensity
  atmoOuter.addColorStop(0, `rgba(${ar},${ag},${ab},${gi * 0.55})`)
  atmoOuter.addColorStop(0.4, `rgba(${ar},${ag},${ab},${gi * 0.22})`)
  atmoOuter.addColorStop(1, `rgba(${ar},${ag},${ab},0)`)
  ctx.fillStyle = atmoOuter
  ctx.beginPath(); ctx.arc(cx, cy, atmoR, 0, Math.PI * 2); ctx.fill()

  // Rings behind
  if (v.hasRings && v.ringColors) drawRings(ctx, cx, cy, r, v, 'behind')

  // Main sphere (pixmap)
  const diameter = Math.ceil(r * 2)
  const imgData = ctx.createImageData(diameter, diameter)
  const pixels = imgData.data

  for (let py = 0; py < diameter; py++) {
    for (let px = 0; px < diameter; px++) {
      const dx = px - r, dy = py - r, dist2 = dx*dx + dy*dy
      if (dist2 > r*r) continue
      const nx = dx/r, ny = dy/r, nz = Math.sqrt(Math.max(0, 1-nx*nx-ny*ny))
      const cosT = Math.cos(tiltRad), sinT = Math.sin(tiltRad)
      const ry2 = ny*cosT - nz*sinT, rz2 = ny*sinT + nz*cosT
      const lat = Math.asin(Math.max(-1, Math.min(1, ry2)))
      const lon = Math.atan2(nx, rz2)
      const u = (lon/(Math.PI*2) + 0.5 + time*0.004*(1/r)) % 1
      const v2 = lat/Math.PI + 0.5
      let r8: number, g8: number, b8: number, a8 = 255

      if (v.type === 'gas-giant') {
        const bandFreq = 7 + (seed % 4)
        const bandVal = Math.sin(lat*bandFreq + noise(u*8, time*0.05)*1.2 - 0.6)
        const t = (bandVal+1)/2
        const noiseWarp = noise(u*6+1.3, v2*6+0.7)*0.18-0.09
        const [cr, cg, cb] = samplePalette(v.colors, Math.max(0, Math.min(1, t+noiseWarp)))
        r8 = cr; g8 = cg; b8 = cb
        if (v.stormSpots) {
          for (const s of v.stormSpots) {
            const du = Math.min(Math.abs(u-s.u), 1-Math.abs(u-s.u))*3, dv3 = (v2-s.v)*4
            const d = Math.sqrt(du*du+dv3*dv3)
            if (d < s.size) {
              const blend = 1-d/s.size
              const [sr, sg, sb] = parseColor(s.color)
              r8 += (sr-r8)*blend*0.85; g8 += (sg-g8)*blend*0.85; b8 += (sb-b8)*blend*0.85
            }
          }
        }
      } else if (v.type === 'rocky') {
        const n1 = noise(u*12,v2*12), n2 = noise(u*24+3.1,v2*24+2.7)*0.5, n3 = noise(u*48+1.2,v2*48+5.3)*0.25
        const n = (n1+n2+n3)/1.75
        const [cr, cg, cb] = samplePalette(v.colors, n); r8 = cr; g8 = cg; b8 = cb
        if (v.craterCount) {
          const craterRNG = makePRNG(seed+99)
          for (let ci = 0; ci < v.craterCount; ci++) {
            const cu = craterRNG(), cv = craterRNG(), csz = 0.03+craterRNG()*0.06
            const du = Math.min(Math.abs(u-cu),1-Math.abs(u-cu))*2, dv3 = (v2-cv)*2
            const d = Math.sqrt(du*du+dv3*dv3)
            if (d < csz) { const rim = d/csz, dark = rim<0.8?0.35:(1-rim)*2.0; r8=Math.max(0,r8-dark*40); g8=Math.max(0,g8-dark*40); b8=Math.max(0,b8-dark*40) }
          }
        }
      } else if (v.type === 'ocean') {
        const wave = noise(u*18+time*0.02,v2*18)*0.5+noise(u*36,v2*36)*0.25
        const land = noise(u*6+7.1,v2*6+3.4), isLand = land>0.68
        const t = isLand?Math.min(1,(land-0.68)/0.18):wave*0.6
        const [cr,cg,cb] = samplePalette(v.colors, isLand?0.8+t*0.2:t); r8=cr; g8=cg; b8=cb
      } else if (v.type === 'lava') {
        const crack = noise(u*20,v2*20), fissure = noise(u*40+2.1,v2*40+1.7)
        const heat = Math.max(0,fissure-0.55)/0.45
        const basePalette = samplePalette(v.colors.slice(0,Math.ceil(v.colors.length*0.6)), crack)
        const lavaColor = samplePalette(v.colors.slice(Math.floor(v.colors.length*0.6)), heat)
        r8 = Math.min(255,basePalette[0]+(lavaColor[0]-basePalette[0])*heat*1.4)
        g8 = Math.min(255,basePalette[1]+(lavaColor[1]-basePalette[1])*heat*1.4)
        b8 = Math.min(255,basePalette[2]+(lavaColor[2]-basePalette[2])*heat*1.4)
      } else if (v.type === 'ice') {
        const n1 = noise(u*10,v2*10), n2 = noise(u*22+4.4,v2*22+3.3)*0.45
        const crevasse = noise(u*50,v2*50)<0.35?0.0:1.0
        const t = ((n1+n2)/1.45)*crevasse
        const [cr,cg,cb] = samplePalette(v.colors, t); r8=cr; g8=cg; b8=cb
      } else if (v.type === 'desert') {
        const dune = Math.sin(u*22+noise(v2*8,u*6)*3)*0.5+0.5, n1 = noise(u*14,v2*14)*0.5
        const t = dune*0.7+n1*0.3
        const [cr,cg,cb] = samplePalette(v.colors, t); r8=cr; g8=cg; b8=cb
      } else if (v.type === 'toxic') {
        const n1 = noise(u*10,v2*10), n2 = noise(u*20+2,v2*20+1)*0.5
        const swirl = Math.sin(u*8+n1*4+time*0.02)*0.25+0.75
        const t = ((n1+n2)/1.5)*swirl
        const [cr,cg,cb] = samplePalette(v.colors, Math.max(0,Math.min(1,t))); r8=cr; g8=cg; b8=cb
      } else { // crystalline
        const angle = Math.atan2(dy,dx)/(Math.PI*2)+0.5
        const facet = Math.floor(angle*12)/12
        const n1 = noise(facet*20, Math.sqrt(dist2)/r*10)
        const [cr,cg,cb] = samplePalette(v.colors, n1); r8=cr; g8=cg; b8=cb
      }

      // Ice caps
      if (v.iceCapFraction && v.iceCapFraction > 0) {
        const poleDist = Math.abs(v2-0.5)*2, iceThresh = 1-v.iceCapFraction
        if (poleDist > iceThresh) {
          const iceBlend = Math.min(1,(poleDist-iceThresh)/0.12+noise(u*12,v2*12)*0.3-0.15)
          r8 += (235-r8)*iceBlend; g8 += (242-g8)*iceBlend; b8 += (255-b8)*iceBlend
        }
      }

      // Limb darkening
      const limbFactor = Math.pow(nz, 0.55); r8 *= limbFactor; g8 *= limbFactor; b8 *= limbFactor
      // Terminator shadow
      const diffuse = Math.max(0, nx*-0.52 + ny*-0.38 + nz*0.76)
      const lit = 0.08 + 0.92*Math.pow(diffuse, 0.7); r8 *= lit; g8 *= lit; b8 *= lit
      // Specular
      if (v.shininess > 0) {
        const hx=-0.52, hy=-0.38, hz=0.76+1, hLen=Math.sqrt(hx*hx+hy*hy+hz*hz)
        const specDot = Math.max(0, nx*(hx/hLen)+ny*(hy/hLen)+nz*(hz/hLen))
        const specular = Math.pow(specDot, 32+v.shininess*80)*v.shininess*180
        r8=Math.min(255,r8+specular); g8=Math.min(255,g8+specular); b8=Math.min(255,b8+specular*0.85)
      }
      // Atmo fringe
      const edgeFactor = 1-nz
      const [ar2,ag2,ab2] = parseColor(v.atmoColor)
      r8=Math.min(255,r8+ar2*edgeFactor*edgeFactor*gi*0.6)
      g8=Math.min(255,g8+ag2*edgeFactor*edgeFactor*gi*0.6)
      b8=Math.min(255,b8+ab2*edgeFactor*edgeFactor*gi*0.6)
      // Clouds
      if (v.cloudOpacity > 0) {
        const cloud1 = noise(u*8+time*0.01,v2*8), cloud2 = noise(u*16+3.3+time*0.007,v2*16+2.1)*0.5
        const cloudVal = (cloud1+cloud2)/1.5
        if (cloudVal > 0.52) {
          const cBlend = Math.min(1,(cloudVal-0.52)/0.22)*v.cloudOpacity*lit
          const [cr2,cg2,cb2] = parseColor(v.cloudColor)
          r8 += (cr2-r8)*cBlend; g8 += (cg2-g8)*cBlend; b8 += (cb2-b8)*cBlend
        }
      }

      const idx = (py*diameter+px)*4
      pixels[idx] = Math.round(Math.max(0,Math.min(255,r8)))
      pixels[idx+1] = Math.round(Math.max(0,Math.min(255,g8)))
      pixels[idx+2] = Math.round(Math.max(0,Math.min(255,b8)))
      pixels[idx+3] = a8
    }
  }
  ctx.putImageData(imgData, Math.round(cx-r), Math.round(cy-r))
  if (v.hasRings && v.ringColors) drawRings(ctx, cx, cy, r, v, 'front')

  // Rim glow
  const rimGrad = ctx.createRadialGradient(cx, cy, r*(1-v.atmoThickness*0.4), cx, cy, r*(1+v.atmoThickness*1.1))
  rimGrad.addColorStop(0, `rgba(${ar},${ag},${ab},0)`)
  rimGrad.addColorStop(0.55, `rgba(${ar},${ag},${ab},${gi*0.35})`)
  rimGrad.addColorStop(1, `rgba(${ar},${ag},${ab},0)`)
  ctx.fillStyle = rimGrad
  ctx.beginPath(); ctx.arc(cx, cy, r*(1+v.atmoThickness*1.1), 0, Math.PI*2); ctx.fill()
}

// ─── Ring System ─────────────────────────────────────────────────────────────

function drawRings(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, v: PlanetVisual, pass: 'behind'|'front') {
  const ringTilt = v.ringTilt ?? 0.42
  const innerR = r*1.28, outerR = r*2.15
  const segCount = 80, halfSeg = Math.PI/segCount
  ctx.save()

  for (let i = 0; i < segCount; i++) {
    const a0 = (i/segCount)*Math.PI*2, a1 = a0+halfSeg*2+0.01, aMid = (a0+a1)/2
    const isBehind = Math.sin(aMid) < 0
    if (pass === 'behind' && !isBehind) continue
    if (pass === 'front' && isBehind) continue

    const ringBands = [
      { t:0.0, w:0.20, opacity:0.55 }, { t:0.25, w:0.06, opacity:0.15 },
      { t:0.32, w:0.22, opacity:0.42 }, { t:0.60, w:0.18, opacity:0.28 },
      { t:0.85, w:0.15, opacity:0.18 },
    ]

    for (const band of ringBands) {
      const ri = innerR+(outerR-innerR)*band.t, ro = ri+(outerR-innerR)*band.w
      const rc = v.ringColors!
      const [rc1,gc1,bc1] = samplePalette(rc, band.t)
      const [rc2,gc2,bc2] = samplePalette(rc, band.t+band.w)
      const yScale = Math.sin(ringTilt)

      ctx.beginPath()
      for (let j = 0; j <= 16; j++) {
        const ang = a0+(j/16)*(a1-a0)
        const px2 = cx+Math.cos(ang)*ro, py2 = cy+Math.sin(ang)*ro*yScale
        if (j===0) ctx.moveTo(px2,py2); else ctx.lineTo(px2,py2)
      }
      for (let j = 16; j >= 0; j--) {
        const ang = a0+(j/16)*(a1-a0)
        ctx.lineTo(cx+Math.cos(ang)*ri, cy+Math.sin(ang)*ri*yScale)
      }
      ctx.closePath()

      const viewFade = Math.abs(Math.cos(aMid))*0.4+0.6
      const grad = ctx.createLinearGradient(cx-ro, cy, cx+ro, cy)
      grad.addColorStop(0, `rgba(${Math.round(rc1)},${Math.round(gc1)},${Math.round(bc1)},${band.opacity*viewFade*0.9})`)
      grad.addColorStop(1, `rgba(${Math.round(rc2)},${Math.round(gc2)},${Math.round(bc2)},${band.opacity*viewFade*0.6})`)
      ctx.fillStyle = grad; ctx.fill()
    }
  }
  ctx.restore()
}

// ─── Planet Button ───────────────────────────────────────────────────────────

function PlanetButton({ planet, cx, cy, time, isSelected, isHovered, onHoverStart, onHoverEnd, onClick }: {
  planet: PlanetConfig; cx: number; cy: number; time: number;
  isSelected: boolean; isHovered: boolean;
  onHoverStart: () => void; onHoverEnd: () => void; onClick: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const r = planet.visual.radius
  const seed = planet.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pad = Math.ceil(r * 2.4), S = pad * 2
    canvas.width = S; canvas.height = S
    ctx.clearRect(0, 0, S, S)
    drawPlanet(ctx, S / 2, S / 2, planet.visual, time, seed)

    if (isSelected || isHovered) {
      const ringR = r + (planet.visual.hasRings ? r * 1.1 : 8)
      const hColor = planet.accent.hud || planet.accent.text
      ctx.strokeStyle = hColor
      ctx.lineWidth = isSelected ? 1.5 : 1; ctx.globalAlpha = isSelected ? 0.85 : 0.55; ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.arc(S/2, S/2, ringR + 4, 0, Math.PI * 2); ctx.stroke()
      ctx.setLineDash([]); ctx.globalAlpha = isSelected ? 0.28 : 0.15
      ctx.beginPath(); ctx.arc(S/2, S/2, ringR + 10, 0, Math.PI * 2); ctx.stroke()
      ctx.globalAlpha = 1
    }
  }, [planet, r, time, isSelected, isHovered, seed])

  const pad = Math.ceil(r * 2.4), S = pad * 2
  const hud = planet.accent.hud || planet.accent.text
  const nameLabel = planet.title.split(':')[0].trim()

  return (
    <button
      className="planet-btn"
      style={{
        left: cx - S/2, top: cy - S/2, width: S, height: S,
        transition: 'filter 0.3s ease',
        filter: isHovered ? `drop-shadow(0 0 16px ${hud}88)` : 'none',
        pointerEvents: 'none'
      }}
      aria-label={`Open project: ${planet.title}`}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%', top: '50%',
          width: r * 2.4, height: r * 2.4,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          pointerEvents: 'auto',
          cursor: 'pointer',
          zIndex: 10
        }}
        onClick={onClick}
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
      />
      <canvas
        ref={canvasRef} width={S} height={S}
        style={{ width: S, height: S, pointerEvents: 'none' }} aria-hidden="true"
      />
      {/* Always-visible label below planet */}
      <div className="planet-label" style={{ bottom: -4, opacity: isSelected ? 0 : 1 }}>
        <span
          className="font-mono uppercase"
          style={{
            display: 'inline-block',
            fontSize: 8.5, letterSpacing: '0.16em',
            padding: '2px 6px', borderRadius: 2,
            color: isHovered ? hud : `${hud}aa`,
            background: isHovered ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)',
            border: `1px solid ${isHovered ? hud + '66' : hud + '22'}`,
            textShadow: isHovered ? `0 0 6px ${hud}` : 'none',
            transition: 'all 0.3s ease',
            opacity: 1,
          }}
        >
          {nameLabel}
        </span>
      </div>
    </button>
  )
}

// ─── Orbit Ring ──────────────────────────────────────────────────────────────

function OrbitRing({ orbit, accentColor, cx, cy }: { orbit: OrbitConfig; accentColor: string; cx: number; cy: number }) {
  return (
    <svg className="orbit-ring-svg" width="100%" height="100%" aria-hidden="true">
      <ellipse
        cx={cx} cy={cy} rx={orbit.rx} ry={orbit.ry}
        fill="none" stroke={accentColor} strokeWidth="0.6" strokeOpacity="0.2" strokeDasharray="3 8"
        transform={`rotate(${(orbit.tilt*180)/Math.PI}, ${cx}, ${cy})`}
      />
    </svg>
  )
}

// ─── Galaxy Nebula ───────────────────────────────────────────────────────────

function GalaxyNebula({ galaxyId }: { galaxyId: 'cyber' | 'software' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let W = 0, H = 0
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)
    const isCyber = galaxyId === 'cyber'
    let t = 0

    function draw() {
      t += 0.003; ctx!.clearRect(0, 0, W, H)
      const nebulaPositions = isCyber
        ? [
          { x:W*0.38,y:H*0.45,rx:W*0.38,ry:H*0.3,c1:'rgba(200,40,0,',c2:'rgba(255,80,20,',op:0.10 },
          { x:W*0.55,y:H*0.38,rx:W*0.25,ry:H*0.22,c1:'rgba(255,120,0,',c2:'rgba(200,60,20,',op:0.07 },
          { x:W*0.25,y:H*0.60,rx:W*0.20,ry:H*0.18,c1:'rgba(160,20,0,',c2:'rgba(255,50,10,',op:0.06 },
        ]
        : [
          { x:W*0.50,y:H*0.48,rx:W*0.35,ry:H*0.28,c1:'rgba(0,160,220,',c2:'rgba(0,210,255,',op:0.09 },
          { x:W*0.38,y:H*0.40,rx:W*0.22,ry:H*0.20,c1:'rgba(0,100,200,',c2:'rgba(60,180,255,',op:0.07 },
          { x:W*0.62,y:H*0.60,rx:W*0.18,ry:H*0.16,c1:'rgba(0,200,240,',c2:'rgba(80,140,255,',op:0.05 },
        ]

      for (const n of nebulaPositions) {
        const pulse = 1+Math.sin(t*0.7+n.x*0.001)*0.04
        const g = ctx!.createRadialGradient(n.x+Math.sin(t*0.4)*12, n.y+Math.cos(t*0.3)*8, 0, n.x, n.y, n.rx*pulse)
        g.addColorStop(0, n.c1+n.op*3+')'); g.addColorStop(0.4, n.c2+n.op*1.5+')'); g.addColorStop(1, 'transparent')
        ctx!.save(); ctx!.scale(1, n.ry/n.rx); ctx!.fillStyle = g
        ctx!.beginPath(); ctx!.arc(n.x, n.y*(n.rx/n.ry), n.rx*pulse, 0, Math.PI*2); ctx!.fill(); ctx!.restore()
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', resize) }
  }, [galaxyId])

  return <canvas ref={canvasRef} className="galaxy-nebula-canvas" aria-hidden="true" />
}

// ─── Main Galaxy Scene ───────────────────────────────────────────────────────

interface GalaxySceneProps {
  galaxyId: 'cyber' | 'software'
  projects: ProjectData[]
  onBack: () => void
  animState: 'entering' | 'idle' | 'leaving'
}

export function GalaxyScene({ galaxyId, projects, onBack, animState }: GalaxySceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 1200, h: 700 })
  const [time, setTime] = useState(0)
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null)
  const [hoveredPlanetId, setHoveredPlanetId] = useState<string | null>(null)
  const rafRef = useRef<number>(0)
  const lastRef = useRef(0)
  const timeAccumRef = useRef(0)

  const isCyber = galaxyId === 'cyber'
  const sectorLabel = isCyber ? 'SECTOR NYX' : 'SECTOR HELIOS'
  const accentColor = isCyber ? '#ff6030' : '#22d3ee'
  const accentColorSoft = isCyber ? 'rgba(255,96,48,0.35)' : 'rgba(34,211,238,0.35)'
  const sunColor = isCyber
    ? 'radial-gradient(circle, #fff6e0 0%, #ffaa40 25%, #ff5500 60%, #aa1500 100%)'
    : 'radial-gradient(circle, #e8f8ff 0%, #80d8ff 25%, #0088cc 60%, #003366 100%)'

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setDims({ w: el.clientWidth, h: el.clientHeight }))
    ro.observe(el); setDims({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    let prevTs = 0
    const tick = (ts: number) => {
      if (ts - lastRef.current > 16) {
        const dt = prevTs ? (ts - prevTs) * 0.001 : 0
        prevTs = ts
        lastRef.current = ts
        // Slow time advancement when hovering a planet (1/6 speed)
        const speed = hoveredPlanetId ? 0.15 : 1.0
        timeAccumRef.current += dt * speed
        setTime(timeAccumRef.current)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [hoveredPlanetId])

  const buildOrbits = useCallback((count: number, W: number, H: number): OrbitConfig[] => {
    const orbits: OrbitConfig[] = []
    if (count <= 3) {
      for (let i = 0; i < count; i++) {
        orbits.push({
          rx: Math.min(W,H)*0.28, ry: Math.min(W,H)*0.13, tilt: (-15*Math.PI)/180,
          speed: 0.10+i*0.03, offsetAngle: (i/count)*Math.PI*2,
        })
      }
    } else {
      const rings = [
        { rx:0.20,ry:0.095,tilt:-12,speed:0.14 },
        { rx:0.30,ry:0.138,tilt:-10,speed:0.09 },
        { rx:0.42,ry:0.190,tilt:-8,speed:0.065 },
      ]
      const perRing = [3,3,3]
      let idx = 0
      for (let ri = 0; ri < rings.length; ri++) {
        const r = rings[ri], n = perRing[ri]
        for (let i = 0; i < n && idx < count; i++, idx++) {
          orbits.push({
            rx: Math.min(W,H)*r.rx*(W/H > 1.6 ? 1.55 : 1.1),
            ry: Math.min(W,H)*r.ry*(W/H > 1.6 ? 1.55 : 1.1),
            tilt: (r.tilt*Math.PI)/180, speed: r.speed+i*0.01,
            offsetAngle: (i/n)*Math.PI*2+ri*0.7,
          })
        }
      }
    }
    return orbits
  }, [])

  const orbits = buildOrbits(projects.length, dims.w, dims.h)

  const planetConfigs: PlanetConfig[] = projects.map((p, i) => ({
    ...p,
    orbit: orbits[i] || orbits[0],
    size: p.visual?.radius ?? 20,
    visual: p.visual ?? {
      type: 'rocky' as const, radius: 20, tiltDeg: 0,
      colors: ['#222','#444','#666'], cloudOpacity: 0, cloudColor: 'rgba(255,255,255,0.8)',
      hasRings: false, atmoColor: 'rgba(100,100,200,1)', atmoThickness: 0.12,
      glowIntensity: 0.6, shininess: 0.3,
    },
  }))

  const cx = dims.w / 2, cy = dims.h / 2

  function getPlanetPos(p: PlanetConfig, t: number) {
    const angle = t * p.orbit.speed + p.orbit.offsetAngle
    const cosT = Math.cos(p.orbit.tilt), sinT = Math.sin(p.orbit.tilt)
    const lx = Math.cos(angle) * p.orbit.rx, ly = Math.sin(angle) * p.orbit.ry
    return { x: cx + lx*cosT - ly*sinT, y: cy + lx*sinT + ly*cosT }
  }

  const animClass = animState === 'entering' ? 'animate-warp-in' : animState === 'leaving' ? 'animate-warp-out' : ''

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${animClass}`} style={{ zIndex: 2 }}>
      <GalaxyNebula galaxyId={galaxyId} />

      {/* Orbit rings */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
        {planetConfigs.map((p) => <OrbitRing key={p.id+'-orbit'} orbit={p.orbit} accentColor={accentColor} cx={cx} cy={cy} />)}
      </div>

      {/* Central sun */}
      <div
        className="absolute pointer-events-none" style={{
          left: cx-28, top: cy-28, width: 56, height: 56, borderRadius: '50%',
          background: sunColor, zIndex: 4, filter: 'blur(0.5px)',
          boxShadow: isCyber
            ? '0 0 24px 8px rgba(255,80,0,0.55), 0 0 60px 20px rgba(200,40,0,0.3), 0 0 120px 40px rgba(160,20,0,0.15)'
            : '0 0 24px 8px rgba(0,180,255,0.55), 0 0 60px 20px rgba(0,120,220,0.3), 0 0 120px 40px rgba(0,60,160,0.15)',
        }}
        aria-hidden="true"
      />

      {/* Planets */}
      <div className="absolute inset-0" style={{ zIndex: 5 }}>
        {planetConfigs.map((p) => {
          const pos = getPlanetPos(p, time)
          return (
            <PlanetButton
              key={p.id} planet={p} cx={pos.x} cy={pos.y} time={time}
              isSelected={selectedProject?.id === p.id}
              isHovered={hoveredPlanetId === p.id}
              onHoverStart={() => setHoveredPlanetId(p.id)}
              onHoverEnd={() => setHoveredPlanetId(null)}
              onClick={() => setSelectedProject(selectedProject?.id === p.id ? null : p)}
            />
          )
        })}
      </div>

      {/* HUD overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 6 }}>
        <div className="absolute animate-sector-badge-in" style={{ top: 20, left: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="flex items-center gap-2">
            <div className="animate-glow-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor, boxShadow: `0 0 8px 2px ${accentColor}` }} />
            <span className="font-mono text-xs font-bold uppercase" style={{ letterSpacing: '0.28em', color: accentColor }}>{sectorLabel}</span>
          </div>
          <span className="font-mono text-10 uppercase ml-4" style={{ letterSpacing: '0.16em', color: 'rgba(255,255,255,0.40)' }}>
            {projects.length} Planetary Bodies Charted
          </span>
        </div>

        <div className="absolute flex flex-col items-end" style={{ top: 20, right: 24, gap: 2 }}>
          <span className="font-mono text-9 uppercase" style={{ letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)' }}>
            {isCyber ? "RA 04h 35m // DEC -05° 27'" : "RA 18h 12m // DEC +22° 14'"}
          </span>
          <span className="font-mono text-9 uppercase animate-coords-tick" style={{ letterSpacing: '0.18em', color: accentColor + '66' }}>
            ORBIT TRACKING ACTIVE
          </span>
        </div>

        {/* Corner ticks */}
        {(['tl','tr','bl','br'] as const).map((corner) => (
          <svg
            key={corner} className="absolute" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"
            style={{
              top: corner.startsWith('t') ? 16 : undefined, bottom: corner.startsWith('b') ? 16 : undefined,
              left: corner.endsWith('l') ? 16 : undefined, right: corner.endsWith('r') ? 16 : undefined,
            }}
          >
            <path
              d={corner==='tl'?'M12 2 H2 V12':corner==='tr'?'M12 2 H22 V12':corner==='bl'?'M12 22 H2 V12':'M12 22 H22 V12'}
              fill="none" stroke={accentColor} strokeWidth="1.2" strokeOpacity="0.5"
            />
          </svg>
        ))}
      </div>

      {/* Back button */}
      <button
        className="absolute pointer-events-auto focus-outline"
        style={{ bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}
        onClick={onBack} aria-label="Return to galaxy overview"
      >
        <div
          className="flex items-center gap-2 font-mono uppercase transition-all"
          style={{
            padding: '8px 16px', fontSize: 10, letterSpacing: '0.26em', borderRadius: 2,
            color: accentColor, border: `1px solid ${accentColorSoft}`,
            background: 'rgba(0,0,0,0.55)', boxShadow: `0 0 0 0 ${accentColor}`,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 16px 2px ${accentColor}44`; e.currentTarget.style.borderColor = accentColor }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = accentColorSoft }}
        >
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
            <path d="M12 4H0M3 1L0 4l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Return to Overview
        </div>
      </button>

      {/* Project card overlay */}
      {selectedProject && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 30, pointerEvents: 'all' }}>
          <ProjectCard project={selectedProject} onClose={() => setSelectedProject(null)} />
        </div>
      )}
    </div>
  )
}
