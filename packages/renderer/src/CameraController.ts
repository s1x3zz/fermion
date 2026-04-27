import {
  PerspectiveCamera,
  Vector2,
  Vector3,
  Spherical,
  Raycaster,
  Object3D,
  Scene,
  Box3,
  MathUtils,
} from 'three'

export interface CameraState {
  theta: number
  phi: number
  radius: number
  target: [number, number, number]
}

export interface CameraControllerOptions {
  dampingFactor?: number
  minRadius?: number
  maxRadius?: number
  zoomSpeed?: number
  orbitSpeed?: number
  panSpeed?: number
}

const _v3a = new Vector3()
const _v3b = new Vector3()

export class CameraController {
  private camera: PerspectiveCamera
  private domElement: HTMLElement
  private scene: Scene | null = null

  private spherical: Spherical
  private targetSpherical: Spherical
  private pivot: Vector3
  private targetPivot: Vector3

  private dampingFactor: number
  private minRadius: number
  private maxRadius: number
  private zoomSpeed: number
  private orbitSpeed: number
  private panSpeed: number

  private isDragging = false
  private isPanning = false
  private lastPointer = new Vector2()

  private velocityTheta = 0
  private velocityPhi = 0

  private raycaster = new Raycaster()
  private animating = false
  private animationId: number | null = null

  constructor(
    camera: PerspectiveCamera,
    domElement: HTMLElement,
    options: CameraControllerOptions = {},
  ) {
    this.camera = camera
    this.domElement = domElement

    this.dampingFactor = options.dampingFactor ?? 0.08
    this.minRadius = options.minRadius ?? 0.5
    this.maxRadius = options.maxRadius ?? 500
    this.zoomSpeed = options.zoomSpeed ?? 1.0
    this.orbitSpeed = options.orbitSpeed ?? 0.6
    this.panSpeed = options.panSpeed ?? 1.0

    // Derive initial spherical from camera position
    _v3a.copy(camera.position)
    this.spherical = new Spherical().setFromVector3(_v3a)
    this.targetSpherical = this.spherical.clone()

    this.pivot = new Vector3()
    this.targetPivot = new Vector3()

    this._clampSpherical(this.spherical)
    this._clampSpherical(this.targetSpherical)

    this._bindEvents()
  }

  setScene(scene: Scene) {
    this.scene = scene
  }

  // ── Event binding ──────────────────────────────────────────────────────────

  private _bindEvents() {
    const el = this.domElement
    el.addEventListener('contextmenu', this._onContextMenu)
    el.addEventListener('mousedown', this._onMouseDown)
    el.addEventListener('wheel', this._onWheel, { passive: false })
    window.addEventListener('mousemove', this._onMouseMove)
    window.addEventListener('mouseup', this._onMouseUp)
  }

  dispose() {
    const el = this.domElement
    el.removeEventListener('contextmenu', this._onContextMenu)
    el.removeEventListener('mousedown', this._onMouseDown)
    el.removeEventListener('wheel', this._onWheel)
    window.removeEventListener('mousemove', this._onMouseMove)
    window.removeEventListener('mouseup', this._onMouseUp)
    if (this.animationId !== null) cancelAnimationFrame(this.animationId)
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  private _onContextMenu = (e: Event) => e.preventDefault()

  private _onMouseDown = (e: MouseEvent) => {
    if (e.button !== 1) return // middle mouse only
    e.preventDefault()
    const isShift = e.shiftKey
    this.isDragging = !isShift
    this.isPanning = isShift
    this.lastPointer.set(e.clientX, e.clientY)
    this.velocityTheta = 0
    this.velocityPhi = 0
  }

  private _onMouseMove = (e: MouseEvent) => {
    if (!this.isDragging && !this.isPanning) return

    const dx = e.clientX - this.lastPointer.x
    const dy = e.clientY - this.lastPointer.y
    this.lastPointer.set(e.clientX, e.clientY)

    if (this.isPanning) {
      this._pan(dx, dy)
    } else {
      const dTheta = -(dx / this.domElement.clientWidth) * Math.PI * 2 * this.orbitSpeed
      const dPhi = -(dy / this.domElement.clientHeight) * Math.PI * this.orbitSpeed

      this.velocityTheta = dTheta
      this.velocityPhi = dPhi

      this.targetSpherical.theta += dTheta
      this.targetSpherical.phi += dPhi
      this._clampSpherical(this.targetSpherical)
    }
  }

  private _onMouseUp = (e: MouseEvent) => {
    if (e.button !== 1) return
    this.isDragging = false
    this.isPanning = false
  }

  private _onWheel = (e: WheelEvent) => {
    e.preventDefault()

    // Update dynamic pivot via raycast under cursor
    this._updatePivotFromCursor(e.clientX, e.clientY)

    const factor = e.deltaY > 0 ? 1 + 0.1 * this.zoomSpeed : 1 - 0.1 * this.zoomSpeed
    this.targetSpherical.radius = MathUtils.clamp(
      this.targetSpherical.radius * factor,
      this.minRadius,
      this.maxRadius,
    )
  }

  // ── Pan ────────────────────────────────────────────────────────────────────

  private _pan(dx: number, dy: number) {
    const el = this.domElement
    const distance = this.spherical.radius

    // Right vector
    const right = new Vector3()
    right.setFromMatrixColumn(this.camera.matrix, 0)

    // Up vector (camera local up)
    const up = new Vector3()
    up.setFromMatrixColumn(this.camera.matrix, 1)

    const scale = (distance * this.panSpeed) / el.clientHeight

    this.targetPivot.addScaledVector(right, -dx * scale)
    this.targetPivot.addScaledVector(up, dy * scale)
  }

  // ── Raycast pivot ──────────────────────────────────────────────────────────

  private _updatePivotFromCursor(clientX: number, clientY: number) {
    if (!this.scene) return

    const rect = this.domElement.getBoundingClientRect()
    const ndc = new Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )

    this.raycaster.setFromCamera(ndc, this.camera)
    const intersects = this.raycaster.intersectObjects(this.scene.children, true)

    if (intersects.length > 0 && intersects[0]) {
      this.targetPivot.copy(intersects[0].point)
    }
  }

