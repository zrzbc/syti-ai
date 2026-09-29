export async function onRequestPost(context) {
  const { request, env } = context;
  const { email } = await request.json();
  if (!email) return Response.json({ error: '参数不完整' }, { status: 400 });

  const user = await env.DB.prepare('SELECT game_data FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });

  const data = user.game_data ? JSON.parse(user.game_data) : {};
  return Response.json({ success: true, data });
}