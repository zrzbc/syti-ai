const PRICES = { normal: 800, premium: 1200, ultimate: 1550 };
const DURATIONS = { normal: 60, premium: 90, ultimate: 120 };

export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, type } = await request.json();
  if (!email || !type) return Response.json({ error: '参数不完整' }, { status: 400 });
  if (!PRICES[type]) return Response.json({ error: '无效的商品类型' }, { status: 400 });

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });

  const price = PRICES[type];
  if ((user.exp || 0) < price) return Response.json({ error: '经验不足' }, { status: 400 });

  const newExp = user.exp - price;
  const expireAt = Date.now() + DURATIONS[type] * 24 * 60 * 60 * 1000;

  await env.DB.prepare(
    'UPDATE users SET exp = ?, badge_type = ?, badge_name = ?, badge_expire_at = ?, badge_update_count = 0, badge_update_month = ?, badge_equipped = 1 WHERE email = ?'
  ).bind(newExp, type, '', expireAt, new Date().toISOString().slice(0, 7), email).run();

  return Response.json({ success: true, exp: newExp, badge_type: type, badge_expire_at: expireAt });
}
