import { PerspectiveCamera, Object3D, Scene } from 'three';
export interface CameraState {
    theta: number;
    phi: number;
    radius: number;
    target: [number, number, number];
}
export interface CameraControllerOptions {
    dampingFactor?: number;
    minRadius?: number;
    maxRadius?: number;
    zoomSpeed?: number;
    orbitSpeed?: number;
    panSpeed?: number;
}
export declare class CameraController {
    private camera;
    private domElement;
    private scene;
    private spherical;
    private targetSpherical;
    private pivot;
    private targetPivot;
    private dampingFactor;
    private minRadius;
    private maxRadius;
    private zoomSpeed;
    private orbitSpeed;
    private panSpeed;
    private isDragging;
    private isPanning;
    private activeButton;
    private lastPointer;
    private cursorNDC;
    private raycaster;
    private velocityTheta;
    private velocityPhi;
    private animating;
    private animationId;
    constructor(camera: PerspectiveCamera, domElement: HTMLElement, options?: CameraControllerOptions);
    setScene(scene: Scene): void;
    private _bindEvents;
    dispose(): void;
    private _onCursorTrack;
    private _onContextMenu;
    private _onMouseDown;
    private _onMouseMove;
    private _onMouseUp;
    private _onWheel;
    private _pan;
    update(dt?: number): void;
    focusOn(object: Object3D, durationMs?: number): void;
    setView(view: 'front' | 'side' | 'top'): void;
    getState(): CameraState;
    setState(state: CameraState): void;
    private _clampSpherical;
}
//# sourceMappingURL=CameraController.d.ts.map