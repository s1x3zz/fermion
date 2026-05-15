import type { CameraController } from '@fermion/renderer';
import type { PinPosition } from '@fermion/core';
export interface SceneAPI {
    removeComponent: (id: string) => void;
    setSelectedComponent: (id: string | null) => void;
    removeWire: (id: string) => void;
    setSelectedWire: (id: string | null) => void;
    cancelWiring: () => void;
    updateWireCurrent: (wireId: string, current: number) => void;
    updateComponentGlow: (compId: string, isOn: boolean, current: number) => void;
    updateAvrLeds: (compId: string, states: any) => void;
    resetGlow: () => void;
    loadCircuit: (components: Record<string, import('@fermion/core').PlacedComponent>, wireData: Record<string, import('@fermion/core').PlacedWire>) => void;
    captureThumb: () => string;
}
export interface SceneFrameInfo {
    fps: number;
    radius: number;
}
export interface SceneProps {
    onControllerReady?: (ctrl: CameraController) => void;
    onFrame?: (info: SceneFrameInfo) => void;
    onCursorMove?: (x: number, z: number) => void;
    isSimulating?: () => boolean;
    onSceneReady?: (api: SceneAPI) => void;
    onComponentPlace?: (type: string, row: string, col: number) => string;
    onComponentSelect?: (id: string | null) => void;
    isOccupied?: (row: string, col: number) => boolean;
    onWireCreate?: (pinA: PinPosition, pinB: PinPosition, signalType: string) => string;
    onWireSelect?: (id: string | null) => void;
}
export declare function Scene(props: SceneProps): import("solid-js").JSX.Element;
//# sourceMappingURL=Scene.d.ts.map