export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, password } = await request.json();

  // 1. 查找用户
  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email).first();

  if (!user) {
    return Response.json({ error: '邮箱未注册' }, { status: 400 });
  }

  // 2. 比对密码哈希
  const encoder = new TextEncoder();
  const pwData = encoder.encode(password + email);
  const pwHashBuffer = await crypto.subtle.digest('SHA-256', pwData);
  const inputHash = Array.from(new Uint8Array(pwHashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (inputHash !== user.password_hash) {
    return Response.json({ error: '密码错误' }, { status: 400 });
  }

  // 3. 登录成功，返回用户信息
  return Response.json({
    success: true,
    message: '登录成功',
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar || '',
      exp: user.exp || 0,
      signin_days: user.signin_days || 0,
      continuous_days: user.continuous_days || 0,
      last_signin_date: user.last_signin_date || null,
      has_badge: (user.badge_type && user.badge_expire_at && user.badge_expire_at > Date.now()) ? 1 : 0,
      badge_type: (user.badge_expire_at && user.badge_expire_at > Date.now()) ? user.badge_type : null,
      badge_name: (user.badge_expire_at && user.badge_expire_at > Date.now()) ? user.badge_name : null,
      badge_expire_at: (user.badge_expire_at && user.badge_expire_at > Date.now()) ? user.badge_expire_at : null,
      badge_update_count: user.badge_update_count || 0,
      badge_update_month: user.badge_update_month || ''
    }
  });
}
