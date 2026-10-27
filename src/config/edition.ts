/**
 * Edition flags are baked in at build time. The free APK and the website do
 * not set VITE_GOLD_EDITION, so their behaviour stays unchanged.
 */
export const IS_GOLD_EDITION = import.meta.env.VITE_GOLD_EDITION === 'true';
