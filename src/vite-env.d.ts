/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_CDN_BASE_URL: string;
  readonly VITE_MAX_FILE_SIZE: string;
  readonly VITE_CHUNK_SIZE: string;
  readonly VITE_ENABLE_MOCK: string;
  readonly VITE_ENABLE_PWA: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
