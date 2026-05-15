import {
  Scene,
  CylinderGeometry,
  MeshStandardMaterial,
  Mesh,
  Color,
} from 'three'
import type { PlacedComponent } from '@fermion/core'
import type { Breadboard } from '../Breadboard'
import { ComponentMesh } from './ComponentMesh'

// ── Resistor color code ───────────────────────────────────────────────────────

const BAND_COLOR_HEX: readonly number[] = [
  0x000000, // 0 black
  0x6b3a2a, // 1 brown
  0xcc2200, // 2 red
  0xff6600, // 3 orange
  0xffcc00, // 4 yellow
  0x226622, // 5 green
  0x2244cc, // 6 blue
  0x7b3fa0, // 7 violet
  0x888888, // 8 gray
  0xffffff, // 9 white
]

const GOLD_HEX   = 0xcfb53b
const SILVER_HEX = 0xc0c0c0

/**
 * Decode ohm value into 4-band resistor colors.
 * Returns [digit1, digit2, multiplier, tolerance] hex values.
 * Falls back to 330 Ω (orange, orange, brown, gold) for invalid input.
 */
function decodeBands(ohms: number): [number, number, number, number] {
  if (!Number.isFinite(ohms) || ohms <= 0) {
    return [0xff6600, 0xff6600, 0x6b3a2a, GOLD_HEX] // 330 Ω default
  }

  // Find mantissa + exponent in base-10 so that significand ∈ [10, 99]
  let exp = Math.floor(Math.log10(ohms)) - 1
  let sig = Math.round(ohms / Math.pow(10, exp))

  // Clamp to valid 2-digit range
  if (sig > 99) { sig = Math.round(sig / 10); exp++ }
  if (sig < 10) { sig = Math.round(sig * 10); exp-- }

  const d1 = Math.floor(sig / 10)
  const d2 = sig % 10

  const d1hex = BAND_COLOR_HEX[d1] ?? 0x000000
  const d2hex = BAND_COLOR_HEX[d2] ?? 0x000000
  const mulHex = exp >= 0 && exp <= 9 ? (BAND_COLOR_HEX[exp] ?? 0x000000) : SILVER_HEX

  return [d1hex, d2hex, mulHex, GOLD_HEX]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PITCH    = 0.254
const BODY_R   = 0.055
const BODY_LEN = 0.55
const BAND_R   = 0.057
const BAND_LEN = 0.06
const LEAD_R   = 0.008
const LEAD_LEN = 0.32
const HOVER    = 0.20   // body centre above board surface

// Band X positions along the horizontal body
const BAND_X = [-0.18, -0.06, 0.06, 0.22] as const

// ── ResistorMesh ──────────────────────────────────────────────────────────────

export class ResistorMesh extends ComponentMesh {
  constructor(scene: Scene, instance: PlacedComponent) {
    super(scene, instance)
    this._build()
  }

  private _build(): void {
    const ohms = typeof this.instance.value === 'number' ? this.instance.value : 330

    // ── Body ──────────────────────────────────────────────────────────────────
    const bodyGeo = new CylinderGeometry(BODY_R, BODY_R, BODY_LEN, 12)
    const bodyMat = new MeshStandardMaterial({
      color: new Color(0xd4a574),
      roughness: 0.8,
      metalness: 0.1,
    })
    const body = new Mesh(bodyGeo, bodyMat)
    body.rotation.z = Math.PI / 2   // lie along X axis
    this.group.add(body)

    // ── Color bands ───────────────────────────────────────────────────────────
    const [c1, c2, c3, c4] = decodeBands(ohms)
    const bandColors = [c1, c2, c3, c4]

    const bandGeo = new CylinderGeometry(BAND_R, BAND_R, BAND_LEN, 12)

    for (let i = 0; i < 4; i++) {
      const bMat = new MeshStandardMaterial({
        color: new Color(bandColors[i]!),
        roughness: 0.5,
        metalness: 0.05,
      })
      const band = new Mesh(bandGeo, bMat)
      band.rotation.z = Math.PI / 2
      band.position.x = BAND_X[i]!
      this.group.add(band)
    }

    // ── Leads ─────────────────────────────────────────────────────────────────
    const leadGeo = new CylinderGeometry(LEAD_R, LEAD_R, LEAD_LEN, 6)
    const leadMat = new MeshStandardMaterial({
      color: new Color(0xc0c0c0),
      metalness: 0.9,
      roughness: 0.2,
    })

    for (const sign of [-1, 1]) {
      const lead = new Mesh(leadGeo, leadMat)
      lead.rotation.z = Math.PI / 2
      // Place lead centre at the end of the body ± half-lead-length
      lead.position.x = sign * (BODY_LEN / 2 + LEAD_LEN / 2)
      this.group.add(lead)
    }
  }

  override setPosition(board: Breadboard): void {
    const p1 = board.getPinPosition(this.instance.position.row, this.instance.position.col)
    const p2 = board.getPinPosition(this.instance.position.row, this.instance.position.col + 1)
    this.group.position.set(
      (p1.x + p2.x) / 2,
      p1.y + HOVER,
      p1.z,
    )
  }
}
