export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, amount, reason } = await request.json();
  if (!email || amount == null) return Response.json({ error: '参数不完整' }, { status: 400 });
  const num = Math.ceil(Number(amount));
  if (!Number.isFinite(num) || num <= 0) return Response.json({ error: '金额不合法' }, { status: 400 });

  const user = await env.DB.prepare('SELECT exp FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });
  if ((user.exp || 0) < num) {
    return Response.json({ error: '四叶草不足' }, { status: 400 });
  }

  const newExp = Math.max(0, (user.exp || 0) - num);
  await env.DB.prepare('UPDATE users SET exp = ? WHERE email = ?').bind(newExp, email).run();
  return Response.json({ success: true, exp: newExp });
}