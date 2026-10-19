// 今日（日本時間）の日付のマスと、今月の月リンクに印を付ける（静的なページを毎日作り直さずに済ませる）
const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
document.querySelector(`.cal td[data-date="${today}"]`)?.classList.add('today');
const month = document.querySelector(`.months a[data-month="${today.slice(0, 7)}"]`);
if (month) {
  month.classList.add('now');
  month.querySelector('span')?.insertAdjacentText('beforeend', '・今月');
}
