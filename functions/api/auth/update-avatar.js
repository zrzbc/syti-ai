export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, avatar } = await request.json();

  if (!email || !avatar) {
    return Response.json({ error: '参数不完整' }, { status: 400 });
  }

  // 限制头像大小（Base64 大约 1.3 倍于原始大小，这里限制约 500KB）
  if (avatar.length > 700000) {
    return Response.json({ error: '头像文件过大，请上传小于 500KB 的图片' }, { status: 400 });
  }

  await env.DB.prepare('UPDATE users SET avatar = ? WHERE email = ?').bind(avatar, email).run();
  return Response.json({ success: true, message: '头像更新成功' });
}