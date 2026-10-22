export async function onRequestPost(context) {
  const { request, env } = context;
  const { password, songName, originalLyrics, maskedLyrics, publishDate } = await request.json();

  const adminPwd = env.ADMIN_PASSWORD || '230223';
  if (!password || password !== adminPwd) return Response.json({ error: '密码错误' }, { status: 403 });
  if (!songName || !originalLyrics || !maskedLyrics || !publishDate) return Response.json({ error: '参数不完整' }, { status: 400 });

  // 建表：将 publish_date 设为 UNIQUE，方便后面覆盖
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS guess_lyrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_name TEXT NOT NULL,
      original_lyrics TEXT NOT NULL,
      masked_lyrics TEXT NOT NULL,
      publish_date TEXT UNIQUE NOT NULL,
      created_at INTEGER NOT NULL
    )
  `).run();

  // 插入或更新：如果该日期已有题目，则覆盖
  await env.DB.prepare(`
    INSERT INTO guess_lyrics (song_name, original_lyrics, masked_lyrics, publish_date, created_at) 
    VALUES (?, ?, ?, ?, ?) 
    ON CONFLICT(publish_date) DO UPDATE SET 
      song_name = excluded.song_name, 
      original_lyrics = excluded.original_lyrics, 
      masked_lyrics = excluded.masked_lyrics,
      created_at = excluded.created_at
  `).bind(songName, originalLyrics, maskedLyrics, publishDate, Date.now()).run();

  return Response.json({ success: true });
}
