const VALID_TYPES = ['normal', 'premium', 'ultimate'];
const MAX_LENGTH = { normal: 4, premium: 6, ultimate: 6 };
const PERMANENT_THRESHOLD = 9999999999999;
const FREE_SWITCH_LIMIT = 3;

export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, type } = await request.json();
  if (!email || !type) return Response.json({ error: '参数不完整' }, { status: 400 });
  if (!VALID_TYPES.includes(type)) return Response.json({ error: '无效的名牌类型' }, { status: 400 });

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });

  // 必须拥有永久名牌
  const isPermanent = user.badge_expire_at && user.badge_expire_at >= PERMANENT_THRESHOLD;
  if (!isPermanent) {
    return Response.json({ error: '只有永久名牌才能免费更换样式' }, { status: 400 });
  }

  if (user.badge_type === type) {
    return Response.json({ error: '已经是当前样式' }, { status: 400 });
  }

  // 每月次数检查
  const currentMonth = new Date().toISOString().slice(0, 7);
  let count = user.badge_update_count || 0;
  if (user.badge_update_month !== currentMonth) count = 0;

  if (count >= FREE_SWITCH_LIMIT) {
    return Response.json({ error: `本月免费更换次数已用完（每月 ${FREE_SWITCH_LIMIT} 次）` }, { status: 400 });
  }

  // 名称长度若超限自动截断
  let newName = user.badge_name || '';
  const maxLen = MAX_LENGTH[type] || 6;
  if (newName.length > maxLen) newName = newName.slice(0, maxLen);

  await env.DB.prepare(
    'UPDATE users SET badge_type = ?, badge_name = ?, badge_update_count = ?, badge_update_month = ?, badge_equipped = 1 WHERE email = ?'
  ).bind(type, newName, count + 1, currentMonth, email).run();

  return Response.json({
    success: true,
    badge_type: type,
    badge_name: newName,
    badge_update_count: count + 1,
    remaining: FREE_SWITCH_LIMIT - (count + 1)
  });
}
