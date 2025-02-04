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
				if (path[2] === 'leaderboard') {
					return handleLeaderboardRequest(env, headers);
				} else {
					return handleGetRequest(path[2], env, headers);
				}
			} else if (request.method === 'POST') {
				return handlePostRequest(request, env, headers);
			}
		}

		return new Response('Not Found', { status: 404 });
	},
};

async function handleGetRequest(playerIndex, env, headers) {
	if (playerIndex) {
		const playerData = await env.HAND_BALL_PLAYER_DATA.get(playerIndex, 'json');
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

	if (data.role && data.index) {
		// Get the existing player data
		const existingPlayerData = await env.HAND_BALL_PLAYER_DATA.get(data.index, 'json');

		if (existingPlayerData) {
			// Increment the specified role count
			if (data.role === 'king' || data.role === 'queen') {
				existingPlayerData[data.role] = (existingPlayerData[data.role] || 0) + 1;
				await env.HAND_BALL_PLAYER_DATA.put(data.index, JSON.stringify(existingPlayerData));
				return new Response('Player stats updated', { status: 200, headers });
			} else {
				return new Response('Invalid role', { status: 400, headers });
			}
		} else {
			return new Response('Player not found', { status: 404, headers });
		}
	}

	// Handle adding a new player
	await env.HAND_BALL_PLAYER_DATA.put(data.index, JSON.stringify(data));
	return new Response('Player added/updated', { status: 200, headers });
}

async function handleLeaderboardRequest(env, headers) {
	const keys = await env.HAND_BALL_PLAYER_DATA.list();
	let players = [];
	for (let key of keys.keys) {
		const playerData = await env.HAND_BALL_PLAYER_DATA.get(key.name, 'json');
		players.push(playerData);
	}

	// Sort players by total score in descending order
	players.sort((a, b) => b.king * 2 + b.queen - (a.king * 2 + a.queen));

	return new Response(JSON.stringify(players), { status: 200, headers });
}
