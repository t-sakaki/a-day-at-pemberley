/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** RevenueCat Web Billing public API key (starts with `rcb_` or, in sandbox, `test_`). */
  readonly VITE_REVENUECAT_WEB_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
