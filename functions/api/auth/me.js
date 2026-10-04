export async function onRequestPost(context) {
  const { request, env } = context;
  const { email } = await request.json();
  if (!email) return Response.json({ error: '参数不完整' }, { status: 400 });

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });

  const badgeValid = user.badge_type && user.badge_expire_at && user.badge_expire_at > Date.now();
  const badgeEquipped = user.badge_equipped !== 0;

  const colorValid = user.nickname_color && user.nickname_color_expire_at && user.nickname_color_expire_at > Date.now();
  const colorEquipped = user.nickname_color_equipped !== 0;

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

      has_badge: (badgeValid && badgeEquipped) ? 1 : 0,
      badge_type: badgeValid ? user.badge_type : null,
      badge_name: badgeValid ? user.badge_name : null,
      badge_expire_at: badgeValid ? user.badge_expire_at : null,
      badge_equipped: badgeEquipped ? 1 : 0,
      badge_update_count: user.badge_update_count || 0,
      badge_update_month: user.badge_update_month || '',

      // ★ 昵称颜色
      nickname_color: colorValid ? user.nickname_color : null,
      nickname_color_expire_at: colorValid ? user.nickname_color_expire_at : null,
      nickname_color_equipped: colorEquipped ? 1 : 0
    }
  });
}
