export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const path = url.pathname.split('/');

		// CORS headers
		const headers = new Headers();
		headers.set('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
		headers.set('Access-Control-Allow-Methods', 'GET, POST');
		headers.set('Access-Control-Allow-Headers', 'Content-Type');

		if (request.method === 'OPTIONS') {
			// Handle preflight requests
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST',
					'Access-Control-Allow-Headers': 'Content-Type',
				},
			});
		}

		if (path[1] === 'api') {
			if (request.method === 'GET') {
				return handleGetRequest(path[2], env, headers);
			} else if (request.method === 'POST') {
				return handlePostRequest(request, env, headers);
			}
		}

		return new Response('Not Found', { status: 404 });
	},
};

async function handleGetRequest(playerName, env, headers) {
	if (playerName) {
		const playerData = await env.HAND_BALL_PLAYER_DATA.get(playerName, 'json');
		if (playerData) {
			return new Response(JSON.stringify(playerData), { status: 200, headers });
		}
		return new Response('Player not found', { status: 404, headers });
	} else {
		const keys = await env.HAND_BALL_PLAYER_DATA.list();
		let players = [];
		for (let key of keys.keys) {
			const playerData = await env.HAND_BALL_PLAYER_DATA.get(key.name, 'json');
			players.push(playerData);
		}
		return new Response(JSON.stringify(players), { status: 200, headers });
	}
}

async function handlePostRequest(request, env, headers) {
	const data = await request.json();
	await env.HAND_BALL_PLAYER_DATA.put(data.index, JSON.stringify(data));
	return new Response('Player added/updated', { status: 200, headers });
}
