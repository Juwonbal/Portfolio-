// ─── Seeded PRNG ─────────────────────────────────────────────────────────────

export function makePRNG(seed: number) {
  let s = seed | 0
  return () => {
    s = Math.imul(s ^ (s >>> 15), s | 1)
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61)
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296
  }
}

// ─── Color Utilities ─────────────────────────────────────────────────────────

export function parseColor(c: string): [number, number, number, number] {
  if (c.startsWith('#')) {
    const h = c.slice(1)
    if (h.length === 3)
      return [parseInt(h[0]+h[0],16), parseInt(h[1]+h[1],16), parseInt(h[2]+h[2],16), 255]
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16), 255]
  }
  const m = c.match(/[\d.]+/g)
  if (!m) return [128,128,128,255]
  return [
    parseFloat(m[0]),
    parseFloat(m[1]),
    parseFloat(m[2]),
    m[3] !== undefined ? Math.round(parseFloat(m[3])*255) : 255,
  ]
}

export function lerpColor(
  a: [number,number,number,number],
  b: [number,number,number,number],
  t: number,
): [number,number,number,number] {
  return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t, a[3]+(b[3]-a[3])*t]
}

export function samplePalette(colors: string[], t: number): [number,number,number,number] {
  const parsed = colors.map(parseColor)
  const seg = t * (parsed.length - 1)
  const lo = Math.floor(seg)
  const hi = Math.min(lo + 1, parsed.length - 1)
  return lerpColor(parsed[lo], parsed[hi], seg - lo)
}

// ─── Smooth Value Noise ──────────────────────────────────────────────────────

export function smoothNoise(rng: () => number, tableSize: number) {
  const table = Array.from({ length: tableSize }, () => rng())
  return (x: number, y: number) => {
    const xi = Math.floor(x) % tableSize
    const yi = Math.floor(y) % tableSize
    const xf = x - Math.floor(x)
    const yf = y - Math.floor(y)
    const x1 = (xi + 1) % tableSize
    const y1 = (yi + 1) % tableSize
    const v00 = table[(xi*57+yi) % tableSize]
    const v10 = table[(x1*57+yi) % tableSize]
    const v01 = table[(xi*57+y1) % tableSize]
    const v11 = table[(x1*57+y1) % tableSize]
    const ux = xf*xf*(3-2*xf)
    const uy = yf*yf*(3-2*yf)
    return v00*(1-ux)*(1-uy) + v10*ux*(1-uy) + v01*(1-ux)*uy + v11*ux*uy
  }
}
