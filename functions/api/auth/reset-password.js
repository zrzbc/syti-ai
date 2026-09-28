export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, code, newPassword } = await request.json();

  if (!email || !code || !newPassword) return Response.json({ error: '请填写所有字段' }, { status: 400 });

  const record = await env.DB.prepare('SELECT * FROM verification_codes WHERE email = ?').bind(email).first();
  if (!record) return Response.json({ error: '请先获取验证码' }, { status: 400 });
  if (new Date(record.expires_at) < new Date()) return Response.json({ error: '验证码已过期' }, { status: 400 });

  const encoder = new TextEncoder();
  const data = encoder.encode(code + email);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const inputHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  if (inputHash !== record.code_hash) return Response.json({ error: '验证码错误' }, { status: 400 });

  const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '该邮箱未注册' }, { status: 400 });

  const pwData = encoder.encode(newPassword + email);
  const pwHashBuffer = await crypto.subtle.digest('SHA-256', pwData);
  const passwordHash = Array.from(new Uint8Array(pwHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  await env.DB.prepare('UPDATE users SET password_hash = ? WHERE email = ?').bind(passwordHash, email).run();
  await env.DB.prepare('DELETE FROM verification_codes WHERE email = ?').bind(email).run();

  return Response.json({ success: true, message: '密码重置成功' });
}