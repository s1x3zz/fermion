import { onMount, onCleanup } from 'solid-js'
import * as THREE from 'three'
import {
  useCameraController,
  WireRenderer,
  SignalType,
  Breadboard,
  ComponentRegistry,
} from '@fermion/renderer'
import type { CameraController, ComponentMesh } from '@fermion/renderer'
import type { ComponentType, PlacedComponent, PinPosition } from '@fermion/core'

// ── Public API exposed to parent ──────────────────────────────────────────────

export interface SceneAPI {
  removeComponent: (id: string) => void
  setSelectedComponent: (id: string | null) => void
  removeWire: (id: string) => void
  setSelectedWire: (id: string | null) => void
  cancelWiring: () => void
  updateWireCurrent: (wireId: string, current: number) => void
  updateComponentGlow: (compId: string, isOn: boolean, current: number) => void
  updateAvrLeds: (compId: string, states: any) => void
  resetGlow: () => void
  loadCircuit: (
    components: Record<string, import('@fermion/core').PlacedComponent>,
    wireData: Record<string, import('@fermion/core').PlacedWire>,
  ) => void
  captureThumb: () => string
}

export interface SceneFrameInfo {
  fps: number
  radius: number
}

export interface SceneProps {
  onControllerReady?: (ctrl: CameraController) => void
  onFrame?: (info: SceneFrameInfo) => void
  onCursorMove?: (x: number, z: number) => void
  isSimulating?: () => boolean
  // Component interaction
  onSceneReady?: (api: SceneAPI) => void
  onComponentPlace?: (type: string, row: string, col: number) => string
  onComponentSelect?: (id: string | null) => void
  isOccupied?: (row: string, col: number) => boolean
  // Wire interaction
  onWireCreate?: (pinA: PinPosition, pinB: PinPosition, signalType: string) => string
  onWireSelect?: (id: string | null) => void
}

// ── Wire drawing state ────────────────────────────────────────────────────────

type WiringState =
  | { mode: 'IDLE' }
  | { mode: 'WIRING'; startPin: { row: string; col: number }; startPos: THREE.Vector3 }

