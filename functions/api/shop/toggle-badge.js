const VALID_TYPES = ['normal', 'premium', 'ultimate'];

export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, type, action } = await request.json();

  if (!email || !type || !action) {
    return Response.json({ error: '参数不完整' }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type)) {
    return Response.json({ error: '无效的名牌类型' }, { status: 400 });
  }
  if (action !== 'load' && action !== 'unload') {
    return Response.json({ error: '无效的操作' }, { status: 400 });
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });

  // 必须拥有这个名牌且未过期
  if (user.badge_type !== type) {
    return Response.json({ error: '你没有这个名牌' }, { status: 400 });
  }
  if (!user.badge_expire_at || user.badge_expire_at < Date.now()) {
    return Response.json({ error: '名牌已过期' }, { status: 400 });
  }

  const equipped = action === 'load' ? 1 : 0;
  await env.DB.prepare(
    'UPDATE users SET badge_equipped = ? WHERE email = ?'
  ).bind(equipped, email).run();

  return Response.json({ success: true, badge_equipped: equipped });
}