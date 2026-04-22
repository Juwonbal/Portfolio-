import { useState, useCallback, useEffect, Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { CameraController } from './components/CameraController'
import { Starfield } from './components/Starfield'
import { GalaxyCluster } from './components/GalaxyCluster'
import { SolarSystem } from './components/SolarSystem'
import { WarpTunnel } from './components/WarpTunnel'
import { BootSequence } from './components/BootSequence'
import { IntroCrawl } from './components/IntroCrawl'
import { OverviewHUD } from './components/OverviewHUD'
import { GalaxyHUD } from './components/GalaxyHUD'
import { ProjectCard } from './components/ProjectCard'
import { RealisticCommsRelay } from './components/RealisticCommsRelay'
import { CommsTerminal } from './components/CommsTerminal'
import { CYBER_PROJECTS, SOFTWARE_PROJECTS } from './data/projects'
import type { ProjectData } from './data/types'

// ─── Constants ───────────────────────────────────────────────────────────────

type GalaxyId = 'cyber' | 'software'

const GALAXY_CENTERS: Record<GalaxyId, [number, number, number]> = {
  cyber:    [-22, 0, 0],
  software: [22, 0, 0],
}

const CAMERA_TARGETS = {
  overview: {
    position: [0, 18, 55] as [number, number, number],
    lookAt:   [0, 0, 0]   as [number, number, number],
  },
  'galaxy-cyber': {
    position: [-22, 10, 24] as [number, number, number],
    lookAt:   [-22, 0, 0]   as [number, number, number],
  },
  'galaxy-software': {
    position: [22, 10, 24] as [number, number, number],
    lookAt:   [22, 0, 0]   as [number, number, number],
  },
}

// ─── Navigation State ────────────────────────────────────────────────────────

type NavView = 'intro' | 'boot' | 'overview' | 'galaxy' | 'planet-focus'

interface NavState {
  view: NavView
  galaxyId: GalaxyId
  selectedProject: ProjectData | null
  transitioning: boolean
  showCard: boolean
}

// ─── App ─────────────────────────────────────────────────────────────────────

const checkHasVisitedRecently = () => {
  const lastVisit = localStorage.getItem('space_portfolio_last_visit')
  if (!lastVisit) return false
  const timeSince = Date.now() - parseInt(lastVisit, 10)
  return timeSince < 48 * 60 * 60 * 1000 // 48 hours
}

export default function App() {
  const [nav, setNav] = useState<NavState>(() => {
    const hasVisited = checkHasVisitedRecently()
    return {
      view: hasVisited ? 'overview' : 'intro',
      galaxyId: 'cyber',
      selectedProject: null,
      transitioning: false,
      showCard: false,
    }
  })

  // Backdrop fades out AFTER boot completes to reveal the 3D scene
  const [backdropVisible, setBackdropVisible] = useState(() => {
    return !checkHasVisitedRecently()
  })

  // Comms Terminal state
  const [isCommsOpen, setIsCommsOpen] = useState(false)

  const planetFocusPosRef = useRef<[number, number, number]>([0, 5, 15])
  const planetFocusLookRef = useRef<[number, number, number]>([0, 0, 0])

  // ─── Camera target computation ──────────────────────────────────────────

  const getCameraTarget = useCallback(() => {
    if (nav.view === 'overview' || nav.view === 'boot' || nav.view === 'intro') {
      return CAMERA_TARGETS.overview
    }
    if (nav.view === 'planet-focus') {
      return {
        position: planetFocusPosRef.current,
        lookAt: planetFocusLookRef.current,
      }
    }
    // galaxy view
    return CAMERA_TARGETS[`galaxy-${nav.galaxyId}`]
  }, [nav.view, nav.galaxyId])

  const cam = getCameraTarget()

  // ─── Navigation actions ─────────────────────────────────────────────────

  const onIntroComplete = useCallback(() => {
    setNav(s => ({ ...s, view: 'boot' }))
  }, [])

  const onBootComplete = useCallback(() => {
    setNav(s => ({ ...s, view: 'overview' }))
    // Delay backdrop fade so the overview HUD is ready
    setTimeout(() => setBackdropVisible(false), 200)
  }, [])

  // Update the visit timestamp whenever we hit the overview
  useEffect(() => {
    if (nav.view === 'overview') {
      localStorage.setItem('space_portfolio_last_visit', Date.now().toString())
    }
  }, [nav.view])

  const onGalaxySelect = useCallback((id: GalaxyId) => {
    setNav(s => ({
      ...s,
      view: 'galaxy',
      galaxyId: id,
      transitioning: true,
      selectedProject: null,
      showCard: false,
    }))
  }, [])

  const onCameraArrived = useCallback(() => {
    setNav(s => {
      if (s.view === 'planet-focus') {
        return { ...s, transitioning: false, showCard: true }
      }
      return { ...s, transitioning: false }
    })
  }, [])

  const onPlanetClick = useCallback((project: ProjectData, worldPos: THREE.Vector3) => {
    // Compute camera position: offset from planet
    const offset = new THREE.Vector3(3, 2, 5).normalize().multiplyScalar(5)
    const camPos = worldPos.clone().add(offset)

    planetFocusPosRef.current = [camPos.x, camPos.y, camPos.z]
    planetFocusLookRef.current = [worldPos.x, worldPos.y, worldPos.z]

    setNav(s => ({
      ...s,
      view: 'planet-focus',
      selectedProject: project,
      transitioning: true,
      showCard: false,
    }))
  }, [])

  const onBackToGalaxy = useCallback(() => {
    setNav(s => ({
      ...s,
      view: 'galaxy',
      selectedProject: null,
      transitioning: true,
      showCard: false,
    }))
  }, [])

  const onBackToOverview = useCallback(() => {
    setNav(s => ({
      ...s,
      view: 'overview',
      selectedProject: null,
      transitioning: true,
      showCard: false,
    }))
  }, [])

  const activeProjects = nav.galaxyId === 'cyber' ? CYBER_PROJECTS : SOFTWARE_PROJECTS

  const isGalaxyActive = nav.view === 'galaxy' || nav.view === 'planet-focus'

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#03020e' }}>

      {/* ─── Persistent R3F Canvas ──────────────────────────────────────── */}
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false, preserveDrawingBuffer: false }}
        camera={{ position: [0, 18, 55], fov: 50, near: 0.1, far: 500 }}
        style={{ position: 'fixed', inset: 0, zIndex: 1 }}
        onCreated={({ gl }) => {
          gl.setClearColor('#03020e')
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.2
        }}
      >
        <Suspense fallback={null}>
          {/* GSAP Camera Controller */}
          <CameraController
            target={cam.position}
            lookAt={cam.lookAt}
            duration={nav.transitioning ? 2.0 : 0.01}
            onComplete={onCameraArrived}
          />

          {/* Global lighting — boosted for visible textures */}
          <ambientLight intensity={0.25} />

          {/* 3D Warp speed tunnel */}
          <WarpTunnel active={nav.transitioning} />

          {/* GPU-instanced starfield */}
          <Starfield count={3000} />

          {/* Galaxy clusters — always visible */}
          <GalaxyCluster
            id="cyber"
            position={GALAXY_CENTERS.cyber}
            onClick={() => onGalaxySelect('cyber')}
            isActive={isGalaxyActive && nav.galaxyId === 'cyber'}
          />
          <GalaxyCluster
            id="software"
            position={GALAXY_CENTERS.software}
            onClick={() => onGalaxySelect('software')}
            isActive={isGalaxyActive && nav.galaxyId === 'software'}
          />

          {/* Drifting Detailed Comms Satellite */}
          <RealisticCommsRelay onClick={() => setIsCommsOpen(true)} />

          {/* Solar systems — always present, planets always orbiting */}
          <SolarSystem
            galaxyId="cyber"
            center={GALAXY_CENTERS.cyber}
            projects={CYBER_PROJECTS}
            selectedPlanetId={nav.galaxyId === 'cyber' ? nav.selectedProject?.id ?? null : null}
            onPlanetClick={onPlanetClick}
          />
          <SolarSystem
            galaxyId="software"
            center={GALAXY_CENTERS.software}
            projects={SOFTWARE_PROJECTS}
            selectedPlanetId={nav.galaxyId === 'software' ? nav.selectedProject?.id ?? null : null}
            onPlanetClick={onPlanetClick}
          />
        </Suspense>
      </Canvas>

      {/* ─── DOM Overlays ──────────────────────────────────────────────── */}

      {/* Persistent dark backdrop — hides Canvas during intro + boot */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2,
          background: '#03020e',
          opacity: backdropVisible ? 1 : 0,
          transition: 'opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
          pointerEvents: backdropVisible ? 'auto' : 'none',
        }}
        aria-hidden="true"
      />

      {/* Star Wars intro crawl */}
      {nav.view === 'intro' && (
        <IntroCrawl onComplete={onIntroComplete} />
      )}

      {/* Boot sequence */}
      {nav.view === 'boot' && (
        <BootSequence onComplete={onBootComplete} />
      )}

      {/* Overview HUD */}
      <OverviewHUD visible={nav.view === 'overview'} />

      {/* Galaxy HUD */}
      <GalaxyHUD
        visible={isGalaxyActive}
        galaxyId={nav.galaxyId}
        planetCount={activeProjects.length}
        onBack={onBackToOverview}
      />

      {/* Project card — shown after camera zoom completes */}
      {nav.showCard && nav.selectedProject && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 30, pointerEvents: 'all' }}
        >
          <ProjectCard
            project={nav.selectedProject}
            onClose={onBackToGalaxy}
          />
        </div>
      )}

      {/* Comms Terminal Overlay */}
      {isCommsOpen && (
        <CommsTerminal onClose={() => setIsCommsOpen(false)} />
      )}

      {/* Warp flash — CSS overlay for screen-level flash */}
      {nav.transitioning && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 15,
            background: `radial-gradient(ellipse at center, ${nav.galaxyId === 'cyber' ? 'rgba(255,96,48,0.12)' : 'rgba(34,211,238,0.12)'} 0%, transparent 70%)`,
            pointerEvents: 'none',
            animation: 'intro-fade-in 0.3s ease forwards',
          }}
        />
      )}

      {/* Persistent HUD corner brackets (overview only) */}
      {nav.view === 'overview' && (
        <div className="hud-brackets" aria-hidden="true">
          {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
            <svg
              key={c} className="hud-bracket" width="28" height="28" viewBox="0 0 28 28"
              style={{
                top: c.startsWith('t') ? 10 : undefined,
                bottom: c.startsWith('b') ? 10 : undefined,
                left: c.endsWith('l') ? 10 : undefined,
                right: c.endsWith('r') ? 10 : undefined,
              }}
            >
              <path
                d={
                  c === 'tl' ? 'M14 2 H2 V14' :
                  c === 'tr' ? 'M14 2 H26 V14' :
                  c === 'bl' ? 'M14 26 H2 V14' :
                               'M14 26 H26 V14'
                }
                fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1.2" strokeLinecap="square"
              />
            </svg>
          ))}
        </div>
      )}
    </main>
  )
}
