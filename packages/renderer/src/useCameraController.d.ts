import type { PerspectiveCamera, Scene } from 'three';
import { CameraController, type CameraControllerOptions } from './CameraController';
/**
 * SolidJS primitive that creates a CameraController and registers cleanup.
 * Call inside a component that already has access to the Three.js objects.
 * The caller is responsible for calling controller.update(delta) each frame.
 */
export declare function useCameraController(camera: PerspectiveCamera, domElement: HTMLElement, scene: Scene, options?: CameraControllerOptions): CameraController;
//# sourceMappingURL=useCameraController.d.ts.map