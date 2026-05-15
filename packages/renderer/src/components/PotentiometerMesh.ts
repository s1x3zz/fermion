import {
  Scene,
  BoxGeometry,
  CylinderGeometry,
  MeshStandardMaterial,
  Mesh,
  Color,
} from 'three'
import type { PlacedComponent } from '@fermion/core'
import type { Breadboard } from '../Breadboard'
import { ComponentMesh } from './ComponentMesh'

// ── Constants ─────────────────────────────────────────────────────────────────

const PITCH      = 0.254
const BODY_W     = 0.70
const BODY_H     = 0.35
const BODY_D     = 0.70
const SHAFT_R    = 0.05
const SHAFT_H    = 0.40
const KNOB_BOT_R = 0.12
const KNOB_TOP_R = 0.10
const KNOB_H     = 0.15
const LEAD_R     = 0.008
const LEAD_LEN   = 0.25
const LEAD_SEP   = PITCH    // 0.254 units apart

const HOVER = 0.05   // group origin above board

// ── PotentiometerMesh ─────────────────────────────────────────────────────────

export class PotentiometerMesh extends ComponentMesh {
  constructor(scene: Scene, instance: PlacedComponent) {
    super(scene, instance)
    this._build()
  }

  private _build(): void {
    // ── Body box ──────────────────────────────────────────────────────────────
    const bodyGeo = new BoxGeometry(BODY_W, BODY_H, BODY_D)
    const bodyMat = new MeshStandardMaterial({
      color: new Color(0x1a237e),
      roughness: 0.6,
      metalness: 0.05,
    })
    const body = new Mesh(bodyGeo, bodyMat)
    body.position.y = BODY_H / 2
    this.group.add(body)

    // ── Shaft (silver, rises from top centre) ─────────────────────────────────
    const shaftGeo = new CylinderGeometry(SHAFT_R, SHAFT_R, SHAFT_H, 12)
    const shaftMat = new MeshStandardMaterial({
      color: new Color(0xc0c0c0),
      metalness: 0.85,
      roughness: 0.2,
    })
    const shaft = new Mesh(shaftGeo, shaftMat)
    shaft.position.y = BODY_H + SHAFT_H / 2
    this.group.add(shaft)

    // ── Knob (black, on top of shaft) ─────────────────────────────────────────
    const knobGeo = new CylinderGeometry(KNOB_BOT_R, KNOB_TOP_R, KNOB_H, 16)
    const knobMat = new MeshStandardMaterial({
      color: new Color(0x222222),
      roughness: 0.5,
      metalness: 0.0,
    })
    const knob = new Mesh(knobGeo, knobMat)
    knob.position.y = BODY_H + SHAFT_H + KNOB_H / 2
    this.group.add(knob)

    // ── Three leads from bottom ───────────────────────────────────────────────
    const leadGeo = new CylinderGeometry(LEAD_R, LEAD_R, LEAD_LEN, 6)
    const leadMat = new MeshStandardMaterial({
      color: new Color(0xc0c0c0),
      metalness: 0.9,
      roughness: 0.2,
    })

    for (const xOff of [-LEAD_SEP, 0, LEAD_SEP]) {
      const lead = new Mesh(leadGeo, leadMat)
      lead.position.set(xOff, -LEAD_LEN / 2, 0)
      this.group.add(lead)
    }
  }

  override setPosition(board: Breadboard): void {
    // Centre over middle column of 3
    const col = this.instance.position.col + 1
    const pos = board.getPinPosition(this.instance.position.row, col)
    this.group.position.set(pos.x, pos.y + HOVER, pos.z)
  }
}
