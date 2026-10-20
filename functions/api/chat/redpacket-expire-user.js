export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, packetId } = await request.json();
  if (!email || !packetId) return Response.json({ error: '参数不完整' }, { status: 400 });

  const p = await env.DB.prepare('SELECT * FROM red_packets WHERE id = ?').bind(packetId).first();
  if (!p) return Response.json({ error: '红包不存在' }, { status: 400 });
  if (p.user_email !== email) return Response.json({ error: '无权操作' }, { status: 403 });
  if (p.direction !== 'user_to_her') return Response.json({ error: '红包类型错误' }, { status: 400 });
  if (p.status !== 'pending') return Response.json({ success: true, exp: null, skipped: true });
  if (Date.now() < p.expire_at) return Response.json({ error: '红包尚未过期' }, { status: 400 });

  await env.DB.prepare("UPDATE red_packets SET status = 'expired' WHERE id = ?").bind(packetId).run();
  const user = await env.DB.prepare('SELECT exp FROM users WHERE email = ?').bind(email).first();
  const newExp = (user?.exp || 0) + (p.amount || 0);
  await env.DB.prepare('UPDATE users SET exp = ? WHERE email = ?').bind(newExp, email).run();
  return Response.json({ success: true, exp: newExp });
}