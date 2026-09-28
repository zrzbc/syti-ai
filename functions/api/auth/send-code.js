export async function onRequestPost(context) {
  const { request, env } = context;
  const { email } = await request.json();

  if (!email || !email.includes('@')) {
    return Response.json({ error: '请输入有效的邮箱地址' }, { status: 400 });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const encoder = new TextEncoder();
  const data = encoder.encode(code + email);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const codeHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  await env.DB.prepare(
    `INSERT INTO verification_codes (email, code_hash, expires_at)
     VALUES (?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET code_hash = ?, expires_at = ?`
  ).bind(email, codeHash, expiresAt, codeHash, expiresAt).run();

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'noreply@zrzbc.com',
      to: email,
      subject: '【这人针不错】您的验证码',
      html: `<p>您的验证码是：<strong style="font-size:24px">${code}</strong></p><p>5分钟内有效，请勿泄露给他人。</p>`
    })
  });

  if (!resendResponse.ok) {
    return Response.json({ error: '邮件发送失败，请稍后重试' }, { status: 500 });
  }

  return Response.json({ success: true, message: '验证码已发送' });
}