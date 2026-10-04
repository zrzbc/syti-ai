export async function onRequestPost(context) {
  const { request, env } = context;
  const { email } = await request.json();
  if (!email) return Response.json({ error: '参数不完整' }, { status: 400 });

  const rows = await env.DB.prepare(
    'SELECT product_type, code FROM activation_codes WHERE used_by = ?'
  ).bind(email).all();

  const owned = {};
  (rows.results || []).forEach(r => { owned[r.product_type] = r.code; });
  return Response.json({ success: true, owned });
}
