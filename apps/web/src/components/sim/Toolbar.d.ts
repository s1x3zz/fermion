import type { CameraController } from '@fermion/renderer';
interface ToolbarProps {
    controller: () => CameraController | null;
    radius: () => number;
    isDirty: () => boolean;
    onSave: () => void;
}
export declare function Toolbar(props: ToolbarProps): import("solid-js").JSX.Element;
export {};
//# sourceMappingURL=Toolbar.d.ts.map