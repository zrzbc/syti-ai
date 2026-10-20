const DAILY_MESSAGE_LIMIT = 50;

export async function onRequestPost(context) {
  const { request, env } = context;
  const { password, email, amount, mode } = await request.json();

  const adminPwd = env.ADMIN_PASSWORD || '230223';
  if (!password || password !== adminPwd) {
    return Response.json({ error: '密码错误' }, { status: 403 });
  }
  if (!email) return Response.json({ error: '缺少邮箱' }, { status: 400 });

  const user = await env.DB.prepare('SELECT email FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });

  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS chat_daily_count (
      email TEXT NOT NULL, date TEXT NOT NULL,
      count INTEGER DEFAULT 0,
      PRIMARY KEY(email, date)
    )`
  ).run();

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });

  const row = await env.DB.prepare(
    'SELECT count FROM chat_daily_count WHERE email = ? AND date = ?'
  ).bind(email, today).first();
  const current = row?.count || 0;

  let newCount;
  if (mode === 'set') {
    newCount = Math.max(0, Math.round(Number(amount) || 0));
  } else if (mode === 'reset') {
    newCount = 0;
  } else {
    // 默认 add：amount 正数=多消耗，负数=返还额度
    newCount = Math.max(0, current + Math.round(Number(amount) || 0));
  }

  await env.DB.prepare(
    `INSERT INTO chat_daily_count (email, date, count) VALUES (?, ?, ?)
     ON CONFLICT(email, date) DO UPDATE SET count = ?`
  ).bind(email, today, newCount, newCount).run();

  return Response.json({
    success: true,
    email,
    date: today,
    used: newCount,
    remaining: Math.max(0, DAILY_MESSAGE_LIMIT - newCount)
  });
}