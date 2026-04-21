import * as THREE from 'three'
import { makePRNG, smoothNoise, samplePalette, parseColor } from './noise'
import type { PlanetVisual } from '@/data/types'

/**
 * Generates a HIGH-DETAIL equirectangular CanvasTexture for a planet.
 * Uses multi-octave fractal noise for rich surface patterns.
 * Three.js handles all 3D lighting on GPU — we only output albedo.
 */
export function generatePlanetTexture(
  visual: PlanetVisual,
  seed: number,
  resolution = 1024,
): THREE.CanvasTexture {
  const W = resolution
  const H = resolution / 2
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const imgData = ctx.createImageData(W, H)
  const pixels = imgData.data

  const rng = makePRNG(seed)
  const noise1 = smoothNoise(rng, 64)
  const noise2 = smoothNoise(makePRNG(seed + 101), 64)
  const noise3 = smoothNoise(makePRNG(seed + 202), 64)

  /** Multi-octave fractal noise for richer detail */
  const fbm = (x: number, y: number, octaves = 5) => {
    let val = 0, amp = 0.5, freq = 1, max = 0
    for (let o = 0; o < octaves; o++) {
      val += noise1(x * freq, y * freq) * amp
      max += amp
      amp *= 0.5
      freq *= 2.1
    }
    return val / max
  }

  /** Domain-warped noise for organic turbulence */
  const warpedNoise = (x: number, y: number, strength = 2.0) => {
    const wx = x + noise2(x * 4, y * 4) * strength
    const wy = y + noise3(x * 4 + 2.1, y * 4 + 1.3) * strength
    return fbm(wx, wy, 4)
  }

  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const u = px / W
      const v = py / H
      const lat = (v - 0.5) * Math.PI

      let r8 = 128, g8 = 128, b8 = 128

      if (visual.type === 'gas-giant') {
        // Multi-band structure with domain warping
        const bandFreq = 8 + (seed % 5)
        const warp = warpedNoise(u * 3, v * 6, 1.5)
        const bandVal = Math.sin(lat * bandFreq + warp * 2.5)
        const t = (bandVal + 1) / 2

        // Secondary fine banding for richness
        const fineBand = Math.sin(lat * bandFreq * 3.7 + noise1(u * 20, v * 20) * 1.5) * 0.15
        const compositeT = Math.max(0, Math.min(1, t + fineBand))

        const [cr, cg, cb] = samplePalette(visual.colors, compositeT)
        r8 = cr; g8 = cg; b8 = cb

        // Turbulent eddies between bands
        const eddy = noise2(u * 25 + v * 5, v * 25) * 0.08
        r8 = Math.min(255, r8 + eddy * 80)
        g8 = Math.min(255, g8 + eddy * 40)

        // Storm spots
        if (visual.stormSpots) {
          for (const s of visual.stormSpots) {
            const du = Math.min(Math.abs(u - s.u), 1 - Math.abs(u - s.u)) * 3
            const dv = (v - s.v) * 4
            const d = Math.sqrt(du * du + dv * dv)
            if (d < s.size * 1.5) {
              const blend = Math.pow(1 - d / (s.size * 1.5), 2)
              const swirl = noise1(u * 40 + d * 10, v * 40) * 0.5
              const [sr, sg, sb] = parseColor(s.color)
              r8 += (sr - r8) * blend * 0.85 * (1 + swirl)
              g8 += (sg - g8) * blend * 0.85 * (1 + swirl)
              b8 += (sb - b8) * blend * 0.85 * (1 + swirl)
            }
          }
        }
      } else if (visual.type === 'rocky') {
        // Multi-octave terrain with elevation coloring
        const elevation = fbm(u * 14, v * 14, 6)
        const detail = fbm(u * 40 + 3.1, v * 40 + 2.7, 4) * 0.3
        const slope = Math.abs(elevation - fbm(u * 14 + 0.01, v * 14, 6)) * 50
        const n = Math.max(0, Math.min(1, elevation + detail))
        const [cr, cg, cb] = samplePalette(visual.colors, n)
        r8 = cr; g8 = cg; b8 = cb

        // Slope shading for surface roughness feel
        r8 = Math.max(0, r8 - slope * 15)
        g8 = Math.max(0, g8 - slope * 15)
        b8 = Math.max(0, b8 - slope * 15)

        // Craters with rims
        if (visual.craterCount) {
          const craterRNG = makePRNG(seed + 99)
          for (let ci = 0; ci < visual.craterCount; ci++) {
            const cu = craterRNG(), cv = craterRNG(), csz = 0.02 + craterRNG() * 0.05
            const du = Math.min(Math.abs(u - cu), 1 - Math.abs(u - cu)) * 2
            const dv = (v - cv) * 2
            const d = Math.sqrt(du * du + dv * dv)
            if (d < csz) {
              const rim = d / csz
              if (rim > 0.75) {
                // Bright rim
                const rimBlend = (rim - 0.75) / 0.25
                r8 = Math.min(255, r8 + 30 * rimBlend)
                g8 = Math.min(255, g8 + 25 * rimBlend)
                b8 = Math.min(255, b8 + 20 * rimBlend)
              } else {
                // Dark interior with depth
                const depth = Math.pow(1 - rim / 0.75, 0.8)
                r8 = Math.max(0, r8 - depth * 60)
                g8 = Math.max(0, g8 - depth * 55)
                b8 = Math.max(0, b8 - depth * 50)
              }
            }
          }
        }
      } else if (visual.type === 'ocean') {
        const landMask = fbm(u * 7 + 7.1, v * 7 + 3.4, 5)
        const isLand = landMask > 0.55
        const wave = warpedNoise(u * 12, v * 12, 1.5)

        if (isLand) {
          const elevation = (landMask - 0.55) / 0.45
          const terrainDetail = fbm(u * 30, v * 30, 4) * 0.2
          const t = Math.min(1, 0.6 + elevation * 0.4 + terrainDetail)
          const [cr, cg, cb] = samplePalette(visual.colors, t)
          r8 = cr; g8 = cg; b8 = cb
          // Beach transition
          if (elevation < 0.08) {
            const beachT = elevation / 0.08
            r8 = r8 + (200 - r8) * (1 - beachT) * 0.5
            g8 = g8 + (180 - g8) * (1 - beachT) * 0.5
            b8 = b8 + (130 - b8) * (1 - beachT) * 0.5
          }
        } else {
          // Ocean with depth shading
          const depth = (0.55 - landMask) / 0.55
          const t = Math.min(0.5, wave * 0.3 + depth * 0.15)
          const [cr, cg, cb] = samplePalette(visual.colors, t)
          r8 = cr; g8 = cg; b8 = cb
          // Specular wave highlights
          const specular = Math.pow(Math.max(0, wave - 0.6) / 0.4, 3)
          r8 = Math.min(255, r8 + specular * 40)
          g8 = Math.min(255, g8 + specular * 50)
          b8 = Math.min(255, b8 + specular * 60)
        }
      } else if (visual.type === 'lava') {
        const rock = fbm(u * 12, v * 12, 5)
        const fissure = warpedNoise(u * 8, v * 8, 3.0)
        const heat = Math.pow(Math.max(0, fissure - 0.4) / 0.6, 1.5)

        const darkPalette = visual.colors.slice(0, Math.ceil(visual.colors.length * 0.5))
        const hotPalette = visual.colors.slice(Math.floor(visual.colors.length * 0.5))
        const [dr, dg, db] = samplePalette(darkPalette, rock)
        const [hr, hg, hb] = samplePalette(hotPalette, Math.min(1, heat * 2))

        r8 = dr + (hr - dr) * heat * 1.6
        g8 = dg + (hg - dg) * heat * 1.6
        b8 = db + (hb - db) * heat * 1.6
        r8 = Math.min(255, Math.max(0, r8))
        g8 = Math.min(255, Math.max(0, g8))
        b8 = Math.min(255, Math.max(0, b8))
      } else if (visual.type === 'ice') {
        const glacier = fbm(u * 8, v * 8, 5)
        const crevasse = fbm(u * 35, v * 35, 3)
        const ridges = Math.abs(Math.sin(u * 30 + glacier * 6)) * 0.2

        const t = Math.max(0, Math.min(1, glacier * 0.7 + ridges))
        const [cr, cg, cb] = samplePalette(visual.colors, t)
        r8 = cr; g8 = cg; b8 = cb

        // Deep crevasses
        if (crevasse < 0.3) {
          const depth = (0.3 - crevasse) / 0.3
          r8 = Math.max(0, r8 - depth * 50)
          g8 = Math.max(0, g8 - depth * 35)
          b8 = Math.min(255, b8 + depth * 20)
        }
        // Surface frost sparkle
        if (crevasse > 0.75) {
          const sparkle = (crevasse - 0.75) / 0.25
          r8 = Math.min(255, r8 + sparkle * 40)
          g8 = Math.min(255, g8 + sparkle * 45)
          b8 = Math.min(255, b8 + sparkle * 50)
        }
      } else if (visual.type === 'desert') {
        const dune = Math.sin(u * 25 + warpedNoise(v * 5, u * 4, 2.0) * 4) * 0.5 + 0.5
        const windBlown = fbm(u * 18, v * 18, 4)
        const rockOutcrop = fbm(u * 30 + 5, v * 30 + 5, 3)

        let t = dune * 0.5 + windBlown * 0.35 + rockOutcrop * 0.15
        // Rocky outcrops
        if (rockOutcrop > 0.7) {
          t = Math.min(1, t + (rockOutcrop - 0.7) * 2)
        }
        const [cr, cg, cb] = samplePalette(visual.colors, Math.max(0, Math.min(1, t)))
        r8 = cr; g8 = cg; b8 = cb
      } else if (visual.type === 'toxic') {
        const swirl = warpedNoise(u * 5, v * 5, 4.0)
        const bubbles = fbm(u * 22, v * 22, 4)
        const flow = Math.sin(u * 10 + swirl * 6) * 0.2 + 0.5

        const t = Math.max(0, Math.min(1, swirl * 0.5 + flow * 0.3 + bubbles * 0.2))
        const [cr, cg, cb] = samplePalette(visual.colors, t)
        r8 = cr; g8 = cg; b8 = cb

        // Toxic bubbling pools
        if (bubbles > 0.72) {
          const poolBright = (bubbles - 0.72) / 0.28
          r8 = Math.min(255, r8 + poolBright * 60)
          g8 = Math.min(255, g8 + poolBright * 80)
          b8 = Math.max(0, b8 - poolBright * 20)
        }
      } else {
        // Crystalline — angular geometric facets
        const facetCount = 14
        const facet = Math.floor(u * facetCount) / facetCount
        const facetV = Math.floor(v * (facetCount / 2)) / (facetCount / 2)
        const angleNoise = fbm(facet * 20 + facetV * 20, facetV * 10, 3)
        const sparkle = Math.pow(noise1(u * 80, v * 80), 4) * 0.5

        const [cr, cg, cb] = samplePalette(visual.colors, angleNoise)
        r8 = Math.min(255, cr + sparkle * 120)
        g8 = Math.min(255, cg + sparkle * 130)
        b8 = Math.min(255, cb + sparkle * 140)

        // Facet edges (darker lines)
        const edgeU = Math.abs((u * facetCount) % 1 - 0.5) * 2
        const edgeV = Math.abs((v * facetCount / 2) % 1 - 0.5) * 2
        if (edgeU > 0.92 || edgeV > 0.92) {
          r8 *= 0.5; g8 *= 0.5; b8 *= 0.5
        }
      }

      // Ice caps
      if (visual.iceCapFraction && visual.iceCapFraction > 0) {
        const poleDist = Math.abs(v - 0.5) * 2
        const iceThresh = 1 - visual.iceCapFraction
        if (poleDist > iceThresh) {
          const noiseMod = noise1(u * 16, v * 16) * 0.08 - 0.04
          const iceBlend = Math.min(1, (poleDist - iceThresh + noiseMod) / 0.15)
          r8 += (235 - r8) * iceBlend
          g8 += (242 - g8) * iceBlend
          b8 += (255 - b8) * iceBlend
        }
      }

      // Cloud layer baked with turbulence
      if (visual.cloudOpacity > 0) {
        const cloud = warpedNoise(u * 6 + 0.5, v * 6, 2.0)
        if (cloud > 0.48) {
          const cBlend = Math.min(1, (cloud - 0.48) / 0.25) * visual.cloudOpacity
          const [cr, cg, cb] = parseColor(visual.cloudColor)
          r8 += (cr - r8) * cBlend
          g8 += (cg - g8) * cBlend
          b8 += (cb - b8) * cBlend
        }
      }

      const idx = (py * W + px) * 4
      pixels[idx]     = Math.round(Math.max(0, Math.min(255, r8)))
      pixels[idx + 1] = Math.round(Math.max(0, Math.min(255, g8)))
      pixels[idx + 2] = Math.round(Math.max(0, Math.min(255, b8)))
      pixels[idx + 3] = 255
    }
  }

  ctx.putImageData(imgData, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

/**
 * Generates an emissive map for planets with glowing features (lava, crystalline).
 */
export function generateEmissiveMap(
  visual: PlanetVisual,
  seed: number,
  resolution = 512,
): THREE.CanvasTexture | null {
  if (visual.type !== 'lava' && visual.type !== 'crystalline') return null

  const W = resolution
  const H = resolution / 2
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  const imgData = ctx.createImageData(W, H)
  const pixels = imgData.data
  const rng = makePRNG(seed + 500)
  const noise = smoothNoise(rng, 64)
  const noise2 = smoothNoise(makePRNG(seed + 600), 64)

  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const u = px / W, v = py / H
      let brightness = 0

      if (visual.type === 'lava') {
        const wx = u + noise2(u * 4, v * 4) * 2
        const wy = v + noise(u * 4 + 2.1, v * 4 + 1.3) * 2
        const fissure = noise(wx * 8, wy * 8)
        brightness = Math.pow(Math.max(0, fissure - 0.38) / 0.62, 1.5)
      } else {
        const n = noise(u * 20, v * 10)
        const sparkle = Math.pow(noise2(u * 80, v * 80), 5)
        brightness = (n > 0.55 ? (n - 0.55) / 0.45 : 0) * 0.6 + sparkle * 0.4
      }

      const [cr, cg, cb] = parseColor(visual.atmoColor)
      const idx = (py * W + px) * 4
      pixels[idx]     = Math.round(Math.min(255, cr * brightness * 1.2))
      pixels[idx + 1] = Math.round(Math.min(255, cg * brightness * 1.2))
      pixels[idx + 2] = Math.round(Math.min(255, cb * brightness * 1.2))
      pixels[idx + 3] = 255
    }
  }

  ctx.putImageData(imgData, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * Generates a bump/height map for surface detail under lighting.
 */
export function generateBumpMap(
  visual: PlanetVisual,
  seed: number,
  resolution = 512,
): THREE.CanvasTexture {
  const W = resolution
  const H = resolution / 2
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  const imgData = ctx.createImageData(W, H)
  const pixels = imgData.data
  const noise = smoothNoise(makePRNG(seed + 333), 64)
  const noise2 = smoothNoise(makePRNG(seed + 444), 64)

  const heightScale = visual.type === 'gas-giant' ? 0.3
    : visual.type === 'ocean' ? 0.5
    : visual.type === 'ice' ? 0.6
    : visual.type === 'lava' ? 0.8
    : 1.0

  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const u = px / W, v = py / H
      let h = 0

      h += noise(u * 12, v * 12) * 0.5
      h += noise2(u * 24, v * 24) * 0.3
      h += noise(u * 48 + 1.5, v * 48 + 1.5) * 0.2

      const gray = Math.round(Math.max(0, Math.min(255, h * 255 * heightScale)))
      const idx = (py * W + px) * 4
      pixels[idx] = gray; pixels[idx + 1] = gray; pixels[idx + 2] = gray; pixels[idx + 3] = 255
    }
  }

  ctx.putImageData(imgData, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}
