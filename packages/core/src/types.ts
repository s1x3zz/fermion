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

export interface CircuitGraph {
  nodes: Map<NodeId, CircuitNode>
  edges: Map<EdgeId, CircuitEdge>
}
