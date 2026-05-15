import { z } from 'zod'

// ── Existing live-graph schemas ───────────────────────────────────────────────

export const CircuitNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  position: z.tuple([z.number(), z.number(), z.number()]),
})

export const CircuitEdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  componentType: z.string(),
  value: z.number(),
})

export const CircuitGraphSchema = z.object({
  nodes: z.array(CircuitNodeSchema),
  edges: z.array(CircuitEdgeSchema),
})

export type CircuitNodeInput = z.input<typeof CircuitNodeSchema>
export type CircuitEdgeInput = z.input<typeof CircuitEdgeSchema>

// ── Breadboard circuit schemas (current storage format) ───────────────────────

const PinPositionSchema = z.object({
  row: z.string(),
  col: z.number().int(),
})

export const PlacedComponentSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: PinPositionSchema,
  rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
  label: z.string().optional(),
  value: z.number().optional(),
  properties: z.record(z.string(), z.unknown()),
})

export const PlacedWireSchema = z.object({
  id: z.string(),
  pinA: PinPositionSchema,
  pinB: PinPositionSchema,
  signalType: z.string(),
})

export const BreadboardCircuitSchema = z.object({
  components: z.array(PlacedComponentSchema),
  wires: z.array(PlacedWireSchema),
})

const ProjectCircuitSchema = BreadboardCircuitSchema

export const CircuitSnapshotSchema = z.object({
  version: z.string(),
  savedAt: z.number(),
  circuit: BreadboardCircuitSchema,
  metadata: z.object({
    componentCount: z.number().int().nonnegative(),
    wireCount: z.number().int().nonnegative(),
    simulatorVersion: z.string(),
  }),
})

export const FermionProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  thumbnail: z.string().optional(),
  circuit: ProjectCircuitSchema,
  metadata: z.object({
    componentCount: z.number().int().nonnegative(),
    wireCount: z.number().int().nonnegative(),
    simulatorVersion: z.string(),
  }),
})
