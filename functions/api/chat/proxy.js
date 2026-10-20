const DAILY_MESSAGE_LIMIT = 50;

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();
  const { email, systemPrompt, userText, history = [], customApiConfig, attachments = [] } = body;

  if (!email) return Response.json({ error: '请先登录' }, { status: 400 });
  if ((!userText && (!attachments || attachments.length === 0)) || !systemPrompt) return Response.json({ error: '参数不完整' }, { status: 400 });

  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) return Response.json({ error: '用户不存在' }, { status: 400 });

  // 每日次数
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
  const countRow = await env.DB.prepare(
    'SELECT count FROM chat_daily_count WHERE email = ? AND date = ?'
  ).bind(email, today).first();
  const usedCount = countRow?.count || 0;
  if (usedCount >= DAILY_MESSAGE_LIMIT) {
    return Response.json({
      error: `今日消息次数已用完（${DAILY_MESSAGE_LIMIT} 次/天），明天 0 点重置`,
      remaining: 0
    }, { status: 429 });
  }

  // API 配置
  let apiConfig;
  if (customApiConfig && customApiConfig.apiKey && customApiConfig.apiBase) {
    apiConfig = customApiConfig;
  } else {
    apiConfig = {
      apiType: env.DEFAULT_API_TYPE || 'deepseek',
      apiBase: env.DEFAULT_API_BASE || 'https://api.deepseek.com',
      apiKey: env.DEFAULT_API_KEY,
      apiModel: env.DEFAULT_API_MODEL || ''
    };
    if (!apiConfig.apiKey) {
      return Response.json({ error: '服务端未配置默认 API' }, { status: 500 });
    }
  }

  let reply;
  try {
    const nickname = String(user.nickname || user.name || user.username || user.display_name || '').trim();
    const userHint = nickname ? `\n\n【当前用户】昵称：${nickname}。可以在合适的场合自然称呼用户，比如打招呼、表达关心、想叫住对方时，但不要每句都叫，也不要生硬地重复。` : '';
    reply = await callAI(apiConfig, systemPrompt + userHint, userText, history, attachments);
  } catch (e) {
    return Response.json({ error: 'AI 请求失败：' + (e.message || '未知错误') }, { status: 504 });
  }

  let redPacketCreated = null;
  const sendMatch = String(reply || '').match(/\[SEND_RED_PACKET\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*:\s*([^\]]{1,30})\]/i);
  if (sendMatch) {
    const rpAmount = Math.round(Number(sendMatch[1]));
    const rpTitle = String(sendMatch[2] || '恭喜发财，大吉大利').trim().slice(0, 15) || '恭喜发财，大吉大利';
    reply = String(reply).replace(/\[SEND_RED_PACKET\s*:[^\]]+\]/gi, '').trim();

    // ===== 风控审核 =====
    // 1. 查询 5 小时内发给该用户的红包数量
    const past5h = Date.now() - 5 * 60 * 60 * 1000;
    let sentCount = 0;
    try {
      const countRow = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM her_redpacket_logs WHERE user_email = ? AND created_at > ?'
      ).bind(email, past5h).first();
      sentCount = countRow?.count || 0;
    } catch(e) {}

    // 2. 判定风控
    let isRisk = false;
    if (rpAmount > 30) isRisk = true;        // 单次金额大于 30 触发风控
    if (sentCount >= 2) isRisk = true;       // 5小时内第3次发送触发风控

    // 3. 如果触发风控，大概率取消（90% 概率拦截）
    if (isRisk && Math.random() < 0.9) {
      reply += '\n\n*（四叶看了看余额，又看了看你，觉得数目太大了，默默地收回了红包）*';
      redPacketCreated = null; 
    } else {
      // 没拦截成功（或正常小额），记录本次发送流水
      try {
        await env.DB.prepare(
          'INSERT INTO her_redpacket_logs (id, user_email, amount, created_at) VALUES (?, ?, ?, ?)'
        ).bind('rplog_' + Date.now(), email, rpAmount, Date.now()).run();
      } catch(e) {}
      
      // ===== 下面紧接着原本的创建红包逻辑 =====
      const wantsReturn = /返还|退回|还给我|还回来|退给我|还我|退我/.test(String(userText || ''));

    const wantsReturn = /返还|退回|还给我|还回来|退给我|还我|退我/.test(String(userText || ''));

    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS red_packets (
        id TEXT PRIMARY KEY, user_email TEXT NOT NULL, direction TEXT NOT NULL,
        amount INTEGER NOT NULL, title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at INTEGER NOT NULL, expire_at INTEGER NOT NULL
      )`
    ).run();
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS her_wallet (user_email TEXT PRIMARY KEY, balance INTEGER DEFAULT 10000)`
    ).run();
    await env.DB.prepare(
      `INSERT OR IGNORE INTO her_wallet (user_email, balance) VALUES (?, 10000)`
    ).bind(email).run();

    let returnedFromPacketId = null;
    if (wantsReturn) {
      const pendingP = await env.DB.prepare(
        `SELECT id FROM red_packets WHERE user_email = ? AND direction = 'user_to_her' AND status = 'pending' ORDER BY created_at DESC LIMIT 1`
      ).bind(email).first();
      if (pendingP) returnedFromPacketId = pendingP.id;
    }

    if (rpAmount > 0) {
      if (returnedFromPacketId) {
        await env.DB.prepare("UPDATE red_packets SET status = 'refunded' WHERE id = ?").bind(returnedFromPacketId).run();
        const u = await env.DB.prepare('SELECT exp FROM users WHERE email = ?').bind(email).first();
        const newExp = (u?.exp || 0) + rpAmount;
        await env.DB.prepare('UPDATE users SET exp = ? WHERE email = ?').bind(newExp, email).run();
        redPacketCreated = { returnedFromPacketId, amount: rpAmount, isReturned: true, exp: newExp };
      } else {
        const w = await env.DB.prepare('SELECT balance FROM her_wallet WHERE user_email = ?').bind(email).first();
        if (w && (w.balance || 0) >= rpAmount) {
          await env.DB.prepare('UPDATE her_wallet SET balance = balance - ? WHERE user_email = ?').bind(rpAmount, email).run();
          const id = 'rp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
          const now = Date.now();
          const expireAt = now + 5 * 60 * 1000;
          await env.DB.prepare(
            'INSERT INTO red_packets (id, user_email, direction, amount, title, status, created_at, expire_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(id, email, 'her_to_user', rpAmount, rpTitle, 'pending', now, expireAt).run();
          redPacketCreated = { id, amount: rpAmount, title: rpTitle, expireAt };
        }
      }
    }
  }

  await env.DB.prepare(
    `INSERT INTO chat_daily_count (email, date, count) VALUES (?, ?, 1)
     ON CONFLICT(email, date) DO UPDATE SET count = count + 1`
  ).bind(email, today).run();

  return Response.json({
    success: true,
    reply,
    redPacketCreated,
    remaining: DAILY_MESSAGE_LIMIT - usedCount - 1
  });
}

