(function () {
  'use strict';

  const READ_KEY = 'zrzbc_notification_read_id';

  // ===== 简单的 HTML 白名单清理 =====
  function sanitizeHTML(html) {
    const ALLOWED_TAGS = ['B','I','U','S','SPAN','FONT','BR','DIV','P','STRONG','EM','A'];
    const ALLOWED_ATTRS = ['style','face','color','size'];
    const doc = new DOMParser().parseFromString(html, 'text/html');

    function walk(node) {
      const children = [...node.childNodes];
      for (const child of children) {
        if (child.nodeType === 1) {
          const tag = child.tagName;
          if (!ALLOWED_TAGS.includes(tag)) {
            const text = document.createTextNode(child.textContent);
            child.replaceWith(text);
            continue;
          }
          [...child.attributes].forEach(attr => {
            const name = attr.name.toLowerCase();
            const isAllowed = ALLOWED_ATTRS.includes(name);
            if (!isAllowed || name.startsWith('on') || name.startsWith('javascript')) {
              child.removeAttribute(attr.name);
            }
          });
          if (child.getAttribute('style')) {
            const safe = child.getAttribute('style')
              .replace(/expression\s*\(/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/url\s*\(/gi, '');
            child.setAttribute('style', safe);
          }
          walk(child);
        }
      }
    }
    walk(doc.body);
    return doc.body.innerHTML;
  }

  // ===== 拉取最新通知 =====
  fetch('/api/notification/get')
    .then(r => r.json())
    .then(data => {
      if (!data.success || !data.notification) return;
      const noti = data.notification;
      const readId = localStorage.getItem(READ_KEY);
      if (readId && String(readId) === String(noti.id)) return;

      // ★ 关键：弹窗出现前，先写入"已读"，防止刷新/跳转后重复弹
      try { localStorage.setItem(READ_KEY, String(noti.id)); } catch (e) {}

      showNotification(noti);
    })
    .catch(() => {});

  function showNotification(noti) {
    const overlay = document.createElement('div');
    overlay.id = 'zrzbcNotificationOverlay';
    overlay.innerHTML = `
      <div class="zrzbc-noti-card" role="dialog" aria-modal="true">
        <button class="zrzbc-noti-close" aria-label="关闭" title="关闭">×</button>
        <div class="zrzbc-noti-title">📢 通知</div>
        <div class="zrzbc-noti-content"></div>
        <button class="zrzbc-noti-ok">我知道了</button>
      </div>
    `;
    document.body.appendChild(overlay);

    // 富文本渲染（先清理）
    const contentEl = overlay.querySelector('.zrzbc-noti-content');
    contentEl.innerHTML = sanitizeHTML(noti.content);
    contentEl.style.whiteSpace = 'pre-wrap';
    contentEl.style.wordBreak = 'break-word';

    // ===== 样式 =====
    if (!document.getElementById('zrzbcNotificationStyle')) {
      const style = document.createElement('style');
      style.id = 'zrzbcNotificationStyle';
      style.textContent = `
        #zrzbcNotificationOverlay {
          position: fixed; inset: 0;
          background: rgba(15,20,35,.55);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 99999;
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: zrzbcNotiFadeIn .2s ease;
        }
        @keyframes zrzbcNotiFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .zrzbc-noti-card {
          position: relative;
          background: #fff;
          border-radius: 20px;
          width: min(460px, 100%);
          max-height: 80vh;
          overflow-y: auto;
          padding: 26px 24px 20px;
          box-shadow: 0 24px 60px rgba(0,0,0,.25);
          animation: zrzbcNotiPop .25s cubic-bezier(.2,.9,.3,1.2);
          font-family: Inter,"PingFang SC","Microsoft YaHei",sans-serif;
          color: #172033;
          line-height: 1.7;
        }
        @keyframes zrzbcNotiPop {
          0% { transform: scale(.92) translateY(8px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .zrzbc-noti-close {
          position: absolute; top: 12px; right: 14px;
          width: 30px; height: 30px; border-radius: 50%;
          border: none; background: #f2f4fb; color: #6f7890;
          font-size: 20px; line-height: 1; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background .15s, color .15s, transform .15s;
        }
        .zrzbc-noti-close:hover { background: #e6e9f5; color: #172033; transform: scale(1.06); }
        .zrzbc-noti-title {
          font-size: 17px; font-weight: 800; letter-spacing: 1px;
          margin-bottom: 12px;
          background: linear-gradient(90deg, #4f7cff, #8a5cf6);
          -webkit-background-clip: text; background-clip: text;
          color: transparent;
        }
        .zrzbc-noti-content {
          font-size: 14px;
          color: #172033;
          margin-bottom: 18px;
        }
        .zrzbc-noti-content img { max-width: 100%; height: auto; border-radius: 8px; }
        .zrzbc-noti-ok {
          display: block; width: 100%; padding: 11px;
          border: none; border-radius: 12px;
          background: linear-gradient(110deg, #4f7cff, #8a5cf6);
          color: #fff; font-size: 15px; font-weight: 700;
          cursor: pointer;
          transition: transform .2s, box-shadow .2s;
        }
        .zrzbc-noti-ok:hover { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(91,100,230,.35); }
      `;
      document.head.appendChild(style);
    }

    // ===== 关闭逻辑（只在点"×"或"我知道了"时触发）=====
    function close() {
      // 已读标记已在弹窗出现时写好，这里不用再写
      overlay.style.animation = 'zrzbcNotiFadeIn .18s ease reverse';
      setTimeout(() => overlay.remove(), 160);
    }

    overlay.querySelector('.zrzbc-noti-close').addEventListener('click', close);
    overlay.querySelector('.zrzbc-noti-ok').addEventListener('click', close);

    // ★ 已删除：点击遮罩关闭
    // ★ 已删除：ESC 键关闭
  }
})();
