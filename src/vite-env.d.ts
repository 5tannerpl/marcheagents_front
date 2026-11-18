/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Web3Forms public access key (form identifier, not a secret). */
  readonly VITE_WEB3FORMS_ACCESS_KEY?: string;
  /** "1" enables the simulated /app/agent-ops dashboard in production builds (always on in dev). */
  readonly VITE_AOB_DASHBOARD_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
