export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, packetId, decision } = await request.json();
  if (!email || !packetId || !decision) return Response.json({ error: '参数不完整' }, { status: 400 });
  if (decision !== 'claim' && decision !== 'refund') return Response.json({ error: '无效的操作' }, { status: 400 });

  const p = await env.DB.prepare('SELECT * FROM red_packets WHERE id = ?').bind(packetId).first();
  if (!p) return Response.json({ error: '红包不存在' }, { status: 400 });
  if (p.user_email !== email) return Response.json({ error: '无权操作' }, { status: 403 });
  if (p.direction !== 'user_to_her') return Response.json({ error: '红包类型错误' }, { status: 400 });
  if (p.status !== 'pending') return Response.json({ error: '红包已处理' }, { status: 400 });

  if (decision === 'claim') {
    await env.DB.prepare("UPDATE red_packets SET status = 'claimed' WHERE id = ?").bind(packetId).run();
    const user = await env.DB.prepare('SELECT exp FROM users WHERE email = ?').bind(email).first();
    return Response.json({ success: true, exp: user?.exp || 0 });
  }

  await env.DB.prepare("UPDATE red_packets SET status = 'refunded' WHERE id = ?").bind(packetId).run();
  const user = await env.DB.prepare('SELECT exp FROM users WHERE email = ?').bind(email).first();
  const newExp = (user?.exp || 0) + (p.amount || 0);
  await env.DB.prepare('UPDATE users SET exp = ? WHERE email = ?').bind(newExp, email).run();
  return Response.json({ success: true, exp: newExp });
}