export async function onRequestPost(context) {
  const { request, env } = context;
  const { email } = await request.json();

  if (!email) return Response.json({ error: '参数不完整' }, { status: 400 });

  const user = await env.DB.prepare('SELECT id, email, nickname, exp FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });

  return Response.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      exp: user.exp || 0
    }
  });
}