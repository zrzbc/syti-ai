export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, code } = await request.json();
  if (!email || !code) return Response.json({ error: '参数不完整' }, { status: 400 });

  const trimmedCode = code.trim();

  // 1. 检查用户
  const user = await env.DB.prepare('SELECT exp FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '用户不存在，请先登录' }, { status: 400 });

  // 2. 检查激活码
  const record = await env.DB.prepare('SELECT amount, is_used FROM exp_codes WHERE code = ?').bind(trimmedCode).first();
  if (!record) return Response.json({ error: '激活码无效' }, { status: 400 });
  if (record.is_used) return Response.json({ error: '该激活码已被使用' }, { status: 400 });

  // 3. 防并发：使用乐观锁更新激活码状态
  const upd = await env.DB.prepare(
    'UPDATE exp_codes SET is_used = 1, used_by = ?, used_at = ? WHERE code = ? AND is_used = 0'
  ).bind(email, Date.now(), trimmedCode).run();

  if (upd.meta.changes === 0) {
    return Response.json({ error: '手慢了，激活码刚被他人使用' }, { status: 409 });
  }

  // 4. 增加用户经验
  const newExp = (user.exp || 0) + record.amount;
  await env.DB.prepare('UPDATE users SET exp = ? WHERE email = ?').bind(newExp, email).run();

  return Response.json({ success: true, added: record.amount, exp: newExp });
}