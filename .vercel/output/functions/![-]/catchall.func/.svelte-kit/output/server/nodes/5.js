

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/leaderboards/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/5.CVaMJFUw.js","_app/immutable/chunks/BaKsUrsJ.js","_app/immutable/chunks/Dz9FklZ6.js","_app/immutable/chunks/SM3Xv8G9.js","_app/immutable/chunks/DxUtbXzk.js"];
export const stylesheets = ["_app/immutable/assets/components.C5rCGzME.css","_app/immutable/assets/5.B2xsS-pR.css"];
export const fonts = [];
