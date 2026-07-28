/** Versión SemVer del monorepo (inyectada en build desde package.json). */
export const APP_VERSION: string =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

export const APP_VERSION_LABEL = `v${APP_VERSION}`;
