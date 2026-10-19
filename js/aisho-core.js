/**
 * 相性（誕生日 2 つ）の計算。ブラウザの中だけで動く（入力は外に送らない・保存しない）。
 * アプリと同じ規則で書き、ビルド（build.mjs）が毎回アプリのエンジンと全件・乱数で突き合わせる:
 * - 太陽の星座: アプリ western/compute.ts（生まれた時刻が分からない＝日本時間 12:00 の太陽の黄経）。境目の表は aisho-data.js（ビルドがエンジンから作る）
 * - 日主（日の干）と通変星: アプリ bazi/compute.ts（日柱）・tenGod（表は aisho-data.js にエンジンから書き出す）
 * - ライフパス: アプリ numerology/compute.ts
 * - 相性の形: アプリ src/components/divine/compat-shape.ts の compatView（点は画面に出さない）
 * - 根拠の 3 行: アプリ supabase/functions/compat-simple の文面
 */

export const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
/** アプリ supabase/functions/_shared/insight.ts の GAN_JA と同じ（ビルドで照合） */
export const GAN_JA = { 甲: '大きな木', 乙: '草花', 丙: '太陽', 丁: 'ともしび', 戊: '山の土', 己: '田畑の土', 庚: '鉄', 辛: '宝石', 壬: '大河', 癸: '雨' };

/** グレゴリオ暦の通日（ユリウス日の整数部） */
function jdn(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}
/** 日の干支。基準＝2026-10-17 が甲子（国立天文台・ベストカレンダーと一致・ビルドでエンジンと 1900〜2030 年の全日を照合） */
const KOSHI = jdn(2026, 10, 17);
export function dayGanzhi(y, m, d) {
  const i = (((jdn(y, m, d) - KOSHI) % 60) + 60) % 60;
  return GAN[i % 10] + ZHI[i % 12];
}

/** ライフパス（アプリ numerology/compute.ts と同じ: 全桁和を還元・11／22／33 は残す） */
const digitSum = (n) => String(n).split('').reduce((s, c) => s + Number(c), 0);
export function lifePath(y, m, d) {
  let x = digitSum(Number(`${y}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}`));
  while (x > 9 && ![11, 22, 33].includes(x)) x = digitSum(x);
  return x;
}

