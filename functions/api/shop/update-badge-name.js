const MAX_LENGTH = { normal: 4, premium: 6, ultimate: 6 };

export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, newName } = await request.json();
  if (!email || !newName) return Response.json({ error: '参数不完整' }, { status: 400 });

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });
  if (!user.badge_type) return Response.json({ error: '你还没有名牌' }, { status: 400 });
  if (!user.badge_expire_at || user.badge_expire_at < Date.now()) {
    return Response.json({ error: '名牌已过期' }, { status: 400 });
  }

  const maxLen = MAX_LENGTH[user.badge_type] || 6;
  const trimmed = newName.trim();
  if (!trimmed) return Response.json({ error: '名称不能为空' }, { status: 400 });
  if (trimmed.length > maxLen) {
    return Response.json({ error: `名称不能超过 ${maxLen} 个字` }, { status: 400 });
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
  let count = user.badge_update_count || 0;
  if (user.badge_update_month !== currentMonth) count = 0;

  const isFirstTime = !user.badge_name;
  if (!isFirstTime && count >= 3) {
    return Response.json({ error: '本月修改次数已用完（每月3次）' }, { status: 400 });
  }

  const newCount = isFirstTime ? 0 : count + 1;

  await env.DB.prepare(
    'UPDATE users SET badge_name = ?, badge_update_count = ?, badge_update_month = ? WHERE email = ?'
  ).bind(trimmed, newCount, currentMonth, email).run();

  return Response.json({ success: true, badge_name: trimmed, badge_update_count: newCount });
}