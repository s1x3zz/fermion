import {
  Scene,
  BoxGeometry,
  EdgesGeometry,
  MeshStandardMaterial,
  LineBasicMaterial,
  Mesh,
  LineSegments,
  Color,
} from 'three'
import type { PlacedComponent, ComponentType } from '@fermion/core'
import type { Breadboard } from '../Breadboard'
import { ComponentMesh } from './ComponentMesh'
import { COMPONENT_SPAN } from '@fermion/core'

// ── Category color map ────────────────────────────────────────────────────────

type Category = 'ic' | 'mcu' | 'generic'

const CATEGORY_MAP: Partial<Record<ComponentType, Category>> = {
  '555_timer': 'ic',
  op_amp:      'ic',
  arduino_uno: 'mcu',
  arduino_nano:'mcu',
}

const CATEGORY_COLOR: Record<Category, number> = {
  ic:      0x1a237e,  // dark blue
  mcu:     0x0d4700,  // dark green
  generic: 0x37474f,  // dark slate
}

const LIGHTER: Record<Category, number> = {
  ic:      0x2a3a9e,
  mcu:     0x1a6a10,
  generic: 0x546e7a,
}

// ── GenericMesh ───────────────────────────────────────────────────────────────

export class GenericMesh extends ComponentMesh {
  constructor(scene: Scene, instance: PlacedComponent) {
    super(scene, instance)
    this._build()
  }

  private _build(): void {
    const type = this.instance.type
    const span = COMPONENT_SPAN[type] ?? 2
    // Width scales with pin span; minimum 1 column
    const cols = Math.max(span, 1)
    const width  = cols * 0.254
    const height = 0.30
    const depth  = 0.50

    const category: Category = CATEGORY_MAP[type] ?? 'generic'
    const baseHex  = CATEGORY_COLOR[category]!
    const lightHex = LIGHTER[category]!

    // ── Body ──────────────────────────────────────────────────────────────────
    const bodyGeo = new BoxGeometry(width, height, depth)
    const bodyMat = new MeshStandardMaterial({
      color: new Color(baseHex),
      roughness: 0.6,
      metalness: 0.05,
    })
    const body = new Mesh(bodyGeo, bodyMat)
    body.position.y = height / 2
    this.group.add(body)

    // ── White edge lines ──────────────────────────────────────────────────────
    const edgesGeo = new EdgesGeometry(bodyGeo)
    const edgesMat = new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
    const edges = new LineSegments(edgesGeo, edgesMat)
    edges.position.y = height / 2
    this.group.add(edges)

    // ── Pin-1 marker: lighter rectangle on top face, near one corner ──────────
    const markerGeo = new BoxGeometry(0.06, 0.005, 0.06)
    const markerMat = new MeshStandardMaterial({
      color: new Color(lightHex),
      roughness: 0.4,
    })
    const marker = new Mesh(markerGeo, markerMat)
    marker.position.set(-width / 2 + 0.05, height + 0.003, -depth / 2 + 0.05)
    this.group.add(marker)
  }

  override setPosition(board: Breadboard): void {
    const span = COMPONENT_SPAN[this.instance.type] ?? 2
    if (span === 0) {
      // Non-pin-snapped: float beside board
      const leftEdge = board.getPinPosition('a', 1)
      this.group.position.set(leftEdge.x - 2.2, 0, 0)
      return
    }

    const col = this.instance.position.col
    // Centre over all spanned columns
    const colMid = col + (span - 1) / 2
    const p1 = board.getPinPosition(this.instance.position.row, Math.floor(colMid))
    const p2 = board.getPinPosition(this.instance.position.row, Math.ceil(colMid))
    this.group.position.set(
      (p1.x + p2.x) / 2,
      p1.y,
      p1.z,
    )
  }
}
