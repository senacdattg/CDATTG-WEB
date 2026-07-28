/** Versión SemVer del monorepo (inyectada en build desde package.json). */
export const APP_VERSION: string =
  typeof __APP_VERSION__ === 'undefined' ? '0.0.0' : __APP_VERSION__;

export const APP_VERSION_LABEL = `v${APP_VERSION}`;
