export type NodeId = string
export type EdgeId = string

export interface CircuitNode {
  id: NodeId
  label: string
  position: [number, number, number]
}

export interface CircuitEdge {
  id: EdgeId
  from: NodeId
  to: NodeId
  componentType: string
  value: number
}

/** In-memory live graph (uses Maps; not JSON-serialisable). */
export interface CircuitGraphLive {
  nodes: Map<NodeId, CircuitNode>
  edges: Map<EdgeId, CircuitEdge>
}
