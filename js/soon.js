// トップの「これからの吉日」: 今日（日本時間）以降の 6 件
const list = document.getElementById('soon');
const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
const items = JSON.parse(list.dataset.items).filter((x) => x.date >= today).slice(0, 6);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
list.innerHTML = items.length
  ? items.map((x) => `<li><b>${esc(x.label)}</b><a href="${esc(x.href)}">${esc(x.what)}</a></li>`).join('')
  : '<li><span>掲載している期間は終わりました</span><a href="kichijitsu/">月の一覧</a></li>';
