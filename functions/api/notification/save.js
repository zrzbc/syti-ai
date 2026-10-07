export async function onRequestPost(context) {
  const { request, env } = context;
  const { password, content } = await request.json();

  if (!password) return Response.json({ error: '缺少密码' }, { status: 400 });
  if (!content || !content.trim()) return Response.json({ error: '通知内容不能为空' }, { status: 400 });

  const adminPwd = env.ADMIN_PASSWORD || '230223';
  if (password !== adminPwd) return Response.json({ error: '密码错误' }, { status: 403 });

  await env.DB.prepare(
    'INSERT INTO notifications (content, created_at) VALUES (?, ?)'
  ).bind(content.trim(), Date.now()).run();

  return Response.json({ success: true });
}
