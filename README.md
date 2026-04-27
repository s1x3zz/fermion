# Fermion

> 3D electronic circuit simulator — fermion.io

## Monorepo structure

```
apps/web          SolidJS + Vite browser app
apps/desktop      Tauri 2 desktop (scaffold)
packages/core     Circuit graph model, types, Zod schemas
packages/solver   MNA solver (Web Worker ready, Comlink)
packages/renderer Three.js scene, CameraController
packages/ui       Shared SolidJS components
services/api      Hono REST API
docs/adrs         Architecture Decision Records
```

## Getting started

```bash
pnpm install
pnpm dev          # starts apps/web on http://localhost:5173
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start web dev server |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all test suites |
| `pnpm typecheck` | TypeScript check across all packages |