const SIGNS = ['牡羊', '牡牛', '双子', '蟹', '獅子', '乙女', '天秤', '蠍', '射手', '山羊', '水瓶', '魚'];
const dayOfYear = (y, m, d) => (Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000;

/**
 * 太陽の星座（日本時間 12:00）と「境目の日」（その日の 0:00 と 24:00 で星座が違う）。
 * data.sun[年] = { s: 1/1 の星座番号, c: 星座が変わる日（年の何日目）[], b: 境目の日（年の何日目）[] }
 */
export function sunSign(data, y, m, d) {
  const row = data.sun[y];
  if (!row) return null;
  const n = dayOfYear(y, m, d);
  let s = row.s;
  for (const c of row.c) if (c <= n) s = (s + 1) % 12;
  return { sign: SIGNS[s], boundary: row.b.includes(n) };
}

/** アプリ compat-shape.ts（形・note・3 占術の点）。点は画面に出さず、言葉の選び分けにだけ使う */
const SHAPE = {
  same: { shape: '並んで歩く', note: '同じ歩幅で進める。張り合うより、並ぶと強い形' },
  give: { shape: '育てる', note: 'あなたが与え、相手が伸びる。見返りを急がないと続く形' },
  lead: { shape: '助け合う', note: '頼りすぎず、頼られすぎず。役割が違うから続く形' },
  push: { shape: '背中を押される', note: '相手があなたを引き締める。素直に聞けると伸びる形' },
  hold: { shape: '支えられる', note: '相手があなたを満たす。受け取り上手だと続く形' },
};
const RELATION = {
  比肩: 'same', 劫財: 'same',
  食神: 'give', 傷官: 'give',
  偏財: 'lead', 正財: 'lead',
  偏官: 'push', 正官: 'push',
  偏印: 'hold', 印綬: 'hold', 正印: 'hold',
};
const BAZI = { 比肩: 72, 劫財: 64, 食神: 80, 傷官: 62, 偏財: 74, 正財: 82, 偏官: 58, 正官: 78, 偏印: 66, 印綬: 84, 正印: 84 };
const WESTERN = [80, 58, 76, 52, 88, 48, 64];
const GROUP = (n) => {
  const d = n > 9 ? [...String(n)].reduce((a, c) => a + Number(c), 0) : n;
  return [1, 5, 7].includes(d) ? 0 : [2, 4, 8].includes(d) ? 1 : 2;
};
export function compatView({ me, partner, tenGod }) {
  const i = SIGNS.indexOf(me.sun.replace(/座$/, ''));
  const j = SIGNS.indexOf(partner.sun.replace(/座$/, ''));
  const gap = i < 0 || j < 0 ? 0 : Math.min(Math.abs(i - j), 12 - Math.abs(i - j));
  const numerology = me.lifePath === partner.lifePath ? 78 : GROUP(me.lifePath) === GROUP(partner.lifePath) ? 85 : 62;
  return {
    ...SHAPE[RELATION[tenGod] ?? 'same'],
    scores: [
      { label: '四柱推命', value: BAZI[tenGod] ?? 70 },
      { label: '西洋占星術', value: WESTERN[gap] },
      { label: '数秘術', value: numerology },
    ],
  };
}

/* ───────── 文章（決まった型の組み合わせ・AI は使わない） ───────── */

const WESTERN_TEXT = [
  '同じ星座どうし。ものの感じ方が近く、説明しなくても通じる場面が多い組み合わせです。',
  '隣り合う星座どうし。似ているようで大事にするものが少し違い、その差がお互いの新しい視点になります。',
  '60 度の関係。会話のテンポが合いやすく、気軽に誘い合える組み合わせです。',
  '90 度の関係。考え方がぶつかる場面もありますが、そのぶん互いを動かす力が強い組み合わせです。',
  '120 度の関係。同じ性質のグループ（火・地・風・水）どうしで、自然体のまま並べる組み合わせです。',
  '150 度の関係。共通点が見えにくいぶん、歩み寄るほど発見が増える組み合わせです。',
  '向かい合う星座どうし。正反対だからこそ惹かれ合い、足りないところを補い合える組み合わせです。',
];
const BAZI_TEXT = {
  比肩: '相手はあなたと同じ五行・同じ陰陽。対等な仲間として、肩を並べて進める関係です。',
  劫財: '相手はあなたと同じ五行で、陰陽が反対。張り合いながら高め合える関係です。',
  食神: 'あなたの五行が相手の五行を生む関係。一緒にいると気持ちがゆるみ、楽しさを分け合えます。',
  傷官: 'あなたの五行が相手の五行を生む関係で、刺激は強め。相手の前では本音や才能が出やすくなります。',
  偏財: 'あなたの五行が相手の五行を動かす関係。行動の範囲が広がり、にぎやかに付き合えます。',
  正財: 'あなたの五行が相手の五行を整える関係。大切に守りながら、堅実に積み上げていけます。',
  偏官: '相手の五行があなたの五行を引き締める関係。ほどよい緊張感が、あなたを鍛えてくれます。',
  正官: '相手の五行があなたの五行を律する関係。けじめのある信頼で結ばれやすい二人です。',
  偏印: '相手の五行があなたの五行を生む関係で、ひらめき型。考え方の幅が広がります。',
  印綬: '相手の五行があなたの五行を生む関係。安心して学び、受け取れる二人です。',
  正印: '相手の五行があなたの五行を生む関係。安心して学び、受け取れる二人です。',
};
const GROUP_NAME = ['考える', '形にする', '表す'];
function numerologyText(a, b) {
  if (a === b) return '同じライフパスどうし。人生で大事にするテーマが重なり、目指す方向をそろえやすい二人です。';
  const ga = GROUP(a);
  const gb = GROUP(b);
  if (ga === gb) return `ふたりとも数のまとまりが「${GROUP_NAME[ga]}」。物事の進め方が似ていて、段取りで揉めにくい二人です。`;
  return `あなたは「${GROUP_NAME[ga]}」、相手は「${GROUP_NAME[gb]}」のまとまり。得意な役割が分かれるので、任せ合うほどうまく回ります。`;
}
const TIP = {
  same: '目標を 1 つ決めて、同じ方向を見ること。比べ合いになりそうな時は、役割を分けると楽になります。',
  give: '先に与えるのはあなた。見返りを急がず、相手が伸びたことを一緒に喜べると長く続きます。',
  lead: 'お互いの得意を言葉にして渡し合うこと。頼む・頼まれるの釣り合いが取れていると心地よい形です。',
  push: '相手の厳しめのひと言は、あなたを伸ばす合図。言い返す前にひと呼吸おけると関係が深まります。',
  hold: '受け取ったら「ありがとう」を言葉に。支えられる側が素直だと、相手も満たされます。',
};

/** 18 歳未満（アプリ src/lib/age.ts と同じ: 誕生日の当日に 1 つ年を取る） */
export function isMinor(b, today = new Date()) {
  const before = today.getMonth() + 1 < b.m || (today.getMonth() + 1 === b.m && today.getDate() < b.d);
  return today.getFullYear() - b.y - (before ? 1 : 0) < 18;
}

/** ふたりの生年月日 → 画面に出す材料（数値の点は含めない） */
export function readPair(data, me, partner) {
  const ms = sunSign(data, me.y, me.m, me.d);
  const ps = sunSign(data, partner.y, partner.m, partner.d);
  const myGan = dayGanzhi(me.y, me.m, me.d)[0];
  const pGan = dayGanzhi(partner.y, partner.m, partner.d)[0];
  const rel = data.tenGod[myGan + pGan];
  const myLp = lifePath(me.y, me.m, me.d);
  const pLp = lifePath(partner.y, partner.m, partner.d);
  const view = compatView({ me: { sun: ms.sign, dayMaster: myGan, lifePath: myLp }, partner: { sun: ps.sign, dayMaster: pGan, lifePath: pLp }, tenGod: rel });
  const i = SIGNS.indexOf(ms.sign);
  const j = SIGNS.indexOf(ps.sign);
  const gap = Math.min(Math.abs(i - j), 12 - Math.abs(i - j));
  const strongest = [...view.scores].sort((a, b) => b.value - a.value)[0].label;
  const boundary = [ms.boundary ? 'あなた' : null, ps.boundary ? '相手の方' : null].filter(Boolean);
  const sunNote = boundary.length ? `（${boundary.join('と')}は星座の境目の日のため、生まれた時刻で変わることがあります）` : '';
  const kind = RELATION[rel] ?? 'same';
  return {
    shape: view.shape,
    note: view.note,
    strongest,
    tip: TIP[kind],
    rows: [
      {
        method: '西洋占星術',
        basis: `太陽は、あなたが${ms.sign}座・相手の方が${ps.sign}座です。${sunNote}`,
        text: WESTERN_TEXT[gap],
      },
      {
        method: '四柱推命',
        basis: `相手の方の日主は${pGan}（${GAN_JA[pGan]}）で、あなたの${myGan}（${GAN_JA[myGan]}）から見て「${rel}」にあたります。`,
        text: BAZI_TEXT[rel],
      },
      {
        method: '数秘術',
        basis: `ライフパスは、あなたが ${myLp}・相手の方が ${pLp} です。`,
        text: numerologyText(myLp, pLp),
      },
    ],
    // ビルドの突き合わせ用（画面には出さない）
    _check: { mySun: ms.sign, pSun: ps.sign, myGan, pGan, rel, myLp, pLp, view },
  };
}
