# ADR-002: Technology Stack — SolidJS, Three.js, MNA Solver

**Status:** Accepted  
**Date:** 2026-04-26

## Context

A 3D circuit simulator needs: (1) a reactive UI that updates at 60 fps without VDOM overhead, (2) a 3D renderer capable of thousands of wire segments, (3) a real-time circuit solver that doesn't block the main thread.

## Decisions

### SolidJS over React

- SolidJS uses **fine-grained reactivity** (no virtual DOM diffing). Signal updates touch only the exact DOM nodes that subscribed — critical for a canvas-heavy app where 60 fps is baseline.
- Smaller bundle (~7 KB vs ~45 KB), faster hydration, no re-render cascades from parent components.
- `solid-three` provides the same `<Canvas>` / `useFrame` mental model as React Three Fiber, so Three.js integration is idiomatic.
- Tradeoff: smaller ecosystem than React. Accepted — Fermion's UI surface is small; simulator logic doesn't depend on ecosystem size.

### Three.js r170+ (no abstraction library)

- Direct Three.js gives full access to the rendering pipeline: custom materials, instanced meshes, post-processing, WebGPU path when r172 ships.
- `solid-three` wraps Three.js objects as SolidJS components without hiding the Three.js API, so we can drop to imperative code anywhere.
- OrbitControls is intentionally **not** used — Fermion needs Blender-style middle-mouse orbit, dynamic pivot raycasting, and animated focus, none of which OrbitControls supports cleanly.

### MNA (Modified Nodal Analysis) Solver in TypeScript

- MNA is the industry-standard circuit simulation algorithm (SPICE uses it). It expresses the circuit as a linear system `Ax = b` solved at each time step.
- Running in a **Web Worker** via Comlink keeps the solve loop off the main thread, preventing frame drops during complex simulations.
- Pure TypeScript (no WASM initially) keeps the build simple. WASM/Rust acceleration is a future upgrade path if benchmarks demand it.

### Zustand + Immer for state

- Zustand provides a minimal, non-opinionated store with selector-based subscriptions — no Provider boilerplate.
- Immer middleware allows mutable-style reducer logic with structural sharing, keeping undo/redo implementable.

### Dexie.js for persistence

- IndexedDB via Dexie stores circuit projects locally with a typed schema.
- Enables offline-first operation; cloud sync is a future layer on top.

## Consequences

- `packages/solver` must never import from `packages/renderer` (no Three.js in the solver).
- The solver communicates with the UI via Comlink-wrapped Worker messages.
- Three.js objects are **never** stored in Zustand — only serializable circuit graph data is stored.
