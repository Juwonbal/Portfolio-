import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface RealisticCommsRelayProps {
  onClick: () => void
}

export function RealisticCommsRelay({ onClick }: RealisticCommsRelayProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  // Hover state
  const [hovered, setHovered] = useState(false)

  // Physics drift
  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (groupRef.current) {
      // 1. Tumbling: Slowly rotate on all axes
      groupRef.current.rotation.x = t * 0.15
      groupRef.current.rotation.y = t * 0.1
      groupRef.current.rotation.z = t * 0.05

      // 2. The Drift: Keep strictly in the center (x: -4 to 4)
      groupRef.current.position.x = Math.sin(t * 0.04) * 4
      // Float way ABOVE the galaxy planes (y=10) so it never clips a planet
      groupRef.current.position.y = 10 + Math.sin(t * 0.08) * 1.5
      // Same depth as the galaxies (z=0) so it doesn't parallax in front of them
      groupRef.current.position.z = Math.cos(t * 0.06) * 2
    }
  })

  // --- Procedural Materials ---
  const kaptonFoil = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffcc00', // Much brighter yellow/gold
    metalness: 0.8,
    roughness: 0.4,
    emissive: '#664400', // Stronger ambient glow so it stays visible in the dark pitch
    emissiveIntensity: 1.0,
  }), [])

  const darkMetal = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#888899', // Made much lighter (not dark anymore)
    metalness: 0.7,
    roughness: 0.4,
    emissive: '#222222',
  }), [])

  const silverMetal = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff', // Pure shining white
    metalness: 0.9,
    roughness: 0.1, 
    emissive: '#333333',
  }), [])

  const solarPanelBase = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1e3a8a', // Brightened up the base blue
    metalness: 0.9,
    roughness: 0.1,
    emissive: '#0f172a',
  }), [])

  // Procedural Grid Texture for Solar Panels
  const gridTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#051125'
      ctx.fillRect(0, 0, 512, 512)
      ctx.strokeStyle = '#3b82f6' // Grid lines
      ctx.lineWidth = 4
      ctx.beginPath()
      for (let i = 0; i <= 512; i += 64) {
        ctx.moveTo(i, 0)
        ctx.lineTo(i, 512)
        ctx.moveTo(0, i)
        ctx.lineTo(512, i)
      }
      ctx.stroke()
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(4, 2)
    return texture
  }, [])

  const solarPanelMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: gridTexture,
    metalness: 0.9,
    roughness: 0.2,
  }), [gridTexture])

  // Latticework strut generation
  const createLattice = (count: number, length: number) => {
    return Array.from({ length: count }).map((_, i) => {
      const zOffset = (i - count / 2 + 0.5) * (length / count)
      return (
        <group key={`cross-${i}`} position={[0, 0, zOffset]}>
          <mesh rotation={[Math.PI / 4, 0, 0]} material={silverMetal}>
            <cylinderGeometry args={[0.015, 0.015, 0.18]} />
          </mesh>
          <mesh rotation={[-Math.PI / 4, 0, 0]} material={silverMetal}>
            <cylinderGeometry args={[0.015, 0.015, 0.18]} />
          </mesh>
        </group>
      )
    })
  }

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
      scale={hovered ? 1.0 : 0.8} // Scaled down even further as requested
    >
      {/* ─── CENTRAL BUS ─── */}
      <group>
        {/* Main hexagonal core with foil */}
        <mesh material={kaptonFoil} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 1.2, 6]} />
        </mesh>
        
        {/* End caps */}
        <mesh position={[0, 0.6, 0]} material={darkMetal}>
          <cylinderGeometry args={[0.36, 0.36, 0.1, 6]} />
        </mesh>
        <mesh position={[0, -0.6, 0]} material={darkMetal}>
          <cylinderGeometry args={[0.36, 0.36, 0.1, 6]} />
        </mesh>
        
        {/* Instrument Box (Greeble) attached to body */}
        <mesh position={[0.3, 0, 0.2]} material={silverMetal}>
          <boxGeometry args={[0.15, 0.3, 0.15]} />
        </mesh>
        <mesh position={[-0.2, 0.3, 0.3]} material={darkMetal}>
          <boxGeometry args={[0.2, 0.2, 0.1]} />
        </mesh>
      </group>

      {/* ─── PRIMARY DISH ─── */}
      <group position={[0, 0, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh material={silverMetal}>
          <coneGeometry args={[0.5, 0.4, 32, 1, true]} />
        </mesh>
        {/* Flat cap for the dish bottom to make it solid */}
        <mesh position={[0, -0.2, 0]} material={silverMetal}>
          <cylinderGeometry args={[0.5, 0.5, 0.02, 32]} />
        </mesh>
        <mesh position={[0, 0.1, 0]} material={darkMetal}>
          <cylinderGeometry args={[0.015, 0.015, 0.6]} />
        </mesh>
        <mesh position={[0, 0.4, 0]} material={silverMetal}>
          <cylinderGeometry args={[0.06, 0.01, 0.1]} />
        </mesh>
      </group>

      {/* ─── SOLAR PANELS & LATTICE BOOMS ─── */}
      {/* Left Array system */}
      <group position={[-1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        {/* Lattice Truss boom */}
        <group position={[0, 0.6, 0]}>
          {/* Main running beams */}
          <mesh position={[0.06, 0, 0.06]} material={silverMetal}>
             <cylinderGeometry args={[0.015, 0.015, 1.2]} />
          </mesh>
          <mesh position={[-0.06, 0, 0.06]} material={silverMetal}>
             <cylinderGeometry args={[0.015, 0.015, 1.2]} />
          </mesh>
          <mesh position={[0, 0, -0.06]} material={silverMetal}>
             <cylinderGeometry args={[0.015, 0.015, 1.2]} />
          </mesh>
          {/* Cross latticework */}
          {createLattice(8, 1.2)}
        </group>
        {/* Panel array */}
        <mesh position={[0, 1.4, 0]} rotation={[0, 0, Math.PI / 2]} material={solarPanelMaterial}>
          <boxGeometry args={[1.8, 0.8, 0.02]} />
        </mesh>
        {/* Dark backing board */}
        <mesh position={[0, 1.4, -0.015]} rotation={[0, 0, Math.PI / 2]} material={solarPanelBase}>
          <boxGeometry args={[1.8, 0.8, 0.015]} />
        </mesh>
      </group>

      {/* Right Array system */}
      <group position={[1.2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        {/* Lattice Truss boom */}
        <group position={[0, 0.6, 0]}>
          <mesh position={[0.06, 0, 0.06]} material={silverMetal}>
             <cylinderGeometry args={[0.015, 0.015, 1.2]} />
          </mesh>
          <mesh position={[-0.06, 0, 0.06]} material={silverMetal}>
             <cylinderGeometry args={[0.015, 0.015, 1.2]} />
          </mesh>
          <mesh position={[0, 0, -0.06]} material={silverMetal}>
             <cylinderGeometry args={[0.015, 0.015, 1.2]} />
          </mesh>
          {createLattice(8, 1.2)}
        </group>
        {/* Panel array */}
        <mesh position={[0, 1.4, 0]} rotation={[0, 0, Math.PI / 2]} material={solarPanelMaterial}>
          <boxGeometry args={[1.8, 0.8, 0.02]} />
        </mesh>
        {/* Dark backing board */}
        <mesh position={[0, 1.4, -0.015]} rotation={[0, 0, Math.PI / 2]} material={solarPanelBase}>
          <boxGeometry args={[1.8, 0.8, 0.015]} />
        </mesh>
      </group>

      {/* ─── DIAGNOSTIC LIGHTS & THRUSTERS ─── */}
      {/* Thruster pods mounted on the end caps */}
      <mesh position={[0.2, 0.65, 0.2]} material={silverMetal}>
        <cylinderGeometry args={[0.04, 0.04, 0.15]} />
      </mesh>
      <mesh position={[-0.2, -0.65, -0.2]} material={silverMetal}>
        <cylinderGeometry args={[0.04, 0.04, 0.15]} />
      </mesh>

      {/* Neon Cyan Diagnostic Light */}
      <group position={[0, 0.8, 0]}>
        <mesh>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#00ffcc" />
        </mesh>
        <pointLight color="#00ffcc" intensity={hovered ? 30 : 6} distance={6} decay={2} />
      </group>

      {/* Flashing Red Diagnostic Light (Bottom) */}
      <group position={[0, -0.8, 0]}>
        <mesh>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color="#ff0044" />
        </mesh>
        <pointLight color="#ff0044" intensity={hovered ? 20 : 8} distance={8} decay={2} />
      </group>
    </group>
  )
}
