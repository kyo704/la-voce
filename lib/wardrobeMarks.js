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
  { key: "often", label: "よく着る" },
  { key: "owned", label: "もっている" },
  { key: "fav", label: "お気に入り" },
  { key: "new", label: "新着" },
  { key: "style", label: "系統" }
]);

// ★★「よく着る」を、★札に移しました（★2026-09-08・坂本さんの決め）。
//   ★★もとは、シートの段（少しだけ／半分／全部）で切り替えていました。
//     ★引き上げ具合で中身が変わるので、★予告なく減ったように見えます。
//     ★実機で「分かりにくい」とご指摘をいただきました。
//   ★★札にすると、★押したときだけ変わります。★自分で選べます。

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

/**
 * ★1つぶんの記録を、★{ n, last } にそろえます。
 *
 *   ★★前は、数だけ（3）で持っていました。
 *     ★古い形も、そのまま読めるようにします。★消しません。
 */
function wearOf(c, key) {
  const v = c[key];
  if (typeof v === "number") return { n: v, last: null };
  if (v && typeof v === "object") return { n: Number(v.n) || 0, last: v.last || null };
  return { n: 0, last: null };
}

/**
 * ★着た回数を、1つ足します。
 *
 *   ★★いつ着たかも、★1つだけ持ちます（★最後の日）。
 *     ★仕様 §7 は「直近30日」と書いています。
 *     ★★1回ずつ日付を持つと、★際限なく増えます。
 *       ★何年も使う方の入れ物が、★どこまでも太ります。
 *     ★だから「最後に着た日」1つで、★30日を見ます。
 *   ★日付は、呼ぶ側が渡します（★ここで new Date() を呼びません）。
 */
export function countWear(equipped, key, nowISO) {
  const c = wearCountsOf(equipped);
  const cur = wearOf(c, key);
  return {
    ...(equipped || {}),
    wearCounts: { ...c, [key]: { n: cur.n + 1, last: nowISO || cur.last } }
  };
}

/** ★30日ぶん、さかのぼった日（★呼ぶ側が今日を渡します）。 */
export function daysAgoISO(todayISO, days) {
  if (!todayISO) return null;
  const d = new Date(String(todayISO).slice(0, 10) + "T00:00:00Z");
  if (isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * ★よく着るもの。★多い順に返します。
 *
 *   ★★数は返しません。★鍵だけです。★出す先で数えられないように。
 *   ★★直近30日のものを先に見ます（★仕様 §7）。
 *     ★30日のうちに4点そろわなければ、★それより前のものも足します。
 *     ★★空の棚を出さないためです。★「よく着るもの」が0点では、意味がありません。
 *   ★slot を渡すと、★その置き場所のものだけを返します。
 */
export function oftenWorn(equipped, { limit = 4, todayISO = null, itemSlotOf = null, slot = null } = {}) {
  const c = wearCountsOf(equipped);
  const since = todayISO ? daysAgoISO(todayISO, 30) : null;
  const keys = Object.keys(c).filter((k) => wearOf(c, k).n > 0)
    .filter((k) => !slot || !itemSlotOf || itemSlotOf(k) === slot);
  const rank = (a, b) => wearOf(c, b).n - wearOf(c, a).n || a.localeCompare(b);
  const recent = since
    ? keys.filter((k) => (wearOf(c, k).last || "") >= since).sort(rank)
    : keys.slice().sort(rank);
  if (recent.length >= limit) return recent.slice(0, limit);
  const rest = keys.filter((k) => !recent.includes(k)).sort(rank);
  return [...recent, ...rest].slice(0, limit);
}

/**
 * ★お気に入りを、★先頭に集めます（★仕様 §7）。
 *
 *   ★★並べ替えるだけです。★落としません。
 *   ★★元の並び（lib/sheepWardrobe.js の sortForShop）は、そのあとに続きます。
 */
export function favoritesFirst(items, equipped) {
  const fav = new Set(favoritesOf(equipped));
  const list = Array.isArray(items) ? items : [];
  return [...list.filter((i) => fav.has(i.key)), ...list.filter((i) => !fav.has(i.key))];
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
    case "often": {
      // ★★よく着るもの（★仕様 §7）。★4点だけ、ではありません。
      //   ★札で選んだときは、★その置き場所で着たものを、多い順に出します。
      const often = oftenWorn(c.equipped, {
        limit: 999, todayISO: c.todayISO,
        itemSlotOf: c.itemSlotOf, slot: c.slot
      });
      return list.filter((i) => often.includes(i.key));
    }
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
