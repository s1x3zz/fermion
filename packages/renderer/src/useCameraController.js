import { onCleanup } from 'solid-js';
import { CameraController } from './CameraController';
/**
 * SolidJS primitive that creates a CameraController and registers cleanup.
 * Call inside a component that already has access to the Three.js objects.
 * The caller is responsible for calling controller.update(delta) each frame.
 */
export function useCameraController(camera, domElement, scene, options) {
    const controller = new CameraController(camera, domElement, options);
    controller.setScene(scene);
    onCleanup(() => controller.dispose());
    return controller;
}
//# sourceMappingURL=useCameraController.js.map