// 姓名判断の画面。計算は seimei-core.js（この端末の中だけ）。外への送信・保存・アドレス欄への書き出しはしない。
import data from './seimei-data.js';
import { GRIDS, computeSeimei, formula, readPart, reduce81 } from './seimei-core.js';

const $ = (id) => document.getElementById(id);
const form = $('seimei');
const err = $('err');
const out = $('result');
const kakusu = (n) => new URL(`../seimei/kakusu/${n}/`, import.meta.url).href;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const good = (r) => (r === '大吉' || r === '吉' ? ' good' : '');

function charsHtml(chart) {
  const box = (c) => `<li><b>${esc(c.char)}</b><span>${c.source === 'unknown' ? '？' : `${c.strokes} 画`}</span></li>`;
  const sei = chart.chars.slice(0, chart.sei_length);
  const mei = chart.chars.slice(chart.sei_length);
  const line = chart.chars.map((c) => `${c.char} ${c.source === 'unknown' ? '？' : c.strokes}`).join(' ／ ');
  return `<div class="steps"><h3>1 字ずつの画数</h3>
<div class="chars" aria-label="${esc(line)}"><div class="g"><small>姓</small><ol aria-hidden="true">${sei.map(box).join('')}</ol></div><div class="g"><small>名</small><ol aria-hidden="true">${mei.map(box).join('')}</ol></div></div></div>`;
}

function kakuHtml(chart, g) {
  const n = chart.grids[g.k];
  const meanLine = `<p class="mean">${g.name}は、${g.how}で、${g.mean}を表します。</p>`;
  if (n === null) {
    return `<article class="kaku"><h3>${g.name}（${g.alias}）</h3><p class="t">一字の姓と一字の名では外格を出しません（霊数を足さない数え方のため）。</p>${meanLine}</article>`;
  }
  const r = chart.ratings[g.k];
  const base = reduce81(n);
  const m = data.m81[base];
  return `<article class="kaku"><h3>${g.name}（${g.alias}）は <span class="n">${n}</span> 画${r ? `で<span class="rt${good(r)}">『${r}』</span>` : ''}</h3>
<p class="f">${esc(formula(chart, g.k))}</p>
${n > 81 ? `<p class="note">82 画以上は 81 を引いた ${base} 画として読みます。</p>` : ''}
${m ? `<p class="key">${esc(m.key)}</p><p class="t">${esc(m.text)}</p>` : '<p class="t prep">この画数の解説は準備中です。</p>'}
${meanLine}
<a class="more" href="${kakusu(base)}">${base} 画の意味を見る ›</a></article>`;
}

function render(sei, mei) {
  const chart = computeSeimei(data, { sei, mei });
  const unknown = [...new Set(chart.chars.filter((c) => c.source === 'unknown').map((c) => c.char))];
  const head = `<h2 tabindex="-1" id="rs">${esc(sei)} ${esc(mei)} さんの五格</h2>${charsHtml(chart)}`;
  const again = '<div class="act"><button class="btn out" type="button" id="again">別の名前で見る</button></div>';
  if (unknown.length) {
    return `${head}<p class="minor">${unknown.map((c) => `「${esc(c)}」`).join('')}の画数が分からないため、五格を出せません。</p>${again}`;
  }
  return `${head}
<div class="kakus">${GRIDS.map((g) => kakuHtml(chart, g)).join('')}</div>
<p class="note mt">${esc(chart.school)}（旧字体には直しません・霊数は足しません）。数え方は流派で変わります。吉凶は言い伝えの目安です。名前の良し悪しや、人柄を決めるものではありません。</p>
${again}`;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const sei = readPart($('sei').value, '姓');
  const mei = readPart($('mei').value, '名');
  const bad = [sei, mei].find((x) => x.error);
  if (bad) {
    err.textContent = bad.error;
    err.hidden = false;
    out.hidden = true;
    return;
  }
  err.hidden = true;
  out.innerHTML = render(sei.value, mei.value);
  out.hidden = false;
  const h = $('rs');
  h.scrollIntoView({ behavior: 'smooth', block: 'start' });
  h.focus({ preventScroll: true });
  $('again').addEventListener('click', () => {
    form.reset();
    out.hidden = true;
    out.innerHTML = '';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('sei').focus({ preventScroll: true });
  });
});
