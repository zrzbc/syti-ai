export async function onRequestPost(context) {
  const { request, env } = context;
  const { email } = await request.json();
  if (!email) return Response.json({ error: '缺少邮箱参数' }, { status: 401 });

  // 按北京时间算今天
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });

  try {
    // 建立领取记录表
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS lyrics_reward_logs (
        email TEXT NOT NULL,
        date TEXT NOT NULL,
        PRIMARY KEY(email, date)
      )
    `).run();

    // 检查今天是否已经领过
    const log = await env.DB.prepare('SELECT 1 FROM lyrics_reward_logs WHERE email = ? AND date = ?').bind(email, today).first();
    if (log) {
      return Response.json({ success: true, rewarded: false, message: '今日已经领过奖励啦' });
    }

    // 检查用户是否存在
    const user = await env.DB.prepare('SELECT exp FROM users WHERE email = ?').bind(email).first();
    if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });

    // 发放 80 经验
    const newExp = (user.exp || 0) + 80;
    await env.DB.prepare('UPDATE users SET exp = ? WHERE email = ?').bind(newExp, email).run();
    
    // 记录日志
    await env.DB.prepare('INSERT INTO lyrics_reward_logs (email, date) VALUES (?, ?)').bind(email, today).run();

    return Response.json({ success: true, rewarded: true, exp: newExp, message: '获得 80 经验' });
  } catch (error) {
    return Response.json({ error: '数据库错误: ' + error.message }, { status: 500 });
  }
}