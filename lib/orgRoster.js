// ============================================================================
// 名簿と、そのご請求（2026-09-09・第3便・見本③⑦）
//
//   ★出どころ docs/opus/woolsong-教室機能の正（9月9日・最終稿）.md §10
//     「★名簿1人あたり 月 ¥400　★月額の下限 ¥12,800
//      ★名簿100人以上 1人 ¥350　★名簿300人以上 1人 ¥250
//      ★初期費用 ★名簿50人以上のときだけ ¥50,000
//      ★年の一括前払い ★2か月分を引く」
//
//   ★★「名簿の人数」＝ その教室に 在籍している 生徒・学生の数。
//     ★★休会中は 数えません。
//     ★★先生・事務は 何人いても 数えません。
//     ★掛け持ちの先生・複数教室の生徒は 教室ごとに1
//       （★「掛け持ちだから半額」を 作らない）。
//
//   ★★「2つの計算のうち、★安いほうを 当てます」（★§10）。
//     ★★これは、★段の 境目で 損をさせない ための 決めです。
//     ★95人が 38,000円で、★100人が 35,000円 だとしたら、
//       ★★人数が 少ないほうが 高くなります。★それを 起こさせません。
//     ★だから、★どの段の 式でも 数えて、★いちばん 安いものを 当てます。
//
//   ★★用語（★§10-1）。★「席」とは 呼びません。★「名簿の人数」です。
//     ★教室が 買っているのは「生徒のアクセス」では なく「事務」だからです。
//     ★生徒本人の 記録と 利用は、★名簿に 載っていても いなくても 無料です。
//
//   ★見張り components/tests/org-roster.test.js
// ============================================================================

/** ★数えない 役割。★何人 いても 数えません（★§10）。 */
export const NOT_COUNTED_ROLES = Object.freeze(["teacher", "staff", "owner", "admin"]);

/** ★数える ようす。★休会中は 数えません。 */
export const COUNTED_STATUSES = Object.freeze(["enrolled"]);

/** ★名簿の ようす（★見本③の「ようす」の 欄）。 */
export const STATUSES = Object.freeze([
  { key: "enrolled", label: "在籍中", counted: true },
  { key: "paused", label: "休会中", counted: false },
  { key: "invited", label: "招待中", counted: false, note: "返事まち" }
]);

export function statusLabel(key) {
  const s = STATUSES.find((x) => x.key === key);
  return s ? s.label : "在籍中";
}

/** ★数える 1人か。 */
export function isCounted(member) {
  if (!member) return false;
  if (NOT_COUNTED_ROLES.includes(member.role)) return false;
  return COUNTED_STATUSES.includes(member.status || "enrolled");
}

/**
 * ★名簿の 人数（★ご請求の 人数）。
 *
 *   ★★先生・事務は 数えません。★休会中も 数えません。
 */
export function rosterCount(members) {
  return (members || []).filter(isCounted).length;
}

/** ★ようす ごとの 数（★見本③の 下の 帯）。 */
export function countsByStatus(members) {
  const out = { counted: 0, paused: 0, invited: 0, notCounted: 0 };
  (members || []).forEach((m) => {
    if (!m) return;
    if (NOT_COUNTED_ROLES.includes(m.role)) { out.notCounted += 1; return; }
    const st = m.status || "enrolled";
    if (st === "paused") out.paused += 1;
    else if (st === "invited") out.invited += 1;
    else out.counted += 1;
  });
  return out;
}

// ---------------------------------------------------------------------------
// ★お金（★§10）
//
//   ★★ここは「いくらに なるか」を 数えるだけです。
//     ★★お支払いを 受け取る 仕組みは、★まだ ありません。
//     ★数えたものを、★お見積りに 使います。
// ---------------------------------------------------------------------------

/** ★段。★min は「その段が 当たりはじめる 人数」です。 */
export const TIERS = Object.freeze([
  { min: 1, rate: 400 },
  { min: 100, rate: 350 },
  { min: 300, rate: 250 }
]);

/** ★月額の 下限。 */
export const MONTHLY_FLOOR = 12800;

/** ★初期費用。★名簿50人以上の ときだけ。 */
export const SETUP_FEE = 50000;
export const SETUP_FEE_FROM = 50;

/** ★年の 一括前払いで 引く 月数。 */
export const YEARLY_FREE_MONTHS = 2;

/**
 * ★月々の ご請求（円）。
 *
 *   ★★どの段の 式でも 数えて、★いちばん 安いものを 当てます（★§10）。
 *     ★段の 境目で、★人数が 少ないほうが 高くなる、を 起こさせません。
 *   ★★そのうえで、★下限を 当てます。
 *   ★0人なら 0円。★下限を 当てません。★使っていない 教室に 請求しません。
 */
export function monthlyFee(count) {
  const n = Number(count);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const candidates = TIERS.map((t) => Math.max(n, t.min) * t.rate);
  return Math.max(Math.min(...candidates), MONTHLY_FLOOR);
}

/** ★初期費用。★名簿50人以上の ときだけ。 */
export function setupFee(count) {
  const n = Number(count);
  return Number.isFinite(n) && n >= SETUP_FEE_FROM ? SETUP_FEE : 0;
}

/** ★年の 一括前払い（★2か月分を 引く）。 */
export function yearlyFee(count) {
  return monthlyFee(count) * (12 - YEARLY_FREE_MONTHS);
}

/** ★1人あたり（★見本⑤の「1人あたり」）。★割り切れないときは 丸めます。 */
export function perHead(count) {
  const n = Number(count);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(monthlyFee(n) / n);
}

/** ★円を 読みやすく。★「20,800」。 */
export function yen(n) {
  return Number(n || 0).toLocaleString("ja-JP");
}
