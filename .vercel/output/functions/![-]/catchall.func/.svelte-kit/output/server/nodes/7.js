

export const index = 7;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/privacy/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/7.BpcMyTZd.js","_app/immutable/chunks/BaKsUrsJ.js","_app/immutable/chunks/Dz9FklZ6.js"];
export const stylesheets = [];
export const fonts = [];
