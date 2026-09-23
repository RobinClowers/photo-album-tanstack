/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Public base URL for photo objects, ending in a slash. Build-time value
   * from .env.<mode>; defaults to the production bucket when unset.
   */
  readonly VITE_PHOTO_BASE_URL?: string
}

/** @stylexjs/unplugin dev runtime: refetches /virtual:stylex.css on HMR. */
declare module 'virtual:stylex:runtime' {}
