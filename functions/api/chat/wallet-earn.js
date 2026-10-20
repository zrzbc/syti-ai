export async function onRequestPost() {
  return Response.json({ error: '该接口已停用' }, { status: 403 });
}
