

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/legal/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/6.D7kkpXUT.js","_app/immutable/chunks/BaKsUrsJ.js","_app/immutable/chunks/Dz9FklZ6.js"];
export const stylesheets = [];
export const fonts = [];
