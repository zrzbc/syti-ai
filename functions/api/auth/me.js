export async function onRequestPost(context) {
  const { request, env } = context;
  const { email } = await request.json();

  if (!email) return Response.json({ error: '参数不完整' }, { status: 400 });

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();

  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });

  // 判断名牌是否有效（是否过期）
  const badgeValid = user.badge_type && user.badge_expire_at && user.badge_expire_at > Date.now();
  // 判断名牌是否佩戴中
  const badgeEquipped = user.badge_equipped !== 0;   // 未设置或为 1 → 佩戴；0 → 已卸下

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

      // has_badge 综合"是否有效 + 是否佩戴中"
      has_badge: (badgeValid && badgeEquipped) ? 1 : 0,

      // ★ badge_type / badge_name / badge_expire_at 保持原样（只看是否过期）
      //   前端会根据 badge_equipped 决定是否显示、是否显示"卸下/装载"
      badge_type: badgeValid ? user.badge_type : null,
      badge_name: badgeValid ? user.badge_name : null,
      badge_expire_at: badgeValid ? user.badge_expire_at : null,

      // ★ 新增：是否佩戴中（1 佩戴 / 0 卸下）
      badge_equipped: badgeEquipped ? 1 : 0,

      badge_update_count: user.badge_update_count || 0,
      badge_update_month: user.badge_update_month || ''
    }
  });
}
