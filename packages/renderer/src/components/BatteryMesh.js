import { BoxGeometry, CylinderGeometry, MeshStandardMaterial, Mesh, Color, } from 'three';
import { ComponentMesh } from './ComponentMesh';
// ── BatteryMesh — PP3 / 9V block form ────────────────────────────────────────
export class BatteryMesh extends ComponentMesh {
    constructor(scene, instance) {
        super(scene, instance);
        this._build();
    }
    _build() {
        // ── Main body ─────────────────────────────────────────────────────────────
        const bodyGeo = new BoxGeometry(0.68, 1.1, 0.4);
        const bodyMat = new MeshStandardMaterial({
            color: new Color(0x1a1a1a),
            roughness: 0.6,
            metalness: 0.05,
        });
        const body = new Mesh(bodyGeo, bodyMat);
        // Centre of body at y = 0.55 so that bottom face is at y = 0
        body.position.y = 0.55;
        this.group.add(body);
        // ── Top face detail strip ─────────────────────────────────────────────────
        const topFaceGeo = new BoxGeometry(0.65, 0.02, 0.38);
        const topFaceMat = new MeshStandardMaterial({
            color: new Color(0x222222),
            roughness: 0.5,
        });
        const topFace = new Mesh(topFaceGeo, topFaceMat);
        topFace.position.y = 1.1 + 0.01; // just above top of body
        this.group.add(topFace);
        // ── Positive terminal (red, +X side) ─────────────────────────────────────
        const posGeo = new CylinderGeometry(0.07, 0.07, 0.08, 12);
        const posMat = new MeshStandardMaterial({
            color: new Color(0xcc2200),
            roughness: 0.4,
            metalness: 0.2,
        });
        const posT = new Mesh(posGeo, posMat);
        posT.position.set(0.18, 1.1 + 0.04, 0);
        this.group.add(posT);
        // ── Negative terminal (dark with ring, -X side) ───────────────────────────
        const negOuterGeo = new CylinderGeometry(0.09, 0.09, 0.06, 12);
        const negMat = new MeshStandardMaterial({
            color: new Color(0x222222),
            roughness: 0.4,
            metalness: 0.3,
        });
        const negT = new Mesh(negOuterGeo, negMat);
        negT.position.set(-0.18, 1.1 + 0.03, 0);
        this.group.add(negT);
        // Inner ring highlight
        const negRingGeo = new CylinderGeometry(0.065, 0.065, 0.065, 12);
        const negRingMat = new MeshStandardMaterial({
            color: new Color(0x555555),
            metalness: 0.6,
            roughness: 0.3,
        });
        const negRing = new Mesh(negRingGeo, negRingMat);
        negRing.position.set(-0.18, 1.1 + 0.033, 0);
        this.group.add(negRing);
        // ── Label face (dark blue front panel) ───────────────────────────────────
        const labelGeo = new BoxGeometry(0.66, 0.6, 0.01);
        const labelMat = new MeshStandardMaterial({
            color: new Color(0x1a237e),
            roughness: 0.4,
        });
        const label = new Mesh(labelGeo, labelMat);
        label.position.set(0, 0.55, 0.205);
        this.group.add(label);
        // ── "9V" approximation — two white boxes ──────────────────────────────────
        const textMat = new MeshStandardMaterial({ color: new Color(0xffffff), roughness: 0.8 });
        // "9" — small square + arc hint (two rects)
        const nineA = new Mesh(new BoxGeometry(0.06, 0.04, 0.008), textMat);
        nineA.position.set(-0.09, 0.60, 0.21);
        this.group.add(nineA);
        const nineB = new Mesh(new BoxGeometry(0.04, 0.09, 0.008), textMat);
        nineB.position.set(-0.07, 0.555, 0.21);
        this.group.add(nineB);
        // "V" — two diagonal-ish rects
        const vLeft = new Mesh(new BoxGeometry(0.025, 0.09, 0.008), textMat);
        vLeft.position.set(0.04, 0.555, 0.21);
        vLeft.rotation.z = 0.3;
        this.group.add(vLeft);
        const vRight = new Mesh(new BoxGeometry(0.025, 0.09, 0.008), textMat);
        vRight.position.set(0.085, 0.555, 0.21);
        vRight.rotation.z = -0.3;
        this.group.add(vRight);
        // ── Wire leads from bottom ────────────────────────────────────────────────
        const leadGeo = new CylinderGeometry(0.008, 0.008, 0.35, 6);
        const leadMat = new MeshStandardMaterial({
            color: new Color(0xc0c0c0),
            metalness: 0.9,
            roughness: 0.2,
        });
        for (const xOff of [-0.12, 0.12]) {
            const lead = new Mesh(leadGeo, leadMat);
            lead.position.set(xOff, -0.175, 0);
            this.group.add(lead);
        }
    }
    setPosition(board) {
        // Float to the left of the board, not pin-snapped
        const leftEdge = board.getPinPosition('a', 1);
        this.group.position.set(leftEdge.x - 1.8, 0, 0);
    }
}
//# sourceMappingURL=BatteryMesh.js.map