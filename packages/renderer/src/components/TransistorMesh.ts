import {
  Scene,
  CylinderGeometry,
  BoxGeometry,
  MeshStandardMaterial,
  Mesh,
  Color,
} from 'three'
import type { PlacedComponent } from '@fermion/core'
import type { Breadboard } from '../Breadboard'
import { ComponentMesh } from './ComponentMesh'

// ── Constants ─────────────────────────────────────────────────────────────────

const BODY_R    = 0.10
const BODY_H    = 0.45
const LEAD_R    = 0.006
const LEAD_LEN  = 0.40
const LEAD_SEP  = 0.10    // 1mm pitch × 2 = 2mm → 0.1 units (1 unit = 1 cm)
const HOVER     = 0.08    // group origin above board surface

// ── TransistorMesh ────────────────────────────────────────────────────────────

export class TransistorMesh extends ComponentMesh {
  constructor(scene: Scene, instance: PlacedComponent) {
    super(scene, instance)
    this._build()
  }

  private _build(): void {
    const bodyMat = new MeshStandardMaterial({
      color: new Color(0x1a1a1a),
      roughness: 0.4,
      metalness: 0.05,
    })

    // ── Round body (full cylinder — approximates TO-92 D-shape) ──────────────
    const bodyGeo = new CylinderGeometry(BODY_R, BODY_R, BODY_H, 16)
    const body = new Mesh(bodyGeo, bodyMat)
    body.position.y = BODY_H / 2
    this.group.add(body)

    // ── Flat-face overlay (dark rect on the front) ────────────────────────────
    // A thin box pressed against the +Z face of the cylinder to simulate the
    // flat side of a D-shaped TO-92 package.
    const flatGeo = new BoxGeometry(BODY_R * 2, BODY_H, 0.008)
    const flatMat = new MeshStandardMaterial({
      color: new Color(0x111111),
      roughness: 0.5,
      metalness: 0.0,
    })
    const flat = new Mesh(flatGeo, flatMat)
    flat.position.set(0, BODY_H / 2, BODY_R + 0.002)
    this.group.add(flat)

    // ── Three leads: Collector / Base / Emitter ───────────────────────────────
    const leadGeo = new CylinderGeometry(LEAD_R, LEAD_R, LEAD_LEN, 6)
    const leadMat = new MeshStandardMaterial({
      color: new Color(0xc0c0c0),
      metalness: 0.9,
      roughness: 0.2,
    })

    // Positions: C = -LEAD_SEP, B = 0, E = +LEAD_SEP
    const xOffsets = [-LEAD_SEP, 0, LEAD_SEP]
    for (const xOff of xOffsets) {
      const lead = new Mesh(leadGeo, leadMat)
      lead.position.set(xOff, -LEAD_LEN / 2, 0)
      this.group.add(lead)
    }
  }

  override setPosition(board: Breadboard): void {
    // Centre over the middle pin (base pin)
    const colBase = this.instance.position.col + 1  // middle of 3 columns
    const pos = board.getPinPosition(this.instance.position.row, colBase)
    this.group.position.set(pos.x, pos.y + HOVER, pos.z)
  }
}
