# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev              # Start web app dev server (localhost:5173)
pnpm -F @fermion/api dev  # Start API server (localhost:3001)

# Build / typecheck / lint
pnpm build            # Build all packages via Turbo
pnpm typecheck        # TypeScript check across all packages
pnpm lint             # ESLint across all packages

# Testing
pnpm test             # Run all test suites
pnpm -F @fermion/core test     # Test a single package
pnpm -F @fermion/solver test   # Test solver specifically
```

Code style: Prettier enforced — `semi: false`, `singleQuote: true`, `printWidth: 100`, `trailingComma: 'all'`.

## Architecture

Fermion is a browser-based electronics simulator. The monorepo is organized as:

```
apps/web         → SolidJS + Vite browser app (main UI)
apps/desktop     → Tauri 2 scaffold (future native app)
packages/core    → Circuit graph types, Zod schemas (imports only zod)
packages/solver  → MNA circuit solver (Web Worker safe)
packages/renderer → Three.js scene, breadboard, camera (imports Three + SolidJS)
packages/ui      → Shared SolidJS components
services/api     → Hono REST API (auth, projects, billing, webhooks)
docs/architecture/adrs/ → Architecture Decision Records
```

### Package dependency rules

The packages form a strict one-way dependency graph — **no circular imports**:

- `core` → nothing (pure types + Zod schemas)
- `solver` → nothing from this repo (safe for Web Workers: no DOM, no Three.js)
- `renderer` → Three.js, SolidJS (does NOT import solver or core)
- `ui` → SolidJS only
- `apps/web` → core, renderer, ui (plus Supabase, Zustand, Dexie, avr8js, Comlink)
- `services/api` → Hono, Supabase, Stripe, Zod

### Simulation pipeline

`MNASolver` (packages/solver) runs in a **Web Worker via Comlink** to avoid blocking the main thread. It builds a netlist from `PlacedComponent[]` and `PlacedWire[]`, groups pins with union-find, then solves `Ax = b` via Gaussian elimination with Newton-Raphson iteration for nonlinear elements (diodes use the Shockley model). Result: `{ nodeVoltages, branchCurrents, converged }`.

### Renderer

- **Breadboard**: procedurally generates Three.js geometry using `InstancedMesh` (holes + color stripes). Exposes `snapToNearestPin()` for component placement.
- **CameraController**: custom Blender-style controls (middle-mouse orbit, dynamic pivot). Does NOT use `OrbitControls`.
- **WireRenderer**: animated GLSL shader that visualizes current flow direction on wires.
- **Three.js objects are never stored in Zustand state** — only serializable circuit graph data goes into the store.

### Web app (apps/web)

Routes: `/` (Landing, public) → `/dashboard` (projects, protected) → `/sim` (3D simulator, protected) → `/auth/callback` (OAuth handler).

State: Zustand + Immer for circuit data; Dexie (IndexedDB) for offline-first project persistence; Supabase for auth and remote sync.

### API (services/api)

Hono server on port 3001. Routes: `/api/health`, `/api/auth/*`, `/api/projects/*`, `/api/billing/*`, `/api/webhooks/*`. CORS allows `localhost:5173` and `fermion.io`.

### Core data model

Key types in `packages/core/src/`:
- `PlacedComponent` — `{ id, type, position: { row: 'a'–'j', col: 1–30 }, rotation, value?, properties }`
- `PlacedWire` — `{ id, pinA, pinB, signalType }`
- `BreadboardCircuit` — `{ components, wires }`
- `FermionProject` — `{ id (uuid v4), name, circuit, createdAt, updatedAt, metadata }`

Project limits by tier: guest=1, free=5, pro=unlimited, team=20.

### Path aliases (tsconfig.base.json)

All packages are available as bare imports: `@fermion/core`, `@fermion/solver`, `@fermion/renderer`, `@fermion/ui`. Vite resolves these via the same aliases at build time.
