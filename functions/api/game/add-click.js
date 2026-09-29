export async function onRequestPost(context) {
  const { request, env } = context;
  const { gameId } = await request.json();
  if (!gameId) return Response.json({ error: '缺少 gameId' }, { status: 400 });

  await env.DB.prepare(
    'CREATE TABLE IF NOT EXISTS game_clicks (game_id TEXT PRIMARY KEY, count INTEGER DEFAULT 0)'
  ).run();

  await env.DB.prepare(
    'INSERT INTO game_clicks (game_id, count) VALUES (?, 1) ON CONFLICT(game_id) DO UPDATE SET count = count + 1'
  ).bind(gameId).run();

  return Response.json({ success: true });
}