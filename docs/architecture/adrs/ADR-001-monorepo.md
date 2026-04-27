# ADR-001: Monorepo with pnpm Workspaces + Turborepo

**Status:** Accepted  
**Date:** 2026-04-26

## Context

Fermion ships as a web app (fermion.io) and a future desktop app (Tauri). Core simulation logic, the renderer, and UI components are shared across both targets. We need a strategy that keeps these concerns isolated but trivially composable.

## Decision

Use a **pnpm workspaces** monorepo with **Turborepo** for task orchestration.

```
apps/web        – SolidJS + Vite browser app
apps/desktop    – Tauri 2 (future)
packages/core   – circuit graph model, types, Zod schemas
packages/solver – MNA solver (Web Worker ready)
packages/renderer – Three.js scene graph, CameraController
packages/ui     – shared SolidJS components
services/api    – Hono backend
```

## Rationale

- **pnpm workspaces** give strict, symlink-based dependency resolution and content-addressable storage (~60% smaller `node_modules` vs npm).
- **Turborepo** provides incremental build caching, parallel execution, and `--filter` for per-app dev servers — all with zero config per package.
- Package-per-concern allows the solver to run in a Web Worker without pulling in Three.js; the renderer can be replaced without touching business logic.
- Tauri 2 requires a separate build target; isolating it in `apps/desktop` avoids polluting the web build.

## Consequences

- All inter-package imports use `@fermion/*` workspace aliases resolved by Vite and TypeScript `paths`.
- Each package owns its own `tsconfig.json` extending `tsconfig.base.json`.
- Circular dependencies between packages are forbidden.
