/**
 * 12 星座の今日の運勢（ブラウザとビルドの両方が使う）。
 * 計算はビルド（lib/seiza-data.mjs）が済ませて seiza-data.js に日ごとに詰めてある＝ここは、表（基本の星・加減）と、
 * 詰めた値を読む関数と、HTML の文字列を作る関数だけ。外への送信・保存はしない。
 * 静的な HTML（ビルドした日の内容）も、ブラウザが出し直す内容も、同じ関数で作る＝JS の有無で中身がずれない。
 */

/** 星座の順＝牡羊 0〜魚 11（アプリ western/compute.ts の SIGNS と同じ並び・ビルドが照合する） */
export const SIGN_LIST = [
  { slug: 'ohitsuji', name: 'おひつじ座', kanji: '牡羊座', el: '火' },
  { slug: 'oushi', name: 'おうし座', kanji: '牡牛座', el: '地' },
  { slug: 'futago', name: 'ふたご座', kanji: '双子座', el: '風' },
  { slug: 'kani', name: 'かに座', kanji: '蟹座', el: '水' },
  { slug: 'shishi', name: 'しし座', kanji: '獅子座', el: '火' },
  { slug: 'otome', name: 'おとめ座', kanji: '乙女座', el: '地' },
  { slug: 'tenbin', name: 'てんびん座', kanji: '天秤座', el: '風' },
  { slug: 'sasori', name: 'さそり座', kanji: '蠍座', el: '水' },
  { slug: 'ite', name: 'いて座', kanji: '射手座', el: '火' },
  { slug: 'yagi', name: 'やぎ座', kanji: '山羊座', el: '地' },
  { slug: 'mizugame', name: 'みずがめ座', kanji: '水瓶座', el: '風' },
  { slug: 'uo', name: 'うお座', kanji: '魚座', el: '水' },
];

/** 4 項目（キーは lib/seiza-texts.mjs の HOUSE_TEXT と同じ） */
export const ITEMS = [
  { k: 'sougou', name: '総合運', short: '総合' },
  { k: 'ren', name: '恋愛運', short: '恋愛' },
  { k: 'kin', name: '金運', short: '金運' },
  { k: 'shigoto', name: '仕事運', short: '仕事' },
];
const SHORT = Object.fromEntries(ITEMS.map((x) => [x.k, x.short]));

/** 月の部屋 h（1〜12）ごとの基本の星（配列の 0 番目＝h1） */
export const BASE = {
  sougou: [4, 3, 3, 2, 5, 2, 3, 1, 4, 4, 5, 1],
  ren: [4, 3, 3, 2, 5, 2, 5, 2, 3, 2, 4, 1],
  kin: [3, 5, 3, 2, 3, 3, 2, 4, 3, 4, 4, 1],
  shigoto: [4, 3, 4, 2, 2, 5, 3, 2, 3, 5, 3, 1],
};

/**
 * 星の動きの加減（bit＝seiza-data.js に詰める印・key＝MOD_TEXT のキー）。
 * when: ally＝その天体が同じ星座か同じエレメント（星座の差 0・4・8）／clash＝90°・180°（差 3・9・6）／newmoon・fullmoon＝その日（JST）にその星座で新月・満月
 * 木星・土星は入れない（10/20 部長決定）＝1 年以上同じ星座にいる星を日ごとの順位に入れると、同じ星座に毎日同じハンデが付く
 * （設計の最初の版で 2026-10-19〜2027-12-31 を計算すると、土星がずっとおひつじ座＝かに座・てんびん座が 439 日で 1 位 0 回だった）
 */
export const MODS = [
  { bit: 1, key: 'venus', body: 'Venus', name: '金星', when: 'ally', delta: { ren: 1 } },
  { bit: 2, key: 'mars', body: 'Mars', name: '火星', when: 'clash', delta: { shigoto: -1 } },
  { bit: 4, key: 'newmoon', name: '新月', when: 'newmoon', delta: { sougou: 1 } },
  { bit: 8, key: 'fullmoon', name: '満月', when: 'fullmoon', delta: {} },
];
/** 水星逆行の期間（全星座・星の加減なし＝文だけ） */
export const RX_KEY = 'mercury_rx';
/** 位置を見る惑星（MODS の body と同じ・seiza-data.js にもこの順で詰める） */
export const PLANET_BODIES = ['Venus', 'Mars'];

const DAY_MS = 86400000;
const WEEKDAY = ['日', '月', '火', '水', '木', '金', '土'];
const QUARTER = ['新月', '上弦', '満月', '下弦'];
const BETWEEN = ['新月から上弦へ、満ちていく月', '上弦から満月へ、満ちていく月', '満月から下弦へ、欠けていく月', '下弦から新月へ、欠けていく月'];

