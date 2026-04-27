import { z } from 'zod'

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
