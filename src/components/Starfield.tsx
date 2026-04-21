import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface StarfieldProps {
  count?: number
}

/**
 * GPU-instanced starfield distributed on a sphere shell.
 * Renders 5000+ stars with color temperature variation.
 * Slowly rotates for ambient parallax.
 */
export function Starfield({ count = 5000 }: StarfieldProps) {
  const pointsRef = useRef<THREE.Points>(null)

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Distribute on sphere shell  r ∈ [100, 250]
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 100 + Math.random() * 150

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      // Color temperature distribution
      const temp = Math.random()
      if (temp > 0.93) {
        // Hot blue-white
        colors[i * 3]     = 0.65 + Math.random() * 0.25
        colors[i * 3 + 1] = 0.75 + Math.random() * 0.25
        colors[i * 3 + 2] = 1.0
      } else if (temp > 0.78) {
        // Warm yellow-orange
        colors[i * 3]     = 1.0
        colors[i * 3 + 1] = 0.8 + Math.random() * 0.15
        colors[i * 3 + 2] = 0.55 + Math.random() * 0.2
      } else {
        // Cool white
        const w = 0.75 + Math.random() * 0.25
        colors[i * 3]     = w
        colors[i * 3 + 1] = w
        colors[i * 3 + 2] = w + Math.random() * 0.05
      }

      sizes[i] = 0.06 + Math.random() * 0.3
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))
    return geo
  }, [count])

  // Slow ambient rotation — creates parallax as camera moves
  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.elapsedTime * 0.002
      pointsRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.0005) * 0.05
    }
  })

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        vertexColors
        size={0.22}
        sizeAttenuation
        transparent
        opacity={0.92}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
