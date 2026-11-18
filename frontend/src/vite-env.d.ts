/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Web3Forms public access key (form identifier, not a secret). */
  readonly VITE_WEB3FORMS_ACCESS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
