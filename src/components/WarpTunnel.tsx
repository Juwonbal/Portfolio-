import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface WarpTunnelProps {
  /** Whether warp is currently active */
  active: boolean
  /** Direction of warp (1 = forward, -1 = backward) */
  direction?: number
}

/**
 * 3D warp speed tunnel effect rendered inside the R3F scene.
 * Streaking lines rush past the camera when active.
 */
export function WarpTunnel({ active, direction = 1 }: WarpTunnelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const linesRef = useRef<THREE.Points>(null)
  const activeRef = useRef(active)
  activeRef.current = active

  const lineCount = 600

  const geometry = useMemo(() => {
    const positions = new Float32Array(lineCount * 3)
    const colors = new Float32Array(lineCount * 3)
    const speeds = new Float32Array(lineCount)

    for (let i = 0; i < lineCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const r = 1.5 + Math.random() * 15
      positions[i * 3]     = Math.cos(theta) * r
      positions[i * 3 + 1] = Math.sin(theta) * r
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80

      const brightness = 0.4 + Math.random() * 0.6
      colors[i * 3]     = brightness
      colors[i * 3 + 1] = brightness * (0.8 + Math.random() * 0.2)
      colors[i * 3 + 2] = brightness

      speeds[i] = 0.5 + Math.random() * 1.5
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    // Store speed as a custom attribute (we'll read from the array directly)
    ;(geo as unknown as { speeds: Float32Array }).speeds = speeds
    return geo
  }, [lineCount])

  useFrame((_, delta) => {
    if (!linesRef.current || !activeRef.current) return

    const posArr = linesRef.current.geometry.attributes.position.array as Float32Array
    const speeds = (linesRef.current.geometry as unknown as { speeds: Float32Array }).speeds

    for (let i = 0; i < lineCount; i++) {
      posArr[i * 3 + 2] += speeds[i] * delta * 120 * direction

      // Wrap around
      if (direction > 0 && posArr[i * 3 + 2] > 40) {
        posArr[i * 3 + 2] = -40
      } else if (direction < 0 && posArr[i * 3 + 2] < -40) {
        posArr[i * 3 + 2] = 40
      }
    }

    linesRef.current.geometry.attributes.position.needsUpdate = true
  })

  if (!active) return null

  return (
    <group ref={groupRef}>
      <points ref={linesRef} geometry={geometry}>
        <pointsMaterial
          vertexColors
          size={0.08}
          sizeAttenuation
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
