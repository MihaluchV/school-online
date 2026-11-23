/* Мальовані обкладинки розділів (SVG). Спільний файл для сайту та кабінету вчителя.
   ART.draw(ключ, колір) → рядок SVG.  ART.list → список доступних обкладинок. */
(function () {
  const I = '#0F172A', W = '#fff';
  const C4 = ['#38BDF8', '#5EEAD4', '#FBBF24', '#F472B6'];
  const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
  const mono = 'font-family="JetBrains Mono,monospace" font-weight="700"';

  const M = {
    os: `<rect x="70" y="36" width="260" height="160" rx="12" fill="${I}"/><rect x="80" y="46" width="240" height="128" rx="6" fill="#38BDF8" opacity=".35"/>
      ${rep(3, i => `<rect x="92" y="${56 + i * 36}" width="22" height="22" rx="5" fill="${C4[i + 1]}"/>`)}
      <rect x="150" y="66" width="150" height="90" rx="8" fill="${W}"/><rect x="150" y="66" width="150" height="18" rx="8" fill="#E2E8F0"/>
      <rect x="162" y="96" width="90" height="8" rx="4" fill="#CBD5E1"/><rect x="162" y="112" width="120" height="8" rx="4" fill="#CBD5E1"/>
      <rect x="80" y="174" width="240" height="14" fill="${I}"/><rect x="84" y="177" width="30" height="8" rx="3" fill="#0EA5E9"/><path d="M180 196h40l8 18h-56z" fill="${W}" opacity=".8"/>`,
    net: `<circle cx="200" cy="120" r="70" fill="${W}" opacity=".95"/><ellipse cx="200" cy="120" rx="30" ry="70" fill="none" stroke="#0EA5E9" stroke-width="3"/>
      <path d="M130 120h140M140 85h120M140 155h120" stroke="#0EA5E9" stroke-width="3"/>
      ${[[70, 60], [330, 70], [80, 190], [320, 190]].map(([x, y]) => `<path d="M${x} ${y}L200 120" stroke="${W}" stroke-width="2" opacity=".6"/><circle cx="${x}" cy="${y}" r="14" fill="${I}"/><circle cx="${x}" cy="${y}" r="6" fill="#F59E0B"/>`).join('')}`,
    slides: `<rect x="80" y="34" width="240" height="140" rx="10" fill="${W}"/><rect x="80" y="34" width="240" height="140" rx="10" fill="none" stroke="${I}" stroke-width="6"/>
      <rect x="100" y="54" width="110" height="12" rx="6" fill="${I}"/><rect x="100" y="76" width="80" height="7" rx="3" fill="#CBD5E1"/>
      ${[40, 64, 30, 80].map((h, i) => `<rect x="${220 + i * 22}" y="${154 - h}" width="15" height="${h}" rx="3" fill="${C4[i]}"/>`).join('')}
      <circle cx="140" cy="128" r="26" fill="#F59E0B"/><path d="M140 128V102a26 26 0 0 1 24 16z" fill="#0EA5E9"/>
      <path d="M200 174v34M170 214l30-14 30 14" stroke="${W}" stroke-width="6" stroke-linecap="round" fill="none"/>`,
    text: `<rect x="110" y="40" width="150" height="180" rx="10" fill="${W}" opacity=".6" transform="rotate(-8 185 130)"/>
      <rect x="140" y="34" width="150" height="180" rx="10" fill="${W}"/><rect x="158" y="56" width="90" height="12" rx="6" fill="${I}"/>
      ${rep(6, i => `<rect x="158" y="${82 + i * 18}" width="${[114, 100, 114, 80, 110, 60][i]}" height="7" rx="3" fill="#CBD5E1"/>`)}
      <path d="M300 180l40-70 14 8-40 70-18 8z" fill="#F59E0B"/>`,
    algo: `<rect x="150" y="26" width="100" height="32" rx="16" fill="${W}"/><path d="M200 58v20" stroke="${W}" stroke-width="3"/>
      <path d="M200 78l44 32-44 32-44-32z" fill="#FBBF24"/><text x="200" y="116" text-anchor="middle" ${mono} font-size="18" fill="${I}">?</text>
      <path d="M156 110H96v40M244 110h60v40" stroke="${W}" stroke-width="3" fill="none"/>
      <rect x="56" y="150" width="80" height="40" rx="8" fill="${I}"/><rect x="264" y="150" width="80" height="40" rx="8" fill="${W}"/>
      <rect x="70" y="166" width="50" height="8" rx="4" fill="#5EEAD4"/><rect x="278" y="166" width="50" height="8" rx="4" fill="#CBD5E1"/>`,
    devices: `<rect x="70" y="50" width="170" height="130" rx="14" fill="${I}"/><rect x="80" y="60" width="150" height="110" rx="6" fill="#38BDF8" opacity=".45"/>
      <rect x="250" y="70" width="70" height="130" rx="14" fill="${W}"/><rect x="258" y="84" width="54" height="96" rx="4" fill="#5EEAD4"/><circle cx="285" cy="190" r="4" fill="${I}"/>
      <rect x="120" y="186" width="70" height="40" rx="12" fill="#FBBF24"/><rect x="130" y="196" width="50" height="20" rx="5" fill="${I}"/>
      <rect x="96" y="80" width="60" height="8" rx="4" fill="${W}"/><rect x="96" y="96" width="100" height="8" rx="4" fill="${W}" opacity=".7"/>`,
    graphics: `<circle cx="150" cy="105" r="58" fill="#F43F5E" opacity=".85"/><circle cx="205" cy="105" r="58" fill="#22D3EE" opacity=".75"/><circle cx="178" cy="150" r="58" fill="#FDE047" opacity=".75"/>
      <path d="M250 200 C 280 120, 330 160, 350 70" stroke="${W}" stroke-width="4" fill="none"/>
      <rect x="244" y="194" width="12" height="12" fill="${I}" stroke="${W}" stroke-width="2"/><rect x="344" y="64" width="12" height="12" fill="${I}" stroke="${W}" stroke-width="2"/>
      <path d="M350 70L310 60" stroke="${W}" stroke-width="2"/><circle cx="310" cy="60" r="5" fill="${W}"/>`,
    data: `<rect x="70" y="40" width="200" height="160" rx="10" fill="${W}"/>${rep(5, i => `<path d="M70 ${72 + i * 32}h200" stroke="#E2E8F0" stroke-width="2"/>`)}
      <path d="M140 40v160M205 40v160" stroke="#E2E8F0" stroke-width="2"/><rect x="70" y="40" width="200" height="32" rx="10" fill="#16A34A" opacity=".85"/>
      <text x="84" y="62" ${mono} font-size="14" fill="${W}">fx</text>
      <g transform="translate(230 90)"><rect width="120" height="110" rx="12" fill="${I}"/>${[46, 70, 34, 84].map((h, i) => `<rect x="${16 + i * 24}" y="${96 - h}" width="16" height="${h}" rx="3" fill="${C4[i]}"/>`).join('')}</g>`,
    cloud: `<path d="M110 160a40 40 0 0 1 8-79 56 56 0 0 1 106-14 46 46 0 0 1 66 46 32 32 0 0 1-6 47z" fill="${W}"/>
      <path d="M170 140v-40m0 0l-14 14m14-14l14 14M232 100v40m0 0l-14-14m14 14l14-14" stroke="#0EA5E9" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      ${rep(3, i => `<rect x="${110 + i * 70}" y="182" width="44" height="36" rx="6" fill="${I}"/><rect x="${118 + i * 70}" y="192" width="28" height="6" rx="3" fill="${C4[i]}"/>`)}`,
    python: `<rect x="70" y="46" width="220" height="150" rx="14" fill="${I}" opacity=".93"/>
      <circle cx="88" cy="62" r="4" fill="#F87171"/><circle cx="102" cy="62" r="4" fill="#FBBF24"/><circle cx="116" cy="62" r="4" fill="#34D399"/>
      <rect x="88" y="84" width="70" height="8" rx="4" fill="#38BDF8"/><rect x="164" y="84" width="40" height="8" rx="4" fill="#FBBF24"/>
      <rect x="102" y="102" width="90" height="8" rx="4" fill="#5EEAD4"/><rect x="102" y="120" width="60" height="8" rx="4" fill="#E2E8F0" opacity=".6"/><rect x="88" y="138" width="110" height="8" rx="4" fill="#38BDF8"/>
      <g transform="translate(210 150)"><rect width="150" height="54" rx="12" fill="${W}"/>${rep(4, i => `<rect x="${12 + i * 34}" y="12" width="28" height="30" rx="6" fill="${['#0EA5E9', '#14B8A6', '#F59E0B', '#F472B6'][i]}"/><text x="${26 + i * 34}" y="33" ${mono} font-size="13" fill="#fff" text-anchor="middle">${i}</text>`)}</g>`,
    media: `<rect x="60" y="60" width="210" height="130" rx="10" fill="${I}"/>${rep(8, i => `<rect x="${70 + i * 25}" y="68" width="14" height="10" rx="2" fill="${W}" opacity=".8"/><rect x="${70 + i * 25}" y="172" width="14" height="10" rx="2" fill="${W}" opacity=".8"/>`)}
      <rect x="74" y="88" width="182" height="76" rx="6" fill="#38BDF8" opacity=".5"/><path d="M152 104l34 22-34 22z" fill="${W}"/>
      <path d="M300 80v86" stroke="${W}" stroke-width="8"/><path d="M300 80l46-12v24l-46 12z" fill="${W}"/><circle cx="286" cy="168" r="20" fill="#FBBF24"/>`,
    anim: `<rect x="50" y="160" width="300" height="34" rx="8" fill="${I}"/>${rep(10, i => `<rect x="${60 + i * 29}" y="168" width="20" height="18" rx="3" fill="${i === 6 ? '#F59E0B' : '#334155'}"/>`)}
      <path d="M80 140 Q 140 20 200 120 T 320 60" stroke="${W}" stroke-width="3" stroke-dasharray="6 6" fill="none"/>
      ${[[80, 128, .35], [140, 70, .55], [200, 108, .75], [260, 88, .9], [320, 60, 1]].map(([x, y, o]) => `<circle cx="${x}" cy="${y}" r="18" fill="#F472B6" opacity="${o}"/>`).join('')}`,
    infosys: `${[['M', 60, '#38BDF8'], ['P', 160, '#FBBF24'], ['R', 260, '#5EEAD4']].map(([t, x, c]) => `<rect x="${x}" y="80" width="80" height="80" rx="16" fill="${W}"/><rect x="${x + 14}" y="94" width="52" height="52" rx="10" fill="${c}"/>`).join('')}
      <path d="M144 120h12m-6-6l6 6-6 6M244 120h12m-6-6l6 6-6 6" stroke="${W}" stroke-width="4" fill="none"/>
      <circle cx="200" cy="120" r="14" fill="none" stroke="${I}" stroke-width="6" stroke-dasharray="6 4"/>
      <path d="M100 160v30h200v-30" stroke="${W}" stroke-width="3" fill="none" stroke-dasharray="6 5"/><circle cx="100" cy="190" r="5" fill="${W}"/>`,
    hw: `<rect x="60" y="40" width="280" height="170" rx="12" fill="#14532D" opacity=".85"/>${rep(6, i => `<path d="M60 ${60 + i * 26}h40" stroke="#FBBF24" stroke-width="2" opacity=".7"/>`)}
      <rect x="130" y="80" width="80" height="80" rx="6" fill="${I}"/>${rep(6, i => `<path d="M${140 + i * 12} 72v8M${140 + i * 12} 160v8M122 ${90 + i * 12}h8M210 ${90 + i * 12}h8" stroke="${W}" stroke-width="2"/>`)}
      <text x="170" y="126" text-anchor="middle" ${mono} font-size="14" fill="#5EEAD4">CPU</text>
      ${rep(3, i => `<rect x="${246 + i * 22}" y="60" width="14" height="120" rx="3" fill="${W}"/><rect x="${249 + i * 22}" y="70" width="8" height="12" fill="#0EA5E9"/><rect x="${249 + i * 22}" y="100" width="8" height="12" fill="#0EA5E9"/>`)}`,
    web: `<rect x="60" y="40" width="280" height="170" rx="14" fill="${W}"/><rect x="60" y="40" width="280" height="28" rx="14" fill="#E2E8F0"/>
      <circle cx="78" cy="54" r="4" fill="#F87171"/><circle cx="92" cy="54" r="4" fill="#FBBF24"/><rect x="110" y="48" width="150" height="12" rx="6" fill="${W}"/>
      <rect x="76" y="80" width="248" height="34" rx="8" fill="${I}"/><rect x="88" y="92" width="80" height="10" rx="5" fill="#38BDF8"/>
      <rect x="76" y="124" width="70" height="72" rx="8" fill="#CBD5E1"/><rect x="156" y="124" width="168" height="30" rx="8" fill="#5EEAD4"/>
      <rect x="156" y="162" width="120" height="10" rx="5" fill="#CBD5E1"/><rect x="156" y="180" width="150" height="10" rx="5" fill="#CBD5E1"/>
      <text x="292" y="103" ${mono} font-size="16" fill="#F59E0B">&lt;/&gt;</text>`,
    smart: `<path d="M110 120l90-70 90 70v90H110z" fill="${W}"/><path d="M96 126l104-82 104 82" stroke="${I}" stroke-width="10" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="200" cy="150" r="24" fill="#FDE047"/><rect x="190" y="172" width="20" height="14" rx="3" fill="${I}"/>
      ${[22, 40, 58].map(r => `<path d="M${330 - r * .7} ${120 - r * .7}A${r} ${r} 0 0 1 ${330 + r * .7} ${120 - r * .7}" stroke="${W}" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('')}
      <circle cx="330" cy="120" r="6" fill="${W}"/>`,
    ai: `${[[90, [70, 120, 170]], [200, [50, 95, 145, 190]], [310, [90, 150]]].map(([x, ys], li, arr) => ys.map(y => (li < 2 ? arr[li + 1][1].map(y2 => `<path d="M${x} ${y}L${arr[li + 1][0]} ${y2}" stroke="${W}" stroke-width="1.6" opacity=".45"/>`).join('') : '')).join('')).join('')}
      ${[[90, [70, 120, 170], '#38BDF8'], [200, [50, 95, 145, 190], '#FBBF24'], [310, [90, 150], '#5EEAD4']].map(([x, ys, c]) => ys.map(y => `<circle cx="${x}" cy="${y}" r="15" fill="${I}"/><circle cx="${x}" cy="${y}" r="8" fill="${c}"/>`).join('')).join('')}
      <text x="310" y="210" text-anchor="middle" ${mono} font-size="20" fill="${W}">AI</text>`,
    security: `<path d="M200 30l80 30v60c0 50-36 82-80 98-44-16-80-48-80-98V60z" fill="${W}"/><path d="M200 50l60 22v48c0 38-27 62-60 75z" fill="#E2E8F0"/>
      <rect x="172" y="112" width="56" height="46" rx="8" fill="${I}"/><path d="M182 112v-12a18 18 0 0 1 36 0v12" stroke="${I}" stroke-width="7" fill="none"/><circle cx="200" cy="133" r="6" fill="#F59E0B"/>
      <text x="70" y="70" ${mono} font-size="14" fill="${W}" opacity=".7">0101</text><text x="290" y="200" ${mono} font-size="14" fill="${W}" opacity=".7">1100</text>`,
    '3d': `<path d="M170 60l70 40v80l-70 40-70-40v-80z" fill="${W}"/><path d="M170 140l70-40v80l-70 40z" fill="#CBD5E1"/><path d="M170 140l-70-40 70-40 70 40z" fill="#F8FAFC"/>
      <path d="M170 140v80" stroke="${I}" stroke-width="2"/><circle cx="300" cy="150" r="42" fill="#FBBF24"/><ellipse cx="300" cy="150" rx="42" ry="14" fill="none" stroke="${I}" stroke-width="2" opacity=".5"/>
      <circle cx="286" cy="134" r="10" fill="${W}" opacity=".6"/><path d="M60 210l60-30M60 210v-50M60 210h60" stroke="${W}" stroke-width="3"/>`,
    db: `${rep(3, i => `<g transform="translate(70 ${60 + i * 42})"><rect width="110" height="34" fill="${W}" opacity="${.95 - i * .12}"/><ellipse cx="55" cy="34" rx="55" ry="14" fill="${W}" opacity="${.95 - i * .12}"/><ellipse cx="55" cy="0" rx="55" ry="14" fill="#E2E8F0"/></g>`)}
      <g transform="translate(220 50)"><rect width="120" height="76" rx="10" fill="${W}"/><rect width="120" height="22" rx="10" fill="${I}"/><rect x="10" y="32" width="70" height="7" rx="3" fill="#0EA5E9"/><rect x="10" y="48" width="90" height="7" rx="3" fill="#CBD5E1"/><rect x="10" y="62" width="60" height="7" rx="3" fill="#CBD5E1"/></g>
      <g transform="translate(250 150)"><rect width="110" height="60" rx="10" fill="${W}"/><rect width="110" height="20" rx="10" fill="${I}"/><rect x="10" y="30" width="60" height="7" rx="3" fill="#F59E0B"/><rect x="10" y="44" width="80" height="7" rx="3" fill="#CBD5E1"/></g>
      <path d="M290 126v24" stroke="${W}" stroke-width="3" stroke-dasharray="5 4"/><circle cx="290" cy="126" r="5" fill="#F59E0B"/>`,
    analytics: `<rect x="60" y="40" width="230" height="160" rx="12" fill="${W}"/>${rep(4, i => `<path d="M80 ${70 + i * 34}h190" stroke="#E2E8F0" stroke-width="2"/>`)}
      <path d="M84 170L124 140 164 150 204 100 244 112 270 70" stroke="#0EA5E9" stroke-width="4" fill="none" stroke-linejoin="round"/>
      ${[[84, 170], [124, 140], [164, 150], [204, 100], [244, 112], [270, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${I}"/>`).join('')}
      <circle cx="310" cy="160" r="34" fill="none" stroke="${W}" stroke-width="9"/><path d="M334 184l26 26" stroke="${W}" stroke-width="11" stroke-linecap="round"/>`
  };

  const NAMES = {
    os: 'Комп’ютер і ОС', net: 'Мережі, Інтернет', slides: 'Презентації', text: 'Текстові документи', algo: 'Алгоритми, Scratch',
    devices: 'Цифрові пристрої', graphics: 'Графіка', data: 'Електронні таблиці', cloud: 'Хмарні сервіси', python: 'Python',
    media: 'Мультимедіа', anim: 'Анімація', infosys: 'Інформаційні системи', hw: 'Апаратне забезпечення', web: 'Веб',
    smart: 'Смарт-технології', ai: 'Штучний інтелект', security: 'Безпека, ПЗ', '3d': '3D', db: 'Бази даних', analytics: 'Аналіз даних'
  };

  const shade = (h, p) => {
    const n = parseInt(h.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v + v * p / 100)));
    return `rgb(${f(n >> 16)},${f(n >> 8 & 255)},${f(n & 255)})`;
  };
  let uid = 0;
  function draw(key, color) {
    const u = 'art' + (uid++), c = color || '#0EA5E9';
    return `<svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -45)}"/></linearGradient><pattern id="${u}p" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="#fff" opacity=".2"/></pattern></defs><rect width="400" height="240" fill="url(#${u})"/><rect width="400" height="240" fill="url(#${u}p)"/><circle cx="350" cy="20" r="110" fill="#fff" opacity=".08"/><ellipse cx="200" cy="232" rx="170" ry="16" fill="#000" opacity=".15"/>${M[key] || M.algo}</svg>`;
  }
  window.ART = { draw, list: Object.keys(M), names: NAMES };
})();
