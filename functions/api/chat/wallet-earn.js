const DAILY_EARN_LIMIT = 500;

export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, amount, reason } = await request.json();
  if (!email || amount == null) return Response.json({ error: '参数不完整' }, { status: 400 });
  const num = Math.round(Number(amount));
  if (!Number.isFinite(num) || num <= 0) return Response.json({ error: '金额不合法' }, { status: 400 });

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
  const row = await env.DB.prepare(
    'SELECT total FROM chat_daily_earn WHERE email = ? AND date = ?'
  ).bind(email, today).first();
  const earned = row?.total || 0;
  if (earned + num > DAILY_EARN_LIMIT) {
    return Response.json({ error: `今日四叶草收入已达上限（${DAILY_EARN_LIMIT}）` }, { status: 400 });
  }

  const user = await env.DB.prepare('SELECT exp FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });
  const newExp = (user.exp || 0) + num;
  await env.DB.prepare('UPDATE users SET exp = ? WHERE email = ?').bind(newExp, email).run();

  await env.DB.prepare(
    `INSERT INTO chat_daily_earn (email, date, total) VALUES (?, ?, ?)
     ON CONFLICT(email, date) DO UPDATE SET total = total + ?`
  ).bind(email, today, num, num).run();

  return Response.json({ success: true, exp: newExp });
}