export async function onRequestPost(context) {
  const { request, env } = context;
  const { email } = await request.json();
  if (!email) return Response.json({ error: '参数不完整' }, { status: 400 });

  const rows = await env.DB.prepare(
    'SELECT product_type FROM activation_codes WHERE used_by = ?'
  ).bind(email).all();

  const owned = (rows.results || []).map(r => r.product_type);
  return Response.json({ success: true, owned });
}