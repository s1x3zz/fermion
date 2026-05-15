import { CylinderGeometry, MeshStandardMaterial, Mesh, Color, } from 'three';
import { ComponentMesh } from './ComponentMesh';
// ── Constants ─────────────────────────────────────────────────────────────────
const BODY_R = 0.045;
const BODY_LEN = 0.38;
const BAND_R = 0.047;
const BAND_LEN = 0.05;
const LEAD_R = 0.008;
const LEAD_LEN = 0.28;
const HOVER = 0.18; // body centre above board surface
// Cathode band position: near the +X end of the body
const BAND_X = BODY_LEN / 2 - BAND_LEN;
// ── DiodeMesh ─────────────────────────────────────────────────────────────────
export class DiodeMesh extends ComponentMesh {
    constructor(scene, instance) {
        super(scene, instance);
        this._build();
    }
    _build() {
        // ── Dark body ─────────────────────────────────────────────────────────────
        const bodyGeo = new CylinderGeometry(BODY_R, BODY_R, BODY_LEN, 12);
        const bodyMat = new MeshStandardMaterial({
            color: new Color(0x2a2a2a),
            roughness: 0.6,
            metalness: 0.05,
        });
        const body = new Mesh(bodyGeo, bodyMat);
        body.rotation.z = Math.PI / 2; // lie along X axis
        this.group.add(body);
        // ── Cathode band (silver ring near +X end) ────────────────────────────────
        const bandGeo = new CylinderGeometry(BAND_R, BAND_R, BAND_LEN, 12);
        const bandMat = new MeshStandardMaterial({
            color: new Color(0xe8e8e8),
            metalness: 0.5,
            roughness: 0.3,
        });
        const band = new Mesh(bandGeo, bandMat);
        band.rotation.z = Math.PI / 2;
        band.position.x = BAND_X;
        this.group.add(band);
        // ── Leads ─────────────────────────────────────────────────────────────────
        const leadGeo = new CylinderGeometry(LEAD_R, LEAD_R, LEAD_LEN, 6);
        const leadMat = new MeshStandardMaterial({
            color: new Color(0xc0c0c0),
            metalness: 0.9,
            roughness: 0.2,
        });
        for (const sign of [-1, 1]) {
            const lead = new Mesh(leadGeo, leadMat);
            lead.rotation.z = Math.PI / 2;
            lead.position.x = sign * (BODY_LEN / 2 + LEAD_LEN / 2);
            this.group.add(lead);
        }
    }
    setPosition(board) {
        const p1 = board.getPinPosition(this.instance.position.row, this.instance.position.col);
        const p2 = board.getPinPosition(this.instance.position.row, this.instance.position.col + 1);
        this.group.position.set((p1.x + p2.x) / 2, p1.y + HOVER, p1.z);
    }
}
//# sourceMappingURL=DiodeMesh.js.map