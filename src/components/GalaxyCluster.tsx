import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface GalaxyClusterProps {
  id: 'cyber' | 'software'
  position: [number, number, number]
  onClick: () => void
  isActive: boolean
}

/**
 * Two visually DISTINCT galaxy shapes — no drei Html dependency.
 * Labels rendered via DOM overlay HUD instead.
 */
export function GalaxyCluster({ id, position, onClick, isActive }: GalaxyClusterProps) {
  const spiralRef = useRef<THREE.Points>(null)
  const dustRef = useRef<THREE.Points>(null)

  const isCyber = id === 'cyber'
  const coreColor = isCyber ? '#ff6030' : '#22d3ee'

  // ─── CYBER: Large 3-arm barred spiral ──────────────────────────────────
  const cyberGeometry = useMemo(() => {
    if (!isCyber) return null
    const count = 900
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    let idx = 0

    // Dense core bulge
    for (let i = 0; i < 200 && idx < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = Math.pow(Math.random(), 0.6) * 2.0
      positions[idx*3] = r * Math.sin(phi) * Math.cos(theta)
      positions[idx*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.25
      positions[idx*3+2] = r * Math.cos(phi)
      const brightness = 0.7 + Math.random() * 0.3
      colors[idx*3] = 1.0 * brightness
      colors[idx*3+1] = 0.75 * brightness
      colors[idx*3+2] = 0.45 * brightness
      idx++
    }

    // Central bar
    for (let i = 0; i < 100 && idx < count; i++) {
      const t = (Math.random() - 0.5) * 2
      positions[idx*3] = t * 3.0 + (Math.random()-0.5) * 0.5
      positions[idx*3+1] = (Math.random()-0.5) * 0.3
      positions[idx*3+2] = (Math.random()-0.5) * 0.8
      colors[idx*3] = 1.0
      colors[idx*3+1] = 0.6 + Math.random()*0.3
      colors[idx*3+2] = 0.3
      idx++
    }

    // 3 spiral arms
    const armCount = 3
    for (let a = 0; a < armCount; a++) {
      for (let i = 0; i < 200 && idx < count; i++) {
        const t = i / 200
        const angle = (a * Math.PI * 2) / armCount + t * Math.PI * 3.2 + (Math.random() - 0.5) * 0.35
        const dist = 2.5 + t * 6.5
        const scatter = (1 - t * 0.3) * 1.2 * Math.random()

        positions[idx*3] = Math.cos(angle) * (dist + scatter * 0.5)
        positions[idx*3+1] = (Math.random() - 0.5) * 0.4 * (1 - t*0.5)
        positions[idx*3+2] = Math.sin(angle) * (dist + scatter * 0.5)

        const fadeT = t * 0.8
        colors[idx*3] = 1.0 - fadeT * 0.3
        colors[idx*3+1] = 0.55 - fadeT * 0.2 + Math.random() * 0.1
        colors[idx*3+2] = 0.25 - fadeT * 0.15
        idx++
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions.slice(0, idx*3), 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors.slice(0, idx*3), 3))
    return geo
  }, [isCyber])

  // ─── SOFTWARE: Compact elliptical globular cluster ─────────────────────
  const softwareGeometry = useMemo(() => {
    if (isCyber) return null
    const count = 420
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 0.5) * 4.0
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i*3] = r * Math.sin(phi) * Math.cos(theta) * 1.3
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.45
      positions[i*3+2] = r * Math.cos(phi) * 0.9

      const distNorm = Math.sqrt(positions[i*3]**2 + positions[i*3+1]**2 + positions[i*3+2]**2) / 5
      const hot = Math.random() > 0.85
      if (hot) {
        colors[i*3] = 0.9; colors[i*3+1] = 0.95; colors[i*3+2] = 1.0
      } else {
        colors[i*3] = 0.3 + (1 - distNorm) * 0.5
        colors[i*3+1] = 0.6 + (1 - distNorm) * 0.35
        colors[i*3+2] = 0.85 + (1 - distNorm) * 0.15
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return geo
  }, [isCyber])

  // ─── Dust cloud ────────────────────────────────────────────────────────
  const dustGeometry = useMemo(() => {
    const count = isCyber ? 300 : 150
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const spread = isCyber ? 10 : 5

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = Math.pow(Math.random(), 0.4) * spread

      positions[i*3] = r * Math.sin(phi) * Math.cos(theta) * (isCyber ? 1.0 : 1.3)
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.15
      positions[i*3+2] = r * Math.cos(phi) * (isCyber ? 1.0 : 0.9)

      const c = isCyber ? [0.5, 0.15, 0.05] : [0.1, 0.3, 0.5]
      colors[i*3] = c[0]; colors[i*3+1] = c[1]; colors[i*3+2] = c[2]
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return geo
  }, [isCyber])

  const activeGeo = isCyber ? cyberGeometry : softwareGeometry

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (spiralRef.current) spiralRef.current.rotation.y = t * (isCyber ? 0.04 : 0.08)
    if (dustRef.current) dustRef.current.rotation.y = t * (isCyber ? 0.025 : 0.05)
  })

  return (
    <group position={position}>
      {/* Main star body */}
      {activeGeo && (
        <points ref={spiralRef} geometry={activeGeo}>
          <pointsMaterial
            vertexColors
            size={isCyber ? 0.13 : 0.11}
            sizeAttenuation
            transparent
            opacity={0.88}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      {/* Dust volume */}
      <points ref={dustRef} geometry={dustGeometry}>
        <pointsMaterial
          vertexColors
          size={isCyber ? 0.6 : 0.45}
          sizeAttenuation
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Glowing core */}
      <mesh>
        <sphereGeometry args={[isCyber ? 0.7 : 0.5, 16, 16]} />
        <meshBasicMaterial color={coreColor} transparent opacity={0.95} />
      </mesh>
      <mesh>
        <sphereGeometry args={[isCyber ? 2.2 : 1.4, 16, 16]} />
        <meshBasicMaterial color={coreColor} transparent opacity={0.15}
          side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[isCyber ? 4.5 : 2.5, 16, 16]} />
        <meshBasicMaterial color={coreColor} transparent opacity={0.04}
          side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Invisible click target */}
      {!isActive && (
        <mesh
          onClick={(e) => { e.stopPropagation(); onClick() }}
          onPointerOver={() => { document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { document.body.style.cursor = 'auto' }}
        >
          <sphereGeometry args={[isCyber ? 9 : 6, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}
