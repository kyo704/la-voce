// ============================================================================
// ★★★実技試験を 組む ── ★決めを 持つのは この ファイル だけ です
//
//   ★出どころ  裁定183 P5 ／ 裁定165
//     ／ 見本 `SC['実技試験を組む']`
//        woolsong-2026-09-21_1.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//        ★2026-09-24 に 確かめ
//
//   ★★★気づいた ことは **お知らせする だけ** です（★見本の 註）──
//     「どれも お知らせするだけです。こちらでは 動かしません・外しません。
//       決めるのは 運営です。」
//   ★★★だから「自動で 直す」「重なりを 避けて 組み直す」を 作りません。
//     ★数を 出す だけ です。★門下も **外しません**（★裁定183 P5「外さない」）。
//
//   ★★並べるのは 台帳です（`jury_layout`）。★時刻を 画面で 数えません。
// ============================================================================

export const COLS_SLOT = "id, org_id, event_id, student_id, student_name_at, place_id, accompanist_id, accompanist_name_at, starts_at, minutes, ord";

/** ★1人あたりの 分（★見本の 札）。 */
export const MINUTES = Object.freeze([10, 12, 15]);
/** ★あいだの 分（★見本の 札）。 */
export const GAPS = Object.freeze([0, 3, 5]);
/** ★部屋の 数（★見本の 札）。 */
export const ROOMS = Object.freeze([1, 2, 3]);

/** ★既定（★見本の はじめの 値）。 */
export const DEFAULTS = Object.freeze({ minutes: 12, gap: 3, rooms: 2, start: "13:00" });

/** ★"13:00" が 読めるか。 */
export function isTime(v) {
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(String(v || "").trim());
}

/** ★その日の "13:00" を 台帳に 渡す 形に します（★日本の 時間）。 */
export function startAt(dateYmd, hhmm) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateYmd || "")) || !isTime(hhmm)) return null;
  const [h, m] = String(hhmm).trim().split(":");
  return dateYmd + "T" + h.padStart(2, "0") + ":" + m + ":00+09:00";
}

/** ★終わりの ころ（★いちばん あとの 枠の 時こく）。★無ければ null。 */
export function endsAround(slots) {
  const 並 = (Array.isArray(slots) ? slots : []).filter((s) => s && s.starts_at);
  if (並.length === 0) return null;
  const 後 = 並.slice().sort((a, b) =>
    String(a.starts_at).localeCompare(String(b.starts_at)))[並.length - 1];
  return String(後.starts_at).slice(11, 16);
}

/**
 * ★気づいた こと。
 *
 *   ★★★数だけ です。★誰が どれかは 出しますが、★動かす 道は 作りません。
 *     ★「自分の 門下を 審査する」は **外す** ためでは ありません。
 *     ★★気づいて いただく ため です（★裁定183 P5）。
 */
export function noticeCounts(conflicts, monkaFlags) {
  const 重 = (Array.isArray(conflicts) ? conflicts : []).length;
  const 門 = (Array.isArray(monkaFlags) ? monkaFlags : []).filter((x) => x && x.is_monka).length;
  return { clash: 重, monka: 門 };
}

/** ★その 枠が 門下か。 */
export function isMonka(monkaFlags, slotId) {
  return (Array.isArray(monkaFlags) ? monkaFlags : [])
    .some((x) => x && x.slot_id === slotId && x.is_monka);
}

/** ★部屋の 名（★番号では なく 名で 出します）。★無ければ 空。 */
export function placeName(places, placeId) {
  if (!placeId) return "";
  const p = (Array.isArray(places) ? places : []).find((x) => x && x.id === placeId);
  return p ? (p.name || "") : "";
}

/**
 * ★伴奏者は 何人 で 回して いるか。
 *
 *   ★★★人の 数 です。★順位でも 出来ばえでも ありません。
 *   ★★名前は 数えません ── ★同じ 方が 何枠 出て いても 1人 です。
 */
export function accompanistCount(slots) {
  const 名 = new Set();
  (Array.isArray(slots) ? slots : []).forEach((s) => {
    const n = s && (s.accompanist_id || s.accompanist_name_at);
    if (n) 名.add(String(n));
  });
  return 名.size;
}

/** ★その 枠が ほかの 予定と 重なるか。 */
export function hasClash(conflicts, slotId) {
  return (Array.isArray(conflicts) ? conflicts : []).some((x) => x && x.slot_id === slotId);
}

/** ★見本の 言葉（★1字 も 足しません）。 */
export const JL_HEAD = "実技試験を 組む";
export const JL_HOW_HEAD = "並べ方";
export const JL_START = "はじまり";
export const JL_PER = "1人あたり";
export const JL_GAP = "あいだ";
export const JL_ROOM = "部屋";
export const JL_ORDER = "順番";
export const JL_ORDER_NOW = "学年 → 五十音";
export const JL_END = "終わりは ";
export const JL_END2 = "ごろ";
export const JL_NOTICE_HEAD = "気づいたこと";
export const JL_CLASH = "ほかの 予定と 重なる";
export const JL_MONKA = "自分の 門下を 審査する";
export const JL_ACCOMP = "伴奏者";
export const JL_JUDGES = "審査員";
export const JL_ACCOMP_COUNT = "人で 回します";
export const JL_TIME = "時刻";
export const JL_WHO = "受験する方";
export const JL_ROOM_ACCOMP = "部屋 ／ 伴奏";
export const JL_MONKA_TAG = "門下";
export const JL_MAKE = "組む";
export const JL_DECIDE = "この形で 決める";
export const JL_PAPER = "紙に 出す";
export const JL_TELL = "受験する方に 知らせる";
export const JL_SWAP = "入れ替える";
export const JL_CLASH_TAG = "と 重なり";
export const JL_ACCOMP_PRE = "伴奏 ";

/**
 * ★下の 但し書き（★見本の .note。★1字 も 足しません）。
 *
 *   ★★★3行目が 約束 です ──
 *     「順位・成績では 並べません。点は ここには 出ません。」
 *     ★★この 画面は 点を 1つも 読みません。★読む 形も ありません。
 */
export const JL_NOTE = Object.freeze([
  "決めると、この順番のまま 採点の 画面に 並びます（二度 打ち込みません）。",
  "順位・成績では 並べません。点は ここには 出ません。"
]);

/**
 * ★気づいた ことの 但し書き（★見本の .note。★1字 も 足しません）。
 *
 *   ★★★これが この 画面の かなめ です。
 *     ★仕組みは 数を 出す だけ。★決めるのは 運営 です。
 */
export const JL_NOTICE_NOTE = Object.freeze([
  "どれも お知らせするだけです。",
  "こちらでは 動かしません・外しません。決めるのは 運営です。"
]);
