/**
 * Store builds must not download or install APK files. The flag is provided
 * at build time (`VITE_STORE_BUILD=true`) so the direct-download APK keeps its
 * in-app update flow while Google Play / Galaxy Store builds stay compliant.
 */
export const IS_STORE_BUILD = import.meta.env.VITE_STORE_BUILD === 'true';
