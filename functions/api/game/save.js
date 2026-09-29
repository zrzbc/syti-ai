const ALLOWED_KEYS = [
  'abyssPlayerCoins', 'abyssAchievements', 'abyssTotalScore', 'abyssTotalKills',
  'abyssMaxDistanceEver', 'abyssTotalComboUses', 'abyssTamedMonsterTotalKills',
  'abyssTotalBonesPickedUp', 'abyssTotalAmethystsPickedUp', 'abyssTotalBulletsFired',
  'abyssTotalShopPurchases', 'abyssDoubleJumpCount', 'abyssTotalCoinsEarned',
  'abyssDamageTakenCount', 'abyssDeathCount', 'abyssAExplodeKillsCount',
  'abyssShopPurchases'
];

export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, data } = await request.json();
  if (!email || typeof data !== 'object') return Response.json({ error: '参数错误' }, { status: 400 });

  const user = await env.DB.prepare('SELECT game_data FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });

  const oldData = user.game_data ? JSON.parse(user.game_data) : {};
  const merged = {};

  for (const key of ALLOWED_KEYS) {
    if (data[key] !== undefined) {
      // 数值型字段做防倒退 + 上限保护
      const oldVal = Number(oldData[key]) || 0;
      const newVal = Number(data[key]) || 0;
      if (key === 'abyssPlayerCoins') {
        // 金币单次增长最多 50000（防恶意篡改），且不能倒退
        merged[key] = Math.max(oldVal, Math.min(newVal, oldVal + 50000));
      } else if (key === 'abyssAchievements' || key === 'abyssShopPurchases') {
        // JSON 字符串，只允许增长不允许减少
        try {
          const oldObj = JSON.parse(oldData[key] || '{}');
          const newObj = JSON.parse(data[key] || '{}');
          merged[key] = JSON.stringify(Object.assign({}, oldObj, newObj));
        } catch(e) { merged[key] = oldData[key] || '{}'; }
      } else {
        // 其他累计值：只增不减
        merged[key] = Math.max(oldVal, newVal);
      }
    } else if (oldData[key] !== undefined) {
      merged[key] = oldData[key];
    }
  }

  await env.DB.prepare('UPDATE users SET game_data = ? WHERE email = ?')
    .bind(JSON.stringify(merged), email).run();

  return Response.json({ success: true });
}