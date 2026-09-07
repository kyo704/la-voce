// ============================================================================
// 着せかえの、印と絞り込み（2026-09-08）
//
//   ★出どころ assets/wardrobe-v2/lavoce-仕様-着せ替え画面のUI（9月6日）.md §4・§7・§11
//
//   ★★保存する場所（§E）について。
//     ★新しい列を、★作りませんでした。
//     ★`profiles.character_equipped` は、★もともと JSON で、
//       ★保存の道も、読み込みの道も、★すでに在ります。
//     ★★列を足すと、SQL を1本 流していただくことになります。
//       ★流していない環境では、★お気に入りが黙って消えます。
//       ★入れ物が既に在るなら、★そちらに入れるほうが、壊れる場所が少ないです。
//
//   ★★数を、出さないこと。
//     ★「よく着るもの」は、★並べ替えに使うだけです。
//     ★「37回 着ました」と、★数を見せません。★数えられていると感じさせます。
//
//   ★見張り components/tests/wardrobe-marks.test.js
// ============================================================================

/**
 * ★絞り込みの札（★仕様 §4）。
 *
 *   ★★1つだけ選べます。★重ねて選べません（★迷わせないため）。
 *   ★★「持っていないものを隠す」は、★作りません（★仕様 §8）。
 *     ★見えなくすると、★何があるのか分からなくなります。
 *     ★「もっている」を選んだときだけ、★絞ります。
 */
export const FILTERS = Object.freeze([
  { key: "all", label: "すべて" },
  { key: "owned", label: "もっている" },
  { key: "fav", label: "お気に入り" },
  { key: "new", label: "新着" },
  { key: "style", label: "系統" }
]);

/**
 * ★系統（★仕様 §4 の第2列）。
 *
 *   ★★これは、★機械で振った第1版です。
 *     ★名前と theme から当てています。★目で見て直してください。
 *   ★★1点が、2つの系統に入ることがあります。★片方に決めません。
 */
export const STYLES = Object.freeze([
  { key: "neat", label: "きれいめ" },
  { key: "casual", label: "カジュアル" },
  { key: "soft", label: "やわらかい" },
  { key: "wa", label: "和風" },
  { key: "season", label: "季節もの" },
  { key: "era", label: "時代もの" }
]);

export const STYLE_KEYS = Object.freeze(STYLES.map((s) => s.key));

export function styleLabel(key) {
  const s = STYLES.find((x) => x.key === key);
  return s ? s.label : key;
}

/**
 * ★その品の系統。★名前と group から当てます。
 *
 *   ★★機械で振った第1版です。★直すときは、ここだけを直してください。
 *   ★どれにも当たらないものは、★空です。★無理に当てません。
 */
const NEAT_WORDS = ["スーツ", "タキシード", "燕尾", "ドレス", "ガウン", "ブラウス",
  "ジャケット", "コート", "ローファー", "パンプス", "革靴", "ネクタイ", "蝶ネクタイ",
  "中折れ", "シルクハット", "ベスト", "スラックス", "宮廷"];
const CASUAL_WORDS = ["Ｔシャツ", "Tシャツ", "デニム", "スウェット", "パーカー", "スニーカー",
  "キャップ", "ボーダー", "ハーフパンツ", "サンダル", "ながぐつ", "バケット", "パジャマ",
  "レギンス", "ワイドパンツ", "チノ"];
const SOFT_WORDS = ["もこもこ", "ニット", "カーディガン", "フリース", "マフラー", "スヌード",
  "キルティング", "パフスリーブ", "花かんむり", "リボン", "チュール", "ヘアバンド",
  "イヤーマフ", "ストール"];

function hasAny(name, words) {
  const n = String(name || "");
  return words.some((w) => n.includes(w));
}

