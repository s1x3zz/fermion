import { Vector2, Vector3, Spherical, Box3, MathUtils, Raycaster, } from 'three';
const _v3a = new Vector3();
const _v3b = new Vector3();
export class CameraController {
    camera;
    domElement;
    scene = null;
    spherical;
    targetSpherical;
    pivot;
    targetPivot;
    dampingFactor;
    minRadius;
    maxRadius;
    zoomSpeed;
    orbitSpeed;
    panSpeed;
    isDragging = false;
    isPanning = false;
    activeButton = -1;
    lastPointer = new Vector2();
    cursorNDC = new Vector2();
    raycaster = new Raycaster();
    velocityTheta = 0;
    velocityPhi = 0;
    animating = false;
    animationId = null;
    constructor(camera, domElement, options = {}) {
        this.camera = camera;
        this.domElement = domElement;
        this.dampingFactor = options.dampingFactor ?? 0.08;
        this.minRadius = options.minRadius ?? 0.5;
        this.maxRadius = options.maxRadius ?? 500;
        this.zoomSpeed = options.zoomSpeed ?? 1.0;
        this.orbitSpeed = options.orbitSpeed ?? 0.6;
        this.panSpeed = options.panSpeed ?? 1.0;
        // Derive initial spherical from camera position
        _v3a.copy(camera.position);
        this.spherical = new Spherical().setFromVector3(_v3a);
        this.targetSpherical = this.spherical.clone();
        this.pivot = new Vector3();
        this.targetPivot = new Vector3();
        this._clampSpherical(this.spherical);
        this._clampSpherical(this.targetSpherical);
        this._bindEvents();
    }
    setScene(scene) {
        this.scene = scene;
    }
    // ── Event binding ──────────────────────────────────────────────────────────
    _bindEvents() {
        const el = this.domElement;
        el.addEventListener('contextmenu', this._onContextMenu);
        el.addEventListener('mousedown', this._onMouseDown);
        el.addEventListener('wheel', this._onWheel, { passive: false });
        el.addEventListener('mousemove', this._onCursorTrack);
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseup', this._onMouseUp);
    }
    dispose() {
        const el = this.domElement;
        el.removeEventListener('contextmenu', this._onContextMenu);
        el.removeEventListener('mousedown', this._onMouseDown);
        el.removeEventListener('wheel', this._onWheel);
        el.removeEventListener('mousemove', this._onCursorTrack);
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup', this._onMouseUp);
        if (this.animationId !== null)
            cancelAnimationFrame(this.animationId);
    }
    // ── Handlers ───────────────────────────────────────────────────────────────
    _onCursorTrack = (e) => {
        const rect = this.domElement.getBoundingClientRect();
        this.cursorNDC.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    };
    _onContextMenu = (e) => e.preventDefault();
    _onMouseDown = (e) => {
        if (e.button === 0) {
            this.isDragging = true;
            this.isPanning = false;
        }
        else if (e.button === 1 || e.button === 2) {
            this.isPanning = true;
            this.isDragging = false;
        }
        else {
            return;
        }
        e.preventDefault();
        this.activeButton = e.button;
        this.lastPointer.set(e.clientX, e.clientY);
        this.velocityTheta = 0;
        this.velocityPhi = 0;
    };
    _onMouseMove = (e) => {
        if (!this.isDragging && !this.isPanning)
            return;
        const dx = e.clientX - this.lastPointer.x;
        const dy = e.clientY - this.lastPointer.y;
        this.lastPointer.set(e.clientX, e.clientY);
        if (this.isPanning) {
            this._pan(dx, dy);
        }
        else {
            const dTheta = -(dx / this.domElement.clientWidth) * Math.PI * 2 * this.orbitSpeed;
            const dPhi = -(dy / this.domElement.clientHeight) * Math.PI * this.orbitSpeed;
            this.velocityTheta = dTheta;
            this.velocityPhi = dPhi;
            this.targetSpherical.theta += dTheta;
            this.targetSpherical.phi += dPhi;
            this._clampSpherical(this.targetSpherical);
        }
    };
    _onMouseUp = (e) => {
        if (e.button !== this.activeButton)
            return;
        this.isDragging = false;
        this.isPanning = false;
        this.activeButton = -1;
    };
    _onWheel = (e) => {
        e.preventDefault();
        // Raycast through cursor to find zoom pivot
        if (this.scene) {
            this.raycaster.setFromCamera(this.cursorNDC, this.camera);
            const hits = this.raycaster.intersectObjects(this.scene.children, true);
            if (hits.length > 0) {
                this.targetPivot.copy(hits[0].point);
            }
            else {
                // No hit — project along ray at current orbit radius
                this.raycaster.ray.at(this.targetSpherical.radius, this.targetPivot);
            }
        }
        // Scale zoom speed with distance so close-up scrolling stays fine-grained
        const distScale = MathUtils.clamp(this.targetSpherical.radius / 10, 0.1, 2.0);
        const factor = e.deltaY > 0
            ? 1 + 0.1 * this.zoomSpeed * distScale
            : 1 - 0.1 * this.zoomSpeed * distScale;
        this.targetSpherical.radius = MathUtils.clamp(this.targetSpherical.radius * factor, this.minRadius, this.maxRadius);
    };
    // ── Pan ────────────────────────────────────────────────────────────────────
    _pan(dx, dy) {
        const el = this.domElement;
        const distance = this.spherical.radius;
        // Right vector
        const right = new Vector3();
        right.setFromMatrixColumn(this.camera.matrix, 0);
        // Up vector (camera local up)
        const up = new Vector3();
        up.setFromMatrixColumn(this.camera.matrix, 1);
        const scale = (distance * this.panSpeed) / el.clientHeight;
        this.targetPivot.addScaledVector(right, -dx * scale);
        this.targetPivot.addScaledVector(up, dy * scale);
    }
    // ── Update (call each frame) ───────────────────────────────────────────────
    update(dt = 1 / 60) {
        void dt;
        if (!this.isDragging) {
            this.velocityTheta *= 1 - this.dampingFactor * 10;
            this.velocityPhi *= 1 - this.dampingFactor * 10;
        }
        // Lerp spherical toward target
        this.spherical.theta = _lerp(this.spherical.theta, this.targetSpherical.theta, this.dampingFactor * 8);
        this.spherical.phi = _lerp(this.spherical.phi, this.targetSpherical.phi, this.dampingFactor * 8);
        this.spherical.radius = _lerp(this.spherical.radius, this.targetSpherical.radius, this.dampingFactor * 8);
        // Lerp pivot
        this.pivot.lerp(this.targetPivot, this.dampingFactor * 8);
        this._clampSpherical(this.spherical);
        this.spherical.makeSafe();
        // Compute camera position from spherical + pivot
        _v3a.setFromSpherical(this.spherical);
        this.camera.position.copy(this.pivot).add(_v3a);
        this.camera.lookAt(this.pivot);
        this.camera.updateMatrixWorld();
    }
    // ── Focus animation ────────────────────────────────────────────────────────
    focusOn(object, durationMs = 600) {
        const box = new Box3().setFromObject(object);
        const center = box.getCenter(_v3b);
        const size = box.getSize(_v3a).length();
        const desiredRadius = size * 1.8;
        const startTheta = this.targetSpherical.theta;
        const startPhi = this.targetSpherical.phi;
        const startRadius = this.targetSpherical.radius;
        const startPivot = this.targetPivot.clone();
        const startTime = performance.now();
        const animate = () => {
            const t = Math.min((performance.now() - startTime) / durationMs, 1);
            const ease = _easeInOut(t);
            this.targetSpherical.theta = _lerp(startTheta, this.targetSpherical.theta, ease);
            this.targetSpherical.phi = _lerp(startPhi, Math.PI / 6, ease);
            this.targetSpherical.radius = _lerp(startRadius, desiredRadius, ease);
            this.targetPivot.lerpVectors(startPivot, center, ease);
            if (t < 1) {
                this.animationId = requestAnimationFrame(animate);
            }
            else {
                this.animating = false;
                this.animationId = null;
            }
        };
        this.animating = true;
        this.animationId = requestAnimationFrame(animate);
    }
    // ── Preset views ───────────────────────────────────────────────────────────
    setView(view) {
        const r = this.targetSpherical.radius;
        switch (view) {
            case 'front':
                this.targetSpherical.set(r, Math.PI / 2, 0);
                break;
            case 'side':
                this.targetSpherical.set(r, Math.PI / 2, Math.PI / 2);
                break;
            case 'top':
                this.targetSpherical.set(r, 0.01, 0);
                break;
        }
    }
    // ── State persistence ──────────────────────────────────────────────────────
    getState() {
        return {
            theta: this.targetSpherical.theta,
            phi: this.targetSpherical.phi,
            radius: this.targetSpherical.radius,
            target: [this.targetPivot.x, this.targetPivot.y, this.targetPivot.z],
        };
    }
    setState(state) {
        this.targetSpherical.set(state.radius, state.phi, state.theta);
        this.spherical.copy(this.targetSpherical);
        this.targetPivot.set(...state.target);
        this.pivot.copy(this.targetPivot);
    }
    // ── Helpers ────────────────────────────────────────────────────────────────
    _clampSpherical(s) {
        s.phi = MathUtils.clamp(s.phi, 0.01, Math.PI - 0.01);
        s.radius = MathUtils.clamp(s.radius, this.minRadius, this.maxRadius);
    }
}
function _lerp(a, b, t) {
    return a + (b - a) * t;
}
function _easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
//# sourceMappingURL=CameraController.js.map