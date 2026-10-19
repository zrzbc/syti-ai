export async function onRequestPost(context) {
  const { request, env } = context;
  const { email } = await request.json();
  if (!email) return Response.json({ error: '参数不完整' }, { status: 400 });
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
  const row = await env.DB.prepare(
    'SELECT count FROM chat_daily_count WHERE email = ? AND date = ?'
  ).bind(email, today).first();
  const used = row?.count || 0;
  return Response.json({ success: true, used, remaining: Math.max(0, 50 - used), limit: 50 });
}