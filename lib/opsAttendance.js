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

// ----------------------------------------------------------------------------
// ★入口 ②── ★日程の コマを 押す（★裁定 その79 ／ ★2026-09-18・段取り1）
// ----------------------------------------------------------------------------
//   ★★★入口は 2つ です（★上の 註）。
//     ★① ホーム → きょうの ながれ → その 行　…… ★2026-09-18 に 通りました
//     ★② 日程 → コマを 押す　　　　　　　…… ★ここ
//   ★★★半分だけ 開いて いる のを、★塞がずに 置きません。
//     ★★片方 しか 無いと、★日程を 見て いる 方は 一度 ホームへ 戻ります。
//
//   ★★見本 `P_nittei` ──
//     ★重なりの コマ … `push('重なり')`
//     ★それ 以外 …… `push('出欠つけ', …)`
//   ★★★重なりの コマは 出欠へ 行きません。★先に どちらを 動かすかを 決めます。

/** ★コマを 押した ときの 行き先。 */
export const TAP_GOES = Object.freeze({
  OVERLAP: "overlap",
  ATTENDANCE: "attendance",
  NOTHING: "nothing"
});

/**
 * ★その コマを 押したら どこへ 行くか。
 *
 *   ★★`dup` …… ★重なって いる コマか（★画面が 数えます）
 *   ★★`perms` … ★見て いる 方の できこと
 *
 *   ★★★`shukketsu` が 無ければ、★どこへも 行きません。
 *     ★★押せる ように 見せません（★§8⑤）。
 *     ★★★ただし 重なりは、★`shukketsu` が 無くても 見られます。
 *       ★★あれは「どこが ぶつかって いるか」です。★出欠では ありません。
 */
export function tapGoesTo({ dup, perms }) {
  if (dup) return TAP_GOES.OVERLAP;
  return can(perms, "shukketsu") ? TAP_GOES.ATTENDANCE : TAP_GOES.NOTHING;
}

/**
 * ★押せる コマか（★押しどころに するか）。
 *
 *   ★★行き先が 無い ものは、★押しどころに しません。
 *   ★★★`<div>` の まま 置きます。★押して 何も 起きない、を 作りません。
 */
export function tappable(args) {
  return tapGoesTo(args) !== TAP_GOES.NOTHING;
}

// ============================================================================
// ★まとめて つける（★裁定 その91 R4・2026-09-18）
// ============================================================================
//   ★★★裁定 その91 ── ★見本が 正。★一括を 採ります。
//     ★★裁定 その79 は「ホーム 1画面」の 話 でした。★出欠の 形は 決めて いません。
//     ★★★20人の 門下で、★1人ずつ 押すのは 20回 です。
//       ★★実際は「ほとんど 出席、★休みは 1〜2人」です。
//       ★★既定を 出席に して、★ちがう 方だけ 直す ほうが 実際に 合います。
//
//   ★★★決め（★裁定 その91）
//     ★① 開いた とき、★まだ つけて いない 方は **出席** に します。
//     ★② 保存する まで **台帳に 書きません**。
//     ★③ 保存の 前に「◯人を つけました」と 出します。
//     ★④ 一度も 触らずに 保存できる ように します（★先生の ご判断 です）。
//
//   ★★★もとから つけて ある ものは、★上書きしません。
//     ★★きのう「休み」と つけた 方が、★開いた だけ で「出席」に なっては いけません。
//     ★★★裁定の「開いた 時点で 全員が 出席」は、★**まだ 白い** 方の 話 です。
//       ★★この 読みで 進めます。★ちがって いれば お直し ください。

/** ★既定の しるし（★開いた ときに、★白い 方に 入る もの）。 */
export const DEFAULT_MARK = "came";

/**
 * ★下書きを 作ります（★台帳には まだ 書きません）。
 *
 *   ★★つけて ある 方 …… ★その まま
 *   ★★まだ 白い 方 …… ★出席
 */
export function draftOf(lessons) {
  const out = {};
  (lessons || []).forEach((l) => {
    if (!l || !l.id) return;
    out[l.id] = l.attendance || DEFAULT_MARK;
  });
  return out;
}

/** ★下書きの 1つを 変えます。★同じ ものを もう一度 押すと、★白に 戻します。 */
export function setDraft(draft, id, mark) {
  const out = { ...(draft || {}) };
  if (out[id] === mark) delete out[id];
  else out[id] = mark;
  return out;
}