export const mod12 = (n) => ((n % 12) + 12) % 12;
/** 星座の差（その星座から数えて何個先か・0〜11） */
export const signDiff = (planet, sign) => mod12(planet - sign);
export const isAlly = (planet, sign) => [0, 4, 8].includes(signDiff(planet, sign));
export const isClash = (planet, sign) => [3, 6, 9].includes(signDiff(planet, sign));
/** 月の部屋（その星座を 1 番目として数える） */
export const house = (moon, sign) => signDiff(moon, sign) + 1;
/** 総合の星が同じ時に比べる数＝恋愛・金運・仕事の星の合計 */
export const subTotal = (st) => st.ren + st.kin + st.shigoto;
/** その日の通し番号＝1970-01-01 からの日数（ビルドし直しても同じ日付なら同じ値） */
export const dayNumber = (date) => Math.round(Date.parse(`${date}T00:00:00Z`) / DAY_MS);
/** 総合も合計も同じ時の並び＝(星座の番号 − その日の通し番号) mod 12 の小さい順（毎日同じ星座が得をしないように） */
export const tieKey = (sign, date) => mod12(sign - dayNumber(date));
/** 順位の並べ方（10/20 部長決定）＝総合の星の多い順 → 恋愛・金運・仕事の合計の多い順 → tieKey の小さい順。a・b＝{ s, stars } */
export const compareSigns = (a, b, date) => b.stars.sougou - a.stars.sougou || subTotal(b.stars) - subTotal(a.stars) || tieKey(a.s, date) - tieKey(b.s, date);

