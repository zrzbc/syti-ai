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
    reply = await callAI(apiConfig, systemPrompt, userText, history, attachments);
  } catch (e) {
    return Response.json({ error: 'AI 请求失败：' + (e.message || '未知错误') }, { status: 504 });
  }

  await env.DB.prepare(
    `INSERT INTO chat_daily_count (email, date, count) VALUES (?, ?, 1)
     ON CONFLICT(email, date) DO UPDATE SET count = count + 1`
  ).bind(email, today).run();

  return Response.json({
    success: true,
    reply,
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
