export async function onRequestPost(context) {
  const { request, env } = context;
  const { password, songName, originalLyrics, maskedLyrics, publishDate } = await request.json();

  const adminPwd = env.ADMIN_PASSWORD || '230223';
  if (!password || password !== adminPwd) return Response.json({ error: '密码错误' }, { status: 403 });
  if (!songName || !originalLyrics || !maskedLyrics || !publishDate) return Response.json({ error: '参数不完整' }, { status: 400 });

  try {
    // 1. 智能检查：尝试查询 publish_date，如果报错说明是旧表缺列，直接删表重建
    try {
      await env.DB.prepare('SELECT publish_date FROM guess_lyrics LIMIT 1').run();
    } catch (e) {
      // 如果报错（比如没有这个列），说明表结构不对，直接销毁旧表
      await env.DB.prepare('DROP TABLE IF EXISTS guess_lyrics').run();
    }

    // 2. 建表（此时如果是刚删过的，就会全新创建）
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS guess_lyrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        song_name TEXT NOT NULL,
        original_lyrics TEXT NOT NULL,
        masked_lyrics TEXT NOT NULL,
        publish_date TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `).run();

    // 3. 检查该日期是否已经有题目
    const existing = await env.DB.prepare(
      'SELECT id FROM guess_lyrics WHERE publish_date = ?'
    ).bind(publishDate).first();

    if (existing) {
      // 如果有，执行 UPDATE 覆盖
      await env.DB.prepare(
        'UPDATE guess_lyrics SET song_name = ?, original_lyrics = ?, masked_lyrics = ?, created_at = ? WHERE publish_date = ?'
      ).bind(songName, originalLyrics, maskedLyrics, Date.now(), publishDate).run();
    } else {
      // 如果没有，执行 INSERT 插入
      await env.DB.prepare(
        'INSERT INTO guess_lyrics (song_name, original_lyrics, masked_lyrics, publish_date, created_at) VALUES (?, ?, ?, ?, ?)'
      ).bind(songName, originalLyrics, maskedLyrics, publishDate, Date.now()).run();
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: '数据库操作失败: ' + error.message }, { status: 500 });
  }
}
