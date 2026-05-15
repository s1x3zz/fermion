import { Group, Box3, Vector3, BoxGeometry, EdgesGeometry, LineSegments, LineBasicMaterial, } from 'three';
export class ComponentMesh {
    scene;
    group;
    instance;
    _selIndicator = null;
    constructor(scene, instance) {
        this.scene = scene;
        this.instance = instance;
        this.group = new Group();
        this.group.name = `comp:${instance.id}`;
        this.group.userData['componentId'] = instance.id;
        scene.add(this.group);
    }
    get object3D() { return this.group; }
    /** Default: positions at primary pin, slightly elevated. Override for multi-pin components. */
    setPosition(board) {
        const pos = board.getPinPosition(this.instance.position.row, this.instance.position.col);
        this.group.position.set(pos.x, pos.y + 0.18, pos.z);
    }
    setSelected(selected) {
        // Remove existing indicator
        if (this._selIndicator) {
            this.group.remove(this._selIndicator);
            this._selIndicator.geometry.dispose();
            this._selIndicator.material.dispose();
            this._selIndicator = null;
        }
        if (!selected)
            return;
        // Build a wireframe bounding box around the group
        const box = new Box3().setFromObject(this.group);
        const size = new Vector3();
        const center = new Vector3();
        box.getSize(size);
        box.getCenter(center);
        this.group.worldToLocal(center);
        const geo = new BoxGeometry(Math.max(size.x + 0.07, 0.18), Math.max(size.y + 0.07, 0.18), Math.max(size.z + 0.07, 0.18));
        const edges = new EdgesGeometry(geo);
        geo.dispose();
        const mat = new LineBasicMaterial({ color: 0x3b8bff });
        const lines = new LineSegments(edges, mat);
        lines.position.copy(center);
        this.group.add(lines);
        this._selIndicator = lines;
    }
    dispose() {
        this.setSelected(false);
        this.scene.remove(this.group);
        this.group.traverse((obj) => {
            const mesh = obj;
            if (!mesh.isMesh)
                return;
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => m.dispose());
            }
            else {
                mesh.material.dispose();
            }
        });
    }
}
//# sourceMappingURL=ComponentMesh.js.map