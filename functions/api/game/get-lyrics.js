export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // 如果传了 date 就查指定日期，否则查北京时间今天
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
  const targetDate = url.searchParams.get('date') || today;

  try {
    const row = await env.DB.prepare(
      'SELECT song_name, original_lyrics, masked_lyrics FROM guess_lyrics WHERE publish_date = ? ORDER BY id DESC LIMIT 1'
    ).bind(targetDate).first();
    
    if (!row) return Response.json({ success: false, error: '该日期暂无题目' });
    return Response.json({ success: true, data: row });
  } catch (e) {
    return Response.json({ success: false, error: '数据库错误' });
  }
}
