import { useRef, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Planet } from './Planet'
import type { ProjectData } from '@/data/types'

interface SolarSystemProps {
  galaxyId: 'cyber' | 'software'
  /** Center position in world space */
  center: [number, number, number]
  projects: ProjectData[]
  selectedPlanetId: string | null
  onPlanetClick: (project: ProjectData, worldPos: THREE.Vector3) => void
}

/**
 * A 3D solar system: central sun + orbiting planets.
 * Planets orbit in 3D ellipses using useFrame.
 * Exposes world positions for camera targeting.
 */
export function SolarSystem({
  galaxyId,
  center,
  projects,
  selectedPlanetId,
  onPlanetClick,
}: SolarSystemProps) {
  const isCyber = galaxyId === 'cyber'
  const sunColor = isCyber ? '#ff7733' : '#44bbff'
  const accentColor = isCyber ? '#ff6030' : '#22d3ee'

  // Build orbit configurations
  const orbits = useMemo(() => {
    const count = projects.length
    if (count <= 3) {
      return projects.map((_, i) => ({
        rx: 5 + i * 3.5,
        ry: 4 + i * 2.8,
        rz: 0,
        tilt: -10 * (Math.PI / 180),
        speed: 0.18 - i * 0.04,
        offsetAngle: (i / count) * Math.PI * 2,
      }))
    }

    // Multi-ring layout for 4+ planets
    const rings = [
      { rx: 5.5,  ry: 4.5,  tilt: -8,  speed: 0.20 },
      { rx: 9.0,  ry: 7.0,  tilt: -12, speed: 0.12 },
      { rx: 13.5, ry: 10.5, tilt: -6,  speed: 0.07 },
      { rx: 18.0, ry: 14.0, tilt: -10, speed: 0.045 },
    ]

    return projects.map((_, i) => {
      const ringIdx = Math.min(Math.floor(i / 3), rings.length - 1)
      const r = rings[ringIdx]
      const posInRing = i % 3
      return {
        rx: r.rx + posInRing * 0.8,
        ry: r.ry + posInRing * 0.6,
        rz: 0,
        tilt: (r.tilt + posInRing * 3) * (Math.PI / 180),
        speed: r.speed - posInRing * 0.015,
        offsetAngle: (posInRing / 3) * Math.PI * 2 + ringIdx * 0.9,
      }
    })
  }, [projects])

  // Refs for each planet's group position (updated each frame)
  const planetGroupRefs = useRef<(THREE.Group | null)[]>([])

  // Update orbital positions each frame
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    orbits.forEach((orbit, i) => {
      const ref = planetGroupRefs.current[i]
      if (!ref) return
      const angle = t * orbit.speed + orbit.offsetAngle
      const cosT = Math.cos(orbit.tilt)
      const sinT = Math.sin(orbit.tilt)
      const lx = Math.cos(angle) * orbit.rx
      const ly = Math.sin(angle) * orbit.ry
      ref.position.set(
        lx * cosT - ly * sinT,
        lx * sinT + ly * cosT,
        Math.sin(angle) * orbit.ry * 0.3,
      )
    })
  })

  const handlePlanetClick = useCallback(
    (project: ProjectData, idx: number) => {
      const ref = planetGroupRefs.current[idx]
      if (!ref) return
      const worldPos = new THREE.Vector3()
      ref.getWorldPosition(worldPos)
      onPlanetClick(project, worldPos)
    },
    [onPlanetClick],
  )

  // Compute planet 3D radius from visual pixel radius
  const planetWorldRadius = useCallback((pixelRadius: number) => {
    return Math.max(0.25, pixelRadius / 30)
  }, [])

  return (
    <group position={center}>
      {/* Central sun — emissive sphere + point light */}
      <mesh>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial color={sunColor} />
      </mesh>

      {/* Sun glow layers */}
      <mesh>
        <sphereGeometry args={[2.0, 16, 16]} />
        <meshBasicMaterial
          color={sunColor}
          transparent
          opacity={0.25}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[3.5, 16, 16]} />
        <meshBasicMaterial
          color={sunColor}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Point light from sun */}
      <pointLight
        color={sunColor}
        intensity={isCyber ? 30 : 25}
        distance={50}
        decay={2}
      />

      {/* Orbit rings (visual only) */}
      {orbits.map((orbit, i) => (
        <OrbitRing key={`orbit-${i}`} orbit={orbit} color={accentColor} />
      ))}

      {/* Planets */}
      {projects.map((project, i) => {
        const visual = project.visual
        if (!visual) return null
        return (
          <group
            key={project.id}
            ref={(el) => { planetGroupRefs.current[i] = el }}
          >
            <Planet
              id={project.id}
              title={project.title}
              visual={visual}
              worldRadius={planetWorldRadius(visual.radius)}
              accentColor={accentColor}
              isSelected={selectedPlanetId === project.id}
              onClick={() => handlePlanetClick(project, i)}
            />
          </group>
        )
      })}
    </group>
  )
}

// ─── Orbit Ring ──────────────────────────────────────────────────────────────

interface OrbitRingProps {
  orbit: { rx: number; ry: number; tilt: number }
  color: string
}

function OrbitRing({ orbit, color }: OrbitRingProps) {
  const lineObj = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const segments = 128
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const cosT = Math.cos(orbit.tilt)
      const sinT = Math.sin(orbit.tilt)
      const lx = Math.cos(angle) * orbit.rx
      const ly = Math.sin(angle) * orbit.ry
      pts.push(new THREE.Vector3(
        lx * cosT - ly * sinT,
        lx * sinT + ly * cosT,
        Math.sin(angle) * orbit.ry * 0.3,
      ))
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return new THREE.Line(geo, mat)
  }, [orbit, color])

  return <primitive object={lineObj} />
}
