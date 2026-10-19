/**
 * 姓名判断の計算。ブラウザの中だけで動く（入力は外に送らない・保存しない）。
 * アプリ supabase/functions/_shared/engine/seimei/compute.ts（computeSeimei・SCHOOL_DEFAULT）を写した。
 * ビルド（build.mjs の checkSeimei）が毎回アプリのエンジンと名前 200 件以上で突き合わせる（画数・五格・吉凶）。
 * 画数の表は seimei-data.js（ビルドがアプリの strokes.ts の UNIHAN_STROKES 全部＋かなを書き出す＝どの字でもアプリと同じ結果）。
 */

/** 五格（画面の見出し・解説・一覧のページが同じ物を使う）。意味はアプリ prompts/packs/seimei.ts の五格の言い方 */
export const GRIDS = [
  { k: 'ten', name: '天格', alias: '祖運', how: '姓の画数の合計', mean: '家系から受け継ぐもの' },
  { k: 'jin', name: '人格', alias: '主運', how: '姓の最後の字と名の最初の字の画数の合計', mean: '本人の中心' },
  { k: 'chi', name: '地格', alias: '初運', how: '名の画数の合計', mean: '若い頃の土台' },
  { k: 'gai', name: '外格', alias: '助運', how: '総格から人格を引いた数', mean: '外との関わり' },
  { k: 'sou', name: '総格', alias: '総運', how: 'すべての字の画数の合計', mean: '全体のまとまり' },
];

/** 入力の決まり（各 1〜5 字・漢字／ひらがな／カタカナ。ー は文字種が「共通」なので足す） */
export const MAX_CHARS = 5;
const ALLOWED = /^[\p{sc=Han}\p{sc=Hiragana}\p{sc=Katakana}ー]+$/u;

/** 入力 1 欄を確かめる。アプリと同じく前後の空白だけ落とし、字は直さない（入力は正規化しない＝画面には入力した字そのまま。NFC は表を引く時だけ） */
export function readPart(raw, label) {
  const s = String(raw ?? '').trim();
  const n = [...s].length;
  if (!n) return { error: `${label}を入れてください。` };
  if (n > MAX_CHARS) return { error: `${label}は ${MAX_CHARS} 字までで入れてください。` };
  if (!ALLOWED.test(s)) return { error: `${label}は漢字・ひらがな・カタカナで入れてください。` };
  return { value: s };
}

/** seimei-data.js の「画数→字の並び」を字→画数の Map にする（1 回だけ） */
const maps = new WeakMap();
function lookup(data) {
  let m = maps.get(data);
  if (!m) {
    const build = (groups) => {
      const out = new Map();
      for (const [n, chars] of Object.entries(groups)) for (const ch of chars) out.set(ch, Number(n));
      return out;
    };
    m = { kanji: build(data.kanji), kana: build(data.kana) };
    maps.set(data, m);
  }
  return m;
}

/** 画数→吉凶（アプリ ratings.ts の ratingOf と同じ: 82 画以上は 81 を引く・0 以下と null は null） */
export const reduce81 = (n) => ((n - 1) % 81) + 1;
export function ratingOf(data, n) {
  if (n === null || n < 1) return null;
  return data.ratings[reduce81(n)] ?? null;
}

/** アプリ compute.ts の charStrokes（表→かな→不明の順。表は「そのまま→無ければ NFC で元の字に戻して」引く＝互換漢字の 神 U+FA19 など） */
function charStrokes(m, ch) {
  const u = m.kanji.get(ch) ?? m.kanji.get(ch.normalize('NFC'));
  if (u !== undefined) return { char: ch, strokes: u, source: 'unihan' };
  const k = m.kana.get(ch);
  if (k !== undefined) return { char: ch, strokes: k, source: 'kana' };
  return { char: ch, strokes: 0, source: 'unknown' };
}

/** アプリ computeSeimei と同じ形（不明の字は 0 画のまま計算する。五格を出すかどうかは画面が決める） */
export function computeSeimei(data, name) {
  const m = lookup(data);
  const school = data.school;
  const sei = [...name.sei].map((c) => charStrokes(m, c));
  const mei = [...name.mei].map((c) => charStrokes(m, c));
  const sum = (xs) => xs.reduce((s, x) => s + x.strokes, 0);
  const reisuSei = school.reisu && sei.length === 1 ? 1 : 0;
  const reisuMei = school.reisu && mei.length === 1 ? 1 : 0;
  const sou = sum(sei) + sum(mei);
  const jin = sei[sei.length - 1].strokes + mei[0].strokes;
  const gaiUndefined = !school.reisu && sei.length === 1 && mei.length === 1;
  const grids = {
    ten: sum(sei) + reisuSei,
    jin,
    chi: sum(mei) + reisuMei,
    gai: gaiUndefined ? null : sou - jin + reisuSei + reisuMei,
    sou,
  };
  const known = [...sei, ...mei].every((c) => c.source !== 'unknown');
  const r = (n) => (known ? ratingOf(data, n) : null);
  return {
    school: school.name,
    chars: [...sei, ...mei],
    sei_length: sei.length,
    grids,
    ratings: { ten: r(grids.ten), jin: r(grids.jin), chi: r(grids.chi), gai: r(grids.gai), sou: r(grids.sou) },
  };
}

/** 各格の足し算の過程（画面の「計算の過程」用。不明の字が無い時だけ使う） */
export function formula(chart, k) {
  const sei = chart.chars.slice(0, chart.sei_length);
  const mei = chart.chars.slice(chart.sei_length);
  const t = (c) => `${c.char} ${c.strokes}`;
  const plus = (xs) => xs.map(t).join(' ＋ ');
  const g = chart.grids;
  if (k === 'ten') return sei.length > 1 ? `${plus(sei)} ＝ ${g.ten}` : `${t(sei[0])}`;
  if (k === 'jin') return `${plus([sei.at(-1), mei[0]])} ＝ ${g.jin}`;
  if (k === 'chi') return mei.length > 1 ? `${plus(mei)} ＝ ${g.chi}` : `${t(mei[0])}`;
  if (k === 'gai') return g.gai === null ? '' : `総格 ${g.sou} − 人格 ${g.jin} ＝ ${g.gai}`;
  return `${plus(chart.chars)} ＝ ${g.sou}`;
}
