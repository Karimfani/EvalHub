# EvalHub - Project Evaluation Platform

## Overview

Full-stack project evaluation platform. Users register with JWT auth, submit projects, vote on them, and can pay via Stripe to feature their projects. Admins get a full dashboard for managing users, projects, payments, and analytics.

pnpm workspace monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (bcryptjs + jsonwebtoken) — NOT Clerk
- **Payments**: Stripe (checkout session + webhook)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS v4
- **UI**: shadcn/ui components, Limelight display font, JetBrains Mono

## Artifacts

- **API Server** (`artifacts/api-server`) — Express REST API, port 8080
- **Web App** (`artifacts/project-eval`) — React Vite, preview path `/`

## Design Theme

- Dark electric palette: background `hsl(222 47% 7%)`, primary blue `#3B82F6`, secondary purple `#8B5CF6`
- Fonts: Limelight (display/headings), JetBrains Mono (mono), Inter (body)
- High-contrast artistic style with card borders and glow effects

## Key Files

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all endpoints)
- `artifacts/api-server/src/routes/` — auth, projects, votes, payments, admin routes
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware
- `lib/db/src/schema/` — users, projects, votes, payments Drizzle schemas
- `artifacts/project-eval/src/context/AuthContext.tsx` — JWT auth context
- `artifacts/project-eval/src/App.tsx` — Routes + providers
- `artifacts/project-eval/src/pages/` — All pages
- `artifacts/project-eval/src/components/` — Layout, ProjectCard, shadcn UI

## Routes

| Path | Page | Auth Required |
|------|------|---------------|
| `/` | Home - Project listing with search/filter | No |
| `/login` | Login form | No |
| `/register` | Register form | No |
| `/projects/:id` | Project detail with voting + feature checkout | No |
| `/submit` | Submit new project | User |
| `/my-projects` | User's own projects | User |
| `/my-payments` | User's payment history | User |
| `/admin` | Admin dashboard with analytics | Admin |
| `/admin/projects` | Approve/reject projects | Admin |
| `/admin/users` | User list | Admin |
| `/admin/payments` | All payments | Admin |

## Demo Credentials

- Admin: `admin@evalplatform.com` / `Admin123!`
- User: `alice@example.com` / `User123!`
- User: `bob@example.com` / `User123!`
- User: `carol@example.com` / `User123!`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — JWT signing secret (also used as Stripe webhook secret if Stripe is configured)
- `STRIPE_SECRET_KEY` — (optional) Stripe secret key for payment features
- `STRIPE_WEBHOOK_SECRET` — (optional) Stripe webhook signing secret

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
