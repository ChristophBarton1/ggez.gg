export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["background.mp4","favicon.svg","riot.txt","service-worker.js"]),
	mimeTypes: {".mp4":"video/mp4",".svg":"image/svg+xml",".txt":"text/plain",".js":"text/javascript"},
	_: {
		client: {start:"_app/immutable/entry/start.CXxIR90g.js",app:"_app/immutable/entry/app.CBngpwxF.js",imports:["_app/immutable/entry/start.CXxIR90g.js","_app/immutable/chunks/BaKsUrsJ.js","_app/immutable/chunks/Dz9FklZ6.js","_app/immutable/entry/app.CBngpwxF.js","_app/immutable/chunks/BaKsUrsJ.js","_app/immutable/chunks/Dz9FklZ6.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js')),
			__memo(() => import('../output/server/nodes/3.js')),
			__memo(() => import('../output/server/nodes/4.js')),
			__memo(() => import('../output/server/nodes/5.js')),
			__memo(() => import('../output/server/nodes/6.js')),
			__memo(() => import('../output/server/nodes/7.js')),
			__memo(() => import('../output/server/nodes/8.js')),
			__memo(() => import('../output/server/nodes/9.js')),
			__memo(() => import('../output/server/nodes/10.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/ai/chat",
				pattern: /^\/api\/ai\/chat\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/ai/chat/_server.js'))
			},
			{
				id: "/api/ai/match-analysis",
				pattern: /^\/api\/ai\/match-analysis\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/ai/match-analysis/_server.js'))
			},
			{
				id: "/api/champion-stats",
				pattern: /^\/api\/champion-stats\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/champion-stats/_server.js'))
			},
			{
				id: "/api/champions-meta",
				pattern: /^\/api\/champions-meta\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/champions-meta/_server.js'))
			},
			{
				id: "/api/coach/analyze",
				pattern: /^\/api\/coach\/analyze\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/coach/analyze/_server.js'))
			},
			{
				id: "/api/image-proxy",
				pattern: /^\/api\/image-proxy\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/image-proxy/_server.js'))
			},
			{
				id: "/api/leaderboards",
				pattern: /^\/api\/leaderboards\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/leaderboards/_server.js'))
			},
			{
				id: "/api/regional-meta",
				pattern: /^\/api\/regional-meta\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/regional-meta/_server.js'))
			},
			{
				id: "/api/rising-stars",
				pattern: /^\/api\/rising-stars\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/rising-stars/_server.js'))
			},
			{
				id: "/champions",
				pattern: /^\/champions\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/impressum",
				pattern: /^\/impressum\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/leaderboards",
				pattern: /^\/leaderboards\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/legal",
				pattern: /^\/legal\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/privacy",
				pattern: /^\/privacy\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/regions",
				pattern: /^\/regions\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/rising-stars",
				pattern: /^\/rising-stars\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/[region]/[gameName]/[tagLine]",
				pattern: /^\/([^/]+?)\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"region","optional":false,"rest":false,"chained":false},{"name":"gameName","optional":false,"rest":false,"chained":false},{"name":"tagLine","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 10 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