function normalizeBase(url, type) {
  let u = String(url || '').trim().replace(/\/$/, '');
  if (!u) return '';
  if (type === 'openai' || type === 'custom') {
    if (!/\/v1$/i.test(u) && !/\/chat\/completions$/i.test(u)) u += '/v1';
  }
  return u;
}

function chatEndpoint(config) {
  const b = normalizeBase(config.apiBase, config.apiType);
  if (config.apiType === 'anthropic') return b.replace(/\/$/, '') + '/messages';
  if (config.apiType === 'gemini') {
    const m = config.apiModel || 'gemini-2.5-flash';
    return b.replace(/\/$/, '') + '/models/' + encodeURIComponent(m) + ':generateContent';
  }
  if (/\/chat\/completions$/i.test(b)) return b;
  return b.replace(/\/$/, '') + '/chat/completions';
}

async function resolveModel(config) {
  if (String(config.apiModel || '').trim()) return config.apiModel.trim();
  const fallback = {
    deepseek: 'deepseek-chat',
    qwen: 'qwen-plus',
    glm: 'glm-4.5-flash',
    kimi: 'kimi-k2.6',
    minimax: 'MiniMax-M2.7',
    siliconflow: 'Qwen/Qwen3-8B',
    openrouter: 'openrouter/auto',
    openai: 'gpt-4o-mini',
    custom: 'gpt-4o-mini',
    anthropic: 'claude-3-5-haiku-latest',
    gemini: 'gemini-2.5-flash'
  };
  return fallback[config.apiType] || 'gpt-4o-mini';
}

async function readApiResponse(res) {
  const raw = await res.text();
  let j = null;
  try { j = raw ? JSON.parse(raw) : null; } catch (_) {
    throw new Error(`API返回非JSON（HTTP ${res.status}）：${raw.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(j?.error?.message || j?.message || `API 请求失败 HTTP ${res.status}`);
  return j;
}

async function callAI(config, systemPrompt, userText, history, attachments = []) {
  const model = await resolveModel(config);
  const imageAttachments = (attachments || []).filter(a => a && a.dataUrl && /^image\//.test(a.type || ''));
  const defaultText = userText || (imageAttachments.length ? '请看看这张图片。' : '');

  if (config.apiType === 'anthropic') {
    const content = [];
    if (defaultText) content.push({ type: 'text', text: defaultText });
    for (const a of imageAttachments) {
      const base64 = String(a.dataUrl).split(',')[1] || '';
      content.push({ type: 'image', source: { type: 'base64', media_type: a.type, data: base64 } });
    }
    if (!content.length) content.push({ type: 'text', text: '请看看这张图片。' });
    const r = await fetch(chatEndpoint(config), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        system: systemPrompt,
        messages: [...history, { role: 'user', content }]
      })
    });
    const j = await readApiResponse(r);
    return j.content?.map(x => x.text || '').join('') || '';
  }

  if (config.apiType === 'gemini') {
    const url = chatEndpoint(config) + '?key=' + encodeURIComponent(config.apiKey);
    const parts = [];
    if (defaultText) parts.push({ text: defaultText });
    for (const a of imageAttachments) {
      const base64 = String(a.dataUrl).split(',')[1] || '';
      parts.push({ inlineData: { mimeType: a.type, data: base64 } });
    }
    if (!parts.length) parts.push({ text: '请看看这张图片。' });
    const contents = [
      ...history.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      { role: 'user', parts }
    ];
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.75, maxOutputTokens: 700 }
      })
    });
    const j = await readApiResponse(r);
    return j.candidates?.[0]?.content?.parts?.map(x => x.text || '').join('') || '';
  }

  let userContent = defaultText;
  if (imageAttachments.length) {
    userContent = [
      { type: 'text', text: defaultText || '请看看这张图片。' },
      ...imageAttachments.map(a => ({ type: 'image_url', image_url: { url: a.dataUrl } }))
    ];
  }
  const r = await fetch(chatEndpoint(config), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + config.apiKey
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userContent }
      ],
      temperature: 0.75,
      max_tokens: 700,
      stream: false
    })
  });
  const j = await readApiResponse(r);
  return j.choices?.[0]?.message?.content || '';
}
