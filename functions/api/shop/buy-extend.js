const PRICES = { extend30: 650, extend90: 1100, extendforever: 3500 };
const DURATIONS = { extend30: 30, extend90: 90 };
const PERMANENT_THRESHOLD = 9999999999999;

export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, type } = await request.json();
  if (!email || !type) return Response.json({ error: '参数不完整' }, { status: 400 });
  if (!PRICES[type]) return Response.json({ error: '无效的商品类型' }, { status: 400 });

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });

  // 必须先拥有名牌
  if (!user.badge_type || !user.badge_expire_at) {
    return Response.json({ error: '你还没有名牌，无法续期' }, { status: 400 });
  }

  // 已过期的不允许续期
  if (user.badge_expire_at < Date.now()) {
    return Response.json({ error: '名牌已过期，请重新购买' }, { status: 400 });
  }

  // 已是永久名牌，无需再续
  if (user.badge_expire_at >= PERMANENT_THRESHOLD) {
    return Response.json({ error: '当前名牌已是永久，无需续期' }, { status: 400 });
  }

  const price = PRICES[type];
  if ((user.exp || 0) < price) return Response.json({ error: '经验不足' }, { status: 400 });

  const newExp = user.exp - price;

  let newExpireAt;
  if (type === 'extendforever') {
    newExpireAt = PERMANENT_THRESHOLD;   // 永久标记
  } else {
    const baseTime = Math.max(user.badge_expire_at, Date.now());
    newExpireAt = baseTime + DURATIONS[type] * 24 * 60 * 60 * 1000;
  }

  await env.DB.prepare(
    'UPDATE users SET exp = ?, badge_expire_at = ? WHERE email = ?'
  ).bind(newExp, newExpireAt, email).run();

  return Response.json({ success: true, exp: newExp, badge_expire_at: newExpireAt });
}