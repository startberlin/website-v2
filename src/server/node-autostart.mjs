// Evaluate before the native adapter module so its server cannot start unprotected.
export const autostart = process.env.ASTRO_NODE_AUTOSTART;
process.env.ASTRO_NODE_AUTOSTART = 'disabled';
