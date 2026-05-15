import { Vector3, CatmullRomCurve3, TubeGeometry, ShaderMaterial, Mesh, Color, } from 'three';
// ── Signal types & colors ────────────────────────────────────────────────────
export var SignalType;
(function (SignalType) {
    SignalType["VCC_5V"] = "VCC_5V";
    SignalType["VCC_3V3"] = "VCC_3V3";
    SignalType["GND"] = "GND";
    SignalType["DIGITAL"] = "DIGITAL";
    SignalType["I2C_SDA"] = "I2C_SDA";
    SignalType["I2C_SCL"] = "I2C_SCL";
    SignalType["ANALOG"] = "ANALOG";
    SignalType["GENERIC"] = "GENERIC";
})(SignalType || (SignalType = {}));
const SIGNAL_COLORS = {
    [SignalType.VCC_5V]: '#ff2a2a',
    [SignalType.VCC_3V3]: '#ff8800',
    [SignalType.GND]: '#1a1a1a',
    [SignalType.DIGITAL]: '#ffd400',
    [SignalType.I2C_SDA]: '#2070ff',
    [SignalType.I2C_SCL]: '#22cc22',
    [SignalType.ANALOG]: '#f0f0f0',
    [SignalType.GENERIC]: '#9b59b6',
};
// ── GLSL shaders ─────────────────────────────────────────────────────────────
const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const FRAG = /* glsl */ `
uniform float uTime;
uniform float uCurrent;
uniform vec3  uColor;
uniform float uDashed;
uniform float uSelected;
varying vec2  vUv;

float particle(float u, float phase, float speed, float width) {
  float pos = mod(phase + uTime * speed, 1.0);
  float d   = abs(u - pos);
  d = min(d, 1.0 - d);
  return smoothstep(width, 0.0, d);
}

void main() {
  if (uDashed > 0.5) {
    float dash = mod(vUv.x * 12.0 - uTime * 1.5, 1.0);
    if (dash > 0.55) discard;
  }

  float rim   = abs(vUv.y - 0.5) * 2.0;
  float shade = mix(1.0, 0.55, rim * rim);
  vec3  base  = uColor * shade;

  float flow = 0.0;
  if (uCurrent > 0.01) {
    flow += particle(vUv.x, 0.00, 0.35, 0.018) * uCurrent;
    flow += particle(vUv.x, 0.33, 0.35, 0.018) * uCurrent;
    flow += particle(vUv.x, 0.66, 0.35, 0.018) * uCurrent;
    flow += particle(vUv.x, 0.16, 0.55, 0.010) * uCurrent * 0.5;
    flow += particle(vUv.x, 0.50, 0.55, 0.010) * uCurrent * 0.5;
    flow += particle(vUv.x, 0.82, 0.55, 0.010) * uCurrent * 0.5;
  }

  vec3  bright = mix(uColor, vec3(1.0), 0.75);
  vec3  color  = mix(base, bright, clamp(flow, 0.0, 1.0));

  if (uSelected > 0.5) {
    color = mix(color, vec3(0.3, 0.6, 1.0), 0.45);
  }

  gl_FragColor = vec4(color, 1.0);
}
`;
// ── Curve builder ─────────────────────────────────────────────────────────────
function buildTube(pinA, pinB, normalA, normalB) {
    const dist = pinA.distanceTo(pinB);
    const lift = Math.min(Math.max(dist * 0.5, 0.4), 1.2);
    const ctrl0 = pinA.clone();
    const ctrl1 = pinA.clone().addScaledVector(normalA.clone().normalize(), lift);
    const ctrl2 = pinB.clone().addScaledVector(normalB.clone().normalize(), lift);
    const ctrl3 = pinB.clone();
    const curve = new CatmullRomCurve3([ctrl0, ctrl1, ctrl2, ctrl3], false, 'catmullrom', 0.5);
    return new TubeGeometry(curve, 48, 0.035, 8, false);
}
// ── WireRenderer ─────────────────────────────────────────────────────────────
export class WireRenderer {
    scene;
    wires = new Map();
    constructor(scene) {
        this.scene = scene;
    }
    addWire(id, params) {
        if (this.wires.has(id))
            this.removeWire(id);
        const { pinA, pinB, normalA = new Vector3(0, 1, 0), normalB = new Vector3(0, 1, 0), signalType = SignalType.GENERIC, dashed = false, } = params;
        const geo = buildTube(pinA, pinB, normalA, normalB);
        const color = new Color(SIGNAL_COLORS[signalType]);
        const mat = new ShaderMaterial({
            vertexShader: VERT,
            fragmentShader: FRAG,
            uniforms: {
                uTime: { value: 0 },
                uCurrent: { value: 0 },
                uColor: { value: color },
                uDashed: { value: dashed ? 1.0 : 0.0 },
                uSelected: { value: 0.0 },
            },
            transparent: dashed,
        });
        const mesh = new Mesh(geo, mat);
        mesh.name = `wire:${id}`;
        mesh.userData['wireId'] = id;
        this.scene.add(mesh);
        this.wires.set(id, {
            mesh,
            pinA: pinA.clone(),
            pinB: pinB.clone(),
            normalA: normalA.clone().normalize(),
            normalB: normalB.clone().normalize(),
            signalType,
        });
    }
    removeWire(id) {
        const entry = this.wires.get(id);
        if (!entry)
            return;
        this.scene.remove(entry.mesh);
        entry.mesh.geometry.dispose();
        entry.mesh.material.dispose();
        this.wires.delete(id);
    }
    updatePins(id, pinA, pinB) {
        const entry = this.wires.get(id);
        if (!entry)
            return;
        entry.mesh.geometry.dispose();
        entry.mesh.geometry = buildTube(pinA, pinB, entry.normalA, entry.normalB);
        entry.pinA = pinA.clone();
        entry.pinB = pinB.clone();
    }
    updateCurrent(id, current) {
        const entry = this.wires.get(id);
        if (!entry)
            return;
        entry.mesh.material.uniforms['uCurrent'].value = Math.max(0, Math.min(1, current));
    }
    setSelected(id, selected) {
        const entry = this.wires.get(id);
        if (!entry)
            return;
        entry.mesh.material.uniforms['uSelected'].value = selected ? 1.0 : 0.0;
    }
    setDashed(id, dashed) {
        const entry = this.wires.get(id);
        if (!entry)
            return;
        entry.mesh.material.uniforms['uDashed'].value = dashed ? 1.0 : 0.0;
        entry.mesh.material.transparent = dashed;
    }
    updateSignalType(id, signalType) {
        const entry = this.wires.get(id);
        if (!entry)
            return;
        entry.mesh.material.uniforms['uColor'].value = new Color(SIGNAL_COLORS[signalType]);
        entry.signalType = signalType;
    }
    getMeshes() {
        return [...this.wires.values()].map((e) => e.mesh);
    }
    update(time) {
        for (const { mesh } of this.wires.values()) {
            mesh.material.uniforms['uTime'].value = time;
        }
    }
    dispose() {
        for (const id of [...this.wires.keys()])
            this.removeWire(id);
    }
}
//# sourceMappingURL=WireRenderer.js.map