/// <reference types="vite/client" />

// Typed frontend environment. Vite exposes only VITE_ prefixed variables to the
// browser bundle; the interface keeps their types explicit instead of falling
// back to the index signature.
interface ImportMetaEnv {
  readonly VITE_INSTANCE_URLS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
