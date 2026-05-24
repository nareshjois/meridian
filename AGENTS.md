# Meridian — Agent Guide

Instructions for cloud agents (Cursor, CI agents, parallel workstreams) working in this repository.

## What this repo is

Meridian is a travel-agency operations app (CRM, quotes, bookings, vendors, accounting) built on **TanStack Start + React 19 + Drizzle + SQLite**. The codebase uses a **contract-first** model: service interfaces, permission keys, and route shapes are frozen before implementation. Implement against contracts; do not rename them without a coordinated migration.

Full MVP scope and parallel workstream plan:

`/Users/naresh/.cursor/plans/meridian_full_mvp_ee1ffb55.plan.md`

**Read the plan section “Agent Learnings (Workstream 2)” before touching auth, DB bootstrap, route loaders, or seeds.**

---

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Dev server at `http://localhost:3000` |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Vitest (unit + service tests) |
| `pnpm build` | Production build (client + SSR + Nitro) |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Generate Drizzle migrations from schema |
| `pnpm db:migrate` | Apply migrations (CLI; app also migrates on boot) |
| `pnpm db:studio` | Drizzle Studio |

**Before claiming work is done:** run `pnpm typecheck`, `pnpm test`, and `pnpm build`.

If tests fail with `better-sqlite3` bindings missing, build the native addon:

```bash
cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 && npm run build-release
```

---

## Local dev login

Dev seed runs automatically in non-production on first server request.

| Field | Value |
|-------|-------|
| Email | `admin@meridian.example` |
| Password | `change-me-now` |

Defined in `src/shared/dev/credentials.ts` (kept in sync with `ensureDevSeed`). Login form prefills these when `import.meta.env.DEV`.

**Reset a corrupted local DB:**

```bash
rm -f data/meridian.sqlite data/meridian.sqlite-wal data/meridian.sqlite-shm
```

---

## Repository layout

```
src/
  routes/                 # TanStack Router file routes
    index.tsx             # Public homepage
    auth/                 # Login, activate (public)
    app/                  # Authenticated backoffice (/app/*)
      route.tsx           # App layout + session guard
      users/              # User management (implemented)
    forms/                # Public customer form links (planned)
  features/               # UI shells and domain components
  components/             # Shared UI (shadcn, marketing)
  server/
    auth/                 # Session, guard, cookies, route-context RPC
    db/
      client.ts           # SQLite + Drizzle client
      schema/             # Drizzle table definitions
      migrations/         # Generated SQL migrations
    services/
      *.contract.ts       # Frozen service interfaces (DO NOT rename)
      users/              # Auth + user management implementation
      _types.ts           # ServiceResult, ServiceContext, etc.
  shared/
    permissions/          # Frozen permission keys + check helpers
    validation/dtos/      # Zod DTOs shared client/server
    routes/contracts.ts   # AppRouteContext, RouteActionResult
    dev/credentials.ts    # Dev-only seed/login credentials
```

Path alias: `@/*` → `src/*`

---

## Architecture rules (non-negotiable)

### 1. Contract-first services

- Interfaces live in `src/server/services/*.contract.ts`.
- Implementations live in `src/server/services/<domain>/`.
- Return `ServiceResult<T>` / `ListResult<T>` from `src/server/services/_types.ts`.
- Enforce permissions inside services with `hasPermission` / `assertPermission`.

Do **not** put business logic in route components. Routes call services via server functions or loaders.

### 2. TanStack Start: server vs client boundaries

Route `.tsx` files are bundled for the **client**. After login, navigation runs `beforeLoad` / `loader` on the client.

| Do | Don't |
|----|-------|
| Call `createServerFn` handlers from routes | Import `**/*.server.*` from route `.tsx` files |
| Put DB/Drizzle/cookies in server fn handlers | Call `createServerOnlyFn()` from route loaders |
| Dynamic-import `*.impl.server.ts` inside handlers | Open SQLite directly in route files |

**Reference patterns (copy these):**

- Auth/actions: `src/server/services/users/actions.ts` (`loginFn`, etc.)
- App session guard: `src/server/auth/route-context.ts` (`getAppRouteContextFn`)
- Domain loaders: `src/server/services/users/loaders.ts`
- Server-only bootstrap: `src/server/auth/bootstrap.impl.server.ts`

### 3. Route namespaces

- **`/app/*`** — authenticated backoffice; guarded by session in `src/routes/app/route.tsx`.
- **`/auth/*`** — public auth (login visuals may be owned by Workstream 0; logic in server fns).
- **`/forms/*`** — public customer form submission (planned).

Use `staticData.requiredPermissions` + `assertPermission` for permission-gated routes.

### 4. Database

