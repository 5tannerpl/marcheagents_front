# MarcheAgents

**Enterprise AI Agents. Explainable by Design. Auditable by Default.**

MarcheAgents is an explainable, auditable enterprise AI Agent showcase
platform. The first available feature is the **Email Support Agent**, a fully
synthetic five-step demo of Email → Multi-Project Cases → Permission-Aware
Retrieval → Explainable Answer → Audit Evidence.

- Blueprint: [`docs/MarcheAgents_Implementation_Blueprint_v2.md`](docs/MarcheAgents_Implementation_Blueprint_v2.md)
- Frontend (Phase 0/1, implemented): [`frontend/`](frontend/) — see its README
  for run, test and Docker instructions.
- Backend (.NET BFF), database and deployment infrastructure arrive in later
  phases per the blueprint.

## Quick start

```bash
cd frontend
npm ci
npm run dev   # http://localhost:5173
```

All demo data is synthetic; no real customer emails, credentials or model
calls are involved in the public demo.