export function Scene(props: SceneProps) {
  let canvasRef!: HTMLCanvasElement

  onMount(() => {
    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x0a0a0f, 1)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // ── Scene + Camera ─────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 1000)
    camera.position.set(0, 8, 12)
    camera.lookAt(0, 0, 0)

    // ── Lights ────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(5, 10, 5)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.set(1024, 1024)
    scene.add(dirLight)

    // ── Grid + Breadboard ─────────────────────────────────────────────────
    scene.add(new THREE.GridHelper(20, 20, 0x1a1a2e, 0x1a1a2e))
    const board = new Breadboard(scene, new THREE.Vector3(0, 0, 0))

    // ── Demo wires ────────────────────────────────────────────────────────
    const wires = new WireRenderer(scene)
    wires.addWire('vcc', {
      pinA: board.getPowerRailPosition('vcc_top', 1),
      pinB: board.getPowerRailPosition('vcc_top', 25),
      signalType: SignalType.VCC_5V,
    })
    wires.updateCurrent('vcc', 0.8)
    wires.addWire('gnd', {
      pinA: board.getPowerRailPosition('gnd_top', 1),
      pinB: board.getPowerRailPosition('gnd_top', 25),
      signalType: SignalType.GND,
    })
    wires.updateCurrent('gnd', 0.8)
    wires.addWire('data', {
      pinA: board.getPinPosition('a', 1),
      pinB: board.getPinPosition('e', 1),
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
    props.onControllerReady?.(controller)

    // ── Resize ────────────────────────────────────────────────────────────
    const resize = () => {
      const w = canvasRef.clientWidth
      const h = canvasRef.clientHeight
      if (w === 0 || h === 0) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvasRef)
    resize()

    // ── Shared raycast helpers ────────────────────────────────────────────
    const raycaster = new THREE.Raycaster()
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const hitPoint = new THREE.Vector3()
    const ndcPoint = new THREE.Vector2()

    const toNdc = (clientX: number, clientY: number) => {
      const rect = canvasRef.getBoundingClientRect()
      ndcPoint.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      )
    }

    // ── Component mesh map + selection state ──────────────────────────────
    const meshMap = new Map<string, ComponentMesh>()
    let selectedMeshId: string | null = null
    let selectedWireId: string | null = null

    // ── Ghost preview mesh ────────────────────────────────────────────────
    const ghostGeo = new THREE.BoxGeometry(0.28, 0.24, 0.20)
    const ghostMatOk  = new THREE.MeshBasicMaterial({ color: 0x3b8bff, transparent: true, opacity: 0.45 })
    const ghostMatBad = new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.45 })
    let ghostMesh: THREE.Mesh | null = null
    let ghostSnap: { row: string; col: number } | null = null

    const snapToPin = (worldX: number, worldZ: number): { row: string; col: number } | null => {
      let bestDist = 0.25; // max snap distance for components
      let bestSnap: { row: string; col: number } | null = null;
      
      for (const [id, mesh] of meshMap.entries()) {
        if ((mesh as any).getAllPins) {
          const pins = (mesh as any).getAllPins();
          for (const p of pins) {
            const dx = p.pos.x - worldX;
            const dz = p.pos.z - worldZ;
            const dist = Math.sqrt(dx*dx + dz*dz);
            if (dist < bestDist) {
              bestDist = dist;
              bestSnap = { row: id, col: p.pin };
            }
          }
        }
      }
      if (bestSnap) return bestSnap;
      return board.snapToNearestPin(worldX, worldZ);
    }

    const showGhost = (worldX: number, worldZ: number) => {
      const snap = snapToPin(worldX, worldZ)
      if (!snap) { hideGhost(); return }

      const occupied = props.isOccupied?.(snap.row, snap.col) ?? false

      if (!ghostMesh) {
        ghostMesh = new THREE.Mesh(ghostGeo, occupied ? ghostMatBad : ghostMatOk)
        scene.add(ghostMesh)
      }
      ghostMesh.material = occupied ? ghostMatBad : ghostMatOk

      let pinPos: THREE.Vector3;
      if (meshMap.has(snap.row)) {
         pinPos = (meshMap.get(snap.row) as any).getPinHeaderPosition(snap.col) ?? board.getPinPosition('a', 1);
      } else {
         pinPos = board.getPinPosition(snap.row, snap.col)
      }
      ghostMesh.position.set(pinPos.x, pinPos.y + 0.18, pinPos.z)
      ghostSnap = snap
    }

    const hideGhost = () => {
      if (ghostMesh) { scene.remove(ghostMesh); ghostMesh = null }
      ghostSnap = null
    }

    // ── Wire drawing state machine ────────────────────────────────────────
    let wiringState: WiringState = { mode: 'IDLE' }

    // Hover ring (blue) — shown on nearest pin in IDLE mode
    const hoverRingGeo = new THREE.TorusGeometry(0.07, 0.012, 8, 32)
    const hoverRingMat = new THREE.MeshBasicMaterial({ color: 0x3b8bff, transparent: true, opacity: 0.85 })
    const hoverRing = new THREE.Mesh(hoverRingGeo, hoverRingMat)
    hoverRing.rotation.x = -Math.PI / 2
    hoverRing.visible = false
    scene.add(hoverRing)

    // Start ring (green) — shown on the wire origin pin while WIRING
    const startRingGeo = new THREE.TorusGeometry(0.07, 0.012, 8, 32)
    const startRingMat = new THREE.MeshBasicMaterial({ color: 0x22cc22 })
    const startRing = new THREE.Mesh(startRingGeo, startRingMat)
    startRing.rotation.x = -Math.PI / 2
    startRing.visible = false
    scene.add(startRing)

    const startWiringMode = (snap: { row: string; col: number }) => {
      let startPos: THREE.Vector3;
      if (meshMap.has(snap.row)) {
         startPos = (meshMap.get(snap.row) as any).getPinHeaderPosition(snap.col) ?? board.getPinPosition('a', 1);
      } else {
         startPos = board.getPinPosition(snap.row, snap.col)
      }
      wiringState = { mode: 'WIRING', startPin: snap, startPos }

      startRing.position.set(startPos.x, startPos.y + 0.025, startPos.z)
      startRing.visible = true

      // Tiny offset so TubeGeometry doesn't degenerate with zero-length curve
      const nearbyPos = startPos.clone().add(new THREE.Vector3(0.02, 0, 0))
      wires.addWire('__preview', {
        pinA: startPos.clone(),
        pinB: nearbyPos,
        signalType: SignalType.GENERIC,
        dashed: true,
      })
    }

    const cancelWiringMode = () => {
      if (wiringState.mode === 'WIRING') wires.removeWire('__preview')
      wiringState = { mode: 'IDLE' }
      startRing.visible = false
      hoverRing.visible = false
    }

    // ── Cursor → world (status bar + pin rings + preview) ─────────────────
    const onMouseMove = (e: MouseEvent) => {
      toNdc(e.clientX, e.clientY)
      raycaster.setFromCamera(ndcPoint, camera)
      if (!raycaster.ray.intersectPlane(groundPlane, hitPoint)) return

      props.onCursorMove?.(hitPoint.x, hitPoint.z)

      const snap = snapToPin(hitPoint.x, hitPoint.z)

      // Hover ring
      if (snap) {
        let pinPos: THREE.Vector3;
        if (meshMap.has(snap.row)) {
           pinPos = (meshMap.get(snap.row) as any).getPinHeaderPosition(snap.col) ?? board.getPinPosition('a', 1);
        } else {
           pinPos = board.getPinPosition(snap.row, snap.col)
        }
        hoverRing.position.set(pinPos.x, pinPos.y + 0.025, pinPos.z)
        hoverRing.visible = true
      } else {
        hoverRing.visible = false
      }

      if (wiringState.mode === 'WIRING') {
        let endPos: THREE.Vector3;
        if (snap) {
           if (meshMap.has(snap.row)) {
             endPos = (meshMap.get(snap.row) as any).getPinHeaderPosition(snap.col) ?? board.getPinPosition('a', 1);
           } else {
             endPos = board.getPinPosition(snap.row, snap.col);
           }
        } else {
           endPos = new THREE.Vector3(hitPoint.x, wiringState.startPos.y, hitPoint.z);
        }
        wires.updatePins('__preview', wiringState.startPos, endPos)
      }
    }
    canvasRef.addEventListener('mousemove', onMouseMove)

    // ── Drag over canvas ──────────────────────────────────────────────────
    const onDragOver = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
      toNdc(e.clientX, e.clientY)
      raycaster.setFromCamera(ndcPoint, camera)
      if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
        showGhost(hitPoint.x, hitPoint.z)
      }
    }

    const onDragLeave = () => hideGhost()

    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      const type = e.dataTransfer?.getData('fermion/component') as ComponentType | undefined
      if (!type || !ghostSnap) { hideGhost(); return }

      const { row, col } = ghostSnap
      if (props.isOccupied?.(row, col)) { hideGhost(); return }

      const id = props.onComponentPlace?.(type, row, col)
      if (!id) { hideGhost(); return }

      const instance: PlacedComponent = {
        id,
        type,
        position: { row, col },
        rotation: 0,
        properties: {},
      }
      const mesh = ComponentRegistry.createMesh(scene, instance)
      mesh.setPosition(board)
      meshMap.set(id, mesh)
      hideGhost()
    }

    canvasRef.addEventListener('dragover', onDragOver)
    canvasRef.addEventListener('dragleave', onDragLeave)
    canvasRef.addEventListener('drop', onDrop)

    // ── Click → select / wire ─────────────────────────────────────────────
    let pointerDownXY = { x: 0, y: 0 }

    const onPointerDown = (e: PointerEvent) => {
      pointerDownXY = { x: e.clientX, y: e.clientY }
    }

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownXY.x
      const dy = e.clientY - pointerDownXY.y
      if (dx * dx + dy * dy > 16) return  // was a drag, not a click

      toNdc(e.clientX, e.clientY)
      raycaster.setFromCamera(ndcPoint, camera)

      // ── WIRING mode: complete or cancel ──────────────────────────────────
      if (wiringState.mode === 'WIRING') {
        if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
          const snap = snapToPin(hitPoint.x, hitPoint.z)
          const isSamePin =
            snap &&
            snap.row === wiringState.startPin.row &&
            snap.col === wiringState.startPin.col

          if (snap && !isSamePin) {
            let endPos: THREE.Vector3;
            if (meshMap.has(snap.row)) {
               endPos = (meshMap.get(snap.row) as any).getPinHeaderPosition(snap.col) ?? board.getPinPosition('a', 1);
            } else {
               endPos = board.getPinPosition(snap.row, snap.col)
            }
            const id = props.onWireCreate?.(wiringState.startPin, snap, 'GENERIC')
            if (id) {
              wires.removeWire('__preview')
              wires.addWire(id, {
                pinA: wiringState.startPos.clone(),
                pinB: endPos,
                signalType: SignalType.GENERIC,
              })
              wiringState = { mode: 'IDLE' }
              startRing.visible = false
              return
            }
          }
        }
        cancelWiringMode()
        return
      }

      // ── IDLE mode ─────────────────────────────────────────────────────────

      // 1. Check component hit
      const compObjects = [...meshMap.values()].map((m) => m.object3D)
      const compHits = raycaster.intersectObjects(compObjects, true)
      if (compHits.length > 0) {
        let node: THREE.Object3D | null = compHits[0]!.object
        while (node) {
          const id = node.userData['componentId'] as string | undefined
          if (id) { props.onComponentSelect?.(id); return }
          node = node.parent
        }
        props.onComponentSelect?.(null)
        return
      }

      // 2. Check wire hit
      const wireMeshes = wires.getMeshes().filter((m) => m.userData['wireId'] !== '__preview')
      const wireHits = raycaster.intersectObjects(wireMeshes, false)
      if (wireHits.length > 0) {
        const wireId = wireHits[0]!.object.userData['wireId'] as string | undefined
        if (wireId) { props.onWireSelect?.(wireId); return }
      }

      // 3. Check for pin → start wiring
      if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
        const snap = snapToPin(hitPoint.x, hitPoint.z)
        if (snap) {
          startWiringMode(snap)
          props.onComponentSelect?.(null)
          props.onWireSelect?.(null)
          return
        }
      }

      // 4. Deselect everything
      props.onComponentSelect?.(null)
      props.onWireSelect?.(null)
    }

    canvasRef.addEventListener('pointerdown', onPointerDown)
    canvasRef.addEventListener('pointerup', onPointerUp)

    // ── SceneAPI ──────────────────────────────────────────────────────────
    const api: SceneAPI = {
      removeComponent: (id) => {
        const mesh = meshMap.get(id)
        if (!mesh) return
        if (selectedMeshId === id) selectedMeshId = null
        mesh.dispose()
        meshMap.delete(id)
      },
      setSelectedComponent: (id) => {
        if (selectedMeshId) meshMap.get(selectedMeshId)?.setSelected(false)
        selectedMeshId = id
        if (id) meshMap.get(id)?.setSelected(true)
      },
      removeWire: (id) => {
        wires.removeWire(id)
        if (selectedWireId === id) selectedWireId = null
      },
      setSelectedWire: (id) => {
        if (selectedWireId) wires.setSelected(selectedWireId, false)
        selectedWireId = id
        if (id) wires.setSelected(id, true)
      },
      cancelWiring: () => {
        cancelWiringMode()
      },
      updateWireCurrent: (wireId, current) => {
        wires.updateCurrent(wireId, current)
      },
      updateComponentGlow: (compId, isOn, current) => {
        const mesh = meshMap.get(compId)
        if (!mesh) return
        // LedMesh exposes setGlow; check via duck-typing
        const led = mesh as unknown as { setGlow?: (on: boolean, current?: number) => void }
        led.setGlow?.(isOn, current)
      },
      updateAvrLeds: (compId, states) => {
        const mesh = meshMap.get(compId) as any;
        if (!mesh || !mesh.setLedState) return;
        mesh.setLedState('L', states.digital[13] === 1);
        mesh.setLedState('TX', states.digital[1] === 1);
        mesh.setLedState('RX', states.digital[0] === 1);
      },
      resetGlow: () => {
        for (const mesh of meshMap.values()) {
          const led = mesh as unknown as { setGlow?: (on: boolean, current?: number) => void }
          led.setGlow?.(false, 0)
        }
        for (const wireMesh of wires.getMeshes()) {
          const id = wireMesh.userData['wireId'] as string | undefined
          if (id) wires.updateCurrent(id, 0)
        }
      },
      loadCircuit: (components, wireData) => {
        // 1. Cancel any in-progress wiring
        cancelWiringMode()

        // 2. Dispose all existing component meshes
        for (const mesh of meshMap.values()) mesh.dispose()
        meshMap.clear()
        selectedMeshId = null

        // 3. Clear all existing wires (demo + user)
        wires.dispose()
        selectedWireId = null

        // 4. Recreate component meshes
        for (const comp of Object.values(components)) {
          const mesh = ComponentRegistry.createMesh(scene, comp)
          mesh.setPosition(board)
          meshMap.set(comp.id, mesh)
        }

        // 5. Recreate wire meshes
        for (const wire of Object.values(wireData)) {
          try {
            let pinA: THREE.Vector3, pinB: THREE.Vector3;
            
            // Resolve Pin A
            if (meshMap.has(wire.pinA.row)) {
              const mesh = meshMap.get(wire.pinA.row) as any;
              pinA = mesh.getPinHeaderPosition(wire.pinA.col) ?? board.getPinPosition('a', 1);
            } else {
              pinA = board.getPinPosition(wire.pinA.row, wire.pinA.col);
            }

            // Resolve Pin B
            if (meshMap.has(wire.pinB.row)) {
              const mesh = meshMap.get(wire.pinB.row) as any;
              pinB = mesh.getPinHeaderPosition(wire.pinB.col) ?? board.getPinPosition('a', 1);
            } else {
              pinB = board.getPinPosition(wire.pinB.row, wire.pinB.col);
            }

            wires.addWire(wire.id, {
              pinA,
              pinB,
              signalType: (wire.signalType as SignalType) ?? SignalType.GENERIC,
            })
          } catch {
            // Skip wires that reference unknown rows (e.g. power rail pins not in main grid)
          }
        }
      },
      captureThumb: () => renderer.domElement.toDataURL('image/png', 0.3),
    }
    props.onSceneReady?.(api)

    // ── Animation loop ────────────────────────────────────────────────────
    let rafId = 0
    const startTime = performance.now()
    let lastTime = startTime
    let frameCount = 0
    let fpsTimer = startTime

    const tick = () => {
      rafId = requestAnimationFrame(tick)
      const now = performance.now()
      const delta = (now - lastTime) / 1000
      const elapsed = (now - startTime) / 1000
      lastTime = now

      controller.update(delta)
      wires.update(elapsed)
      renderer.render(scene, camera)

      frameCount++
      if (now - fpsTimer >= 1000) {
        props.onFrame?.({ fps: frameCount, radius: controller.getState().radius })
        frameCount = 0
        fpsTimer = now
      }
    }
    tick()

    onCleanup(() => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      canvasRef.removeEventListener('mousemove', onMouseMove)
      canvasRef.removeEventListener('dragover', onDragOver)
      canvasRef.removeEventListener('dragleave', onDragLeave)
      canvasRef.removeEventListener('drop', onDrop)
      canvasRef.removeEventListener('pointerdown', onPointerDown)
      canvasRef.removeEventListener('pointerup', onPointerUp)
      hideGhost()
      ghostGeo.dispose()
      ghostMatOk.dispose()
      ghostMatBad.dispose()
      hoverRingGeo.dispose()
      hoverRingMat.dispose()
      startRingGeo.dispose()
      startRingMat.dispose()
      meshMap.forEach((m) => m.dispose())
      meshMap.clear()
      board.dispose()
      wires.dispose()
      renderer.dispose()
    })
  })

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair' }}
    />
  )
}
