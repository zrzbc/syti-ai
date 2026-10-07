(function () {
  'use strict';

  const READ_KEY = 'zrzbc_notification_read_id';

  // 1. 拉取最新通知
  fetch('/api/notification/get')
    .then(r => r.json())
    .then(data => {
      if (!data.success || !data.notification) return;
      const noti = data.notification;
      const readId = localStorage.getItem(READ_KEY);
      if (readId && String(readId) === String(noti.id)) return;  // 已读，不弹
      showNotification(noti);
    })
    .catch(() => {});

  function showNotification(noti) {
    // 2. 动态创建弹窗 DOM
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

    // 内容用 textContent 防止 XSS，用 pre-wrap 保留换行
    const contentEl = overlay.querySelector('.zrzbc-noti-content');
    contentEl.textContent = noti.content;
    contentEl.style.whiteSpace = 'pre-wrap';

    // 3. 注入样式（只注入一次）
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
        @keyframes zrzbcNotiFadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        .zrzbc-noti-card {
          position: relative;
          background: #fff;
          border-radius: 20px;
          width: min(440px, 100%);
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

    // 4. 关闭逻辑：写入已读，移除弹窗
    function close() {
      try { localStorage.setItem(READ_KEY, String(noti.id)); } catch (e) {}
      overlay.style.animation = 'zrzbcNotiFadeIn .18s ease reverse';
      setTimeout(() => overlay.remove(), 160);
    }

    overlay.querySelector('.zrzbc-noti-close').addEventListener('click', close);
    overlay.querySelector('.zrzbc-noti-ok').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    // ESC 关闭
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
  }
})();