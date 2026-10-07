export async function onRequestGet(context) {
  const { env } = context;
  try {
    const row = await env.DB.prepare(
      'SELECT id, content, created_at FROM notifications ORDER BY id DESC LIMIT 1'
    ).first();
    if (!row) return Response.json({ success: true, notification: null });
    return Response.json({ success: true, notification: row });
  } catch (e) {
    return Response.json({ success: true, notification: null });
  }
}

export async function onRequestPost(context) {
  return onRequestGet(context);
}