/**
 * ★台帳に 書く ぶん だけ を 出します。
 *
 *   ★★★変わって いない ものを 書きません。
 *     ★★書くと、★つけた人と 時刻が 塗り替わります。
 *     ★★「触って いないのに 私の 名が 残った」に なります。
 */
export function changedRows(lessons, draft) {
  const d = draft || {};
  return (lessons || []).filter((l) => {
    if (!l || !l.id) return false;
    const 前 = l.attendance || null;
    const 後 = d[l.id] || null;
    return 前 !== 後;
  }).map((l) => ({ lesson: l, mark: d[l.id] || null }));
}

/** ★下書きの 数（★裁定 その91 R5）。 */
export function draftCounts(lessons, draft) {
  const d = draft || {};
  const out = { total: 0, came: 0, absent: 0, canceled: 0, yet: 0 };
  (lessons || []).forEach((l) => {
    if (!l || !l.id) return;
    out.total += 1;
    const v = d[l.id];
    if (v === "came" || v === "absent" || v === "canceled") out[v] += 1;
    else out.yet += 1;
  });
  return out;
}

/**
 * ★数の 1行（★裁定 その91 R5）。
 *
 *   ★★見本 ──「20人中、出席18／休み2」
 *   ★★★率（％）を 出しません（★裁定 その90）。★「18/20」の 形にも しません。
 *     ★★見た人が 割るのと、★画面が 割って 見せるのは 別 です。
 *   ★★0の ものは 出しません。★「休講 0」を 並べません。
 */
export function bulkCountLine(lessons, draft) {
  const c = draftCounts(lessons, draft);
  const 出 = [];
  MARKS.forEach((m) => { if (c[m.key] > 0) 出.push(`${m.label}${c[m.key]}`); });
  if (c.yet > 0) 出.push(`まだ ${c.yet}`);
  return `${c.total}人中、${出.join("／")}`;
}

/** ★保存の 前に 出す 1行（★裁定 その91 R4 の 注意）。 */
export function saveWord(lessons, draft) {
  const n = changedRows(lessons, draft).length;
  return n > 0 ? `${n}人を つけました` : "変えた ところは ありません";
}

/**
 * ★まとめて つける 姿に するか。
 *
 *   ★★同じ 時刻・同じ 先生の コマが 2つ 以上 ある とき です。
 *   ★★1つ だけ なら、★これまで どおり 1人の 画面 です。
 */
export function isBulk(lessons) {
  return (lessons || []).length > 1;
}

// ----------------------------------------------------------------------------
// ★一覧の 中を 移る（★裁定 その91 R3）
// ----------------------------------------------------------------------------
//   ★★20人を 開く なら、★次へ・前へ が 要ります。
//   ★★まとめて つける ときも、★1人ずつ 直す ときは 同じ です。

/** ★いまの 方の 位置（★0 から）。★見つからなければ -1。 */
export function indexOf(lessons, currentId) {
  return (lessons || []).findIndex((l) => l && l.id === currentId);
}

/** ★次の 方（★終わりなら null。★回りません）。 */
export function nextOf(lessons, currentId) {
  const i = indexOf(lessons, currentId);
  if (i < 0) return null;
  return (lessons || [])[i + 1] || null;
}

/** ★前の 方（★はじめなら null）。 */
export function prevOf(lessons, currentId) {
  const i = indexOf(lessons, currentId);
  if (i <= 0) return null;
  return (lessons || [])[i - 1] || null;
}

/** ★何人中 何人目（★見本の「いま」）。 */
export function positionWord(lessons, currentId) {
  const i = indexOf(lessons, currentId);
  const n = (lessons || []).length;
  if (i < 0 || n === 0) return "";
  return `${n}人中 ${i + 1}人目`;
}

// ----------------------------------------------------------------------------
// ★戻り道（★裁定 その91 R1）
// ----------------------------------------------------------------------------
//   ★★つけられない 役職でも、★来た 道に 戻れる こと。
//   ★★見本 ──「戻る」と「自分の レッスンを 見る」。
export const BACK_LABEL = "もどる";
export const BACK_MINE_LABEL = "自分の レッスンを 見る";