export function stylesOf(item) {
  if (!item) return [];
  const out = [];
  const g = item.group;
  const n = item.name || "";
  if (g === "wafuku" || /和服|着物|羽織|袴|下駄|草履|わらじ|浴衣/.test(n)) out.push("wa");
  if (g === "season") out.push("season");
  if (g === "era" || g === "armor") out.push("era");
  if (hasAny(n, NEAT_WORDS)) out.push("neat");
  if (hasAny(n, CASUAL_WORDS)) out.push("casual");
  if (hasAny(n, SOFT_WORDS)) out.push("soft");
  // ★並びを、いつも同じにします。
  return STYLE_KEYS.filter((k) => out.includes(k));
}

// ---------------------------------------------------------------------------
// ★印の入れ物（★character_equipped の中に持ちます）
// ---------------------------------------------------------------------------

/** ★お気に入りの鍵の一覧。★無ければ空です。 */
export function favoritesOf(equipped) {
  const v = equipped && equipped.favorites;
  return Array.isArray(v) ? v : [];
}

export function isFavorite(equipped, key) {
  return favoritesOf(equipped).includes(key);
}

/**
 * ★お気に入りを、入れたり外したり。
 *   ★★元の入れ物を書き替えません。★新しいものを返します。
 */
export function toggleFavorite(equipped, key) {
  const cur = favoritesOf(equipped);
  const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
  return { ...(equipped || {}), favorites: next };
}

/**
 * ★着た回数。★並べ替えにだけ使います。
 *   ★★数を、画面に出さないこと。★数えられていると感じさせます。
 */
export function wearCountsOf(equipped) {
  const v = equipped && equipped.wearCounts;
  return v && typeof v === "object" ? v : {};
}

export function countWear(equipped, key) {
  const c = wearCountsOf(equipped);
  return { ...(equipped || {}), wearCounts: { ...c, [key]: (c[key] || 0) + 1 } };
}

/**
 * ★よく着るもの。★多い順に返します。
 *   ★★数は返しません。★鍵だけです。★出す先で数えられないように。
 */
export function oftenWorn(equipped, limit = 8) {
  const c = wearCountsOf(equipped);
  return Object.keys(c)
    .filter((k) => c[k] > 0)
    .sort((a, b) => c[b] - c[a] || a.localeCompare(b))
    .slice(0, limit);
}

/**
 * ★新着かどうか。
 *
 *   ★★「いつ見たか」を1つ持ち、★それより後に届いた品を新着とします。
 *   ★品ごとに「見た」を持ちません。★持つと、際限なく増えます。
 *   ★日付は、呼ぶ側が渡します（★ここで new Date() を呼びません）。
 */
export function seenAtOf(equipped) {
  return (equipped && equipped.wardrobeSeenAt) || null;
}

export function markAllSeen(equipped, nowISO) {
  return { ...(equipped || {}), wardrobeSeenAt: nowISO };
}

/**
 * ★その品が、新着か。
 *
 *   ★★持っていないものは、★新着ではありません。★届いていないからです。
 *   ★受け取った日を持っていない品は、★新着にしません（★分からないため）。
 */
export function isNew(equipped, key, receivedAt) {
  if (!receivedAt) return false;
  const seen = seenAtOf(equipped);
  if (!seen) return true;
  return String(receivedAt) > String(seen);
}

/**
 * ★絞り込みを、当てます。
 *
 *   @param items     並べ替えずみの品物
 *   @param filter    FILTERS の key
 *   @param style     STYLES の key（★filter が "style" のときだけ）
 *   @param ctx       { owned:Set, equipped, receivedAt:{key:iso} }
 */
export function applyFilter(items, filter, style, ctx) {
  const list = Array.isArray(items) ? items : [];
  const c = ctx || {};
  const owned = c.owned instanceof Set ? c.owned : new Set(c.owned || []);
  switch (filter) {
    case "owned":
      return list.filter((i) => owned.has(i.key));
    case "fav":
      return list.filter((i) => isFavorite(c.equipped, i.key));
    case "new":
      return list.filter((i) => isNew(c.equipped, i.key, (c.receivedAt || {})[i.key]));
    case "style":
      if (!style) return list;
      return list.filter((i) => stylesOf(i).includes(style));
    default:
      return list;
  }
}
