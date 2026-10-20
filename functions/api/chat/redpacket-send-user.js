export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, amount, title } = await request.json();
  if (!email || amount == null) return Response.json({ error: '参数不完整' }, { status: 400 });
  const num = Math.round(Number(amount));
  if (!Number.isFinite(num) || num <= 0) return Response.json({ error: '金额不合法' }, { status: 400 });
  const t = String(title || '').trim().slice(0, 15) || '恭喜发财，大吉大利';

  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS red_packets (
      id TEXT PRIMARY KEY, user_email TEXT NOT NULL, direction TEXT NOT NULL,
      amount INTEGER NOT NULL, title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL, expire_at INTEGER NOT NULL
    )`
  ).run();

  const user = await env.DB.prepare('SELECT exp FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });
  if ((user.exp || 0) < num) return Response.json({ error: '四叶草不足' }, { status: 400 });

  const newExp = (user.exp || 0) - num;
  await env.DB.prepare('UPDATE users SET exp = ? WHERE email = ?').bind(newExp, email).run();

  const id = 'rp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  const now = Date.now();
  const expireAt = now + 60 * 1000;
  await env.DB.prepare(
    'INSERT INTO red_packets (id, user_email, direction, amount, title, status, created_at, expire_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, email, 'user_to_her', num, t, 'pending', now, expireAt).run();

  return Response.json({ success: true, id, expireAt, exp: newExp });
}