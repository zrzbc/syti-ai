(function() {
  // ================= 1. 动态注入公共 CSS =================
  const style = document.createElement('style');
  style.textContent = `
    /* 基础导航样式 */
    .nav{position:fixed;top:16px;left:50%;transform:translateX(-50%);width:min(1120px,calc(100% - 32px));z-index:20;background:rgba(255,255,255,.72);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.9);box-shadow:0 10px 35px rgba(55,65,110,.08);border-radius:18px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;}
    .logo{font-weight:800;letter-spacing:-.5px} .logo span{background:linear-gradient(90deg,#4f7cff,#8a5cf6);-webkit-background-clip:text;color:transparent}
    .navlinks{display:flex;gap:4px;align-items:center}
    .home-dropdown{position:relative;display:inline-block}
    .home-trigger{font-size:14px;color:#59627a;padding:8px 12px;border-radius:10px;cursor:pointer;transition:.2s;display:inline-block}
    .home-trigger:hover{background:#f0f3ff;color:#3f63d9}
    .home-dropdown .home-menu{display:none;position:absolute;top:100%;left:0;min-width:140px;background:#fff;border:1px solid #e8ebf5;border-radius:12px;box-shadow:0 12px 30px rgba(55,65,110,.14);padding:6px;z-index:30}
    .home-dropdown:hover .home-menu{display:block}
    .home-menu a{display:block;font-size:14px;color:#59627a;padding:8px 12px;border-radius:8px;transition:.2s}
    .home-menu a:hover{background:#f0f3ff;color:#3f63d9}
    .navlinks a{font-size:14px;color:#59627a;padding:8px 12px;border-radius:10px}
    .navlinks a:hover{background:#f0f3ff;color:#3f63d9}
    .nav-right{display:flex;align-items:center;gap:8px}
    .lang-switch{position:relative}
    .lang-btn{font:inherit;font-size:13px;color:#59627a;padding:8px 12px;border-radius:10px;background:#fff;border:1px solid #e8ebf5;cursor:pointer;transition:.2s;white-space:nowrap}
    .lang-btn:hover{background:#f0f3ff;color:#3f63d9}
    .lang-menu{position:absolute;top:calc(100% + 6px);right:0;min-width:168px;background:#fff;border:1px solid #e8ebf5;border-radius:12px;box-shadow:0 12px 30px rgba(55,65,110,.14);padding:6px;display:none;z-index:30}
    .lang-menu.open{display:block}
    .lang-menu button{display:block;width:100%;text-align:left;padding:8px 10px;font:inherit;font-size:13px;color:#59627a;background:none;border:0;border-radius:8px;cursor:pointer}
    .lang-menu button:hover{background:#f0f3ff;color:#3f63d9}
    .lang-menu button.active{background:#eef2ff;color:#3f63d9;font-weight:600}

    /* 头像和悬浮窗 */
.user-center{position:relative;display:flex;align-items:center;margin-left:4px;padding-bottom:10px;margin-bottom:-10px;}
    .avatar-btn{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#4f7cff,#8a5cf6);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;transition:transform .2s,box-shadow .2s;border:2px solid rgba(255,255,255,.8);overflow:hidden}
    .avatar-btn:hover{transform:scale(1.08);box-shadow:0 6px 16px rgba(79,124,255,.35)}
    .user-popover{position:absolute;top:100%;right:0;width:220px;background:#fff;border:1px solid #e8ebf5;border-radius:16px;box-shadow:0 10px 30px rgba(55,65,110,.15);display:none;z-index:50}
    .user-popover::before{content:"";position:absolute;top:-6px;right:18px;width:12px;height:12px;background:#fff;border-top:1px solid #e8ebf5;border-left:1px solid #e8ebf5;transform:rotate(45deg)}
    .user-center:hover .user-popover{display:block}

    /* 弹窗及表单 */
    .modal-overlay{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(23,32,51,.55);backdrop-filter:blur(6px);z-index:999;justify-content:center;align-items:center}
    .modal-overlay.show{display:flex}
    .modal-content{background:#fff;border-radius:24px;width:min(420px,calc(100% - 40px));padding:32px 28px;box-shadow:0 30px 80px rgba(0,0,0,.2);position:relative;max-height:90vh;overflow-y:auto}
    .modal-close{position:absolute;top:16px;right:20px;background:none;border:none;font-size:28px;color:#999;cursor:pointer;line-height:1}
    .modal-tabs{display:flex;gap:8px;margin-bottom:24px}
    .modal-tab{flex:1;padding:10px;border:1px solid #e8ebf5;border-radius:12px;background:#f7f9ff;color:#6f7890;font-weight:600;cursor:pointer;transition:.2s}
    .modal-tab.active{background:linear-gradient(110deg,#4f7cff,#8a5cf6);color:#fff;border-color:transparent}
    .form-group{margin-bottom:18px}
    .form-group label{display:block;font-size:13px;color:#6f7890;margin-bottom:6px;font-weight:600}
    .form-group input{width:100%;padding:12px 14px;border:1px solid #e8ebf5;border-radius:12px;font-size:15px;outline:none;transition:border-color .2s}
    .form-group input:focus{border-color:#4f7cff;box-shadow:0 0 0 3px rgba(79,124,255,.12)}
    .code-row{display:flex;gap:10px} .code-row input{flex:1}
    .send-code-btn{white-space:nowrap;padding:12px 16px;border:1px solid #4f7cff;border-radius:12px;background:#fff;color:#4f7cff;font-weight:600;font-size:13px;cursor:pointer;transition:.2s}
    .send-code-btn:hover{background:#f0f3ff}
    .submit-btn{width:100%;padding:14px;border:none;border-radius:14px;background:linear-gradient(110deg,#4f7cff,#8a5cf6);color:#fff;font-size:16px;font-weight:700;cursor:pointer;margin-top:8px;transition:transform .2s,box-shadow .2s}
    .submit-btn:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(91,100,230,.35)}
    .modal-footer{text-align:center;margin-top:16px} .modal-footer a{font-size:13px;color:#8a5cf6}

    /* 经验条及名牌 */
    .popover-level-wrap{position:relative;display:inline-block}
    .level-tooltip{position:absolute;left:100%;top:50%;transform:translateY(-50%) translateX(6px);background:#fff;color:#172033;font-size:12px;line-height:1.8;padding:10px 14px;border-radius:10px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.15);border:1px solid #e8ebf5}
    .level-tooltip::before{content:"";position:absolute;right:100%;top:50%;transform:translateY(-50%);border:6px solid transparent;border-right-color:#fff}
    .level-tooltip .lv-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
    .level-tooltip .lv-row:last-child{margin-bottom:0}
    .level-tooltip .lv-badge{display:inline-block;padding:1px 8px;border-radius:6px;font-weight:bold;font-size:12px;color:#fff;min-width:36px;text-align:center}
    .level-tooltip .lv-exp{color:#172033;margin-left:auto;text-align:right}
    .popover-level-wrap:hover .level-tooltip{opacity:1;transform:translateY(-50%) translateX(12px)}
    .user-badge{display:inline-block;padding:1px 8px;border-radius:6px;font-size:12px;font-weight:700;margin-left:6px;vertical-align:middle}
    .user-badge.normal{background:#b8e9b8;color:#000} .user-badge.premium{background:#ffd700;color:#000} .user-badge.ultimate{background:linear-gradient(135deg,#a855f7,#7e22ce);color:#fff}
    .user-badge.editable-badge{cursor:pointer;transition:filter .15s,transform .15s}
    .user-badge.editable-badge:hover{filter:brightness(1.08);transform:scale(1.05)}
    .nick-colored{-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;display:inline-block;font-weight:700}
    .nick-colored.nick-yellow{background-image:linear-gradient(90deg,#ff6a00 0%,#ffb800 100%)} .nick-colored.nick-blue{background-image:linear-gradient(90deg,#0044cc 0%,#00b4ff 100%)}
    .nick-colored.nick-pink{background-image:linear-gradient(90deg,#d91e63 0%,#ff8fab 100%)} .nick-colored.nick-purple{background-image:linear-gradient(90deg,#6a0dad 0%,#c77dff 100%)}
    
    @media(max-width:850px){ .navlinks{display:none} }
  `;
  document.head.appendChild(style);

  // ================= 2. 动态注入 HTML =================
  const navHTML = `
    <nav class="nav">
      <a class="logo" href="index.html">&nbsp;&nbsp;这人<span>针不错</span></a>
      <div class="nav-right">
        <div class="navlinks">
          <div class="home-dropdown">
            <a href="index.html" class="home-trigger">主页 ▾</a>
            <div class="home-menu">
              <a href="index.html#works">作品</a><a href="index.html#about">关于</a>
              <a href="index.html#community">社群</a><a href="index.html#contact">联系</a>
            </div>
          </div>
          <a href="resources.html">资源</a><a href="games.html">游戏</a><a href="shop.html">商店</a>
        </div>
        <div class="lang-switch">
          <button class="lang-btn" id="langBtn" type="button">简体中文 ▾</button>
          <div class="lang-menu" id="langMenu">
            <button type="button" data-lang="cn" class="active">简体中文</button>
            <button type="button" data-lang="hk">繁體中文（香港）</button>
            <button type="button" data-lang="tw">繁體中文（台灣）</button>
          </div>
        </div>
        <a href="https://zrzbc.com/faq" class="faq-icon-btn" title="常见问题" style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;border:1px solid #e8ebf5;background:#fff;color:#59627a;transition:all .2s;margin:0 8px;text-decoration:none;">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </a>
        <div class="user-center" id="userCenter">
          <div class="avatar-btn" id="avatarBtn" title="个人中心">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
          <div class="user-popover" id="userPopover">
            <div id="popoverNotLoggedIn" style="display:none;padding:20px;text-align:center;color:#6f7890;font-size:14px;cursor:pointer;">请先点击头像登录或注册</div>
            <div id="popoverLoggedIn" style="display:none;padding:16px;">
              <div style="text-align:center;margin-bottom:12px;">
                <div id="popoverAvatar" style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#4f7cff,#8a5cf6);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.1);background-size:cover;background-position:center;position:relative;">
                  <span id="popoverAvatarLetter" style="font-size:28px;font-weight:bold;color:#fff;">U</span>
                  <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.5);color:#fff;font-size:10px;text-align:center;padding:2px 0;">修改</div>
                </div>
                <input type="file" id="avatarUploadInput" style="display:none;" accept="image/*">
              </div>
              <div style="text-align:center;font-size:16px;font-weight:bold;color:#172033;margin-bottom:4px;">
                <span id="popoverNickname" style="cursor:pointer;" title="点击修改昵称">用户昵称</span><span id="popoverUserBadge"></span>
              </div>
              <div style="text-align:center;font-size:12px;color:#9ca3af;margin-bottom:16px;">点击昵称或名牌修改</div>
              <div style="font-size:12px;color:#6f7890;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <span>经验值：<span id="popoverExpText">0/200</span></span>
                  <div class="popover-level-wrap">
                    <span id="popoverLevelText" style="font-weight:bold;padding:1px 8px;border-radius:6px;color:#fff;background:#4ade80;">Lv1</span>
                    <div class="level-tooltip">
                      <div class="lv-row"><span class="lv-badge" style="background:linear-gradient(135deg,#4ade80,#22c55e);color:#fff;">Lv1</span><span class="lv-exp">0 经验</span></div>
                      <div class="lv-row"><span class="lv-badge" style="background:linear-gradient(135deg,#22c55e,#15803d);color:#fff;">Lv2</span><span class="lv-exp">200 经验</span></div>
                      <div class="lv-row"><span class="lv-badge" style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;">Lv3</span><span class="lv-exp">500 经验</span></div>
                      <div class="lv-row"><span class="lv-badge" style="background:linear-gradient(135deg,#facc15,#eab308);color:#1f2937;">Lv4</span><span class="lv-exp">1200 经验</span></div>
                      <div class="lv-row"><span class="lv-badge" style="background:linear-gradient(135deg,#f97316,#c2410c);color:#fff;">Lv5</span><span class="lv-exp">2800 经验</span></div>
                      <div class="lv-row"><span class="lv-badge" style="background:linear-gradient(135deg,#ef4444,#b91c1c);color:#fff;">Lv6</span><span class="lv-exp">6200 经验</span></div>
                      <div class="lv-row"><span class="lv-badge" style="background:linear-gradient(135deg,#a855f7,#7e22ce);color:#fff;">Lv7</span><span class="lv-exp">13200 经验</span></div>
                    </div>
                  </div>
                </div>
                <div style="width:100%;height:8px;background:#fff;border:1px solid #e8ebf5;border-radius:4px;overflow:hidden;">
                  <div id="popoverExpBarFill" style="height:100%;width:0%;background:#4ade80;border-radius:4px;transition:all .3s;"></div>
                </div>
              </div>
              <button class="submit-btn" id="popoverSigninBtn" style="padding:8px;font-size:14px;margin-top:16px;background:#fff;color:#172033;border:1px solid #e8ebf5;">签到</button>
              <button class="submit-btn" id="popoverLogoutBtn" style="padding:8px;font-size:14px;margin-top:8px;background:linear-gradient(110deg,#ff7a8a,#ff2442);">退出登录</button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `;
  document.body.insertAdjacentHTML('afterbegin', navHTML);

  // 弹窗HTML
  const modalHTML = `
    <div class="modal-overlay" id="authModal">
      <div class="modal-content">
        <button class="modal-close" id="closeModal">&times;</button>
        <div id="authFormContainer">
          <div class="modal-tabs">
            <button class="modal-tab active" data-tab="login" id="tabLogin">登录</button>
            <button class="modal-tab" data-tab="register" id="tabRegister">注册</button>
          </div>
          <form id="authForm">
            <div class="form-group"><label>邮箱</label><input type="email" id="emailInput" placeholder="请输入邮箱地址" required></div>
            <div class="form-group" id="nicknameGroup" style="display:none;"><label>昵称</label><input type="text" id="nicknameInput" placeholder="设置一个独一无二的昵称" maxlength="20"></div>
            <div class="form-group" id="codeGroup" style="display:none;">
              <label>验证码</label>
              <div class="code-row">
                <input type="text" id="codeInput" placeholder="6位数字验证码" maxlength="6">
                <button type="button" id="sendCodeBtn" class="send-code-btn">获取验证码</button>
              </div>
            </div>
            <div class="form-group"><label>密码</label><input type="password" id="passwordInput" placeholder="至少8位，包含字母和数字" required></div>
            <button type="submit" class="submit-btn" id="submitBtn">登录 / 注册</button>
          </form>
          <div class="modal-footer"><a href="javascript:void(0)" id="forgotPasswordLink">忘记密码？</a></div>
        </div>
        <div id="resetFormContainer" style="display:none;">
          <h3 style="margin-bottom:20px;text-align:center;">重置密码</h3>
          <form id="resetForm">
            <div class="form-group"><label>注册邮箱</label><input type="email" id="resetEmail" placeholder="请输入注册时的邮箱" required></div>
            <div class="form-group">
              <label>验证码</label>
              <div class="code-row">
                <input type="text" id="resetCode" placeholder="6位数字验证码" maxlength="6" required>
                <button type="button" id="sendResetCodeBtn" class="send-code-btn">获取验证码</button>
              </div>
            </div>
            <div class="form-group"><label>新密码</label><input type="password" id="newPassword" placeholder="至少8位，包含字母和数字" required></div>
            <button type="submit" class="submit-btn" id="resetSubmitBtn">确认修改</button>
          </form>
          <div class="modal-footer"><a href="javascript:void(0)" id="backToLoginLink">返回登录</a></div>
        </div>
      </div>
    </div>

    <div class="modal-overlay" id="badgeNameModal">
      <div class="modal-content">
        <button class="modal-close" id="closeBadgeNameModal">&times;</button>
        <h3 style="text-align:center;margin-bottom:18px;" id="badgeNameModalTitle">修改名牌名称</h3>
        <form id="badgeNameForm">
          <div class="form-group">
            <label>名牌名称（<span id="badgeNameMaxLen">4</span> 字以内）</label>
            <input type="text" id="badgeNameInput" placeholder="请输入名牌显示的名称" maxlength="6">
          </div>
          <button type="submit" class="submit-btn" id="badgeNameSubmitBtn">确定</button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // ================= 3. 核心逻辑控制 =================
  // 状态更新函数，挂载到 window 供各页面调用
  window.getLocalUser = function() {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const u = JSON.parse(raw);
      return (u && u.email) ? u : null;
    } catch (e) { return null; }
  };

  window.renderGlobalUI = function() {
    const user = window.getLocalUser();
    
    // 更新右上角头像
    const avatarBtn = document.getElementById('avatarBtn');
    if (avatarBtn) {
      if (!user) {
        avatarBtn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
      } else if (user.avatar) {
        avatarBtn.innerHTML = `<img src="${user.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      } else {
        avatarBtn.innerHTML = `<span style="font-size:16px;font-weight:bold;color:#fff;">${(user.nickname || 'U').charAt(0).toUpperCase()}</span>`;
      }
    }

    // 更新悬浮窗
    const popoverLoggedIn = document.getElementById('popoverLoggedIn');
    const popoverNotLoggedIn = document.getElementById('popoverNotLoggedIn');
    if (popoverLoggedIn && popoverNotLoggedIn) {
      if (user) {
        popoverLoggedIn.style.display = 'block';
        popoverNotLoggedIn.style.display = 'none';

        const avatarBox = document.getElementById('popoverAvatar');
        const avatarLetter = document.getElementById('popoverAvatarLetter');
        if (user.avatar) {
          avatarBox.style.backgroundImage = `url(${user.avatar})`;
          avatarBox.style.background = `url(${user.avatar}) center/cover no-repeat`;
          avatarLetter.style.display = 'none';
        } else {
          avatarBox.style.backgroundImage = 'none';
          avatarBox.style.background = 'linear-gradient(135deg, #4f7cff, #8a5cf6)';
          avatarLetter.style.display = 'block';
          avatarLetter.textContent = (user.nickname || 'U').charAt(0).toUpperCase();
        }

        // 昵称颜色
        const nickEl = document.getElementById('popoverNickname');
        const hasColor = user.nickname_color && user.nickname_color_expire_at && user.nickname_color_expire_at > Date.now() && user.nickname_color_equipped !== 0;
        if (hasColor) {
          nickEl.innerHTML = `<span class="nick-colored nick-${user.nickname_color}">${user.nickname || '用户'}</span>`;
        } else {
          nickEl.textContent = user.nickname || '用户';
        }

        // 名牌
        const badgeEl = document.getElementById('popoverUserBadge');
        if (badgeEl) {
          if (user.badge_type && user.badge_name && user.badge_expire_at && user.badge_expire_at > Date.now()) {
            badgeEl.innerHTML = `<span class="user-badge ${user.badge_type} editable-badge" title="点击修改名牌名称">${user.badge_name}</span>`;
          } else {
            badgeEl.innerHTML = '';
          }
        }

        // 经验条渲染逻辑 (提取成一个内部函数)
        const expNum = parseInt(user.exp) || 0;
        let level = 1, nextExp = 200, baseColor = '#4ade80', darkColor = '#22c55e', textColor = '#ffffff';
        if (expNum >= 13200) { level = 7; nextExp = Infinity; baseColor = '#a855f7'; darkColor = '#7e22ce'; }
        else if (expNum >= 6200) { level = 6; nextExp = 13200; baseColor = '#ef4444'; darkColor = '#b91c1c'; }
        else if (expNum >= 2800) { level = 5; nextExp = 6200; baseColor = '#f97316'; darkColor = '#c2410c'; }
        else if (expNum >= 1200) { level = 4; nextExp = 2800; baseColor = '#facc15'; darkColor = '#eab308'; textColor = '#1f2937'; }
        else if (expNum >= 500) { level = 3; nextExp = 1200; baseColor = '#3b82f6'; darkColor = '#1d4ed8'; }
        else if (expNum >= 200) { level = 2; nextExp = 500; baseColor = '#22c55e'; darkColor = '#15803d'; }
        
        const popoverExpText = document.getElementById('popoverExpText');
        const popoverLevelText = document.getElementById('popoverLevelText');
        const popoverExpBarFill = document.getElementById('popoverExpBarFill');
        if (popoverExpText) {
          if (nextExp === Infinity) { popoverExpText.textContent = `${expNum}/∞`; popoverExpBarFill.style.width = '100%'; }
          else { popoverExpText.textContent = `${expNum}/${nextExp}`; popoverExpBarFill.style.width = Math.min((expNum / nextExp) * 100, 100) + '%'; }
          popoverLevelText.textContent = `Lv${level}`;
          popoverLevelText.style.background = `linear-gradient(135deg, ${baseColor}, ${darkColor})`;
          popoverLevelText.style.color = textColor;
          popoverExpBarFill.style.background = baseColor;
        }
      } else {
        popoverLoggedIn.style.display = 'none';
        popoverNotLoggedIn.style.display = 'block';
      }
    }
  };

  // ================= 4. 绑定公共事件 =================
  // 登录入口
  const authModal = document.getElementById('authModal');
  window.openAuthModal = function() {
    document.getElementById('authFormContainer').style.display = 'block';
    document.getElementById('resetFormContainer').style.display = 'none';
    authModal.classList.add('show');
  };

  document.getElementById('avatarBtn').addEventListener('click', () => {
    if (!window.getLocalUser()) window.openAuthModal();
  });
  document.getElementById('popoverNotLoggedIn').addEventListener('click', window.openAuthModal);
  document.getElementById('closeModal').addEventListener('click', () => authModal.classList.remove('show'));
  authModal.addEventListener('click', (e) => { if (e.target === authModal) authModal.classList.remove('show'); });

  // 忘记密码切换
  document.getElementById('forgotPasswordLink').addEventListener('click', () => {
    document.getElementById('authFormContainer').style.display = 'none';
    document.getElementById('resetFormContainer').style.display = 'block';
  });
  document.getElementById('backToLoginLink').addEventListener('click', () => {
    document.getElementById('authFormContainer').style.display = 'block';
    document.getElementById('resetFormContainer').style.display = 'none';
  });
  
  // 登录/注册 Tabs 切换
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active'); tabRegister.classList.remove('active');
    document.getElementById('nicknameGroup').style.display = 'none';
    document.getElementById('codeGroup').style.display = 'none';
    document.getElementById('codeInput').required = false;
    document.getElementById('forgotPasswordLink').style.display = 'inline';
  });
  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active'); tabLogin.classList.remove('active');
    document.getElementById('nicknameGroup').style.display = 'block';
    document.getElementById('codeGroup').style.display = 'block';
    document.getElementById('codeInput').required = true;
    document.getElementById('forgotPasswordLink').style.display = 'none';
  });

  // 发送验证码
  function startCountdown(btn) {
    let c = 60; btn.disabled = true; btn.textContent = `${c}秒后重试`;
    const timer = setInterval(() => {
      c--; if (c <= 0) { clearInterval(timer); btn.disabled = false; btn.textContent = '获取验证码'; }
      else btn.textContent = `${c}秒后重试`;
    }, 1000);
  }
  async function sendCode(email, btn) {
    if (!email || !email.includes('@')) return alert('请输入有效的邮箱地址');
    btn.disabled = true; btn.textContent = '发送中...';
    try {
      const res = await fetch('/api/auth/send-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (data.success) startCountdown(btn);
      else { alert(data.error || '发送失败'); btn.disabled = false; btn.textContent = '获取验证码'; }
    } catch (e) { alert('网络错误'); btn.disabled = false; btn.textContent = '获取验证码'; }
  }
  document.getElementById('sendCodeBtn').addEventListener('click', () => sendCode(document.getElementById('emailInput').value.trim(), document.getElementById('sendCodeBtn')));
  document.getElementById('sendResetCodeBtn').addEventListener('click', () => sendCode(document.getElementById('resetEmail').value.trim(), document.getElementById('sendResetCodeBtn')));

  // 登录/注册提交
  document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('emailInput').value.trim();
    const code = document.getElementById('codeInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();
    const isRegister = tabRegister.classList.contains('active');
    const nickname = isRegister ? document.getElementById('nicknameInput').value.trim() : '';
    if (!email || !password) return alert('请填写邮箱和密码');
    if (isRegister && !code) return alert('请填写验证码');
    if (password.length < 8) return alert('密码至少8位');
    if (isRegister && !nickname) return alert('请设置您的昵称');
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true; submitBtn.textContent = '处理中...';
    try {
      const payload = isRegister ? { email, code, password, nickname } : { email, password };
      const res = await fetch(isRegister ? '/api/auth/register' : '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        alert(isRegister ? '注册成功！' : '登录成功！');
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          const urlParams = new URLSearchParams(window.location.search);
          const redirectUrl = urlParams.get('redirect');
          if (redirectUrl) window.location.href = redirectUrl;
          else location.reload();
        }
      } else alert(data.error || '操作失败');
    } catch (e) { alert('网络错误'); }
    finally { submitBtn.disabled = false; submitBtn.textContent = '登录 / 注册'; }
  });

  // 重置密码提交
  document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value.trim();
    const code = document.getElementById('resetCode').value.trim();
    const password = document.getElementById('newPassword').value.trim();
    if (!email || !code || !password) return alert('请填写所有字段');
    if (password.length < 8) return alert('密码至少8位');
    
    const btn = document.getElementById('resetSubmitBtn');
    btn.disabled = true; btn.textContent = '处理中...';
    try {
      const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code, newPassword: password }) });
      const data = await res.json();
      if (data.success) { alert('密码重置成功！'); document.getElementById('authFormContainer').style.display = 'block'; document.getElementById('resetFormContainer').style.display = 'none'; }
      else alert(data.error || '重置失败');
    } catch (e) { alert('网络错误'); }
    finally { btn.disabled = false; btn.textContent = '确认修改'; }
  });

  // 悬浮窗头像上传
  document.getElementById('popoverAvatar').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('avatarUploadInput').click(); });
  document.getElementById('avatarUploadInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) return alert('图片不能超过 500KB，请压缩后再上传');
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      const user = window.getLocalUser();
      if(!user) return;
      try {
        const res = await fetch('/api/auth/update-avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, avatar: base64 }) });
        const data = await res.json();
        if (data.success) {
          user.avatar = base64; if(data.rewardGiven) user.exp = data.newExp;
          localStorage.setItem('user', JSON.stringify(user));
          alert(data.message || '头像修改成功！');
          window.renderGlobalUI();
          if (typeof window.onUserUpdate === 'function') window.onUserUpdate(user);
        } else alert(data.error || '上传失败');
      } catch (err) { alert('网络错误'); }
    };
    reader.readAsDataURL(file);
  });

  // 修改昵称
  document.getElementById('popoverNickname').addEventListener('click', async (e) => {
    e.stopPropagation();
    const user = window.getLocalUser(); if (!user) return;
    const newNickname = prompt('请输入新的昵称：', user.nickname);
    if (!newNickname || newNickname.trim() === '' || newNickname === user.nickname) return;
    try {
      const res = await fetch('/api/auth/update-nickname', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, newNickname: newNickname.trim() }) });
      const data = await res.json();
      if (data.success) {
        user.nickname = newNickname.trim(); localStorage.setItem('user', JSON.stringify(user));
        alert('昵称修改成功！'); window.renderGlobalUI();
        if (typeof window.onUserUpdate === 'function') window.onUserUpdate(user);
      } else alert(data.error || '修改失败');
    } catch (err) { alert('网络错误'); }
  });

  // 修改名牌
  const badgeNameModal = document.getElementById('badgeNameModal');
  document.getElementById('popoverUserBadge').addEventListener('click', (e) => {
    const badge = e.target.closest('.editable-badge'); if (!badge) return;
    e.stopPropagation();
    const u = window.getLocalUser(); if (!u) return;
    if (!u.badge_type) return alert('你还没有名牌');
    if (u.badge_expire_at && u.badge_expire_at < Date.now()) return alert('名牌已过期');
    const currentMonth = new Date().toISOString().slice(0, 7);
    let count = u.badge_update_count || 0;
    if (u.badge_update_month !== currentMonth) count = 0;
    const maxTimes = u.badge_type === 'ultimate' ? 5 : 3;
    if (u.badge_name && count >= maxTimes) return alert(`本月修改次数已用完（每月${maxTimes}次）`);
    document.getElementById('badgeNameMaxLen').textContent = { normal: 4, premium: 6, ultimate: 6 }[u.badge_type] || 6;
    document.getElementById('badgeNameInput').maxLength = { normal: 4, premium: 6, ultimate: 6 }[u.badge_type] || 6;
    document.getElementById('badgeNameInput').value = u.badge_name || '';
    badgeNameModal.classList.add('show');
  });
  document.getElementById('closeBadgeNameModal').addEventListener('click', () => badgeNameModal.classList.remove('show'));
  document.getElementById('badgeNameForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = window.getLocalUser(); if (!u) return;
    const newName = document.getElementById('badgeNameInput').value.trim();
    if (!newName) return alert('名称不能为空');
    const btn = document.getElementById('badgeNameSubmitBtn'); btn.disabled = true; btn.textContent = '保存中...';
    try {
      const res = await fetch('/api/shop/update-badge-name', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: u.email, newName }) });
      const data = await res.json();
      if (data.success) {
        badgeNameModal.classList.remove('show');
        const meRes = await fetch('/api/auth/me', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: u.email }) });
        const meData = await meRes.json();
        if (meData.success && meData.user) localStorage.setItem('user', JSON.stringify(meData.user));
        alert('名牌名称修改成功！'); window.renderGlobalUI();
        if (typeof window.onUserUpdate === 'function') window.onUserUpdate(meData.user || u);
      } else alert(data.error || '修改失败');
    } catch(err) { alert('网络错误'); }
    finally { btn.disabled = false; btn.textContent = '确定'; }
  });

  // 签到 / 退出
  document.getElementById('popoverSigninBtn').addEventListener('click', (e) => { 
    e.stopPropagation(); 
    window.location.href = 'index.html#signin'; 
  });
  
  document.getElementById('popoverLogoutBtn').addEventListener('click', (e) => {
    e.stopPropagation(); 
    
    // 1. 清理 localStorage 和 sessionStorage
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // 2. 清理可能残留的 Cookie (保险起见)
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });

    alert('已退出登录');
    
    // 3. 强制跳转到首页，防止浏览器保留当前页面的登录状态缓存
    window.location.replace('index.html');
  });

  // ================= 5. 语言切换和页面跳转过渡 =================
  // 语言切换...
  var langBtn = document.getElementById('langBtn'), langMenu = document.getElementById('langMenu'), langSwitch = document.querySelector('.lang-switch');
  if (langBtn && langMenu && langSwitch && typeof OpenCC !== 'undefined') {
    var converters = { cn: null, hk: OpenCC.Converter({ from: 'cn', to: 'hk' }), tw: OpenCC.Converter({ from: 'cn', to: 'twp' }) };
    var langNames = { cn: '简体中文 ▾', hk: '繁體中文（香港）▾', tw: '繁體中文（台灣）▾' };
    var textNodes = []; var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false); var n;
    while ((n = walker.nextNode())) {
      if (!n.nodeValue || !n.nodeValue.trim()) continue; var p = n.parentElement; if (!p) continue;
      var tag = p.tagName; if (tag === 'SCRIPT' || tag === 'STYLE' || p.closest('.nav') || p.closest('.modal-overlay')) continue;
      n.__original = n.nodeValue; textNodes.push(n);
    }
    var applyLang = function (lang) {
      var converter = converters[lang];
      for (var i = 0; i < textNodes.length; i++) {
        var node = textNodes[i]; if (!node.isConnected) continue;
        node.nodeValue = converter ? converter(node.__original) : node.__original;
      }
      langBtn.textContent = langNames[lang];
      var btns = langMenu.querySelectorAll('button');
      for (var j = 0; j < btns.length; j++) { btns[j].classList.toggle('active', btns[j].getAttribute('data-lang') === lang); }
      document.documentElement.lang = lang === 'cn' ? 'zh-CN' : (lang === 'hk' ? 'zh-HK' : 'zh-TW');
    };
    langBtn.addEventListener('click', function (e) { e.stopPropagation(); langMenu.classList.toggle('open'); });
    var menuBtns = langMenu.querySelectorAll('button');
    for (var k = 0; k < menuBtns.length; k++) {
      (function (btn) { btn.addEventListener('click', function () { applyLang(btn.getAttribute('data-lang')); langMenu.classList.remove('open'); }); })(menuBtns[k]);
    }
    document.addEventListener('click', function (e) { if (!langSwitch.contains(e.target)) langMenu.classList.remove('open'); });
  }

  // 页面跳转淡入淡出
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a'); if (!link) return;
    var href = link.getAttribute('href'); if (!href) return;
    if (href.startsWith('#') || href.startsWith('http') || link.target === '_blank' || href.startsWith('javascript:')) return;
    e.preventDefault(); document.body.classList.add('page-leaving');
    setTimeout(function () { window.location.href = href; }, 200);
  });
})();
