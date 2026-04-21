// ─── Core Data Types ─────────────────────────────────────────────────────────

export interface ProjectSpecs {
  infra: string
  domain: string
  framework: string
  hardware: string
}

export interface ProjectAccent {
  border: string
  glow: string
  glowSoft: string
  text: string
  textMuted: string
  badgeBg: string
  badgeBorder: string
  tagBg: string
  tagBorder: string
  tagText: string
  highlight: string
  hud: string
}

export interface ProjectData {
  id: string
  title: string
  subtitle: string
  category: string
  description: string
  tags: string[]
  mediumUrl?: string
  statusLabel?: string
  efficiency?: number
  specs?: ProjectSpecs
  accent: ProjectAccent
  icon?: React.ReactNode
  stats?: { label: string; value: string }[]
  planetGradient: string
  planetAtmo: string
  visual?: PlanetVisual
}

// ─── Planet Visual Descriptor ────────────────────────────────────────────────

export type PlanetType =
  | 'gas-giant'
  | 'rocky'
  | 'ocean'
  | 'ice'
  | 'lava'
  | 'desert'
  | 'toxic'
  | 'crystalline'

export interface PlanetVisual {
  type: PlanetType
  radius: number
  tiltDeg: number
  colors: string[]
  cloudOpacity: number
  cloudColor: string
  hasRings: boolean
  ringColors?: string[]
  ringTilt?: number
  atmoColor: string
  atmoThickness: number
  stormSpots?: Array<{ u: number; v: number; size: number; color: string }>
  craterCount?: number
  iceCapFraction?: number
  glowIntensity: number
  shininess: number
}

// ─── Orbit Configuration ─────────────────────────────────────────────────────

export interface OrbitConfig {
  rx: number
  ry: number
  tilt: number
  speed: number
  offsetAngle: number
}

export interface PlanetConfig extends ProjectData {
  orbit: OrbitConfig
  size: number
  visual: PlanetVisual
}
