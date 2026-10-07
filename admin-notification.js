<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>发布通知 · 管理</title>
<style>
  body { font-family: Inter,"PingFang SC","Microsoft YaHei",sans-serif;
         background: radial-gradient(circle at 20% 10%,rgba(79,124,255,.14),transparent 30%),
                     radial-gradient(circle at 80% 90%,rgba(138,92,246,.14),transparent 30%),
                     #f7f9ff;
         min-height: 100vh; display: flex; align-items: center; justify-content: center;
         padding: 24px; margin: 0; color: #172033; }
  .box { background: #fff; border-radius: 22px; padding: 30px 28px;
         width: min(500px,100%); box-shadow: 0 24px 60px rgba(55,65,110,.14); }
  h1 { font-size: 20px; margin: 0 0 6px; }
  p.sub { color: #6f7890; font-size: 13px; margin: 0 0 22px; }
  label { display: block; font-size: 13px; font-weight: 600; color: #6f7890; margin-bottom: 6px; }
  input, textarea { width: 100%; box-sizing: border-box; padding: 12px 14px;
         border: 1px solid #e8ebf5; border-radius: 12px;
         font-size: 14px; outline: none; font-family: inherit; }
  input:focus, textarea:focus { border-color: #4f7cff; box-shadow: 0 0 0 3px rgba(79,124,255,.12); }
  textarea { min-height: 130px; resize: vertical; line-height: 1.6; }
  .row { margin-bottom: 16px; }
  button { width: 100%; padding: 13px; border: none; border-radius: 13px;
           background: linear-gradient(110deg,#4f7cff,#8a5cf6); color: #fff;
           font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 6px;
           transition: transform .2s, box-shadow .2s; }
  button:hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(91,100,230,.35); }
  button:disabled { opacity: .5; cursor: not-allowed; transform: none; }
  .msg { margin-top: 12px; font-size: 13px; text-align: center; }
  .msg.ok { color: #22c55e; }
  .msg.err { color: #ef4444; }
</style>
</head>
<body>
  <div class="box">
    <h1>📢 发布新通知</h1>
    <p class="sub">用户下次打开网页时会弹窗显示，关闭后不再重复提醒。</p>
    <div class="row">
      <label>管理员密码</label>
      <input type="password" id="pwd" placeholder="请输入密码">
    </div>
    <div class="row">
      <label>通知内容</label>
      <textarea id="content" placeholder="支持多行文本，直接换行即可"></textarea>
    </div>
    <button id="btn">发布通知</button>
    <div class="msg" id="msg"></div>
  </div>

<script>
document.getElementById('btn').addEventListener('click', async () => {
  const password = document.getElementById('pwd').value;
  const content = document.getElementById('content').value;
  const msg = document.getElementById('msg');
  const btn = document.getElementById('btn');
  if (!password || !content.trim()) {
    msg.className = 'msg err';
    msg.textContent = '请填写密码和内容';
    return;
  }
  btn.disabled = true; btn.textContent = '发布中...';
  msg.textContent = '';
  try {
    const res = await fetch('/api/notification/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, content })
    });
    const data = await res.json();
    if (data.success) {
      msg.className = 'msg ok';
      msg.textContent = '✅ 发布成功！用户下次打开页面就会看到。';
      document.getElementById('content').value = '';
    } else {
      msg.className = 'msg err';
      msg.textContent = data.error || '发布失败';
    }
  } catch (e) {
    msg.className = 'msg err';
    msg.textContent = '网络错误';
  } finally {
    btn.disabled = false; btn.textContent = '发布通知';
  }
});
</script>
</body>
</html>