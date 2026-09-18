// The lite build has no Node-only code paths, which is what the Worker needs;
// it shares the package's public type surface.
declare module 'exifr/dist/lite.esm.mjs' {
  export * from 'exifr'
}
