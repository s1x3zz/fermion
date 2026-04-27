import {
  Scene,
  Vector3,
  CatmullRomCurve3,
  TubeGeometry,
  ShaderMaterial,
  Mesh,
  Color,
} from 'three'

// ── Signal types & colors ────────────────────────────────────────────────────

export enum SignalType {
  VCC_5V   = 'VCC_5V',
  VCC_3V3  = 'VCC_3V3',
  GND      = 'GND',
  DIGITAL  = 'DIGITAL',
  I2C_SDA  = 'I2C_SDA',
  I2C_SCL  = 'I2C_SCL',
  ANALOG   = 'ANALOG',
  GENERIC  = 'GENERIC',
}

const SIGNAL_COLORS: Record<SignalType, string> = {
  [SignalType.VCC_5V]:  '#ff2a2a',
  [SignalType.VCC_3V3]: '#ff8800',
  [SignalType.GND]:     '#1a1a1a',
  [SignalType.DIGITAL]: '#ffd400',
  [SignalType.I2C_SDA]: '#2070ff',
  [SignalType.I2C_SCL]: '#22cc22',
  [SignalType.ANALOG]:  '#f0f0f0',
  [SignalType.GENERIC]: '#9b59b6',
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface WireParams {
  pinA: Vector3
  pinB: Vector3
  normalA?: Vector3
  normalB?: Vector3
  signalType?: SignalType
}

// ── GLSL shaders ─────────────────────────────────────────────────────────────

const VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FRAG = /* glsl */`
uniform float uTime;
uniform float uCurrent;
uniform vec3  uColor;
varying vec2  vUv;

float particle(float u, float phase, float speed, float width) {
  float pos = mod(phase + uTime * speed, 1.0);
  float d   = abs(u - pos);
  // wrap-around distance
  d = min(d, 1.0 - d);
  return smoothstep(width, 0.0, d);
}

void main() {
  // Base wire with subtle ambient shading along the tube cross-section
  float rim   = abs(vUv.y - 0.5) * 2.0;           // 0 at centre, 1 at edges
  float shade = mix(1.0, 0.55, rim * rim);
  vec3  base  = uColor * shade;

  // Flowing particles along UV.x when current is active
  float flow = 0.0;
  if (uCurrent > 0.01) {
    flow += particle(vUv.x, 0.00, 0.35, 0.018) * uCurrent;
    flow += particle(vUv.x, 0.33, 0.35, 0.018) * uCurrent;
    flow += particle(vUv.x, 0.66, 0.35, 0.018) * uCurrent;
    // faster dim trail
    flow += particle(vUv.x, 0.16, 0.55, 0.010) * uCurrent * 0.5;
    flow += particle(vUv.x, 0.50, 0.55, 0.010) * uCurrent * 0.5;
    flow += particle(vUv.x, 0.82, 0.55, 0.010) * uCurrent * 0.5;
  }

  vec3  bright = mix(uColor, vec3(1.0), 0.75);
  vec3  color  = mix(base, bright, clamp(flow, 0.0, 1.0));
  float alpha  = 1.0;

  gl_FragColor = vec4(color, alpha);
}
`

// ── Internal wire entry ────────────────────────────────────────────────────

interface WireEntry {
  mesh: Mesh<TubeGeometry, ShaderMaterial>
}

// ── WireRenderer ─────────────────────────────────────────────────────────────

export class WireRenderer {
  private scene: Scene
  private wires = new Map<string, WireEntry>()

  constructor(scene: Scene) {
    this.scene = scene
  }

  addWire(id: string, params: WireParams): void {
    if (this.wires.has(id)) this.removeWire(id)

    const {
      pinA,
      pinB,
      normalA = new Vector3(0, 1, 0),
      normalB = new Vector3(0, 1, 0),
      signalType = SignalType.GENERIC,
    } = params

    // 4-point Catmull-Rom — exit/approach tangents via pin normals
    const ctrl0 = pinA.clone()
    const ctrl1 = pinA.clone().addScaledVector(normalA.clone().normalize(), 0.8)
    const ctrl2 = pinB.clone().addScaledVector(normalB.clone().normalize(), 0.8)
    const ctrl3 = pinB.clone()

    const curve = new CatmullRomCurve3([ctrl0, ctrl1, ctrl2, ctrl3], false, 'catmullrom', 0.5)
    const geo   = new TubeGeometry(curve, 64, 0.035, 8, false)

    const hex   = SIGNAL_COLORS[signalType]
    const color = new Color(hex)

    const mat = new ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime:    { value: 0 },
        uCurrent: { value: 0 },
        uColor:   { value: color },
      },
    })

    const mesh = new Mesh(geo, mat)
    mesh.name = `wire:${id}`
    this.scene.add(mesh)
    this.wires.set(id, { mesh })
  }

  removeWire(id: string): void {
    const entry = this.wires.get(id)
    if (!entry) return
    this.scene.remove(entry.mesh)
    entry.mesh.geometry.dispose()
    entry.mesh.material.dispose()
    this.wires.delete(id)
  }

  updateCurrent(id: string, current: number): void {
    const entry = this.wires.get(id)
    if (!entry) return
    entry.mesh.material.uniforms['uCurrent']!.value = Math.max(0, Math.min(1, current))
  }

  // Call each frame with total elapsed time in seconds
  update(time: number): void {
    for (const { mesh } of this.wires.values()) {
      mesh.material.uniforms['uTime']!.value = time
    }
  }

  dispose(): void {
    for (const id of [...this.wires.keys()]) this.removeWire(id)
  }
}
