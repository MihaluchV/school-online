/* Кабінет учителя · редагування catalog.json і завантаження файлів у репозиторій через GitHub API.
   Токен зберігається лише в браузері вчителя (localStorage), у репозиторій він не потрапляє. */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const view = $('#view'), conn = $('#conn'), st = $('#st'), saveBtn = $('#saveBtn'), dlBtn = $('#dlBtn'), fileIn = $('#fileIn');
  const M = $('#modal'), mbody = $('#mbody'), gate = $('#gate'), work = $('#work'), acts = $('#acts');
  const EM = '@klas-kod.app'; // технічний домен старих логінів Клас-коду
  const SOFT = ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email', 'auth/invalid-login-credentials'];
  const TYPE_C = { theory: '#0284C7', slides: '#D97706', video: '#DB2777', trainer: '#0D9488', practical: '#4F46E5', quiz: '#65A30D', test: '#E11D48' };
  const LOCKABLE = ['test', 'quiz']; // типи з перемикачем «відкрито / закрито»
  const DEF_TYPES = { theory: 'Теорія', slides: 'Презентація', video: 'Відеоурок', trainer: 'Тренажер', practical: 'Практична', quiz: 'Тест', test: 'Контрольна' };

  const load = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const keep = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  let cfg = { owner: 'MihaluchV', repo: 'school-online', branch: 'main', token: '' };
  const oldTok = load('hubTok'); // токен зі старої версії кабінету (зберігався в браузері)
  let AU = null, DB = null, user = null, prof = {};
  let cat = null, connected = false, dirty = false, busy = false, tab = 'edit', curC = null, curS = null;
  let autoSave = load('hubAuto') !== false;

  /* ---------- дрібні помічники ---------- */
  let tt;
  function toast(t, isErr) {
    const e = $('#toast'); e.innerHTML = t; e.className = 'toast show' + (isErr ? ' err' : '');
    clearTimeout(tt); tt = setTimeout(() => e.classList.remove('show'), isErr ? 6000 : 3500);
  }
  function status() {
    st.textContent = busy ? 'Зачекайте…' : !user ? 'Вхід не виконано' : !cat ? 'Не підключено' : dirty ? 'Є незбережені зміни' : connected ? 'Збережено на GitHub' : 'Без GitHub';
    st.className = 'st ' + (dirty ? 'dirty' : connected && cat ? 'ok' : '');
    saveBtn.disabled = !connected || !cat || busy;
    dlBtn.disabled = !cat;
  }
  function setDirty(v = true) {
    dirty = v;
    keep('hubDraft', v ? { t: Date.now(), cat } : null);
    status();
  }
  const TR = { а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', ы: 'y', э: 'e', ё: 'io', ъ: '' };
  function slug(s) {
    return String(s || '').toLowerCase().replace(/[’'ʼ`"]/g, '').split('').map(ch => TR[ch] != null ? TR[ch] : ch).join('')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');
  }
  const cleanPath = p => String(p || '').trim().replace(/\\/g, '/').replace(/^\.?\/+/, '').split('/')
    .map(part => part.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')).filter(Boolean).join('/');
  const isUrl = f => /^https?:\/\//i.test(f || '');
  function uniqueId(C, base, except) {
    let id = base || 'rozdil', n = 2;
    while (C.sections.some(S => S !== except && S.id === id)) id = (base || 'rozdil') + '-' + n++;
    return id;
  }
  const cls = () => cat.classes.find(c => c.id === curC) || cat.classes[0];

  /* ---------- base64 (UTF-8) ---------- */
  function bytesToB64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
  const b64enc = str => bytesToB64(new TextEncoder().encode(str));
  const b64dec = b => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, '')), c => c.charCodeAt(0)));
  const fileB64 = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(f); });

  /* ---------- GitHub API ---------- */
  const encPath = p => p.split('/').map(encodeURIComponent).join('/');
  function gh(path, opt = {}) {
    const h = { Authorization: 'Bearer ' + cfg.token, Accept: 'application/vnd.github+json' };
    if (opt.body) h['Content-Type'] = 'application/json';
    return fetch(`https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/${path}`, Object.assign({ cache: 'no-store' }, opt, { headers: h }));
  }
  async function apiErr(r) {
    let m = ''; try { m = (await r.json()).message; } catch (e) { }
    const map = { 401: 'Токен недійсний або прострочений', 403: 'Немає доступу: перевірте права токена (Contents: Read and write)', 404: 'Репозиторій, гілку або файл не знайдено', 409: 'Конфлікт версій — спробуйте ще раз', 422: 'GitHub відхилив запит' };
    return new Error((map[r.status] || 'Помилка ' + r.status) + (m ? ` (${m})` : ''));
  }
  async function getFile(p) {
    const r = await gh(`contents/${encPath(p)}?ref=${encodeURIComponent(cfg.branch)}`);
    if (r.status === 404) return null;
    if (!r.ok) throw await apiErr(r);
    return r.json();
  }
  async function putFile(p, b64, msg) {
    const old = await getFile(p);
    const body = { message: msg, content: b64, branch: cfg.branch };
    if (old && old.sha) body.sha = old.sha;
    const r = await gh(`contents/${encPath(p)}`, { method: 'PUT', body: JSON.stringify(body) });
    if (!r.ok) throw await apiErr(r);
    return r.json();
  }
  async function delFile(p, msg) {
    const old = await getFile(p);
    if (!old) return;
    const r = await gh(`contents/${encPath(p)}`, { method: 'DELETE', body: JSON.stringify({ message: msg, sha: old.sha, branch: cfg.branch }) });
    if (!r.ok) throw await apiErr(r);
  }
  async function withBusy(fn) {
    busy = true; status();
    try { return await fn(); } catch (e) { toast(esc(e.message || e), true); return false; } finally { busy = false; status(); }
  }

  /* ---------- завантаження й збереження каталогу ---------- */
  function normalize(c) {
    c.types = Object.assign({}, DEF_TYPES, c.types || {}); // нові типи (напр. «Практична») додаються автоматично
    c.platforms = c.platforms || [];
    c.classes.forEach(C => C.sections.forEach(S => {
      S.topics = S.topics || []; S.img = S.img || '';
      S.topics.forEach(T => { T.materials = T.materials || []; T.materials.forEach(m => { if (m.open == null) m.open = true; m.new = !!m.new; }); });
    }));
    return c;
  }
  async function siteCatalog() {
    const r = await fetch('catalog.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('Не вдалося прочитати catalog.json сайту');
    return r.json();
  }
  async function start(data, isConnected) {
    cat = normalize(data); connected = isConnected;
    curC = cat.classes[0].id; curS = cls().sections[0] || null;
    dirty = false;
    const d = load('hubDraft');
    if (d && d.cat && JSON.stringify(d.cat) !== JSON.stringify(cat)) {
      const ok = await modal(`<h3>Незбережені зміни</h3><p>Знайдено чернетку від ${new Date(d.t).toLocaleString('uk-UA')}, яку не було збережено. Відновити її?</p>`,
        [{ t: 'Ні, видалити', v: false }, { t: 'Відновити', v: true, cls: 'pri' }]);
      if (ok) { cat = normalize(d.cat); curC = cat.classes[0].id; curS = cls().sections[0] || null; setDirty(true); }
      else keep('hubDraft', null);
    }
    render();
  }
  async function connect(fromForm) {
    let saveAcc = false;
    if (fromForm) {
      cfg.owner = $('#cOwner').value.trim(); cfg.repo = $('#cRepo').value.trim(); cfg.branch = $('#cBranch').value.trim() || 'main';
      cfg.token = $('#cTok').value.trim(); saveAcc = $('#cSave').checked;
    }
    if (!cfg.token) return toast('Вставте токен доступу GitHub', true);
    await withBusy(async () => {
      const f = await getFile('catalog.json');
      let data;
      if (f && f.content) data = JSON.parse(b64dec(f.content));
      else if (f && f.download_url) data = await (await fetch(f.download_url, { cache: 'no-store' })).json();
      else data = await siteCatalog();
      if (saveAcc) {
        await DB.ref('hub/gh/' + user.uid).set({ owner: cfg.owner, repo: cfg.repo, branch: cfg.branch, token: cfg.token });
        keep('hubTok', null);
      }
      await start(data, true);
      toast('Підключено до ' + esc(cfg.owner + '/' + cfg.repo) + (saveAcc ? '. Налаштування збережено у вашому обліковому записі.' : ''));
    });
  }
  function validate() {
    for (const C of cat.classes) {
      const seen = {};
      for (const S of C.sections) {
        const bad = !S.title.trim() ? 'немає назви розділу' : !/^[a-z0-9][a-z0-9-]*$/.test(S.id) ? 'папка розділу має бути латиницею (a–z, 0–9, дефіс)' : seen[S.id] ? 'дві однакові папки розділів' : '';
        if (bad) { tab = 'edit'; curC = C.id; curS = S; render(); toast(`${esc(C.title)}: ${bad}.`, true); return false; }
        seen[S.id] = 1;
        for (const T of S.topics) if (!T.title.trim()) { tab = 'edit'; curC = C.id; curS = S; render(); toast(`${esc(S.title)}: у теми немає назви.`, true); return false; }
      }
    }
    return true;
  }
  async function saveGH(quiet) {
    if (!connected || !validate()) return false;
    return withBusy(async () => {
      cat.updated = new Date().toISOString().slice(0, 10);
      await putFile('catalog.json', b64enc(JSON.stringify(cat, null, 1)), 'Оновлення змісту сайту');
      setDirty(false);
      toast(quiet ? 'Збережено на GitHub.' : 'Збережено. Сайт оновиться приблизно за 1–2 хвилини.');
      return true;
    });
  }
  function download() {
    if (!cat || !validate()) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(cat, null, 1)], { type: 'application/json' }));
    a.download = 'catalog.json'; document.body.appendChild(a); a.click(); a.remove();
    toast('Файл catalog.json завантажено. Замініть ним файл у корені репозиторію.');
  }

  /* ---------- діалоги ---------- */
  function modal(html, btns) {
    return new Promise(res => {
      mbody.innerHTML = html + `<div class="row" style="justify-content:flex-end;margin-top:18px">${btns.map((b, i) => `<button type="button" class="btn ${b.cls || ''}" data-mb="${i}">${b.t}</button>`).join('')}</div>`;
      M.hidden = false;
      const inp = mbody.querySelector('input'); if (inp) { inp.focus(); inp.select(); }
      const done = v => { M.hidden = true; mbody.onclick = null; document.removeEventListener('keydown', key); res(v); };
      const key = e => { if (e.key === 'Escape') done(null); if (e.key === 'Enter' && inp) { const b = btns.find(x => x.v === 'input'); if (b) done(inp.value); } };
      document.addEventListener('keydown', key);
      mbody.onclick = e => { const b = e.target.closest('[data-mb]'); if (!b) return; const v = btns[+b.dataset.mb].v; done(v === 'input' ? inp.value : v); };
    });
  }
  const ask = (title, text, okText = 'Видалити') => modal(`<h3>${title}</h3><p>${text}</p>`, [{ t: 'Скасувати', v: false }, { t: okText, v: true, cls: 'red' }]);
  const pickFile = accept => new Promise(res => { fileIn.accept = accept; fileIn.value = ''; fileIn.onchange = () => res(fileIn.files[0] || null); fileIn.click(); });

  /* ---------- завантаження файлів ---------- */
  async function uploadTo(defPath, accept, what) {
    if (!connected) { toast('Щоб завантажувати файли, підключіться до GitHub.', true); return null; }
    const f = await pickFile(accept); if (!f) return null;
    if (f.size > 25 * 1024 * 1024) { toast('Файл завеликий (понад 25 МБ). Для відео краще дати посилання на YouTube.', true); return null; }
    const ext = ((f.name.match(/\.[a-z0-9]+$/i) || ['.html'])[0]).toLowerCase();
    const def = defPath.replace(/\.[a-z0-9]+$/i, '') + ext;
    const p = await modal(`<h3>Завантаження ${what}</h3><p>Файл <b>${esc(f.name)}</b> буде збережено в репозиторії за цим шляхом. Якщо такий файл уже є, його буде замінено новою версією.</p><label class="f">Шлях у репозиторії<input class="i" value="${esc(def)}"></label>`,
      [{ t: 'Скасувати', v: null }, { t: 'Завантажити', v: 'input', cls: 'pri' }]);
    if (!p) return null;
    const path = cleanPath(p);
    if (!path || !/\.[a-z0-9]+$/.test(path)) { toast('Вкажіть шлях із назвою файлу, наприклад 9/databases/zoo.html', true); return null; }
    const ok = await withBusy(async () => { toast('Завантаження…'); await putFile(path, await fileB64(f), 'Файл: ' + path); return true; });
    return ok ? path : null;
  }
  async function uploadMat(ti, mi) {
    const C = cls(), S = curS, T = S.topics[ti], m = T.materials[mi];
    if (!S.id) return toast('Спочатку вкажіть папку розділу.', true);
    const def = m.file && !isUrl(m.file) ? m.file : `${C.id}/${S.id}/${slug(T.title) || 'material'}-${m.type}.html`;
    const path = await uploadTo(def, '.html,.htm,.pdf,.pptx,.ppt,.docx,.png,.jpg,.jpeg,.gif,.webp,.svg,.mp4,.zip', 'матеріалу');
    if (!path) return;
    m.file = path; setDirty(); render();
    if (!(await saveGH(true))) return;
    toast('Файл завантажено і додано на сайт. Оновлення з’явиться за 1–2 хвилини.');
  }
  async function uploadImg() {
    const C = cls(), S = curS;
    const path = await uploadTo(`img/${C.id}-${S.id || 'rozdil'}.jpg`, '.jpg,.jpeg,.png,.webp,.svg', 'обкладинки');
    if (!path) return;
    S.img = path; setDirty(); render(); saveGH(true);
  }

  /* ---------- відображення ---------- */
  function renderConn() {
    const who = esc([prof.last, prof.first, prof.middle].filter(Boolean).join(' ') || prof.login || (user && user.email) || '');
    if (connected) {
      conn.innerHTML = `<div class="row" style="margin:0;justify-content:space-between"><div><b>${who}</b><div class="who">Сайт: <code>${esc(cfg.owner)}/${esc(cfg.repo)}</code> · гілка <code>${esc(cfg.branch)}</code></div></div>
        <button type="button" class="btn sm" data-act="ghEdit">Налаштування GitHub</button></div>`;
      return;
    }
    conn.innerHTML = `<div class="who" style="margin-bottom:6px">${who}</div><h2>Підключення до репозиторію сайту</h2>
      <p class="hint">Потрібен токен доступу GitHub з правом <b>Contents: Read and write</b> лише для репозиторію сайту (як створити — у README.md). Його достатньо ввести один раз: він збережеться у вашому обліковому записі, і на інших комп’ютерах кабінет підключиться сам після входу.</p>
      <div class="fields">
        <label class="f">Власник<input class="i" id="cOwner" value="${esc(cfg.owner)}"></label>
        <label class="f">Репозиторій<input class="i" id="cRepo" value="${esc(cfg.repo)}"></label>
        <label class="f">Гілка<input class="i" id="cBranch" value="${esc(cfg.branch)}"></label>
        <label class="f">Токен доступу<input class="i" id="cTok" type="password" autocomplete="off" value="${esc(cfg.token || oldTok || '')}" placeholder="github_pat_…"></label>
      </div>
      <div class="row"><label class="chk"><input type="checkbox" id="cSave" checked>Зберегти в моєму обліковому записі</label></div>
      <div class="row"><button type="button" class="btn pri" data-act="connect">Підключитися</button>
        <button type="button" class="btn" data-act="offline">Працювати без GitHub</button>
        <button type="button" class="btn" data-act="openJson">Відкрити catalog.json з комп’ютера</button></div>`;
  }

  /* ---------- єдиний вхід (Firebase, ті самі облікові записи, що в Клас-коді) ---------- */
  function gateScreen(kind, extra) {
    work.hidden = true; acts.hidden = true; gate.hidden = false;
    const H = {
      login: `<div class="gbox"><h2>Вхід для вчителя</h2><p>Логін і пароль ті самі, що на платформах «Клас-код» і «Групова робота». Після входу ці платформи відкриватимуться вже без повторного входу.</p>
        <label class="f">Логін або пошта<input class="i" id="gId" autocomplete="username"></label>
        <label class="f">Пароль<input class="i" id="gPw" type="password" autocomplete="current-password"></label>
        <div class="err" id="gErr"></div><button type="button" class="btn pri" data-act="gLogin">Увійти</button>
        <button type="button" class="link" data-act="gReset">Забули пароль?</button></div>`,
      claim: `<div class="gbox"><h2>Адміністратор сайту</h2><p>Адміністратора цього сайту ще не призначено. Призначити адміністратором ваш обліковий запис <b>${esc(extra)}</b>? Змінити це потім можна лише в консолі Firebase.</p>
        <button type="button" class="btn pri" data-act="gClaim">Так, я адміністратор</button><button type="button" class="btn" data-act="gOut">Вийти</button></div>`,
      denied: `<div class="gbox"><h2>Немає доступу</h2><p>Обліковий запис <b>${esc(extra)}</b> не має права керувати цим сайтом.</p><button type="button" class="btn" data-act="gOut">Вийти</button></div>`,
      rules: `<div class="gbox"><h2>Потрібно оновити правила Firebase</h2><p>База не дозволяє кабінету сайту прочитати свої налаштування. Опублікуйте в Firebase (Realtime Database → Rules) оновлений файл <code>firebase-rules.json</code>.</p><p>${esc(extra)}</p><button type="button" class="btn" data-act="gOut">Вийти</button></div>`,
      error: `<div class="gbox"><h2>Помилка</h2><p>${esc(extra)}</p></div>`
    };
    gate.innerHTML = H[kind];
    const f = gate.querySelector('input'); if (f) f.focus();
    status();
  }
  const authMsg = x => x && x.code === 'auth/too-many-requests' ? 'Забагато спроб. Спробуйте за кілька хвилин.' : x && x.code === 'auth/network-request-failed' ? 'Немає зв’язку із сервером.' : 'Неправильний логін або пароль.';
  async function emailsFor(id) {
    if (id.includes('@')) return [id];
    const c = [];
    try { const m = (await DB.ref('logins/' + id).once('value')).val(); if (m && m.e) c.push(m.e); } catch (e) { }
    c.push(id + EM);
    return c;
  }
  async function gLogin() {
    const id = $('#gId').value.trim().toLowerCase(), pw = $('#gPw').value, err = $('#gErr');
    if (!id || !pw) { err.textContent = 'Введіть логін і пароль.'; return; }
    err.textContent = ''; busy = true; status();
    try {
      let last = null, mail = null;
      for (const e of await emailsFor(id)) {
        try { await AU.signInWithEmailAndPassword(e, pw); mail = e; break; } catch (x) { last = x; if (!SOFT.includes(x.code)) throw x; }
      }
      if (!mail) throw last;
      // той самий вхід для «Групової роботи» (вона зберігає сесію окремо)
      try {
        const ca = firebase.apps.find(a => a.name === 'collab-teacher') || firebase.initializeApp(CFG, 'collab-teacher');
        await ca.auth().signInWithEmailAndPassword(mail, pw);
      } catch (x) { }
    } catch (x) { err.textContent = authMsg(x); }
    finally { busy = false; status(); }
  }
  async function gReset() {
    const id = ($('#gId').value || '').trim().toLowerCase(), err = $('#gErr');
    if (!id) { err.textContent = 'Введіть логін або пошту, а потім натисніть «Забули пароль?».'; return; }
    try { const e = (await emailsFor(id))[0]; if (!e.endsWith(EM)) await AU.sendPasswordResetEmail(e); } catch (x) { }
    err.style.color = '#047857'; err.textContent = 'Якщо такий обліковий запис має пошту, на неї надіслано лист для зміни пароля (перевірте «Спам»).';
  }
  async function signOutAll() {
    if (dirty && !(await ask('Вийти без збереження?', 'Є незбережені зміни. Вони залишаться в чернетці цього браузера.', 'Вийти'))) return;
    dirty = false;
    try { const ca = firebase.apps.find(a => a.name === 'collab-teacher') || firebase.initializeApp(CFG, 'collab-teacher'); await ca.auth().signOut(); } catch (e) { }
    await AU.signOut(); location.reload();
  }
  async function onAuth(u) {
    if (!u || u.isAnonymous) { user = null; cat = null; connected = false; return gateScreen('login'); }
    user = u; gate.innerHTML = '<div class="loading">Перевірка доступу…</div>';
    try { prof = (await DB.ref('teachers/' + u.uid).once('value')).val() || {}; } catch (e) { prof = {}; }
    const name = [prof.last, prof.first].filter(Boolean).join(' ') || prof.login || u.email;
    let owner;
    try { owner = (await DB.ref('hub/owner').once('value')).val(); }
    catch (e) { return gateScreen('rules', e.message); }
    if (!owner) return gateScreen('claim', name);
    if (owner !== u.uid) return gateScreen('denied', name);
    gate.hidden = true; work.hidden = false; acts.hidden = false;
    let g = null;
    try { g = (await DB.ref('hub/gh/' + u.uid).once('value')).val(); } catch (e) { }
    if (g && g.token) { Object.assign(cfg, g); await connect(false); if (!connected) render(); }
    else render();
  }
  function fbInit() {
    if (typeof firebase === 'undefined' || typeof CFG === 'undefined') return gateScreen('error', 'Не вдалося завантажити Firebase. Перевірте з’єднання з Інтернетом і оновіть сторінку.');
    const app = firebase.apps.find(a => a.name === '[DEFAULT]') || firebase.initializeApp(CFG);
    AU = app.auth(); AU.languageCode = 'uk'; DB = app.database();
    AU.onAuthStateChanged(onAuth);
  }

  function render() {
    status(); if (!user) return; renderConn();
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    if (!cat) return;
    if (tab === 'tests') renderTests(); else if (tab === 'misc') renderMisc(); else renderEdit();
  }

  const pills = () => `<div class="cpills">${cat.classes.map(C => `<button type="button" data-act="selC" data-c="${esc(C.id)}" style="--c:${C.color}" class="${C.id === cls().id ? 'on' : ''}">${esc(C.label)}</button>`).join('')}</div>`;

  function renderEdit() {
    const C = cls();
    if (curS && !C.sections.includes(curS)) curS = C.sections[0] || null;
    const S = curS;
    view.innerHTML = pills() + `<div class="ed"><div class="slist">
      ${C.sections.map((x, i) => `<div class="si ${x === S ? 'on' : ''}" data-act="selS" data-i="${i}" role="button" tabindex="0">
        <div class="art">${x.img ? `<img src="${esc(x.img)}" alt="">` : ART.draw(x.art, C.color)}</div>
        <div><b>${esc(x.title || 'Без назви')}</b><small>${x.topics.length} тем · ${esc(x.id || 'папку не вказано')}</small></div>
        <div class="mv"><button type="button" class="ib" data-act="mvS" data-i="${i}" data-d="-1" ${i ? '' : 'disabled'} aria-label="Вище">↑</button><button type="button" class="ib" data-act="mvS" data-i="${i}" data-d="1" ${i < C.sections.length - 1 ? '' : 'disabled'} aria-label="Нижче">↓</button></div></div>`).join('')}
      <button type="button" class="btn" data-act="addS">+ Новий розділ</button></div>
      <div>${S ? secEditor(C, S) : '<div class="empty">Виберіть розділ ліворуч або створіть новий.</div>'}</div></div>`;
  }

  function secEditor(C, S) {
    return `<div class="panel" style="--c:${C.color}"><h2>Розділ</h2>
      <div class="fields"><label class="f">Назва розділу<input class="i" data-k="s.title" value="${esc(S.title)}"></label>
      <label class="f">Папка розділу (латиницею)<input class="i" data-k="s.id" value="${esc(S.id)}" placeholder="наприклад databases"></label></div>
      <label class="f" style="margin-top:12px">Короткий опис<textarea class="i" data-k="s.desc" rows="2">${esc(S.desc)}</textarea></label>
      <p class="hint">Файли цього розділу зберігатимуться в папці <code>${esc(C.id)}/${esc(S.id || '…')}/</code>. Якщо змінити назву папки, уже завантажені файли залишаться на старому місці.</p>
      <p class="f" style="margin:16px 0 0">Обкладинка</p>
      <div class="covers">${ART.list.map(k => `<button type="button" class="cov ${!S.img && S.art === k ? 'on' : ''}" data-act="art" data-v="${k}"><div class="art">${ART.draw(k, C.color)}</div><span>${esc(ART.names[k] || k)}</span></button>`).join('')}</div>
      <div class="row"><label class="f" style="flex:1;min-width:220px">Власне зображення замість малюнка (необов’язково)<input class="i" data-k="s.img" value="${esc(S.img)}" placeholder="img/9-databases.jpg"></label>
        <button type="button" class="btn" data-act="upImg" style="align-self:flex-end">Завантажити зображення</button>
        ${S.img ? '<button type="button" class="btn" data-act="clrImg" style="align-self:flex-end">Прибрати</button>' : ''}</div>
      <div class="row"><button type="button" class="btn red" data-act="delS">Видалити розділ</button></div></div>
      <div class="panel" style="--c:${C.color}"><h2>Теми і матеріали</h2>
      <p class="hint">Порядок тем і матеріалів на сайті такий самий, як тут. Матеріал без файлу або посилання учні не бачать.</p>
      ${S.topics.map((T, ti) => topicEd(T, ti, S.topics.length)).join('')}
      <div class="row"><button type="button" class="btn pri" data-act="addT">+ Нова тема</button></div></div>`;
  }

  function topicEd(T, ti, n) {
    return `<div class="topic"><div class="th"><span class="tn">${String(ti + 1).padStart(2, '0')}</span>
      <input class="i" data-k="t.title" data-ti="${ti}" value="${esc(T.title)}" placeholder="Назва теми (уроку)">
      <div class="tbtn"><button type="button" class="ib" data-act="mvT" data-ti="${ti}" data-d="-1" ${ti ? '' : 'disabled'} aria-label="Вище">↑</button><button type="button" class="ib" data-act="mvT" data-ti="${ti}" data-d="1" ${ti < n - 1 ? '' : 'disabled'} aria-label="Нижче">↓</button><button type="button" class="ib del" data-act="delT" data-ti="${ti}" aria-label="Видалити тему">✕</button></div></div>
      <div class="tdesc"><input class="i" data-k="t.desc" data-ti="${ti}" value="${esc(T.desc)}" placeholder="Короткий опис теми (необов’язково)"></div>
      <div class="mats">${T.materials.map((m, mi) => matEd(m, ti, mi, T.materials.length)).join('')}
      <div><button type="button" class="btn sm" data-act="addM" data-ti="${ti}">+ Матеріал</button></div></div></div>`;
  }

  function matEd(m, ti, mi, n) {
    const a = `data-ti="${ti}" data-mi="${mi}"`;
    return `<div class="mat" style="--t:${TYPE_C[m.type] || '#64748B'}">
      <select class="i" data-k="m.type" ${a} aria-label="Тип">${Object.entries(cat.types).map(([k, v]) => `<option value="${k}" ${m.type === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>
      <input class="i" data-k="m.title" ${a} value="${esc(m.title)}" placeholder="Напис на кнопці (необов’язково)">
      <input class="i file" data-k="m.file" ${a} value="${esc(m.file)}" placeholder="Шлях у репозиторії або https://…">
      <div class="mb">
        ${LOCKABLE.includes(m.type) ? `<label class="tog ${m.open ? 'open' : 'shut'}"><input type="checkbox" data-k="m.open" ${a} ${m.open ? 'checked' : ''}>${m.open ? 'Відкрито' : 'Закрито'}</label>` : ''}
        <label class="tog" title="Показати на головній у «Нових матеріалах»"><input type="checkbox" data-k="m.new" ${a} ${m.new ? 'checked' : ''}>NEW</label>
        <button type="button" class="btn sm" data-act="upM" ${a} title="Вибрати файл на комп’ютері й завантажити в репозиторій">Завантажити файл</button>
        ${m.file ? `<a class="btn sm" href="${esc(m.file)}" target="_blank" rel="noopener">Відкрити ↗</a>` : ''}
        <span style="flex:1"></span>
        <button type="button" class="ib" data-act="mvM" ${a} data-d="-1" ${mi ? '' : 'disabled'} aria-label="Вище">↑</button>
        <button type="button" class="ib" data-act="mvM" ${a} data-d="1" ${mi < n - 1 ? '' : 'disabled'} aria-label="Нижче">↓</button>
        <button type="button" class="ib del" data-act="delM" ${a} aria-label="Видалити матеріал">✕</button></div></div>`;
  }

  function renderTests() {
    const groups = cat.classes.map((C, ci) => {
      const rows = [];
      C.sections.forEach((S, si) => S.topics.forEach((T, ti) => T.materials.forEach((m, mi) => {
        if (LOCKABLE.includes(m.type)) rows.push(`<div class="tr" style="border-left:4px solid ${TYPE_C[m.type]}"><div><b>${esc(m.title || T.title)}</b><small>${esc(cat.types[m.type] || m.type)} · ${esc(S.title)}${m.file ? '' : ' · файл ще не додано'}</small></div>
          <button type="button" class="sw ${m.open ? 'on' : ''}" data-act="tog" data-p="${ci}.${si}.${ti}.${mi}" role="switch" aria-checked="${m.open}" aria-label="${m.open ? 'Відкрито' : 'Закрито'}"></button></div>`);
      })));
      return rows.length ? `<div class="panel" style="--c:${C.color}"><div class="row" style="margin:0;justify-content:space-between"><h2>${esc(C.title)}</h2>
        <div class="row" style="margin:0"><button type="button" class="btn sm" data-act="allT" data-ci="${ci}" data-v="1">Відкрити всі</button><button type="button" class="btn sm" data-act="allT" data-ci="${ci}" data-v="0">Закрити всі</button></div></div><div class="tl">${rows.join('')}</div></div>` : '';
    }).join('');
    view.innerHTML = `<div class="panel"><h2>Контрольні роботи й тести</h2><p class="hint">Закриту контрольну чи тест учні бачать з позначкою «закрито» і не можуть відкрити. Зелений перемикач означає «відкрито». Нові контрольні й тести спочатку закриті.</p>
      ${connected ? `<div class="row"><label class="chk"><input type="checkbox" id="autoSave" ${autoSave ? 'checked' : ''}>Одразу зберігати на GitHub після перемикання</label></div>` : ''}</div>
      ${groups || '<div class="empty">Ще немає жодної контрольної чи тесту. Додайте до теми матеріал типу «Контрольна» або «Тест».</div>'}`;
  }

  function renderMisc() {
    view.innerHTML = `<div class="panel"><h2>Класи</h2><p class="hint">Назва, підпис на кнопці та колір класу. Колір використовується в обкладинках розділів.</p>
      ${cat.classes.map((C, ci) => `<div class="fields"><label class="f">Кнопка<input class="i" data-k="c.label" data-ci="${ci}" value="${esc(C.label)}"></label>
        <label class="f">Назва<input class="i" data-k="c.title" data-ci="${ci}" value="${esc(C.title)}"></label>
        <label class="f">Колір<input class="i" type="color" data-k="c.color" data-ci="${ci}" value="${esc(C.color)}" style="height:44px;padding:4px"></label>
        <label class="f">Папка<input class="i" value="${esc(C.id)}/" disabled></label></div>`).join('')}</div>
      <div class="panel"><h2>Платформи для роботи на уроці</h2><p class="hint">Показуються на головній сторінці.</p>
      ${cat.platforms.map((P, pi) => `<div class="topic"><div class="fields"><label class="f">Назва<input class="i" data-k="p.title" data-pi="${pi}" value="${esc(P.title)}"></label>
        <label class="f">Посилання<input class="i" data-k="p.url" data-pi="${pi}" value="${esc(P.url)}"></label>
        <label class="f">Обкладинка<select class="i" data-k="p.art" data-pi="${pi}">${ART.list.map(k => `<option value="${k}" ${P.art === k ? 'selected' : ''}>${esc(ART.names[k] || k)}</option>`).join('')}</select></label>
        <label class="f">Колір<input class="i" type="color" data-k="p.color" data-pi="${pi}" value="${esc(P.color)}" style="height:44px;padding:4px"></label></div>
        <label class="f" style="margin-top:10px">Опис<input class="i" data-k="p.desc" data-pi="${pi}" value="${esc(P.desc)}"></label>
        <div class="row"><button type="button" class="btn sm red" data-act="delP" data-pi="${pi}">Видалити платформу</button></div></div>`).join('')}
      <div class="row"><button type="button" class="btn" data-act="addP">+ Додати платформу</button></div></div>`;
  }

  /* ---------- редагування полів ---------- */
  function targetOf(el) {
    const [o, f] = el.dataset.k.split('.'), d = el.dataset;
    const T = curS && d.ti != null ? curS.topics[+d.ti] : null;
    const obj = { s: curS, t: T, m: T && d.mi != null ? T.materials[+d.mi] : null, p: cat.platforms[+d.pi], c: cat.classes[+d.ci] }[o];
    return [obj, f, o];
  }
  view.addEventListener('input', e => {
    const el = e.target.closest('[data-k]'); if (!el || el.type === 'checkbox' || el.tagName === 'SELECT') return;
    const [obj, f, o] = targetOf(el); if (!obj) return;
    if (o === 's' && f === 'id') return; // назва папки застосовується після виходу з поля
    obj[f] = el.value; setDirty();
    if (o === 's' && f === 'title') { const b = view.querySelector('.si.on b'); if (b) b.textContent = el.value || 'Без назви'; }
  });
  view.addEventListener('change', e => {
    const el = e.target;
    if (el.id === 'autoSave') { autoSave = el.checked; keep('hubAuto', autoSave); return; }
    if (!el.dataset || !el.dataset.k) return;
    const [obj, f, o] = targetOf(el); if (!obj) return;
    if (el.type === 'checkbox') obj[f] = el.checked;
    else if (o === 's' && f === 'id') obj.id = uniqueId(cls(), slug(el.value), obj);
    else if (o === 'm' && f === 'file') obj.file = isUrl(el.value.trim()) ? el.value.trim() : cleanPath(el.value);
    else if (o === 's' && f === 'img') obj.img = isUrl(el.value.trim()) ? el.value.trim() : cleanPath(el.value);
    else obj[f] = el.value;
    if (o === 's' && f === 'title' && !obj.id) obj.id = uniqueId(cls(), slug(obj.title), obj);
    if (o === 'm' && f === 'type' && LOCKABLE.includes(obj.type)) obj.open = false;
    setDirty();
    if (el.type === 'checkbox' || el.tagName === 'SELECT' || f === 'id' || f === 'img' || f === 'file' || (o === 's' && f === 'title')) render();
  });

  const swap = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };

  document.addEventListener('click', async e => {
    const tb = e.target.closest('.tabs [data-tab]');
    if (tb) { tab = tb.dataset.tab; render(); return; }
    const b = e.target.closest('[data-act]'); if (!b || busy) return;
    const a = b.dataset.act, d = b.dataset, C = cat && cls(), S = curS;
    const T = S && d.ti != null ? S.topics[+d.ti] : null;
    switch (a) {
      case 'connect': return connect(true);
      case 'gLogin': return gLogin();
      case 'gReset': return gReset();
      case 'gOut': return signOutAll();
      case 'gClaim': {
        try { await DB.ref('hub/owner').set(user.uid); } catch (x) { return gateScreen('rules', x.message); }
        return onAuth(user);
      }
      case 'ghEdit': connected = false; return render();
      case 'offline': return withBusy(async () => { await start(await siteCatalog(), false); toast('Режим без GitHub: зміни зберігайте кнопкою «Завантажити catalog.json».'); });
      case 'openJson': {
        const f = await pickFile('.json,application/json'); if (!f) return;
        try { await start(JSON.parse(await f.text()), false); } catch (err) { toast('Це не схоже на файл catalog.json', true); }
        return;
      }
      case 'selC': curC = d.c; curS = cls().sections[0] || null; return render();
      case 'selS': curS = C.sections[+d.i]; render(); return scrollTo({ top: 0, behavior: 'smooth' });
      case 'mvS': swap(C.sections, +d.i, +d.d); break;
      case 'addS': {
        const ns = { id: '', title: 'Новий розділ', desc: '', art: 'algo', img: '', topics: [] };
        C.sections.push(ns); curS = ns; ns.id = uniqueId(C, 'novyi-rozdil', ns); setDirty(); render();
        const inp = view.querySelector('[data-k="s.title"]'); if (inp) { inp.focus(); inp.select(); }
        return;
      }
      case 'delS':
        if (!(await ask('Видалити розділ?', `Розділ «${esc(S.title)}» і всі його теми зникнуть із сайту. Файли в репозиторії залишаться.`))) return;
        C.sections.splice(C.sections.indexOf(S), 1); curS = C.sections[0] || null; break;
      case 'art': S.art = d.v; S.img = ''; break;
      case 'upImg': return uploadImg();
      case 'clrImg': S.img = ''; break;
      case 'addT': S.topics.push({ title: '', desc: '', materials: [{ type: 'theory', title: '', file: '', open: true, new: false }] }); setDirty(); render();
        { const ins = view.querySelectorAll('[data-k="t.title"]'); const last = ins[ins.length - 1]; if (last) { last.focus(); last.scrollIntoView({ block: 'center' }); } }
        return;
      case 'mvT': swap(S.topics, +d.ti, +d.d); break;
      case 'delT':
        if (T.materials.some(m => m.file) && !(await ask('Видалити тему?', `Тема «${esc(T.title || 'без назви')}» і посилання на її матеріали зникнуть із сайту.`))) return;
        S.topics.splice(+d.ti, 1); break;
      case 'addM': T.materials.push({ type: 'trainer', title: '', file: '', open: true, new: true }); break;
      case 'mvM': swap(T.materials, +d.mi, +d.d); break;
      case 'delM': {
        const m = T.materials[+d.mi];
        if (m.file && !isUrl(m.file) && connected) {
          const v = await modal(`<h3>Видалити матеріал?</h3><p>Кнопка зникне з сайту. Файл <code>${esc(m.file)}</code> можна також видалити з репозиторію.</p>`,
            [{ t: 'Скасувати', v: 0 }, { t: 'Лише з сайту', v: 1 }, { t: 'І файл з GitHub', v: 2, cls: 'red' }]);
          if (!v) return;
          if (v === 2 && !(await withBusy(async () => { await delFile(m.file, 'Видалено: ' + m.file); return true; }))) return;
        } else if (m.file && !(await ask('Видалити матеріал?', 'Кнопка цього матеріалу зникне з сайту.'))) return;
        T.materials.splice(+d.mi, 1); break;
      }
      case 'upM': return uploadMat(+d.ti, +d.mi);
      case 'tog': case 'allT': {
        if (a === 'tog') { const [ci, si, ti, mi] = d.p.split('.').map(Number); const m = cat.classes[ci].sections[si].topics[ti].materials[mi]; m.open = !m.open; }
        else cat.classes[+d.ci].sections.forEach(x => x.topics.forEach(t => t.materials.forEach(m => { if (LOCKABLE.includes(m.type)) m.open = d.v === '1'; })));
        setDirty(); render();
        if (connected && autoSave) saveGH(true);
        return;
      }
      case 'addP': cat.platforms.push({ title: 'Нова платформа', desc: '', url: 'https://', art: 'web', color: '#0EA5E9' }); break;
      case 'delP': if (!(await ask('Видалити платформу?', 'Кнопка зникне з головної сторінки.'))) return; cat.platforms.splice(+d.pi, 1); break;
      default: return;
    }
    setDirty(); render();
  });
  view.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.si')) { e.preventDefault(); e.target.click(); } });

  saveBtn.addEventListener('click', () => saveGH(false));
  dlBtn.addEventListener('click', download);
  addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (connected) saveGH(false); else if (cat) download(); } });

  $('#outBtn').addEventListener('click', signOutAll);
  gate.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'gPw') gLogin(); });
  fbInit();
})();
