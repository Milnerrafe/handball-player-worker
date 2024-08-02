export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const path = url.pathname.split('/');
		if (path[1] === 'api') {
			if (request.method === 'GET') {
				return handleGetRequest(env);
			} else if (request.method === 'POST') {
				return handlePostRequest(request, env);
			}
		}
		return new Response('Not Found', { status: 404 });
	},
};

async function handleGetRequest(env) {
	const keys = await env.HAND_BALL_PLAYER_DATA.list();
	let players = [];
	for (let key of keys.keys) {
		const playerData = await env.HAND_BALL_PLAYER_DATA.get(key.name, 'json');
		players.push(playerData);
	}
	return new Response(JSON.stringify(players), { status: 200 });
}

async function handlePostRequest(request, env) {
	const data = await request.json();
	if (data.index !== undefined) {
		// Update existing player
		const existingPlayer = await env.HAND_BALL_PLAYER_DATA.get(data.index, 'json');
		if (existingPlayer) {
			existingPlayer[data.role]++;
			await env.HAND_BALL_PLAYER_DATA.put(data.index, JSON.stringify(existingPlayer));
		} else {
			return new Response('Player not found', { status: 404 });
		}
	} else {
		// Add new player
		const keys = await env.HAND_BALL_PLAYER_DATA.list();
		const index = keys.keys.length ? Math.max(...keys.keys.map((key) => parseInt(key.name, 10))) + 1 : 1;
		await env.HAND_BALL_PLAYER_DATA.put(
			index.toString(),
			JSON.stringify({
				index,
				name: data.name,
				img: data.img,
				king: 0,
				pawn: 0,
				knight: 0,
				queen: 0,
			}),
		);
	}
	return new Response('Player added/updated', { status: 200 });
}