- SQLite file: `./data/meridian.sqlite` (gitignored). Parent dir is auto-created in `src/server/db/client.ts`.
- Schema: `src/server/db/schema/*.ts` → export via `schema/index.ts`.
- After schema changes: `pnpm db:generate`, commit migration SQL under `src/server/db/migrations/`.
- **Seeds must be idempotent:** resolve existing parent row IDs before inserting FK children. Never insert child rows with UUIDs that were skipped by `onConflictDoNothing`.

### 5. Permissions (RBAC)

Frozen keys: `src/shared/permissions/keys.ts` — do not rename without migration.

User-domain mapping:

| Operation | Permission |
|-----------|------------|
| List/view users | `users.read` |
| Activate/deactivate | `users.write` |
| Invite | `users.invite` |
| Assign/remove roles | `users.manage_roles` |

Default dev roles (seeded): `admin` (all), `staff` (no user admin / journal post), `viewer` (read-only).

### 6. Server function responses

Cross-wire RPC with `RouteActionResult<T>` and `RouteServiceError` (`code` + `message` only) from `src/shared/routes/contracts.ts`. Do not return `ServiceError.details` over the wire.

---

## Adding a new domain module (checklist)

1. **Contract** — Add `src/server/services/<domain>.contract.ts`; register in `MeridianServices` in `src/server/services/index.ts` only if foundation team approved.
2. **Schema** — Add tables in `src/server/db/schema/<domain>.ts`; export from `schema/index.ts`; run `pnpm db:generate`.
3. **Service** — Implement in `src/server/services/<domain>/`; use repository pattern like `src/server/services/users/repository.ts`.
4. **DTOs** — Add Zod schemas in `src/shared/validation/dtos/<domain>.ts`.
5. **Permissions** — Add keys to `src/shared/permissions/keys.ts` (coordinated change).
6. **Routes** — Add under `src/routes/app/<domain>/`; use `createServerFn` loaders; wire nav in `src/features/app-shell/AppNav.tsx`.
7. **Tests** — Service tests with in-memory SQLite (`src/server/services/users/test-helpers.ts` as template).

---

## Parallel workstream file ownership

When multiple agents work in parallel, respect directory ownership (see plan for full detail):

| Workstream | Owns |
|------------|------|
| 0 | `src/routes/index.tsx`, login visuals |
| 1 | Shared contracts, `src/server/db/*`, app shell contracts |
| 2 | `src/routes/app/users/*`, `src/routes/auth/*` (logic), `src/server/services/users/*` |
| 3 | `customers`, `customer-families`, `groups` routes + services |
| 4 | `booking-services`, `quotes`, `bookings` |
| 5 | `vendors` |
| 6 | `src/routes/forms/*` |
| 7 | `accounting` |

**Shared files** (coordinate before editing): `src/routes/app/route.tsx`, `src/routes/__root.tsx`, `src/server/db/client.ts`, `src/server/db/schema/index.ts`, `src/shared/**`.

---

## Common failure modes (quick reference)

| Error | Fix |
|-------|-----|
| `Cannot open database because the directory does not exist` | Ensure `mkdirSync` in `client.ts` (already fixed); don't require manual `mkdir data` |
| Login does nothing | Catch errors in UI; check server fn response; verify DB exists |
| `createServerOnlyFn() functions can only be called on the server!` | Move logic to `createServerFn`; route calls RPC, not server-only fn |
| `FOREIGN KEY constraint failed` on boot | Fix idempotent seed; reset local sqlite files |
| Import denied for `*.server.*` in client build | Never import `.server` modules from route `.tsx` |
| Build/type errors on server fn return types | Use `RouteServiceError`, not `ServiceError` with `details` |

Details and rationale: plan doc → **Agent Learnings (Workstream 2)**.

---

## Code style

- TypeScript strict mode; prefer existing patterns in neighboring files.
- Minimal diffs — don't refactor unrelated code.
- Use `@/` imports.
- Tests: Vitest; `:memory:` SQLite for service tests.
- Do not commit secrets, `.env`, or `data/*.sqlite`.
- Do not commit unless the user explicitly asks.

---

## Verification checklist (every PR / task)

- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes
- [ ] New routes work via **client navigation** (not only hard refresh)
- [ ] Permission checks enforced in service layer
- [ ] No `*.server.*` imports from client route files
- [ ] Seeds/migrations idempotent where applicable

---

## Where to ask questions in code

| Question | Look at |
|----------|---------|
| How does login/session work? | `src/server/services/users/auth.service.ts`, `src/server/auth/cookie-session.ts` |
| How does app auth guard work? | `src/server/auth/route-context.ts`, `src/server/auth/guard.ts` |
| How to add a server action? | `src/server/services/users/actions.ts` |
| How to add a loader with DB? | `src/server/services/users/loaders.ts` |
| Permission keys | `src/shared/permissions/keys.ts` |
| Frozen service API | `src/server/services/*.contract.ts` |
| MVP roadmap | `.cursor/plans/meridian_full_mvp_ee1ffb55.plan.md` |
