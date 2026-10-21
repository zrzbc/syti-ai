export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, avatar } = await request.json();

  if (!email || !avatar) {
    return Response.json({ error: '参数不完整' }, { status: 400 });
  }

  // 限制头像大小（Base64 大约 1.3 倍于原始大小，这里限制约 500KB）
  if (avatar.length > 700000) {
    return Response.json({ error: '头像文件过大，请上传小于 500KB 的图片' }, { status: 400 });
  }

  // 查询用户信息，检查是否领过首次头像奖励
  const user = await env.DB.prepare('SELECT avatar_reward_claimed, exp FROM users WHERE email = ?').bind(email).first();
  
  let newExp = user?.exp || 0;
  let rewardMsg = '头像更新成功';
  let rewardGiven = false;

  // 如果没领过，则增加 80 经验并标记为已领取
  if (user && user.avatar_reward_claimed !== 1) {
    newExp += 80;
    await env.DB.prepare('UPDATE users SET avatar = ?, exp = ?, avatar_reward_claimed = 1 WHERE email = ?').bind(avatar, newExp, email).run();
    rewardMsg = '头像更新成功，首次设置头像奖励 80 经验！';
    rewardGiven = true;
  } else {
    // 已经领过，仅更新头像
    await env.DB.prepare('UPDATE users SET avatar = ? WHERE email = ?').bind(avatar, email).run();
  }

  return Response.json({ 
    success: true, 
    message: rewardMsg,
    rewardGiven: rewardGiven,
    newExp: newExp
  });
}
