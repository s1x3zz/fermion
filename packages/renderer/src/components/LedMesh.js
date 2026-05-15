import { CylinderGeometry, SphereGeometry, BoxGeometry, MeshStandardMaterial, MeshPhysicalMaterial, Mesh, PointLight, Color, } from 'three';
import { ComponentMesh } from './ComponentMesh';
// ── Color map ─────────────────────────────────────────────────────────────────
const LED_HEX = {
    led_red: 0xff2020,
    led_green: 0x20ff40,
    led_blue: 0x2040ff,
    led_yellow: 0xffcc00,
};
// ── Constants ─────────────────────────────────────────────────────────────────
const BASE_BOT_R = 0.052; // base bottom radius
const BASE_TOP_R = 0.048; // base top radius (slight taper)
const BASE_H = 0.22; // base height
const DOME_R = 0.052; // dome sphere radius
const LEAD_R = 0.006;
const LEAD_LEN = 0.35;
const HOVER = 0.15; // group origin above board surface (lead bottom flush with board)
// ── LedMesh ───────────────────────────────────────────────────────────────────
export class LedMesh extends ComponentMesh {
    _baseMat;
    _domeMat;
    _light;
    _color;
    constructor(scene, instance) {
        super(scene, instance);
        const hex = LED_HEX[instance.type] ?? 0xffffff;
        this._color = new Color(hex);
        this._build();
    }
    _build() {
        const c = this._color;
        // ── Opaque plastic base ────────────────────────────────────────────────────
        const baseGeo = new CylinderGeometry(BASE_TOP_R, BASE_BOT_R, BASE_H, 16);
        this._baseMat = new MeshStandardMaterial({
            color: c,
            emissive: c,
            emissiveIntensity: 0.3,
            roughness: 0.35,
            metalness: 0.0,
        });
        const base = new Mesh(baseGeo, this._baseMat);
        // Base sits from Y=0 (board surface) to Y=BASE_H
        base.position.y = BASE_H / 2;
        this.group.add(base);
        // ── Flat-face notch (dark stripe indicating cathode / anode orientation) ───
        const notchGeo = new BoxGeometry(0.004, BASE_H + 0.002, BASE_BOT_R * 0.6);
        const notchMat = new MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        const notch = new Mesh(notchGeo, notchMat);
        notch.position.set(BASE_BOT_R - 0.002, BASE_H / 2, 0);
        this.group.add(notch);
        // ── Translucent dome ───────────────────────────────────────────────────────
        // Half-sphere opening downward, placed on top of base
        const domeGeo = new SphereGeometry(DOME_R, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        this._domeMat = new MeshPhysicalMaterial({
            color: c,
            transmission: 0.7,
            roughness: 0.05,
            thickness: 0.1,
            transparent: true,
            opacity: 0.85,
        });
        const dome = new Mesh(domeGeo, this._domeMat);
        dome.position.y = BASE_H; // sits on top of base
        this.group.add(dome);
        // ── Leads ──────────────────────────────────────────────────────────────────
        const leadGeo = new CylinderGeometry(LEAD_R, LEAD_R, LEAD_LEN, 6);
        const leadMat = new MeshStandardMaterial({
            color: 0xc0c0c0,
            metalness: 0.9,
            roughness: 0.2,
        });
        // Anode (longer, +X offset ~0.05) and cathode (shorter / centered at origin X)
        const anodeOffset = 0.05;
        const cathodeOffset = -0.05;
        const anodeExtraLen = 0.02;
        // Anode lead — slightly longer (lead extends below group origin into board)
        const anodeLead = new Mesh(new CylinderGeometry(LEAD_R, LEAD_R, LEAD_LEN + anodeExtraLen, 6), leadMat);
        anodeLead.position.set(anodeOffset, -(LEAD_LEN + anodeExtraLen) / 2, 0);
        this.group.add(anodeLead);
        // Cathode lead
        const cathodeLead = new Mesh(leadGeo, leadMat);
        cathodeLead.position.set(cathodeOffset, -LEAD_LEN / 2, 0);
        this.group.add(cathodeLead);
        // ── Interior point light ───────────────────────────────────────────────────
        this._light = new PointLight(this._color, 0, 0.8);
        this._light.position.y = BASE_H + DOME_R * 0.4;
        this.group.add(this._light);
    }
    /** Call each simulation frame. current > 0 means LED is conducting. */
    setGlow(glowing, _current = 0) {
        this._baseMat.emissiveIntensity = glowing ? 2.5 : 0.3;
        this._light.intensity = glowing ? 0.6 : 0.0;
    }
    setPosition(board) {
        const pos = board.getPinPosition(this.instance.position.row, this.instance.position.col);
        this.group.position.set(pos.x, pos.y + HOVER, pos.z);
    }
}
//# sourceMappingURL=LedMesh.js.map