  // ── Update (call each frame) ───────────────────────────────────────────────

  update(dt: number = 1 / 60) {
    void dt

    if (!this.isDragging) {
      this.velocityTheta *= 1 - this.dampingFactor * 10
      this.velocityPhi *= 1 - this.dampingFactor * 10
    }

    // Lerp spherical toward target
    this.spherical.theta = _lerp(this.spherical.theta, this.targetSpherical.theta, this.dampingFactor * 8)
    this.spherical.phi = _lerp(this.spherical.phi, this.targetSpherical.phi, this.dampingFactor * 8)
    this.spherical.radius = _lerp(this.spherical.radius, this.targetSpherical.radius, this.dampingFactor * 8)

    // Lerp pivot
    this.pivot.lerp(this.targetPivot, this.dampingFactor * 8)

    this._clampSpherical(this.spherical)
    this.spherical.makeSafe()

    // Compute camera position from spherical + pivot
    _v3a.setFromSpherical(this.spherical)
    this.camera.position.copy(this.pivot).add(_v3a)
    this.camera.lookAt(this.pivot)
    this.camera.updateMatrixWorld()
  }

  // ── Focus animation ────────────────────────────────────────────────────────

  focusOn(object: Object3D, durationMs = 600) {
    const box = new Box3().setFromObject(object)
    const center = box.getCenter(_v3b)
    const size = box.getSize(_v3a).length()
    const desiredRadius = size * 1.8

    const startTheta = this.targetSpherical.theta
    const startPhi = this.targetSpherical.phi
    const startRadius = this.targetSpherical.radius
    const startPivot = this.targetPivot.clone()

    const startTime = performance.now()

    const animate = () => {
      const t = Math.min((performance.now() - startTime) / durationMs, 1)
      const ease = _easeInOut(t)

      this.targetSpherical.theta = _lerp(startTheta, this.targetSpherical.theta, ease)
      this.targetSpherical.phi = _lerp(startPhi, Math.PI / 6, ease)
      this.targetSpherical.radius = _lerp(startRadius, desiredRadius, ease)
      this.targetPivot.lerpVectors(startPivot, center, ease)

      if (t < 1) {
        this.animationId = requestAnimationFrame(animate)
      } else {
        this.animating = false
        this.animationId = null
      }
    }

    this.animating = true
    this.animationId = requestAnimationFrame(animate)
  }

  // ── Preset views ───────────────────────────────────────────────────────────

  setView(view: 'front' | 'side' | 'top') {
    const r = this.targetSpherical.radius
    switch (view) {
      case 'front':
        this.targetSpherical.set(r, Math.PI / 2, 0)
        break
      case 'side':
        this.targetSpherical.set(r, Math.PI / 2, Math.PI / 2)
        break
      case 'top':
        this.targetSpherical.set(r, 0.01, 0)
        break
    }
  }

  // ── State persistence ──────────────────────────────────────────────────────

  getState(): CameraState {
    return {
      theta: this.targetSpherical.theta,
      phi: this.targetSpherical.phi,
      radius: this.targetSpherical.radius,
      target: [this.targetPivot.x, this.targetPivot.y, this.targetPivot.z],
    }
  }

  setState(state: CameraState) {
    this.targetSpherical.set(state.radius, state.phi, state.theta)
    this.spherical.copy(this.targetSpherical)
    this.targetPivot.set(...state.target)
    this.pivot.copy(this.targetPivot)
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private _clampSpherical(s: Spherical) {
    s.phi = MathUtils.clamp(s.phi, 0.01, Math.PI - 0.01)
    s.radius = MathUtils.clamp(s.radius, this.minRadius, this.maxRadius)
  }
}

function _lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function _easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

