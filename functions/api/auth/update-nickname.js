export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, newNickname } = await request.json();

  if (!email || !newNickname) {
    return Response.json({ error: '参数不完整' }, { status: 400 });
  }

  // 1. 检查新昵称是否已被别人占用
  const existing = await env.DB.prepare(
    'SELECT id FROM users WHERE nickname = ? AND email != ?'
  ).bind(newNickname, email).first();

  if (existing) {
    return Response.json({ error: '该昵称已被其他人占用' }, { status: 400 });
  }

  // 2. 更新昵称
  await env.DB.prepare('UPDATE users SET nickname = ? WHERE email = ?').bind(newNickname, email).run();

  return Response.json({ success: true, message: '昵称修改成功' });
}