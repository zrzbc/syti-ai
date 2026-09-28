export async function onRequestPost(context) {
  const { request, env } = context;
  const { email } = await request.json();

  if (!email) return Response.json({ error: '参数不完整' }, { status: 400 });

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });

  // 按北京时间算今天
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });

  // 如果今天已签到
  if (user.last_signin_date === today) {
    return Response.json({ error: '今天已经签到过了，明天再来吧！' }, { status: 400 });
  }

  // 判断是否连续：昨天签到过则连续，否则重新从第 1 天开始
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
  let newSigninDays = 1;
  let newContinuousDays = 1;

  if (user.last_signin_date === yesterday) {
    // 连续签到
    newSigninDays = (user.signin_days || 0) + 1;
    if (newSigninDays > 7) newSigninDays = 1; // 满 7 天回到第 1 天
    newContinuousDays = (user.continuous_days || 0) + 1;
  } else {
    // 漏签，重置
    newSigninDays = 1;
    newContinuousDays = 1;
  }

  // 根据第几天给经验
  let expReward = 0;
  const dayRewards = { 1: 5, 2: 8, 3: 10, 5: 8, 6: 12 };
  if (newSigninDays === 4 || newSigninDays === 7) {
    // 随机 8~20 经验
    expReward = Math.floor(Math.random() * 13) + 8;
  } else {
    expReward = dayRewards[newSigninDays] || 5;
  }

  const newExp = (user.exp || 0) + expReward;

  await env.DB.prepare(
    'UPDATE users SET exp = ?, signin_days = ?, last_signin_date = ?, continuous_days = ? WHERE email = ?'
  ).bind(newExp, newSigninDays, today, newContinuousDays, email).run();

  return Response.json({
    success: true,
    exp: newExp,
    signinDays: newSigninDays,
    continuousDays: newContinuousDays,
    reward: expReward,
    message: `签到成功！获得 ${expReward} 经验`
  });
}