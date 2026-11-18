# MarcheAgents — Frontend (`marcheagents-web`)

React + TypeScript + Vite frontend for **MarcheAgents**, an explainable, auditable
enterprise AI Agent showcase platform. This package implements the blueprint's
**Phase 0 (platform shell)** and **Phase 1 (public interactive story)** — see
[`docs/MarcheAgents_Implementation_Blueprint_v2.md`](../docs/MarcheAgents_Implementation_Blueprint_v2.md).

> **Everything in the public demo is synthetic.** All customers, contacts,
> emails and permissions are fabricated test data. Identity switching is a
> simulation aid, never real authentication or authorization.

## Pages

| Route | Purpose |
|---|---|
| `/` | MarcheAgents landing: platform positioning, capabilities, featured agent |
| `/features` | Agent Feature Catalog (only Email Support Agent is Available) |
| `/features/email-support` | Email Support Agent overview + Try Demo CTA |
| `/features/email-support/demo` | Five-step interactive demo (synthetic data) |
| `/features/email-support/data-protection` | Data Protection: 10 simulated scenarios, run individually |
| `/contact` | Contact form (submits via Web3Forms to info@marcheagents.com) |
| `/app/features/email-support`, `/app/*` | Protected Live placeholder (OIDC BFF arrives in Phase 3+) |
| `/demo`, `/demo/security` | Legacy compatibility redirects |

The demo restores `?step=` and `?identity=` from the URL, so refresh and deep
links work. The layout is a three-column workspace on desktop and a stacked,
tabbed layout on mobile.

## Architecture notes

- `src/features/registry.ts` — static feature registry (display only, no
  security authority). Coming-soon entries render no launch CTA and hit no API.
- `src/features/email-support/scenario.ts` — the **simulated** policy engine.
  It filters evidence *before* anything reaches rendering components, so UI
  components only ever receive the authorized evidence list (never "fetch all
  and hide with CSS").
- `src/data/publicScenario.ts` — the fully synthetic ABC Group scenario
  (E-5001 → cases A-101 / B-201; Alice sees A, Carol A+B, David A+B+C).
- Shared platform components (`components/inspectors/*`, `ModeBadge`,
  `PlatformHeader`, `FeatureCard`) are email-agnostic; email-specific UI lives
  under `components/demo/` and `features/email-support/`.
- `src/lib/apiClient.ts` is a health-check-only stub; no backend calls, tokens
  or secrets exist in this bundle.

## Develop

```bash
cd frontend
npm ci
npm run dev        # http://localhost:5173
```

## Test

```bash
npm run lint       # oxlint
npm test           # Vitest unit + component tests (17 tests)
npx playwright install chromium --with-deps   # one-time browser setup
npm run test:e2e   # Playwright E2E, desktop + mobile emulation (16 tests)
```

## Build & run with Docker

```bash
npm run build      # outputs dist/

# Standalone static image (local demo / CI smoke; multi-arch incl. linux/arm64)
docker build -t marcheagents-web .
docker run --rm -p 8080:8080 marcheagents-web
# → http://localhost:8080
```

In the full production deployment (blueprint §10), Caddy serves `dist/`
directly and reverse-proxies `/api/*` to the .NET BFF; this image is a
self-contained convenience for frontend-only runs.

## Known TODOs (later phases)

- Footer Privacy link is a placeholder — a real URL is not yet provided. The
  contact form submits to Web3Forms (set `VITE_WEB3FORMS_ACCESS_KEY`, see
  `.env.example`) and is forwarded to MarcheAgents; no custom backend yet.
- Protected Live workspace (`/app/*`) is a locked placeholder until the OIDC
  BFF, server-side policy and audit store ship (Phase 3+).
- Data Protection outcomes are deterministic **simulations** of expected server
  behavior; they must be backed by real BFF endpoints before being presented
  as verified security results.
- Feature registry becomes BFF-served and authorization-aware in later phases.
