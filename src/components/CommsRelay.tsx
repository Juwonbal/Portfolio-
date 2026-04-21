import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CommsRelayProps {
  onClick: () => void
}

export function CommsRelay({ onClick }: CommsRelayProps) {
  const groupRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  
  // Hover state for cursor change
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (groupRef.current) {
      // 1. Tumbling: Slowly rotate on all axes
      groupRef.current.rotation.x = t * 0.15
      groupRef.current.rotation.y = t * 0.1
      groupRef.current.rotation.z = t * 0.05

      // Drift precisely in the "no man's land" between galaxies (x: -6 to 6)
      groupRef.current.position.x = Math.sin(t * 0.04) * 6
      // Float "above" the galaxies
      groupRef.current.position.y = 2 + Math.sin(t * 0.08) * 1.5
      // Bring it much closer to the camera (overview camera is at z=55, galaxies at z=0)
      groupRef.current.position.z = 18 + Math.cos(t * 0.06) * 1.5
    }
  })

  // --- Realistic Space Materials ---
  // Kapton space blanket foil (used universally on satellites)
  const kaptonFoil = new THREE.MeshStandardMaterial({
    color: '#cc7700',
    emissive: '#331100',
    metalness: 0.8,
    roughness: 0.4,
  })

  // Matte dark chassis metal
  const darkMetal = new THREE.MeshStandardMaterial({
    color: '#222222',
    metalness: 0.7,
    roughness: 0.6,
  })

  // Bright titanium for structural elements
  const structureMetal = new THREE.MeshStandardMaterial({
    color: '#9999a0',
    metalness: 0.9,
    roughness: 0.2,
  })

  // Deep space highly reflective glossy solar panels
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: '#020617',
    metalness: 1.0,
    roughness: 0.1,
  })

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
      scale={hovered ? 3.5 : 3}
    >
      {/* ─── CENTRAL BUS ─── */}
      <group ref={coreRef}>
        {/* Hexagonal Gold Foil Main Chassis */}
        <mesh material={kaptonFoil} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 1.2, 6]} />
        </mesh>

        {/* Structural Caps */}
        <mesh position={[0, 0.6, 0]} material={structureMetal}>
          <cylinderGeometry args={[0.36, 0.36, 0.05, 6]} />
        </mesh>
        <mesh position={[0, -0.6, 0]} material={structureMetal}>
          <cylinderGeometry args={[0.36, 0.36, 0.05, 6]} />
        </mesh>
      </group>

      {/* ─── HIGH GAIN PARABOLIC DISH ─── */}
      <group position={[0, 0, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
        {/* Dish */}
        <mesh material={structureMetal}>
          <sphereGeometry args={[0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
        </mesh>
        {/* Feed Horn Strut */}
        <mesh position={[0, 0.3, 0]} material={darkMetal}>
          <cylinderGeometry args={[0.015, 0.015, 0.6]} />
        </mesh>
        {/* Feed Horn Bell */}
        <mesh position={[0, 0.6, 0]} material={structureMetal}>
          <cylinderGeometry args={[0.06, 0.01, 0.1]} />
        </mesh>
      </group>

      {/* ─── GREEBLES & SENSOR BOOMS ─── */}
      {/* Long bottom sensor boom */}
      <mesh position={[0, -1.2, 0]} material={structureMetal}>
        <cylinderGeometry args={[0.02, 0.02, 1.2]} />
      </mesh>
      {/* Magnetometer package at end of boom */}
      <mesh position={[0, -1.8, 0]} material={darkMetal}>
        <boxGeometry args={[0.15, 0.2, 0.15]} />
      </mesh>

      {/* Side star trackers/thruster blocks */}
      <mesh position={[0.38, 0.4, 0]} material={darkMetal}>
        <boxGeometry args={[0.1, 0.15, 0.1]} />
      </mesh>
      <mesh position={[-0.38, -0.4, 0]} material={darkMetal}>
        <boxGeometry args={[0.1, 0.15, 0.1]} />
      </mesh>

      {/* ─── SOLAR ARRAYS ─── */}
      {/* Center structural truss running through the entire width */}
      <mesh rotation={[0, 0, Math.PI / 2]} material={structureMetal}>
        <cylinderGeometry args={[0.03, 0.03, 3.8, 8]} />
      </mesh>

      {/* Left Array */}
      <group position={[-1.5, 0, 0]}>
        <mesh material={panelMaterial}>
          <boxGeometry args={[1.8, 0.7, 0.02]} />
        </mesh>
        {/* Photovoltaic Cells Grid */}
        <mesh position={[0, 0, 0.015]}>
          <planeGeometry args={[1.7, 0.6, 8, 3]} />
          <meshBasicMaterial color="#3388ff" wireframe transparent opacity={0.4} />
        </mesh>
        {/* Backside structure ribs */}
        <mesh position={[0, 0, -0.015]} material={darkMetal}>
          <planeGeometry args={[1.7, 0.6, 4, 1]} />
          <meshBasicMaterial color="#222" wireframe />
        </mesh>
      </group>

      {/* Right Array */}
      <group position={[1.5, 0, 0]}>
        <mesh material={panelMaterial}>
          <boxGeometry args={[1.8, 0.7, 0.02]} />
        </mesh>
        {/* Photovoltaic Cells Grid */}
        <mesh position={[0, 0, 0.015]}>
          <planeGeometry args={[1.7, 0.6, 8, 3]} />
          <meshBasicMaterial color="#3388ff" wireframe transparent opacity={0.4} />
        </mesh>
        {/* Backside structure ribs */}
        <mesh position={[0, 0, -0.015]} material={darkMetal}>
          <planeGeometry args={[1.7, 0.6, 4, 1]} />
          <meshBasicMaterial color="#222" wireframe />
        </mesh>
      </group>

      {/* ─── NEON BEACON ─── */}
      {/* Flashing light mounted on the top chassis */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#00ffcc" />
        <pointLight color="#00ffcc" intensity={hovered ? 30 : 12} distance={10} decay={2} />
      </mesh>
    </group>

  )
}
