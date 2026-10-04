export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, productType } = await request.json();
  if (!email || !productType) return Response.json({ error: '参数不完整' }, { status: 400 });

  const row = await env.DB.prepare(
    'SELECT code FROM activation_codes WHERE used_by = ? AND product_type = ? LIMIT 1'
  ).bind(email, productType).first();
  if (!row) return Response.json({ error: '你还没有购买该产品' }, { status: 400 });

  return Response.json({ success: true, code: row.code });
}