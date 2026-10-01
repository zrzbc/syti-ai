export async function onRequestPost(context) {
  const { request, env } = context;
  const { email } = await request.json();

  // 获取排行榜前 10 名（按连续签到天数从高到低）
const top10 = await env.DB.prepare(
    'SELECT email, nickname, avatar, continuous_days, badge_type, badge_name, badge_expire_at FROM users ORDER BY continuous_days DESC LIMIT 10'
  ).all();

  // 获取当前用户信息（可能没上榜）
  let currentUser = null;
  if (email) {
currentUser = await env.DB.prepare(
      'SELECT email, nickname, avatar, continuous_days, badge_type, badge_name, badge_expire_at FROM users WHERE email = ?'
    ).bind(email).first();
  }

  return Response.json({
    success: true,
    top10: top10.results || [],
    currentUser: currentUser
  });
}
