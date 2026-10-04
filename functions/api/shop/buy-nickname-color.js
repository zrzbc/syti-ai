const PRICES = { yellow: 450, blue: 450, pink: 600, purple: 600 };
const DURATION_DAYS = 30;

export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, color } = await request.json();
  if (!email || !color) return Response.json({ error: '参数不完整' }, { status: 400 });
  if (!PRICES[color]) return Response.json({ error: '无效的颜色类型' }, { status: 400 });

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });

  const price = PRICES[color];
  if ((user.exp || 0) < price) return Response.json({ error: '经验不足' }, { status: 400 });

  const newExp = user.exp - price;
  const expireAt = Date.now() + DURATION_DAYS * 24 * 60 * 60 * 1000;

  await env.DB.prepare(
    'UPDATE users SET exp = ?, nickname_color = ?, nickname_color_expire_at = ?, nickname_color_equipped = 1 WHERE email = ?'
  ).bind(newExp, color, expireAt, email).run();

  return Response.json({
    success: true,
    exp: newExp,
    nickname_color: color,
    nickname_color_expire_at: expireAt,
    nickname_color_equipped: 1
  });
}