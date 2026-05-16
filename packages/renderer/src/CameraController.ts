import {
  PerspectiveCamera,
  Vector2,
  Vector3,
  Spherical,
  Object3D,
  Scene,
  Box3,
  MathUtils,
  Raycaster,
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

// Reusable scratch vectors — never nested calls between _va/_vb
const _va = new Vector3()
const _vb = new Vector3()

export class CameraController {
  private camera: PerspectiveCamera
  private domElement: HTMLElement
  private scene: Scene | null = null

  // Invariant every frame: camera.position === pivot + sphericalOffset
  // pivot is the orbit/look-at center in world space.
  private pivot = new Vector3()
  private targetPivot = new Vector3()

  private spherical: Spherical        // current (rendered)
  private targetSpherical: Spherical  // desired (lerped toward)

  private dampingFactor: number
  private minRadius: number
  private maxRadius: number
  private zoomSpeed: number
  private orbitSpeed: number
  private panSpeed: number

  private isDragging = false
  private isPanning = false
  private activeButton = -1
  private lastPointer = new Vector2()
  private cursorNDC = new Vector2()
  private raycaster = new Raycaster()

  private animationId: number | null = null
  private lastClickTime = 0

  constructor(
    camera: PerspectiveCamera,
    domElement: HTMLElement,
    options: CameraControllerOptions = {},
  ) {
    this.camera = camera
    this.domElement = domElement

    this.dampingFactor = options.dampingFactor ?? 0.12
    this.minRadius = options.minRadius ?? 0.5
    this.maxRadius = options.maxRadius ?? 200
    this.zoomSpeed = options.zoomSpeed ?? 1.0
    this.orbitSpeed = options.orbitSpeed ?? 0.6
    this.panSpeed = options.panSpeed ?? 1.0

    // Derive initial spherical from camera.position (pivot = origin)
    _va.copy(camera.position)
    this.spherical = new Spherical().setFromVector3(_va)
    this.targetSpherical = this.spherical.clone()
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
    el.addEventListener('mousemove', this._onCursorTrack)
    window.addEventListener('mousemove', this._onMouseMove)
    window.addEventListener('mouseup', this._onMouseUp)
    window.addEventListener('keydown', this._onKeyDown)
  }

  dispose() {
    const el = this.domElement
    el.removeEventListener('contextmenu', this._onContextMenu)
    el.removeEventListener('mousedown', this._onMouseDown)
    el.removeEventListener('wheel', this._onWheel)
    el.removeEventListener('mousemove', this._onCursorTrack)
    window.removeEventListener('mousemove', this._onMouseMove)
    window.removeEventListener('mouseup', this._onMouseUp)
    window.removeEventListener('keydown', this._onKeyDown)
    if (this.animationId !== null) cancelAnimationFrame(this.animationId)
  }

  // ── Input handlers ─────────────────────────────────────────────────────────

  private _onCursorTrack = (e: MouseEvent) => {
    const rect = this.domElement.getBoundingClientRect()
    this.cursorNDC.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    )
  }

  private _onContextMenu = (e: Event) => e.preventDefault()

  private _onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      const now = performance.now()
      if (now - this.lastClickTime < 300 && this.scene) {
        this._doubleclickFocus(e)
      }
      this.lastClickTime = now
      this.isDragging = true
      this.isPanning = false
    } else if (e.button === 1 || e.button === 2) {
      this.isPanning = true
      this.isDragging = false
    } else {
      return
    }
    e.preventDefault()
    this.activeButton = e.button
    this.lastPointer.set(e.clientX, e.clientY)
  }

  private _onMouseMove = (e: MouseEvent) => {
    if (!this.isDragging && !this.isPanning) return
    const dx = e.clientX - this.lastPointer.x
    const dy = e.clientY - this.lastPointer.y
    this.lastPointer.set(e.clientX, e.clientY)

    if (this.isPanning) {
      this._pan(dx, dy)
    } else {
      // Orbit — pivot is NEVER modified here, only angles change
      const dTheta = -(dx / this.domElement.clientWidth) * Math.PI * 2 * this.orbitSpeed
      const dPhi = -(dy / this.domElement.clientHeight) * Math.PI * this.orbitSpeed
      this.targetSpherical.theta += dTheta
      this.targetSpherical.phi += dPhi
      this._clampSpherical(this.targetSpherical)
    }
  }

  private _onMouseUp = (e: MouseEvent) => {
    if (e.button !== this.activeButton) return
    this.isDragging = false
    this.isPanning = false
    this.activeButton = -1
  }

  private _onKeyDown = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return
    if (e.key === 'r' || e.key === 'R' || e.key === 'Home') {
      this.resetView()
    } else if (e.key === 'f' || e.key === 'F') {
      this._focusScene()
    }
  }

  private _onWheel = (e: WheelEvent) => {
    e.preventDefault()
    this._zoomTowardCursor(e.deltaY)
  }

  // ── Zoom ──────────────────────────────────────────────────────────────────
  //
  // KEY INSIGHT: when pivot changes, spherical must be immediately rebased so
  // that camera.position = newPivot + newOffset = same position (no jump).
  // Then we adjust radius for the actual zoom movement.

  private _zoomTowardCursor(deltaY: number) {
    const hitPoint = this._getZoomTarget()
    const camPos = this.camera.position.clone()

    // Vector from hitPoint to camera
    const toCamera = camPos.sub(hitPoint)  // camPos is already a clone
    const currentDist = toCamera.length()
    if (currentDist < 1e-6) return

    // Proportional speed: farther = faster scroll feel
    const distScale = MathUtils.clamp(currentDist / 10, 0.05, 3.0)
    const step = 0.12 * this.zoomSpeed * distScale
    const factor = deltaY > 0 ? 1 + step : 1 - step
    const newDist = MathUtils.clamp(currentDist * factor, this.minRadius, this.maxRadius)

    // New camera stays on same ray from hitPoint, just different distance
    const dir = toCamera.divideScalar(currentDist) // normalize (toCamera is a clone)
    const newCamPos = hitPoint.clone().addScaledVector(dir, newDist)

    // Rebase spherical: express (newCamPos - hitPoint) as spherical
    const newOffset = newCamPos.clone().sub(hitPoint)
    const newSph = new Spherical().setFromVector3(newOffset)
    this._clampSpherical(newSph)
    newSph.makeSafe()

    // Commit immediately — any lerp between old/new pivot causes position jumps
    this.pivot.copy(hitPoint)
    this.targetPivot.copy(hitPoint)
    this.spherical.copy(newSph)
    this.targetSpherical.copy(newSph)
  }

  private _getZoomTarget(): Vector3 {
    if (!this.scene) return this.pivot.clone()

    this.raycaster.setFromCamera(this.cursorNDC, this.camera)
    const hits = this.raycaster.intersectObjects(this.scene.children, true)
    if (hits.length > 0) return hits[0]!.point.clone()

    // Miss → try ground plane (Y = 0)
    const ray = this.raycaster.ray
    if (Math.abs(ray.direction.y) > 1e-6) {
      const t = -ray.origin.y / ray.direction.y
      if (t > 0 && t < this.maxRadius * 2) {
        return ray.origin.clone().addScaledVector(ray.direction, t)
      }
    }

    // Fallback: stay at current pivot (zoom in/out along orbit axis)
    return this.pivot.clone()
  }

  // ── Pan ────────────────────────────────────────────────────────────────────

  private _pan(dx: number, dy: number) {
    const distance = this.spherical.radius
    const scale = (distance * this.panSpeed) / this.domElement.clientHeight

    _va.setFromMatrixColumn(this.camera.matrix, 0) // camera right
    _vb.setFromMatrixColumn(this.camera.matrix, 1) // camera up

    const delta = new Vector3()
      .addScaledVector(_va, -dx * scale)
      .addScaledVector(_vb, dy * scale)

    // Apply immediately — no lerp lag during mouse drag
    this.pivot.add(delta)
    this.targetPivot.copy(this.pivot)
  }

  // ── Update (called each frame from render loop) ───────────────────────────

  update(dt: number = 1 / 60) {
    void dt

    const t = MathUtils.clamp(this.dampingFactor * 8, 0, 1)

    // Smooth orbit: lerp spherical toward target
    this.spherical.theta = _lerp(this.spherical.theta, this.targetSpherical.theta, t)
    this.spherical.phi = _lerp(this.spherical.phi, this.targetSpherical.phi, t)
    this.spherical.radius = _lerp(this.spherical.radius, this.targetSpherical.radius, t)

    // Smooth pivot: only active during focus/reset animations
    // (zoom and pan commit pivot immediately, so lerp is a no-op there)
    this.pivot.lerp(this.targetPivot, t)

    this._clampSpherical(this.spherical)
    this.spherical.makeSafe()

    _va.setFromSpherical(this.spherical)
    this.camera.position.copy(this.pivot).add(_va)
    this.camera.lookAt(this.pivot)
    this.camera.updateMatrixWorld()
  }

  // ── Focus animation ────────────────────────────────────────────────────────

  focusOn(object: Object3D, durationMs = 400) {
    const box = new Box3().setFromObject(object)
    const center = box.getCenter(new Vector3())
    const size = box.getSize(new Vector3()).length()
    const radius = MathUtils.clamp(size * 1.8, this.minRadius, this.maxRadius)
    this._animateTo(center, this.targetSpherical.theta, Math.PI / 5, radius, durationMs)
  }

  resetView(durationMs = 400) {
    const defaultPos = new Vector3(8, 8, 8)
    const sph = new Spherical().setFromVector3(defaultPos)
    this._animateTo(new Vector3(), sph.theta, sph.phi, sph.radius, durationMs)
  }

  // ── Preset views ───────────────────────────────────────────────────────────

  setView(view: 'front' | 'side' | 'top') {
    const r = this.targetSpherical.radius
    switch (view) {
      case 'front': this.targetSpherical.set(r, Math.PI / 2, 0);           break
      case 'side':  this.targetSpherical.set(r, Math.PI / 2, Math.PI / 2); break
      case 'top':   this.targetSpherical.set(r, 0.01, 0);                  break
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

  // ── Private helpers ────────────────────────────────────────────────────────

  private _animateTo(
    newPivot: Vector3,
    theta: number,
    phi: number,
    radius: number,
    durationMs: number,
  ) {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    // Snapshot current state (not target — use actual rendered state)
    const s0 = { theta: this.spherical.theta, phi: this.spherical.phi, radius: this.spherical.radius }
    const p0 = this.pivot.clone()
    const startTime = performance.now()

    const tick = () => {
      const elapsed = performance.now() - startTime
      const raw = Math.min(elapsed / durationMs, 1)
      const ease = _easeOut(raw)

      this.targetSpherical.theta = _lerp(s0.theta, theta, ease)
      this.targetSpherical.phi = _lerp(s0.phi, phi, ease)
      this.targetSpherical.radius = _lerp(s0.radius, radius, ease)
      this.targetPivot.lerpVectors(p0, newPivot, ease)

      if (raw < 1) {
        this.animationId = requestAnimationFrame(tick)
      } else {
        this.animationId = null
      }
    }

    this.animationId = requestAnimationFrame(tick)
  }

  private _focusScene() {
    if (!this.scene) return
    const box = new Box3()
    this.scene.traverse((child) => {
      if (child.type === 'Mesh' || child.type === 'InstancedMesh') {
        box.expandByObject(child)
      }
    })
    if (box.isEmpty()) { this.resetView(); return }
    const center = box.getCenter(new Vector3())
    const size = box.getSize(new Vector3()).length()
    const radius = MathUtils.clamp(size * 1.5, this.minRadius, this.maxRadius)
    this._animateTo(center, this.targetSpherical.theta, Math.PI / 5, radius, 400)
  }

  private _doubleclickFocus(e: MouseEvent) {
    if (!this.scene) return
    const rect = this.domElement.getBoundingClientRect()
    const ndc = new Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    )
    this.raycaster.setFromCamera(ndc, this.camera)
    const hits = this.raycaster.intersectObjects(this.scene.children, true)
    if (hits.length > 0) {
      this.focusOn(hits[0]!.object)
    }
  }

  private _clampSpherical(s: Spherical) {
    s.phi = MathUtils.clamp(s.phi, 0.01, Math.PI - 0.01)
    s.radius = MathUtils.clamp(s.radius, this.minRadius, this.maxRadius)
  }
}

function _lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function _easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3) // cubic ease-out
}
