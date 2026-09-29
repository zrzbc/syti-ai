export async function onRequestPost(context) {
  const { env } = context;
  try {
    await env.DB.prepare(
      'CREATE TABLE IF NOT EXISTS game_clicks (game_id TEXT PRIMARY KEY, count INTEGER DEFAULT 0)'
    ).run();
    const rows = await env.DB.prepare('SELECT game_id, count FROM game_clicks').all();
    const map = {};
    for (const row of (rows.results || [])) {
      map[row.game_id] = row.count;
    }
    return Response.json({ success: true, data: map });
  } catch (e) {
    return Response.json({ success: true, data: {} });
  }
}