// 12 星座の今日の運勢の画面。計算はビルドが済ませた seiza-data.js を読むだけ（外への送信・保存・アドレス欄への書き出しはしない）。
// HTML にはビルドした日の内容が入っている＝ここで日本時間の今日と明日に出し直す（範囲外の日は「準備中」）。
import data from './seiza-data.js';
import { addDays, fmtLong, fmtShort, jstToday, rankingPanel, signPanel } from './seiza-core.js';

const root = document.getElementById('seiza');
const panel = document.getElementById('sz-panel');
const dateLine = document.getElementById('sz-date');
const sign = root.dataset.sign === '' ? null : Number(root.dataset.sign);
const link = (slug) => new URL(`../seiza/${slug}/`, import.meta.url).href;
const today = jstToday();
const days = [today, addDays(today, 1)];
const buttons = [...root.querySelectorAll('.sztabs button')];

function show(n) {
  const date = days[n];
  const label = n ? '明日' : '今日';
  panel.innerHTML = sign === null ? rankingPanel(data, date, { label, link }) : signPanel(data, date, sign, { label });
  dateLine.textContent = fmtLong(date);
  buttons.forEach((b, j) => {
    b.setAttribute('aria-pressed', String(j === n));
    b.querySelector('small').textContent = fmtShort(days[j]);
  });
}
buttons.forEach((b, j) => b.addEventListener('click', () => show(j)));
show(0);
