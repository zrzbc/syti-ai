export async function onRequestGet(context) {
  const { env } = context;
  try {
    const row = await env.DB.prepare(
      'SELECT song_name, original_lyrics, masked_lyrics FROM guess_lyrics ORDER BY id DESC LIMIT 1'
    ).first();
    if (!row) return Response.json({ success: false, error: '暂无题目' });
    return Response.json({ success: true, data: row });
  } catch (e) {
    return Response.json({ success: false, error: '数据库错误' });
  }
}