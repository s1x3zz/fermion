import { CylinderGeometry, BoxGeometry, MeshStandardMaterial, Mesh, Color, } from 'three';
import { ComponentMesh } from './ComponentMesh';
// ── Constants ─────────────────────────────────────────────────────────────────
const LEAD_R = 0.006;
const LEAD_H = 0.30;
const BAR_H = 0.005;
const BAR_D = 0.02;
const BAR_GAP = 0.06;
const HOVER = 0.02;
const GND_COLOR = new Color(0x888888);
// ── GroundMesh ────────────────────────────────────────────────────────────────
export class GroundMesh extends ComponentMesh {
    constructor(scene, instance) {
        super(scene, instance);
        this._build();
    }
    _build() {
        const mat = new MeshStandardMaterial({ color: GND_COLOR, roughness: 0.7 });
        // ── Vertical lead ─────────────────────────────────────────────────────────
        const leadGeo = new CylinderGeometry(LEAD_R, LEAD_R, LEAD_H, 6);
        const lead = new Mesh(leadGeo, mat);
        lead.position.y = LEAD_H / 2;
        this.group.add(lead);
        // ── Horizontal bars (decreasing width, stacked downward from lead top) ────
        const barWidths = [0.30, 0.20, 0.10];
        const barY0 = LEAD_H + BAR_H / 2; // first bar just above lead top
        for (let i = 0; i < barWidths.length; i++) {
            const barGeo = new BoxGeometry(barWidths[i], BAR_H, BAR_D);
            const bar = new Mesh(barGeo, mat);
            bar.position.y = barY0 + i * BAR_GAP;
            this.group.add(bar);
        }
    }
    setPosition(board) {
        const pos = board.getPinPosition(this.instance.position.row, this.instance.position.col);
        this.group.position.set(pos.x, pos.y + HOVER, pos.z);
    }
}
//# sourceMappingURL=GroundMesh.js.map