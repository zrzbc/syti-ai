export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, password } = await request.json();

  if (!email || !password) {
    return Response.json({ error: '请填写邮箱和密码' }, { status: 400 });
  }

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) {
    return Response.json({ error: '邮箱未注册' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const pwData = encoder.encode(password + email);
  const pwHashBuffer = await crypto.subtle.digest('SHA-256', pwData);
  const inputHash = Array.from(new Uint8Array(pwHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  if (inputHash !== user.password_hash) {
    return Response.json({ error: '密码错误' }, { status: 400 });
  }

  return Response.json({
    success: true,
    message: '登录成功',
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      exp: user.exp || 0
    }
  });
}
