import {
  Scene,
  Vector3,
  Group,
  BoxGeometry,
  CylinderGeometry,
  MeshStandardMaterial,
  Mesh,
  InstancedMesh,
  Object3D,
} from 'three'

// ── Layout constants (1 unit = 1 cm) ─────────────────────────────────────────

const PITCH      = 0.254   // 2.54 mm
const BOARD_W    = 17.0
const BOARD_D    = 5.7
const BOARD_H    = 0.25
// Board geometry is shifted up so its bottom sits at the group's Y origin.
// BOARD_TOP_Y is the local-space Y of the top surface.
const BOARD_TOP_Y = BOARD_H            // 0.25
const HOLE_Y      = BOARD_TOP_Y - 0.06 // cylinder centre, recessed into board

const MAIN_COLS = 30
const RAIL_COLS = 25

// Row Z positions relative to board/group centre.
// DIP gap is centred at Z = 0; rows e/f are ±PITCH/2 away from that centre.
const Z_ROWS: Readonly<Record<string, number>> = {
  a: -(5 * PITCH + PITCH / 2),   // -1.397  → adjusted below
  b: -(4 * PITCH + PITCH / 2),
  c: -(3 * PITCH + PITCH / 2),
  d: -(2 * PITCH + PITCH / 2),
  e: -(    PITCH + PITCH / 2),
  f:  (    PITCH / 2),
  g:  (    PITCH + PITCH / 2),
  h:  (2 * PITCH + PITCH / 2),
  i:  (3 * PITCH + PITCH / 2),
  j:  (4 * PITCH + PITCH / 2),
}

// Let DIP gap centre sit at Z=0; e→f centre-to-centre = 2×PITCH (gap row).
// Re-derive cleanly:
const Z_E = -(PITCH * 1)        // -0.254
const Z_F =  (PITCH * 1)        //  0.254
const Z_D = Z_E - PITCH         // -0.508
const Z_C = Z_D - PITCH         // -0.762
const Z_B = Z_C - PITCH         // -1.016
const Z_A = Z_B - PITCH         // -1.270
const Z_G = Z_F + PITCH         //  0.508
const Z_H = Z_G + PITCH         //  0.762
const Z_I = Z_H + PITCH         //  1.016
const Z_J = Z_I + PITCH         //  1.270

const Z_ROW_MAP: Readonly<Record<string, number>> = {
  a: Z_A, b: Z_B, c: Z_C, d: Z_D, e: Z_E,
  f: Z_F, g: Z_G, h: Z_H, i: Z_I, j: Z_J,
}

// Power rail Z positions — centred symmetrically outside the main grid.
const RAIL_GAP   = PITCH * 2
const Z_GND_TOP  = Z_A - RAIL_GAP              // -1.778
const Z_VCC_TOP  = Z_GND_TOP - PITCH           // -2.032
const Z_GND_BOT  = Z_J + RAIL_GAP              //  1.778
const Z_VCC_BOT  = Z_GND_BOT + PITCH           //  2.032

// ── Column X helpers ─────────────────────────────────────────────────────────

function _mainColX(col: number): number {
  return ((col - 1) - (MAIN_COLS - 1) / 2) * PITCH
}

function _railColX(col: number): number {
  return ((col - 1) - (RAIL_COLS - 1) / 2) * PITCH
}

// ── Breadboard ────────────────────────────────────────────────────────────────

export class Breadboard {
  private scene: Scene
  private group: Group
  /** Geometries and materials to dispose on cleanup. */
  private disposables: Array<BoxGeometry | CylinderGeometry | MeshStandardMaterial> = []

  constructor(scene: Scene, position = new Vector3()) {
    this.scene = scene
    this.group = new Group()
    this.group.position.copy(position)

    this._buildBase()
    this._buildHoles()
    this._buildRailStripes()

    scene.add(this.group)
  }

  // ── Base board ───────────────────────────────────────────────────────────────

