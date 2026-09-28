export async function onRequestPost(context) {
  const { request, env } = context;
  // 1. 接收前端数据（去掉了 code）
  const { email, password } = await request.json();

  if (!email || !password) {
    return Response.json({ error: '请填写邮箱和密码' }, { status: 400 });
  }

  // 2. 查找用户
  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) {
    return Response.json({ error: '邮箱未注册' }, { status: 400 });
  }

  // 3. 比对密码哈希
  const encoder = new TextEncoder();
  const pwData = encoder.encode(password + email);
  const pwHashBuffer = await crypto.subtle.digest('SHA-256', pwData);
  const inputHash = Array.from(new Uint8Array(pwHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  if (inputHash !== user.password_hash) {
    return Response.json({ error: '密码错误' }, { status: 400 });
  }

  // 4. 返回用户信息（包含昵称）
  return Response.json({
    success: true,
    message: '登录成功',
    user: { 
      id: user.id, 
      email: user.email, 
      nickname: user.nickname, 
      exp: user.exp || 0  // 👈 加上这一行，把经验值也返回
    }
  });
