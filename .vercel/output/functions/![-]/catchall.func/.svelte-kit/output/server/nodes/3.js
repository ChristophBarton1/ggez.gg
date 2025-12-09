

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/champions/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/3.C9GjksdU.js","_app/immutable/chunks/CZxR6uu-.js","_app/immutable/chunks/BaKsUrsJ.js","_app/immutable/chunks/Dz9FklZ6.js","_app/immutable/chunks/SM3Xv8G9.js","_app/immutable/chunks/DxUtbXzk.js"];
export const stylesheets = ["_app/immutable/assets/components.C5rCGzME.css","_app/immutable/assets/route-champions.C5vOqj-y.css"];
export const fonts = [];
