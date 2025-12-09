

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.B91RZKTe.js","_app/immutable/chunks/BaKsUrsJ.js","_app/immutable/chunks/Dz9FklZ6.js"];
export const stylesheets = [];
export const fonts = [];
