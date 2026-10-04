const PRICES = { draw: 100 };

export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, productType } = await request.json();
  if (!email || !productType) return Response.json({ error: '参数不完整' }, { status: 400 });
  if (!PRICES[productType]) return Response.json({ error: '无效的产品' }, { status: 400 });

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });

  // 是否已购买
  const existing = await env.DB.prepare(
    'SELECT id FROM activation_codes WHERE used_by = ? AND product_type = ? LIMIT 1'
  ).bind(email, productType).first();
  if (existing) return Response.json({ error: '你已购买过该产品' }, { status: 400 });

  // 经验是否足够
  const price = PRICES[productType];
  if ((user.exp || 0) < price) return Response.json({ error: '经验不足' }, { status: 400 });

  // 随机取一个未使用的激活码
  const row = await env.DB.prepare(
    'SELECT id, code FROM activation_codes WHERE product_type = ? AND used_by IS NULL ORDER BY RANDOM() LIMIT 1'
  ).bind(productType).first();
  if (!row) return Response.json({ error: '激活码已发完' }, { status: 400 });

  // 原子性占用（避免并发抢同一个码）
  const upd = await env.DB.prepare(
    'UPDATE activation_codes SET used_by = ?, used_at = ? WHERE id = ? AND used_by IS NULL'
  ).bind(email, Date.now(), row.id).run();
  if (!upd.meta.changes) return Response.json({ error: '激活码已被抢走，请重试' }, { status: 409 });

  // 扣经验
  await env.DB.prepare('UPDATE users SET exp = exp - ? WHERE email = ?').bind(price, email).run();

  return Response.json({ success: true, code: row.code, exp: (user.exp - price) });
}