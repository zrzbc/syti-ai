export async function onRequestPost(context) {
  const { request, env } = context;
  const { password, songName, originalLyrics, maskedLyrics } = await request.json();

  const adminPwd = env.ADMIN_PASSWORD || '230223';
  if (!password || password !== adminPwd) return Response.json({ error: '密码错误' }, { status: 403 });
  if (!songName || !originalLyrics || !maskedLyrics) return Response.json({ error: '参数不完整' }, { status: 400 });

  // 建表（保证存在）
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS guess_lyrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_name TEXT NOT NULL,
      original_lyrics TEXT NOT NULL,
      masked_lyrics TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `).run();

  await env.DB.prepare(
    'INSERT INTO guess_lyrics (song_name, original_lyrics, masked_lyrics, created_at) VALUES (?, ?, ?, ?)'
  ).bind(songName, originalLyrics, maskedLyrics, Date.now()).run();

  return Response.json({ success: true });
}