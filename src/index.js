export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const path = url.pathname.split('/');
		if (path[1] === 'api') {
			if (request.method === 'GET') {
				return handleGetRequest(path[2], env);
			} else if (request.method === 'POST') {
				return handlePostRequest(request, env);
			}
		}
		return new Response('Not Found', { status: 404 });
	},
};

async function handleGetRequest(playerName, env) {
	if (playerName) {
		const playerData = await env.HAND_BALL_PLAYER_DATA.get(playerName, 'json');
		if (playerData) {
			return new Response(JSON.stringify(playerData), { status: 200 });
		}
		return new Response('Player not found', { status: 404 });
	} else {
		const keys = await env.HAND_BALL_PLAYER_DATA.list();
		let players = [];
		for (let key of keys.keys) {
			const playerData = await env.HAND_BALL_PLAYER_DATA.get(key.name, 'json');
			players.push(playerData);
		}
		return new Response(JSON.stringify(players), { status: 200 });
	}
}

async function handlePostRequest(request, env) {
	const data = await request.json();
	const existingPlayer = await env.HAND_BALL_PLAYER_DATA.get(data.name, 'json');
	if (existingPlayer) {
		// Update existing player
		existingPlayer[data.role]++;
		await env.HAND_BALL_PLAYER_DATA.put(data.name, JSON.stringify(existingPlayer));
	} else {
		// Add new player
		await env.HAND_BALL_PLAYER_DATA.put(
			data.name,
			JSON.stringify({
				name: data.name,
				img: data.img,
				king: 0,
				pawn: 0,
				knight: 0,
				queen: 0,
				[data.role]: 1,
			}),
		);
	}
	return new Response('Player added/updated', { status: 200 });
}
