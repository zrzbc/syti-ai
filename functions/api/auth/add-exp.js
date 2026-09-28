export async function onRequestPost(context) {
  const { request, env } = context;
  const { email } = await request.json();

  if (!email) return Response.json({ error: '参数不完整' }, { status: 400 });

  // 1. 获取用户当前信息
  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });

  // 2. 获取今天的日期字符串 (YYYY-MM-DD)，按北京时间算
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }); // 例如 "2026-09-28"

  // 3. 判断今天是否已经点过
  if (user.last_clover_click_date === today) {
    return Response.json({ error: '今天已经领取过经验啦，明天再来吧！' }, { status: 400 });
  }

  // 4. 增加 10 点经验，并更新最后签到日期
  const newExp = (user.exp || 0) + 10;
  await env.DB.prepare(
    'UPDATE users SET exp = ?, last_clover_click_date = ? WHERE email = ?'
  ).bind(newExp, today, email).run();

  // 5. 返回最新经验值
  return Response.json({ success: true, exp: newExp, message: '签到成功，经验值 +10！' });
}