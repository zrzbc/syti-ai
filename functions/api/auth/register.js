export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, code, password } = await request.json();

  const record = await env.DB.prepare(
    'SELECT * FROM verification_codes WHERE email = ?'
  ).bind(email).first();

  if (!record) {
    return Response.json({ error: '请先获取验证码' }, { status: 400 });
  }

  if (new Date(record.expires_at) < new Date()) {
    return Response.json({ error: '验证码已过期，请重新获取' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(code + email);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const inputHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (inputHash !== record.code_hash) {
    return Response.json({ error: '验证码错误' }, { status: 400 });
  }

  const existing = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email).first();

  if (existing) {
    return Response.json({ error: '该邮箱已注册，请直接登录' }, { status: 400 });
  }

  const pwData = encoder.encode(password + email);
  const pwHashBuffer = await crypto.subtle.digest('SHA-256', pwData);
  const passwordHash = Array.from(new Uint8Array(pwHashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  await env.DB.prepare(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)'
  ).bind(email, passwordHash).run();

  await env.DB.prepare('DELETE FROM verification_codes WHERE email = ?')
    .bind(email).run();

  return Response.json({ success: true, message: '注册成功' });
}