/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UMAMI_SRC?: string;
  readonly VITE_UMAMI_WEBSITE_ID?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

declare module "virtual:catalog" {
  const catalog: import("./engine/content").CatalogEntry[];
  export default catalog;
}
