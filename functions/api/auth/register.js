export async function onRequestPost(context) {
  const { request, env } = context;
  // 1. 接收前端传来的数据（新增 nickname）
  const { email, code, password, nickname } = await request.json();

  // ================= 2. 基础验证 =================
  if (!email || !code || !password || !nickname) {
    return Response.json({ error: '请填写所有字段' }, { status: 400 });
  }

  // 3. 查询验证码记录
  const record = await env.DB.prepare(
    'SELECT * FROM verification_codes WHERE email = ?'
  ).bind(email).first();

  if (!record) {
    return Response.json({ error: '请先获取验证码' }, { status: 400 });
  }

  if (new Date(record.expires_at) < new Date()) {
    return Response.json({ error: '验证码已过期，请重新获取' }, { status: 400 });
  }

  // 4. 验证码哈希比对
  const encoder = new TextEncoder();
  const data = encoder.encode(code + email);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const inputHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (inputHash !== record.code_hash) {
    return Response.json({ error: '验证码错误' }, { status: 400 });
  }

  // ================= 5. 核心：检查邮箱和昵称是否已存在 =================

  // 检查邮箱是否已注册
  const existingEmail = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email).first();

  if (existingEmail) {
    return Response.json({ error: '该邮箱已注册，请直接登录' }, { status: 400 });
  }

  // 检查昵称是否已被占用
  const existingNickname = await env.DB.prepare(
    'SELECT id FROM users WHERE nickname = ?'
  ).bind(nickname).first();

  if (existingNickname) {
    return Response.json({ error: '该昵称已被占用，请换一个' }, { status: 400 });
  }

  // ================= 6. 写入数据库 =================

  // 密码哈希
  const pwData = encoder.encode(password + email);
  const pwHashBuffer = await crypto.subtle.digest('SHA-256', pwData);
  const passwordHash = Array.from(new Uint8Array(pwHashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // 插入新用户（新增 nickname 字段）
  await env.DB.prepare(
    'INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)'
  ).bind(email, passwordHash, nickname).run();

  // 删除已使用的验证码
  await env.DB.prepare('DELETE FROM verification_codes WHERE email = ?')
    .bind(email).run();

  return Response.json({ success: true, message: '注册成功' });
}
