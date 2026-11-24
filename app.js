/* Інформатика 5–11 · логіка сайту.
   Увесь зміст береться з catalog.json (його редагує кабінет учителя admin.html). */
(function () {
  'use strict';
  const TYPE_STYLE = {
    theory: { c: '#0284C7', i: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 21V5M8 7h7M8 11h7"/>' },
    slides: { c: '#D97706', i: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/>' },
    video: { c: '#DB2777', i: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z" fill="currentColor"/>' },
    trainer: { c: '#0D9488', i: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>' },
    practical: { c: '#4F46E5', i: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M9 9l-2 2 2 2M15 9l2 2-2 2M8 21h8"/>' },
    quiz: { c: '#65A30D', i: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.6-2.5 2-2.5 3.6M12 17h.01"/>' },
    test: { c: '#E11D48', i: '<path d="M9 4h6v3H9zM7 5H5v16h14V5h-2M8 12l2 2 4-4M8 17h8"/>' }
  };
  // Типи матеріалів за замовчуванням (catalog.json може перейменувати їх, а нові типи додаються автоматично)
  const DEF_TYPES = { theory: 'Теорія', slides: 'Презентація', video: 'Відеоурок', trainer: 'Тренажер', practical: 'Практична', quiz: 'Тест', test: 'Контрольна' };
  // Підказки, що з’являються при наведенні на кнопки та позначки типів
  const TIPS = {
    theory: 'Теорія — пояснення теми з прикладами',
    slides: 'Презентація — слайди до уроку',
    video: 'Відеоурок — відеопояснення теми',
    trainer: 'Тренажер — інтерактивні вправи для відпрацювання вмінь',
    practical: 'Практична — завдання для самостійного виконання на комп’ютері',
    quiz: 'Тест — запитання з варіантами відповідей для перевірки знань',
    test: 'Контрольна — перевірка знань з оцінюванням'
  };
  const tip = k => esc(TIPS[k] || TYPES[k] || k);
  const LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>';
  const app = document.getElementById('app'), nav = document.getElementById('nav'), q = document.getElementById('q');
  let CAT = null, TYPES = {}, ALL = [], filter = 'all';

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const ico = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${(TYPE_STYLE[k] || TYPE_STYLE.theory).i}</svg>`;
  const tc = k => (TYPE_STYLE[k] || TYPE_STYLE.theory).c;
  const tn = k => TYPES[k] || k;
  const cover = (S, C) => S.img ? `<img src="${esc(S.img)}" alt="" loading="lazy">` : ART.draw(S.art, C.color);
  const store = {
    get() { try { return localStorage.getItem('hubClass'); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem('hubClass', v); } catch (e) { } }
  };
  const LOCKABLE = ['test', 'quiz']; // типи, які вчитель відкриває й закриває
  const locked = m => LOCKABLE.includes(m.type) && !m.open;
  const lockTip = t => t === 'quiz' ? 'Тест закритий — його відкриє вчитель' : 'Контрольна закрита — її відкриє вчитель';
  const visible = m => m.file && !locked(m);

  function counts(S) {
    const o = {};
    S.topics.forEach(t => t.materials.forEach(m => { if (m.file) o[m.type] = (o[m.type] || 0) + 1; }));
    return o;
  }
  const chips = o => Object.keys(TYPES).filter(k => o[k]).map(k => `<span class="chip" style="--t:${tc(k)}" data-tip="${tip(k)}">${ico(k)}${esc(tn(k))} · ${o[k]}</span>`).join('');

  function matBtn(m) {
    const label = esc(m.title || tn(m.type));
    if (locked(m))
      return `<span class="rb lock" style="--t:${tc(m.type)}" tabindex="0" data-tip="${lockTip(m.type)}">${LOCK}${label} · закрито</span>`;
    return `<a class="rb" style="--t:${tc(m.type)}" href="${esc(m.file)}" target="_blank" rel="noopener" data-tip="${tip(m.type)}">${ico(m.type)}${label}${m.new ? ' <span class="new">NEW</span>' : ''}</a>`;
  }
  function row(x) {
    return `<a class="ri" href="${esc(x.m.file)}" target="_blank" rel="noopener" style="--t:${tc(x.m.type)};--c:${x.C.color}"><span class="ic" data-tip="${tip(x.m.type)}">${ico(x.m.type)}</span><span><b>${esc(x.m.title || x.T.title)}</b><small>${esc(tn(x.m.type))} · ${esc(x.S.title)}</small></span><span class="gr">${esc(x.C.label)} кл.</span></a>`;
  }

  /* ---------- сторінки ---------- */
  function home() {
    const last = CAT.classes.find(c => c.id === store.get());
    const fresh = ALL.filter(x => x.m.new && visible(x.m));
    return `<section class="hero band"><div class="wrap"><h1>Інформатика для 5–11 класів</h1>
      <p class="lead">Уроки, презентації, тренажери й контрольні роботи в одному місці. Обери свій клас — і переходь до потрібного розділу.</p>
      ${last ? `<a class="cont" href="#c-${last.id}">Продовжити: ${esc(last.title)} →</a>` : ''}
      <div class="grades">${CAT.classes.map(C => {
        const n = C.sections.reduce((a, S) => a + S.topics.length, 0), S0 = C.sections[0];
        return `<a class="g" style="--c:${C.color}" href="#c-${C.id}"><div class="art">${S0 ? cover(S0, C) : ART.draw('algo', C.color)}</div><b>${esc(C.label)}</b><span>${esc(C.title)}<small>${C.sections.length} розд. · ${n} тем</small></span></a>`;
      }).join('')}</div></div></section>
      ${CAT.platforms && CAT.platforms.length ? `<section class="band"><div class="wrap"><h2>Робота на уроці</h2><p class="sub">Код завдання або кімнати повідомить учитель.</p>
      <div class="plats">${CAT.platforms.map(P => `<a class="pl" href="${esc(P.url)}" target="_blank" rel="noopener"><div class="art">${ART.draw(P.art, P.color)}</div><div class="in"><h3>${esc(P.title)}</h3><p>${esc(P.desc)}</p><span class="go">Увійти →</span></div></a>`).join('')}</div></div></section>` : ''}
      ${fresh.length ? `<section class="band" style="padding-top:0"><div class="wrap"><h2>Нові матеріали</h2><div class="rl">${fresh.map(row).join('')}</div></div></section>` : ''}`;
  }

  function classPage(C) {
    store.set(C.id);
    const all = {};
    C.sections.forEach(S => { const o = counts(S); for (const k in o) all[k] = (all[k] || 0) + o[k]; });
    const secs = C.sections.filter(S => filter === 'all' || counts(S)[filter]);
    const used = Object.keys(TYPES).filter(k => all[k]);
    return `<section class="chead band" style="--c:${C.color}"><div class="wrap"><div class="crumb"><a href="#">Головна</a> / ${esc(C.title)}</div><h1>${esc(C.title)}</h1>
      <div class="stats"><div><b>${C.sections.length}</b>розділів</div><div><b>${C.sections.reduce((a, S) => a + S.topics.length, 0)}</b>тем</div><div><b>${all.trainer || 0}</b>тренажерів</div><div><b>${all.practical || 0}</b>практичних</div><div><b>${all.test || 0}</b>контрольних</div></div></div></section>
      <section class="band"><div class="wrap">
      ${used.length ? `<div class="filt" role="group" aria-label="Тип матеріалу">${[['all', 'Усе'], ...used.map(k => [k, tn(k)])].map(([k, n]) => `<button type="button" data-filt="${k}" class="${filter === k ? 'on' : ''}"${k === 'all' ? '' : ` data-tip="${tip(k)}"`}>${esc(n)}</button>`).join('')}</div>` : ''}
      <div class="grid">${secs.map(S => `<a class="card" href="#s-${C.id}--${S.id}"><div class="art">${cover(S, C)}</div><div class="in"><h3>${esc(S.title)}</h3><p>${esc(S.desc)}</p><div class="chips"><span class="chip" style="--t:#64748B">${S.topics.length} тем</span>${chips(counts(S))}</div></div></a>`).join('') || '<div class="empty">Матеріалів такого типу ще немає.</div>'}</div></div></section>`;
  }

  function sectionPage(C, S) {
    store.set(C.id);
    let n = 0;
    const topics = S.topics.map(T => {
      const mats = T.materials.filter(m => m.file);
      n++;
      return `<article class="ls"><div class="num">${String(n).padStart(2, '0')}</div><div><h3>${esc(T.title)}</h3>${T.desc ? `<p>${esc(T.desc)}</p>` : ''}
        <div class="res">${mats.map(matBtn).join('') || '<span class="sub" style="font-size:14px">Матеріали готуються</span>'}</div></div></article>`;
    }).join('');
    return `<section class="band stop" style="--c:${C.color}"><div class="wrap shead"><div>
      <div class="crumb"><a href="#">Головна</a> / <a href="#c-${C.id}">${esc(C.title)}</a></div>
      <h1>${esc(S.title)}</h1><p class="desc">${esc(S.desc)}</p><div class="chips">${chips(counts(S))}</div></div>
      <div class="art">${cover(S, C)}</div></div></section>
      <section class="band" style="padding-top:0;--c:${C.color}"><div class="wrap"><h2>Теми розділу</h2>
      <div class="lessons">${topics || '<div class="empty">Матеріали цього розділу з’являться згодом.</div>'}</div></div></section>`;
  }

  function searchPage(s) {
    const w = s.toLowerCase();
    const r = ALL.filter(x => x.m.file && (x.m.title + ' ' + x.T.title + ' ' + x.S.title + ' ' + tn(x.m.type) + ' ' + x.C.title).toLowerCase().includes(w));
    return `<section class="band"><div class="wrap"><h2>Пошук: «${esc(s)}»</h2><p class="sub">Знайдено: ${r.length}</p>
      <div class="rl">${r.map(x => visible(x.m) ? row(x) : `<div class="ri" style="--t:${tc(x.m.type)};--c:${x.C.color}"><span class="ic" data-tip="${lockTip(x.m.type)}">${LOCK}</span><span><b>${esc(x.m.title || x.T.title)}</b><small>${esc(tn(x.m.type))} · закрито · ${esc(x.S.title)}</small></span><span class="gr">${esc(x.C.label)} кл.</span></div>`).join('') || '<div class="empty">Нічого не знайдено. Спробуйте інше слово.</div>'}</div></div></section>`;
  }

  function render() {
    const h = decodeURIComponent(location.hash.slice(1)), s = q.value.trim();
    let C = null, S = null, html;
    const mc = h.match(/^c-(.+)$/), ms = h.match(/^s-(.+?)--(.+)$/);
    if (s) html = searchPage(s);
    else if (ms && (C = CAT.classes.find(c => c.id === ms[1])) && (S = C.sections.find(x => x.id === ms[2]))) html = sectionPage(C, S);
    else if (mc && (C = CAT.classes.find(c => c.id === mc[1]))) html = classPage(C);
    else { C = null; html = home(); }
    app.innerHTML = html;
    nav.innerHTML = CAT.classes.map(c => `<a href="#c-${c.id}" style="--c:${c.color}" class="${C && C.id === c.id && !s ? 'on' : ''}" aria-label="${esc(c.title)}">${esc(c.label)}</a>`).join('');
    document.title = (S ? S.title + ' · ' : C ? C.title + ' · ' : '') + 'Інформатика 5–11';
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-filt]');
    if (b) { filter = b.dataset.filt; render(); }
  });
  q.addEventListener('input', render);

  /* ---------- спливні підказки ---------- */
  const tipEl = document.createElement('div');
  tipEl.className = 'tip'; tipEl.setAttribute('role', 'tooltip'); document.body.appendChild(tipEl);
  let tipFor = null;
  function showTip(t) {
    tipFor = t; tipEl.textContent = t.dataset.tip; tipEl.classList.add('show');
    const r = t.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    let x = r.left + r.width / 2 - w / 2, y = r.top - h - 8;
    x = Math.max(8, Math.min(x, innerWidth - w - 8));
    if (y < 64) y = r.bottom + 8;
    tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
  }
  const hideTip = () => { tipFor = null; tipEl.classList.remove('show'); };
  document.addEventListener('mousemove', e => { const t = e.target.closest && e.target.closest('[data-tip]'); if (t && t !== tipFor) showTip(t); else if (!t && tipFor) hideTip(); });
  document.addEventListener('mouseleave', hideTip);
  document.addEventListener('focusin', e => { const t = e.target.closest('[data-tip]'); t ? showTip(t) : hideTip(); });
  addEventListener('scroll', hideTip, { passive: true });
  addEventListener('hashchange', hideTip);
  addEventListener('hashchange', () => { q.value = ''; filter = 'all'; render(); scrollTo(0, 0); });

  fetch('catalog.json?t=' + Date.now(), { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(data => {
      CAT = data; TYPES = Object.assign({}, DEF_TYPES, data.types || {});
      CAT.classes.forEach(C => C.sections.forEach(S => S.topics.forEach(T => T.materials.forEach(m => ALL.push({ C, S, T, m })))));
      render();
    })
    .catch(() => {
      app.innerHTML = '<div class="loading">Не вдалося завантажити зміст сайту (catalog.json).<br>Якщо ви відкрили файл просто з комп’ютера — відкрийте сайт за адресою GitHub Pages.</div>';
    });
})();
