import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'

interface CameraControllerProps {
  target: [number, number, number]
  lookAt: [number, number, number]
  duration?: number
  /** Subtle idle drift when not transitioning */
  enableDrift?: boolean
  onComplete?: () => void
}

export function CameraController({
  target,
  lookAt,
  duration = 1.8,
  enableDrift = true,
  onComplete,
}: CameraControllerProps) {
  const { camera } = useThree()
  const lookAtTarget = useRef(new THREE.Vector3(lookAt[0], lookAt[1], lookAt[2]))
  const tweenRef = useRef<gsap.core.Tween[]>([])
  const completedRef = useRef(false)
  const isTransitioning = useRef(false)

  useEffect(() => {
    tweenRef.current.forEach(t => t.kill())
    completedRef.current = false
    isTransitioning.current = true

    const posTween = gsap.to(camera.position, {
      x: target[0],
      y: target[1],
      z: target[2],
      duration,
      ease: 'power2.inOut',
      onComplete: () => {
        isTransitioning.current = false
        if (!completedRef.current) {
          completedRef.current = true
          onComplete?.()
        }
      },
    })

    const lookAtTween = gsap.to(lookAtTarget.current, {
      x: lookAt[0],
      y: lookAt[1],
      z: lookAt[2],
      duration,
      ease: 'power2.inOut',
    })

    tweenRef.current = [posTween, lookAtTween]

    return () => {
      posTween.kill()
      lookAtTween.kill()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target[0], target[1], target[2], lookAt[0], lookAt[1], lookAt[2], duration])

  useFrame(({ clock }) => {
    // Subtle idle camera drift for organic feel
    if (enableDrift && !isTransitioning.current) {
      const t = clock.elapsedTime
      const driftX = Math.sin(t * 0.15) * 0.3
      const driftY = Math.cos(t * 0.12) * 0.15
      camera.position.x = target[0] + driftX
      camera.position.y = target[1] + driftY
    }

    camera.lookAt(lookAtTarget.current)
  })

  return null
}