export const addDays = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
/** 日本時間の今日 */
export const jstToday = () => new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10);
const ymd = (date) => {
  const [y, m, d] = date.split('-').map(Number);
  return { y, m, d, wd: WEEKDAY[new Date(`${date}T00:00:00Z`).getUTCDay()] };
};
export const fmtLong = (date) => {
  const x = ymd(date);
  return `${x.y}年${x.m}月${x.d}日（${x.wd}）`;
};
export const fmtShort = (date) => {
  const x = ymd(date);
  return `${x.m}月${x.d}日（${x.wd}）`;
};
const fmtMd = (date) => {
  const x = ymd(date);
  return `${x.m}月${x.d}日`;
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const nw = (s) => `<span class="nw">${s}</span>`;
const b36 = (c) => parseInt(c, 36);

/**
 * seiza-data.js の 1 日分を読む。範囲外の日は null。
 * 1 日＝[月の星座, 新月の星座|-1, 満月の星座|-1, 水星逆行(0 なし・1 期間中・2 始まる日・3 順行に戻る日), 金星・火星の星座(36 進 2 字),
 *        六曜, 日の干支, 月の満ち欠け(0〜3＝その日に新月・上弦・満月・下弦／4〜7＝その後の期間), その瞬間の時刻 HH:MM|'', 月の照度%(06:30),
 *        順位の並び(1 位から星座の番号 36 進 12 字), 星(星座ごとに 総合・恋愛・金運・仕事 の 4 桁×12), 効いた加減(星座ごとに MODS の bit の和 16 進 1 字×12)]
 */
export function dayOf(data, date) {
  const i = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${data.from}T00:00:00Z`)) / DAY_MS);
  const row = i >= 0 ? data.days[i] : undefined;
  if (!row) return null;
  const [moon, newMoon, fullMoon, rx, pl, roku, gz, phase, phaseTime, ill, order, st, md] = row;
  const ord = [...order].map(b36);
  const signs = SIGN_LIST.map((_, s) => {
    const v = [...st.slice(s * 4, s * 4 + 4)].map(Number);
    const stars = { sougou: v[0], ren: v[1], kin: v[2], shigoto: v[3] };
    return { s, h: house(moon, s), stars, sub: subTotal(stars), bits: parseInt(md[s], 16), rank: ord.indexOf(s) + 1 };
  });
  const planets = Object.fromEntries(PLANET_BODIES.map((b, j) => [b, b36(pl[j])]));
  return { date, moon, newMoon, fullMoon, rx, planets, roku, gz, phase, phaseTime, ill, order: ord, signs };
}

/** ★（accent）と☆（sub）。読み上げは aria-label の 1 つだけ */
export const stars = (n, label) =>
  `<span class="stars" role="img" aria-label="${label} ${n}（5 段階）"><span aria-hidden="true">${'★'.repeat(n)}</span>${n < 5 ? `<span class="off" aria-hidden="true">${'☆'.repeat(5 - n)}</span>` : ''}</span>`;

const firstSentence = (t) => {
  const i = t.indexOf('。');
  return i < 0 ? t : t.slice(0, i + 1);
};
const prep = (what = '解説') => `<span class="prep">${what}は準備中です</span>`;
const unavailable = (date) => `<p class="minor">${fmtLong(date)}の運勢は準備中です。</p>`;

/** 1〜12 位の並び＋その日の暦の箱 */
export function rankingPanel(data, date, { label, link }) {
  const day = dayOf(data, date);
  const head = `<h2 id="szh">${label} ${nw(fmtShort(date))}の運勢ランキング</h2>`;
  if (!day) return head + unavailable(date);
  const house = data.texts?.house;
  const rows = day.order
    .map((s, j) => {
      const x = day.signs[s];
      const sign = SIGN_LIST[s];
      const t = house ? esc(firstSentence(house[x.h].sougou)) : prep();
      return `<li${j < 3 ? ' class="top"' : ''}><a href="${link(sign.slug)}"><span class="no">${j + 1}<small>位</small></span><span class="nm">${sign.name}</span><span class="st">${stars(x.stars.sougou, '総合')}</span><span class="t">${t}</span></a></li>`;
    })
    .join('');
  return `${head}<ol class="rank">${rows}</ol>
<p class="note mt">順位は総合の星の多い順です。総合の星が同じ時は恋愛・金運・仕事の星の合計の多い順、それも同じ時は日ごとに入れ替わる順番で並べます。星座名を押すと、恋愛運・金運・仕事運と、その日の運勢の出し方をご覧いただけます。</p>
${koyomiBox(data, day, label)}`;
}

/** その日の暦（六曜・日の干支・月の満ち欠け・月の星座・水星逆行） */
function koyomiBox(data, day, label) {
  const moonText =
    day.phase < 4
      ? `${QUARTER[day.phase]}（${day.phaseTime}）`
      : BETWEEN[day.phase - 4];
  let rx = 'なし';
  if (day.rx) {
    const p = data.retro.find(([a, b]) => a <= day.date && day.date <= b);
    rx = day.rx === 2 ? `この日から逆行（${fmtMd(p[1])}まで）` : day.rx === 3 ? `この日に順行に戻る（${fmtMd(p[0])}から）` : `逆行中（${fmtMd(p[0])}〜${fmtMd(p[1])}）`;
  }
  return `<section class="koyomi" aria-labelledby="kb"><h2 id="kb">${label} ${nw(fmtShort(day.date))}の暦</h2>
<dl class="points">
<div><dt>六曜</dt><dd>${day.roku}</dd></div>
<div><dt>日の干支</dt><dd>${day.gz}</dd></div>
<div><dt>月の満ち欠け</dt><dd>${moonText}${nw(`（明るさ ${day.ill}%・午前 6 時半）`)}</dd></div>
<div><dt>月の星座</dt><dd>${SIGN_LIST[day.moon].name}${nw('（正午）')}</dd></div>
<div><dt>水星逆行</dt><dd>${rx}</dd></div>
</dl></section>`;
}

/** 天体の位置とその星座の関係（根拠の箱の言い方） */
function relation(planet, sign) {
  const d = signDiff(planet, sign);
  if (d === 0) return 'あなたの星座と重なる位置';
  if (d === 4 || d === 8) return `あなたの星座の味方の位置（どちらも${SIGN_LIST[sign].el}の星座）`;
  return `あなたの星座とぶつかる位置（${d === 6 ? 180 : 90} 度）`;
}
const deltaText = (delta) => {
  const e = Object.entries(delta);
  return e.length ? e.map(([k, v]) => `${SHORT[k]}${v > 0 ? '＋' : '−'}${Math.abs(v)}`).join('・') : '星はそのまま、文を足します';
};

/** 1 つの星座の運勢＋根拠の箱 */
export function signPanel(data, date, s, { label }) {
  const sign = SIGN_LIST[s];
  const day = dayOf(data, date);
  const head = `<h2 id="szh">${label} ${nw(fmtShort(date))}の${sign.name}</h2>`;
  if (!day) return head + unavailable(date);
  const x = day.signs[s];
  const ht = data.texts?.house?.[x.h];
  const mt = data.texts?.mod;
  const items = ITEMS.slice(1)
    .map((it) => `<div class="szit"><h3>${it.name} ${stars(x.stars[it.k], it.short)}</h3><p>${ht ? esc(ht[it.k]) : prep()}</p></div>`)
    .join('');
  // 効いた星の動き（MODS の順・水星逆行は最後）
  const applied = MODS.filter((m) => x.bits & m.bit);
  const modKeys = [...applied.map((m) => m.key), ...(day.rx ? [RX_KEY] : [])];
  const mods = modKeys.length
    ? `<div class="szmods"><h3>${label}の星の動き</h3>${mt ? `<ul>${modKeys.map((k) => `<li>${esc(mt[k])}</li>`).join('')}</ul>` : `<p>${prep('星の動きの文')}</p>`}</div>`
    : '';
  return `${head}
<div class="szhead"><p class="szrank"><small>12星座中</small><b>${x.rank}</b><span>位</span></p>
<div class="szsum"><h3>総合運 ${stars(x.stars.sougou, '総合')}</h3><p>${ht ? esc(ht.sougou) : prep()}</p></div></div>
<div class="szitems">${items}</div>
${mods}
${basisBox(day, x, s, label)}`;
}

/** 根拠の箱＝計算の過程（月の部屋→基本の星→加減→1〜5 に収める→点→順位） */
function basisBox(day, x, s, label) {
  const sign = SIGN_LIST[s];
  const base = Object.fromEntries(ITEMS.map((it) => [it.k, BASE[it.k][x.h - 1]]));
  const raw = { ...base };
  const lines = [];
  for (const m of MODS) {
    if (!(x.bits & m.bit)) continue;
    for (const [k, v] of Object.entries(m.delta)) raw[k] += v;
    if (m.body) lines.push(`${m.name}が${SIGN_LIST[day.planets[m.body]].name}にあり、${relation(day.planets[m.body], s)} ${nw(`→ ${deltaText(m.delta)}`)}`);
    else if (m.key === 'newmoon') lines.push(`この日（${day.phaseTime}）、${sign.name}で新月を迎えます ${nw(`→ ${deltaText(m.delta)}`)}`);
    else lines.push(`この日（${day.phaseTime}）、${sign.name}で満月を迎えます ${nw(`→ ${deltaText(m.delta)}`)}`);
  }
  if (day.rx) lines.push(`水星逆行の期間です ${nw(`→ ${deltaText({})}`)}`);
  const finalText = ITEMS.map((it) => {
    const r = raw[it.k];
    const f = x.stars[it.k];
    return `${it.short} ${f}${r !== f ? `（${r} → ${r > 5 ? '上限' : '下限'}の ${f}）` : ''}`;
  }).join('・');
  const st = x.stars;
  const sameS = day.signs.filter((y) => y.stars.sougou === st.sougou).length;
  const sameSub = day.signs.filter((y) => y.stars.sougou === st.sougou && y.sub === x.sub).length;
  const order =
    sameS < 2
      ? `総合 ${st.sougou} の星座はほかに無いので`
      : `総合 ${st.sougou} の星座が ${sameS} つあり、恋愛・金運・仕事の合計（${st.ren}＋${st.kin}＋${st.shigoto}＝${x.sub}）の多い順${sameSub > 1 ? `。合計も ${x.sub} の星座が ${sameSub} つあるので、日ごとに入れ替わる順番で` : 'で'}`;
  return `<div class="szbasis"><h3>この運勢の出し方</h3>
<ol>
<li>${label}（${fmtMd(day.date)}）正午の月は${SIGN_LIST[day.moon].name}。${sign.name}から数えて ${x.h} 番目の星座です（月の部屋 ${x.h}）。</li>
<li>月が ${x.h} 番目の星座にある日の基本の星: ${ITEMS.map((it) => `${it.short} ${base[it.k]}`).join('・')}</li>
<li>星の動き: ${lines.length ? `<ul>${lines.map((l) => `<li>${l}</li>`).join('')}</ul>` : 'この日は、星を足し引きする動きはありません。'}</li>
<li>${label}の星（1〜5 に収めます）: ${finalText}</li>
<li>順位は総合の星の多い順です。${order} ${nw(`→ 12星座中 ${x.rank} 位`)}</li>
</ol></div>`;
}

/** 今日／明日の切り替え（JS が動くと押せる・日付は JS が出し直す） */
export function tabsHtml(today) {
  return `<div class="sztabs" role="group" aria-label="表示する日"><button type="button" data-day="0" aria-pressed="true"><b>今日</b><small>${fmtShort(today)}</small></button><button type="button" data-day="1" aria-pressed="false"><b>明日</b><small>${fmtShort(addDays(today, 1))}</small></button></div>`;
}

/** 12 星座の一覧（current＝今のページの星座を強調） */
export function signListHtml({ link, ranges, current = null }) {
  return `<ul class="signs">${SIGN_LIST.map((x, i) => `<li><a href="${link(x.slug)}"${i === current ? ' aria-current="page"' : ''}><b>${x.name}</b>${ranges?.[x.slug] ? `<span>${esc(ranges[x.slug])}</span>` : ''}</a></li>`).join('')}</ul>`;
}
