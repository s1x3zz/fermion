import { CylinderGeometry, BoxGeometry, MeshStandardMaterial, Mesh, Color, } from 'three';
import { ComponentMesh } from './ComponentMesh';
// ── Constants ─────────────────────────────────────────────────────────────────
const BODY_R = 0.12;
const BODY_H = 0.45;
const CAP_H = 0.02;
const LEAD_R = 0.008;
const LEAD_LEN = 0.22; // length below board surface
const LEAD_SPACING = 0.1;
const HOVER = 0.10; // group origin above board (lead root)
// ── CapacitorMesh ─────────────────────────────────────────────────────────────
export class CapacitorMesh extends ComponentMesh {
    constructor(scene, instance) {
        super(scene, instance);
        this._build();
    }
    _build() {
        // ── Body (dark blue electrolytic sleeve) ──────────────────────────────────
        const bodyGeo = new CylinderGeometry(BODY_R, BODY_R, BODY_H, 16);
        const bodyMat = new MeshStandardMaterial({
            color: new Color(0x1a237e),
            roughness: 0.6,
            metalness: 0.05,
        });
        const body = new Mesh(bodyGeo, bodyMat);
        body.position.y = BODY_H / 2;
        this.group.add(body);
        // ── Aluminum top cap ──────────────────────────────────────────────────────
        const capGeo = new CylinderGeometry(BODY_R, BODY_R, CAP_H, 16);
        const capMat = new MeshStandardMaterial({
            color: new Color(0xc8c8c8),
            metalness: 0.8,
            roughness: 0.25,
        });
        const cap = new Mesh(capGeo, capMat);
        cap.position.y = BODY_H + CAP_H / 2;
        this.group.add(cap);
        // ── White polarity stripe on the side ─────────────────────────────────────
        const stripeGeo = new BoxGeometry(0.005, BODY_H, 0.08);
        const stripeMat = new MeshStandardMaterial({
            color: new Color(0xffffff),
            roughness: 0.7,
        });
        const stripe = new Mesh(stripeGeo, stripeMat);
        // Place on one side of the body (+X)
        stripe.position.set(BODY_R + 0.001, BODY_H / 2, 0);
        this.group.add(stripe);
        // ── Leads ─────────────────────────────────────────────────────────────────
        const leadGeo = new CylinderGeometry(LEAD_R, LEAD_R, LEAD_LEN, 6);
        const leadMat = new MeshStandardMaterial({
            color: new Color(0xc0c0c0),
            metalness: 0.9,
            roughness: 0.2,
        });
        for (const xOff of [-LEAD_SPACING / 2, LEAD_SPACING / 2]) {
            const lead = new Mesh(leadGeo, leadMat);
            lead.position.set(xOff, -LEAD_LEN / 2, 0);
            this.group.add(lead);
        }
    }
    setPosition(board) {
        const pos = board.getPinPosition(this.instance.position.row, this.instance.position.col);
        this.group.position.set(pos.x, pos.y + HOVER, pos.z);
    }
}
//# sourceMappingURL=CapacitorMesh.js.map