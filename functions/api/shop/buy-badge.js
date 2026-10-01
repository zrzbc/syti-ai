export async function onRequestPost(context) {
  const { request, env } = context;
  const { email } = await request.json();
  if (!email) return Response.json({ error: '参数不完整' }, { status: 400 });

  // 后端自己查真实经验，绝对不信任前端传的任何数值
  const user = await env.DB.prepare(
    'SELECT exp, has_badge FROM users WHERE email = ?'
  ).bind(email).first();

  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });
  if (user.has_badge) return Response.json({ error: '已拥有该物品' }, { status: 400 });
  if ((user.exp || 0) < 500) return Response.json({ error: '经验不足，需要 500 经验' }, { status: 400 });

  const newExp = user.exp - 500;
  await env.DB.prepare(
    'UPDATE users SET exp = ?, has_badge = 1 WHERE email = ?'
  ).bind(newExp, email).run();

  return Response.json({ success: true, exp: newExp, hasBadge: 1 });
}