export async function onRequestPost(context) {
  const { request, env } = context;
  const { email, detailedAnswers, roughScores } = await request.json();

  // ★ 1. 校验是否传了邮箱
  if (!email) {
    return Response.json({ error: '请先登录后再测试' }, { status: 401 });
  }

  // ★ 2. 校验邮箱在数据库中是否存在
  const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (!user) {
    return Response.json({ error: '用户不存在或登录已过期' }, { status: 401 });
  }

  if (!detailedAnswers || !roughScores) {
    return Response.json({ error: '参数不完整' }, { status: 400 });
  }

  const prompt = `你要为一套娱乐性质的四维人格测试判定最匹配的人格类型。用户共回答20题。请依据“题目情境+用户实际选择的回答”进行语义分析，而不是仅凭选项字母。

四维含义：
- R 理性：重视事实、逻辑、规则、计划、执行和直接解决问题。
- F 感性：表达情绪、追求新鲜体验、凭直觉行动、喜欢表现或释放情绪。
- P 谨慎：风险规避、犹豫、退缩、回避冲突、偏好稳定或独处反思。
- E 共情：关注他人感受、倾听、协商、照顾关系、协调矛盾。

人格类型映射：
- CPU：R明显突出
- LIGHTER：F明显突出
- SLOTH：P明显突出
- SAINT：E明显突出
- DIRECTOR：R与F共同突出
- SHADOW：R与P共同突出
- THERMOS：R与E共同突出
- ARTIST：F与P共同突出
- BUTTERFLY：F与E共同突出
- MULE：P与E共同突出
- NPC：四维整体均衡，没有明显主导倾向

判定规则：
1. 以下每题都包含原题和用户选中的完整回答。相同措辞放在不同情境中可能代表不同倾向，必须结合题意判断。
2. 不要假定A/B/C/D在所有题目中都固定代表某一维度；以实际回答内容为主。
3. 综合全部20题，识别重复出现的稳定倾向；不要被某一道题、单个情绪词或某个极端回答带偏。
4. 区分“冷静解决问题”和“单纯强势”；区分“关心他人”和“为了避免冲突而妥协”；区分“感性表达”和“焦虑退缩”。
5. 下列本地语义校正分数只作辅助参考，若与具体答案语义明显冲突，应以题目和回答的整体证据为准：R=${roughScores.R}，F=${roughScores.F}，P=${roughScores.P}，E=${roughScores.E}。
6. 如果两个维度长期共同突出，选择对应组合型；只有四维确实均衡时才选择NPC。

完整答题记录：
${detailedAnswers}

只输出以下11个代码之一，不要解释、不要标点、不要输出其他文字：CPU, LIGHTER, SLOTH, SAINT, DIRECTOR, SHADOW, THERMOS, ARTIST, BUTTERFLY, MULE, NPC。`;

  // 使用 Cloudflare 环境变量中的 API Key
  const apiKey = env.DEFAULT_API_KEY;
  if (!apiKey) {
    return Response.json({ error: '服务端未配置 API Key' }, { status: 500 });
  }

  try {
    // 直接请求 DeepSeek，不再需要代理
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a careful personality-test evaluator. Follow the requested output format exactly.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.15,
        max_tokens: 32,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`AI 请求失败 HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = String(data?.choices?.[0]?.message?.content || '').trim().toUpperCase();
    
    // 解析类型代码
    let aiType = content.match(/"TYPE"\s*:\s*"([A-Z_]+)"/)?.[1];
    if (!aiType) {
      const firstLine = content.replace(/^```(?:JSON)?\s*/i, '').split(/\r?\n/)[0].trim();
      aiType = firstLine.match(/^[\s\"'`*_]*(CPU|LIGHTER|SLOTH|SAINT|DIRECTOR|SHADOW|THERMOS|ARTIST|BUTTERFLY|MULE|NPC)\b/)?.[1];
    }

    if (aiType) {
      return Response.json({ success: true, type: aiType });
    } else {
      return Response.json({ success: false, error: 'AI 返回格式错误' }, { status: 502 });
    }
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}