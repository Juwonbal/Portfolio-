import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { generatePlanetTexture, generateEmissiveMap, generateBumpMap } from '@/utils/planetTexture'
import type { PlanetVisual } from '@/data/types'
import { parseColor } from '@/utils/noise'

interface PlanetProps {
  id: string
  title: string
  visual: PlanetVisual
  worldRadius: number
  accentColor: string
  isSelected: boolean
  onClick: () => void
}

/**
 * High-detail 3D planet — no drei Html dependency.
 * Labels are handled by the parent HUD layer.
 */
export function Planet({
  id,
  title,
  visual,
  worldRadius,
  accentColor,
  isSelected,
  onClick,
}: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)

  // Generate textures once — 512px resolution for performance
  const { albedoMap, emissiveMap, bumpMap } = useMemo(() => {
    const albedo = generatePlanetTexture(visual, seed, 512)
    const emissive = generateEmissiveMap(visual, seed, 256)
    const bump = generateBumpMap(visual, seed, 256)
    return { albedoMap: albedo, emissiveMap: emissive, bumpMap: bump }
  }, [visual, seed])

  const [atmoR, atmoG, atmoB] = useMemo(() => {
    const [r, g, b] = parseColor(visual.atmoColor)
    return [r / 255, g / 255, b / 255]
  }, [visual.atmoColor])

  const atmoColor = useMemo(() => new THREE.Color(atmoR, atmoG, atmoB), [atmoR, atmoG, atmoB])

  // Self-rotation
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.elapsedTime * 0.06 * (1 / Math.max(worldRadius, 0.3))
    }
  })

  const tiltRad = (visual.tiltDeg * Math.PI) / 180

  // Material properties per planet type
  const roughness = visual.type === 'gas-giant' ? 0.85
    : visual.type === 'ocean' ? 0.3
    : visual.type === 'ice' ? 0.2
    : visual.type === 'lava' ? 0.9
    : visual.type === 'crystalline' ? 0.1
    : 0.75

  const metalness = visual.type === 'crystalline' ? 0.5
    : visual.type === 'ice' ? 0.15
    : visual.type === 'ocean' ? 0.08
    : 0.02

  return (
    <group>
      {/* Planet sphere */}
      <mesh
        ref={meshRef}
        rotation={[tiltRad, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onClick() }}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
        scale={hovered ? 1.08 : 1}
      >
        <sphereGeometry args={[worldRadius, 48, 48]} />
        <meshStandardMaterial
          map={albedoMap}
          bumpMap={bumpMap}
          bumpScale={worldRadius * 0.06}
          emissiveMap={emissiveMap ?? undefined}
          emissive={emissiveMap ? atmoColor : undefined}
          emissiveIntensity={emissiveMap ? 2.0 : 0}
          roughness={roughness}
          metalness={metalness}
        />
      </mesh>

      {/* Inner atmosphere glow */}
      <mesh rotation={[tiltRad, 0, 0]} scale={1 + visual.atmoThickness * 0.6}>
        <sphereGeometry args={[worldRadius, 24, 24]} />
        <meshBasicMaterial
          color={atmoColor}
          transparent
          opacity={visual.glowIntensity * 0.22}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer atmosphere halo */}
      <mesh rotation={[tiltRad, 0, 0]} scale={1 + visual.atmoThickness * 2.8}>
        <sphereGeometry args={[worldRadius, 16, 16]} />
        <meshBasicMaterial
          color={atmoColor}
          transparent
          opacity={visual.glowIntensity * 0.07}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Ring system */}
      {visual.hasRings && visual.ringColors && visual.ringColors.map((color, i) => {
        const innerR = worldRadius * (1.35 + i * 0.35)
        const outerR = worldRadius * (1.65 + i * 0.35)
        return (
          <mesh key={`ring-${i}`} rotation={[Math.PI / 2 * (visual.ringTilt ?? 0.5) + tiltRad, 0, 0]}>
            <ringGeometry args={[innerR, outerR, 64]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.55 - i * 0.12}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )
      })}

      {/* Selection / hover ring */}
      {(isSelected || hovered) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[worldRadius * 1.5, worldRadius * 1.6, 64]} />
          <meshBasicMaterial
            color={accentColor}
            transparent
            opacity={isSelected ? 0.5 : 0.25}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  )
}
