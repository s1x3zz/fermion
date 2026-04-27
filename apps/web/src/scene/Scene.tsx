import { onMount, onCleanup } from 'solid-js'
import * as THREE from 'three'
import { useCameraController, WireRenderer, SignalType } from '@fermion/renderer'

export function Scene() {
  let canvasRef!: HTMLCanvasElement

  onMount(() => {
    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef,
      antialias: true,
      alpha: false,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x0a0a0f, 1)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // ── Scene ─────────────────────────────────────────────────────────────
    const scene = new THREE.Scene()

    // ── Camera ────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1000)
    camera.position.set(5, 5, 5)
    camera.lookAt(0, 0, 0)

    // ── Lights ────────────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(5, 10, 5)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.set(1024, 1024)
    scene.add(dirLight)

    // ── Grid ──────────────────────────────────────────────────────────────
    const grid = new THREE.GridHelper(20, 20, 0x1a1a2e, 0x1a1a2e)
    scene.add(grid)

    // ── Cube ──────────────────────────────────────────────────────────────
    const cubeGeo = new THREE.BoxGeometry(1, 1, 1)
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0x1a3a5c,
      emissive: 0x0a1f3a,
      emissiveIntensity: 0.6,
      roughness: 0.4,
      metalness: 0.3,
    })
    const cube = new THREE.Mesh(cubeGeo, cubeMat)
    cube.position.set(0, 0.5, 0)
    cube.castShadow = true
    scene.add(cube)

    // ── Wire renderer ─────────────────────────────────────────────────────
    const wires = new WireRenderer(scene)

    wires.addWire('vcc', {
      pinA: new THREE.Vector3(-1, 0, -1),
      pinB: new THREE.Vector3(1, 0, 1),
      signalType: SignalType.VCC_5V,
    })
    wires.updateCurrent('vcc', 0.8)

    wires.addWire('gnd', {
      pinA: new THREE.Vector3(-1, 0, 1),
      pinB: new THREE.Vector3(1, 0, -1),
      signalType: SignalType.GND,
    })
    wires.updateCurrent('gnd', 0.8)

    wires.addWire('data', {
      pinA: new THREE.Vector3(0, 0, -1.5),
      pinB: new THREE.Vector3(0, 0, 1.5),
      signalType: SignalType.DIGITAL,
    })
    wires.updateCurrent('data', 0.3)

    // ── Camera controller ─────────────────────────────────────────────────
    const controller = useCameraController(camera, canvasRef, scene, {
      dampingFactor: 0.08,
      zoomSpeed: 1.0,
      orbitSpeed: 0.6,
      panSpeed: 1.0,
    })

    // ── Animation loop ────────────────────────────────────────────────────
    let rafId = 0
    const startTime = performance.now()
    let lastTime = startTime

    const tick = () => {
      rafId = requestAnimationFrame(tick)
      const now = performance.now()
      const delta = (now - lastTime) / 1000
      const elapsed = (now - startTime) / 1000
      lastTime = now

      controller.update(delta)
      wires.update(elapsed)
      renderer.render(scene, camera)
    }
    tick()

    // ── Resize ────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    onCleanup(() => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      wires.dispose()
      renderer.dispose()
      cubeGeo.dispose()
      cubeMat.dispose()
    })
  })

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100vw',
        height: '100vh',
        cursor: 'crosshair',
      }}
    />
  )
}
