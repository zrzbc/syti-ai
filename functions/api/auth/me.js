export async function onRequestPost(context) {
  const { request, env } = context;
  const { email } = await request.json();

  if (!email) return Response.json({ error: '参数不完整' }, { status: 400 });

const user = await env.DB.prepare('SELECT id, email, nickname, exp, avatar, signin_days, continuous_days, last_signin_date, has_badge FROM users WHERE email = ?').bind(email).first();

  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });

  return Response.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar || '',
      exp: user.exp || 0,
      signin_days: user.signin_days || 0,
      continuous_days: user.continuous_days || 0,
      last_signin_date: user.last_signin_date || null,
      has_badge: user.has_badge || 0
    }
  });
}