  private _buildBase() {
    const geo = new BoxGeometry(BOARD_W, BOARD_H, BOARD_D)
    const mat = new MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8, metalness: 0.0 })
    const mesh = new Mesh(geo, mat)
    // Shift so board bottom is at Y = 0 (group origin).
    mesh.position.y = BOARD_H / 2
    this.group.add(mesh)
    this.disposables.push(geo, mat)
  }

  // ── Holes via InstancedMesh ──────────────────────────────────────────────────

  private _buildHoles() {
    type XYZ = [number, number, number]
    const positions: XYZ[] = []

    // Power rail holes (4 rails × RAIL_COLS)
    const railZs: number[] = [Z_VCC_TOP, Z_GND_TOP, Z_VCC_BOT, Z_GND_BOT]
    for (const z of railZs) {
      for (let col = 1; col <= RAIL_COLS; col++) {
        positions.push([_railColX(col), HOLE_Y, z])
      }
    }

    // Main grid holes (10 rows × MAIN_COLS)
    for (const rowKey of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']) {
      const z = Z_ROW_MAP[rowKey]!
      for (let col = 1; col <= MAIN_COLS; col++) {
        positions.push([_mainColX(col), HOLE_Y, z])
      }
    }

    const geo = new CylinderGeometry(0.04, 0.04, 0.12, 8)
    const mat = new MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.6, roughness: 0.4 })
    const im  = new InstancedMesh(geo, mat, positions.length)
    im.name = 'breadboard-holes'

    const dummy = new Object3D()
    positions.forEach(([x, y, z], i) => {
      dummy.position.set(x, y, z)
      dummy.updateMatrix()
      im.setMatrixAt(i, dummy.matrix)
    })
    im.instanceMatrix.needsUpdate = true

    this.group.add(im)
    this.disposables.push(geo, mat)
  }

  // ── Power-rail colour stripes ────────────────────────────────────────────────

  private _buildRailStripes() {
    const stripeW   = (RAIL_COLS - 1) * PITCH + 0.15  // span all rail holes + margin
    const stripeGeo = new BoxGeometry(stripeW, 0.008, 0.055)
    const redMat    = new MeshStandardMaterial({ color: 0xcc2200, roughness: 0.5 })
    const blueMat   = new MeshStandardMaterial({ color: 0x0044cc, roughness: 0.5 })
    const stripeY   = BOARD_TOP_Y + 0.003

    const config: Array<[number, MeshStandardMaterial]> = [
      [Z_VCC_TOP, redMat],
      [Z_GND_TOP, blueMat],
      [Z_VCC_BOT, redMat],
      [Z_GND_BOT, blueMat],
    ]

    for (const [z, mat] of config) {
      const mesh = new Mesh(stripeGeo, mat)
      mesh.position.set(0, stripeY, z)
      this.group.add(mesh)
    }

    this.disposables.push(stripeGeo, redMat, blueMat)
  }

  // ── Public pin accessors ──────────────────────────────────────────────────────

  /** Returns world-space position of a main-grid pin. row = 'a'–'j', col = 1–30. */
  getPinPosition(row: string, col: number): Vector3 {
    const z = Z_ROW_MAP[row.toLowerCase()]
    if (z === undefined) throw new Error(`Breadboard: unknown row "${row}"`)
    return new Vector3(
      this.group.position.x + _mainColX(col),
      this.group.position.y + BOARD_TOP_Y,
      this.group.position.z + z,
    )
  }

  /** Returns world-space position of a power-rail pin. col = 1–25. */
  getPowerRailPosition(
    rail: 'vcc_top' | 'gnd_top' | 'vcc_bot' | 'gnd_bot',
    col: number,
  ): Vector3 {
    const zMap = {
      vcc_top: Z_VCC_TOP,
      gnd_top: Z_GND_TOP,
      vcc_bot: Z_VCC_BOT,
      gnd_bot: Z_GND_BOT,
    } as const
    return new Vector3(
      this.group.position.x + _railColX(col),
      this.group.position.y + BOARD_TOP_Y,
      this.group.position.z + zMap[rail],
    )
  }

  dispose() {
    this.scene.remove(this.group)
    for (const d of this.disposables) d.dispose()
    this.disposables.length = 0
  }
}
