// 相性ページの画面。計算は aisho-core.js（この端末の中だけ）。fetch・保存・URL への書き出しはしない。
import data from './aisho-data.js';
import { isMinor, readPair } from './aisho-core.js';

const $ = (id) => document.getElementById(id);
const form = $('aisho');
const err = $('err');
const out = $('result');
const yoiro = new URL('../img/yoiro.png', import.meta.url).href;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function read(prefix, who) {
  const y = Number($(`${prefix}-y`).value);
  const m = Number($(`${prefix}-m`).value);
  const d = Number($(`${prefix}-d`).value);
  if (!y || !m || !d) return { error: `${who}の生年月日を選んでください。` };
  const t = new Date(y, m - 1, d);
  if (t.getMonth() !== m - 1) return { error: `${who}の生年月日：${y}年${m}月${d}日という日付はありません。` };
  if (t > new Date()) return { error: `${who}の生年月日が今日より後になっています。` };
  return { y, m, d };
}

function render(me, pt) {
  if (isMinor(me) || isMinor(pt)) {
    return `<p class="minor">ふたりのうちどちらかが 18 歳未満のため、結果は表示していません。「おつげ」は 18 歳以上の方を対象にしています。</p>`;
  }
  const r = readPair(data, me, pt);
  return `
<div class="pair" aria-label="入力したふたり"><div class="p"><small>あなた</small><b>${me.m}/${me.d}</b></div><span class="x" aria-hidden="true">×</span><div class="p"><small>相手</small><b>${pt.m}/${pt.d}</b></div></div>
<div class="shape"><p class="lbl">ふたりの形</p><h2 tabindex="-1" id="shape">${esc(r.shape)}</h2><p>${esc(r.note)}</p></div>
<p class="strong">3 つの占術のうち、いちばん響き合うのは<em>${esc(r.strongest)}</em>の見方です。</p>
<div class="reads">${r.rows.map((x) => `<div class="read"><h3>${esc(x.method)}</h3><p class="basis">${esc(x.basis)}</p><p class="t">${esc(x.text)}</p></div>`).join('')}</div>
<div class="tip"><h3>ふたりのコツ</h3><p>${esc(r.tip)}</p></div>
<div class="say"><img src="${yoiro}" alt="フクロウの占い師ヨイロ" width="118" height="100"><div class="bubble"><p class="who">ヨイロ（おつげの占い師）</p><p>アプリでは、相手を招待する「ふたり相性」と、ふたりの関係を深く読む相性の鑑定書があります。</p></div></div>
<div class="act"><button class="btn out" type="button" id="again">別のふたりで見る</button></div>`;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const me = read('me', 'あなた');
  const pt = read('pt', '相手');
  const bad = [me, pt].find((x) => x.error);
  if (bad) {
    err.textContent = bad.error;
    err.hidden = false;
    out.hidden = true;
    return;
  }
  err.hidden = true;
  out.innerHTML = render(me, pt);
  out.hidden = false;
  const h = document.getElementById('shape');
  (h ?? out).scrollIntoView({ behavior: 'smooth', block: 'center' });
  h?.focus({ preventScroll: true });
  document.getElementById('again')?.addEventListener('click', () => {
    form.reset();
    out.hidden = true;
    out.innerHTML = '';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
