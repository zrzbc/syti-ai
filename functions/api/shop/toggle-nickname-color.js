export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, action } = await request.json();
  if (!email || !action) return Response.json({ error: '参数不完整' }, { status: 400 });
  if (action !== 'reset' && action !== 'use') {
    return Response.json({ error: '无效的操作' }, { status: 400 });
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });

  if (!user.nickname_color || !user.nickname_color_expire_at || user.nickname_color_expire_at < Date.now()) {
    return Response.json({ error: '你还没有可用的昵称颜色' }, { status: 400 });
  }

  const equipped = action === 'use' ? 1 : 0;
  await env.DB.prepare(
    'UPDATE users SET nickname_color_equipped = ? WHERE email = ?'
  ).bind(equipped, email).run();

  return Response.json({ success: true, nickname_color_equipped: equipped });
}