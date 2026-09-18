// ============================================================================
// ★出欠を つける ── ★決めごと 1か所（★裁定 その79 ／ 見本 `P_shukketsu`）
//
//   ★★出どころ
//     ★`00-動く見本-PC・iPad（運営）.html` の `P_shukketsu`
//     ★`00-動く見本（さわれる・全画面）.html` の `SC['出欠つけ']`
//
//   ★★★帯（タブ）は 作りません（★裁定 その79）。
//     ★★出欠は「いつ・誰の」が 要ります。★帯だけ では 入口が 決まりません。
//     ★★入口は 2つ ── ★ホーム → きょうの ながれ ／ ★日程 → コマを 押す。
//
//   ★見張り components/tests/ops-attendance.test.js
// ============================================================================

import { can } from "@/lib/opsPerms";
import { ATTENDANCE } from "@/lib/todayBand";

/** ★つける ときの 3つ（★字は `lib/todayBand.js` が 持ちます）。 */
export const MARKS = ATTENDANCE;

/**
 * ★つけられる か（★見本の `lock` ／ 台帳の `can_view_ops`）。
 *
 *   ★★見本 ──「つけられるのは、★自分が 担当して いる レッスンだけ」
 *            「事務は、先生に **代わって** つけられる」
 *   ★★台帳 ── `can_view_ops` は
 *     ★`is_org_owner_or_admin` **または** ★その 生徒の 担当（assignments）
 *
 *   ★★★画面は できことで 判じます（★A2）。★`shukketsu` を 持つ こと。
 *     ★★そのうえで、★見本の「自分の 担当か」も 見ます。
 *     ★★★台帳の 門は まだ 役割の 名 です（★台帳 08-1）。
 *       ★★だから 画面で 通しても、★台帳で 止まる ことが あり得ます。
 *       ★★★そのときは 黙りません。★画面に わけを 出します。
 */
export function mayMark(perms, { lesson, userId }) {
  if (!lesson || !userId) return false;
  if (!can(perms, "shukketsu")) return false;
  return true;
}

/** ★自分の レッスンか（★見本の `mine`）。 */
export function isMine(lesson, userId) {
  return !!(lesson && userId && lesson.teacher_id === userId);
}

/**
 * ★代わりに つけて いる か（★見本の `daiban`）。
 *
 *   ★★自分の レッスンでは ない のに、★つけられる とき。
 *   ★★★そのときは、★**必ず** その ことを お伝えします。
 *     ★★つけた人として、★ご自分の お名前が 残ります。
 *     ★★黙って 残すのは、★だまし討ち です。
 */
export function isActingFor(lesson, userId, perms) {
  return mayMark(perms, { lesson, userId }) && !isMine(lesson, userId);
}

/** ★代わりに つける ときの 断り（★見本の ままです）。 */
export const ACTING_NOTE =
  "あなたは 事務として、先生に 代わって つけています。あなたの お名前が 残ります。";

/**
 * ★つけられない ときに 出す 字（★見本の `lock` の 中）。
 *
 *   ★★★「お名前も 出しません」── ★ここが 肝 です。
 *     ★★よその 門下の 名簿は、★1人も 出しません。
 *     ★★「つけられない」と「見えない」を、★同時に 守ります。
 */
export const LOCKED_LINES = Object.freeze([
  "これは ほかの 先生の レッスンです。出席は つけられません。",
  "つけられるのは、自分が 担当して いる レッスンだけです。",
  "お名前も 出しません。"
]);

export const LOCKED_EMPTY = "ここには 何も 出ません。";
export const LOCKED_EMPTY_SUB =
  "日程の 表では、いつ・どこかは 見られます。中身は 出ません。";

/** ★いちばん 下の 注（★見本の `.note`。★減らしません）。 */
export const NOTES = Object.freeze([
  "出席は「担当して いる 人」が つけます。",
  "事務は、先生に 代わって つけられます（つけた人として 事務の 名前が 残ります）。",
  "生徒の 体調・記録の 中身は、どの 立場でも 出ません。",
  "休講＝その回を しなかった とき。生徒の 欠席に なりません。",
  "押した その場で 変わります。確認を 出しません。あとから 直せます。"
]);

/**
 * ★次に つける 方（★見本の `nx`）。
 *
 *   ★★まだ つけて いない 方の うち、★いま 見て いる 方 以外 の はじめ。
 *   ★★★戻らずに 次へ 行ける ように する ため です。
 */
export function nextUnmarked(lessons, currentId) {
  return (lessons || []).find((l) => l && l.id !== currentId && !l.attendance) || null;
}

/** ★数（★見本の「出席 8　休み 1　休講 0　まだ 3」）。 */
export function counts(lessons) {
  const out = { came: 0, absent: 0, canceled: 0, yet: 0 };
  (lessons || []).forEach((l) => {
    const a = l && l.attendance;
    if (a === "came" || a === "absent" || a === "canceled") out[a] += 1;
    else out.yet += 1;
  });
  return out;
}

/** ★数の 1行（★字は `MARKS` から。★書き写しません）。 */
export function countLine(lessons) {
  const c = counts(lessons);
  const 頭 = MARKS.map((m) => `${m.label} ${c[m.key]}`).join("　");
  return c.yet > 0 ? `${頭}　まだ ${c.yet}` : 頭;
}
