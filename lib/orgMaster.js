// ============================================================================
// ★学校の 基本（★見本 `stKoma` ／ `stPlace`）── ★決めごと 1か所
//
//   ★★★学校の コマは「全員の 画面の もと」です。
//     ★★先生は その 中で ご自分の コマを 決めます（★`my_periods`）。
//     ★★★学校の ぶんと、★ご自分の ぶんは 別の 表 です。★上書きしません。
//
//   ★★★直せるのは `koma` を 持つ 方 だけ です。★ほかの 方は 見るだけ。
//     ★★台帳も 同じ 門 です。★画面だけで 守りません。
//
//   ★見張り components/tests/org-master.test.js
// ============================================================================

import { can } from "@/lib/opsPerms";

export const KOMA_HEAD = "時間の 割り方（学校の 基本）";
export const KOMA_NOTE = Object.freeze([
  "これが 学校の 基本です。全員の 画面の もとに なります。",
  "先生は、この 中で 自分の コマを 決められます。"
]);
export const PLACE_HEAD = "場所";
export const PLACE_HINT = "れい：第4練習室";

/** ★直せる 方（★`koma`）。 */
export function mayEditMaster(perms) {
  return can(perms, "koma");
}

/** ★「9:00」→ 540。★読めなければ null。 */
export function toMin(t) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || "").trim());
  if (!m) return null;
  const h = Number(m[1]), mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}

/** ★540 →「9:00」。 */
export function hhmm(min) {
  const v = Number(min);
  if (!Number.isFinite(v)) return "";
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;
}

/** ★長さ（分）。★見本は「長さ」の 列を 出して います。 */
export function lengthOf(row) {
  const s = Number(row && row.start_min), e = Number(row && row.end_min);
  if (!Number.isFinite(s) || !Number.isFinite(e)) return null;
  return e - s;
}
export function lengthWord(row) {
  const n = lengthOf(row);
  return n == null ? "—" : `${n}分`;
}

/**
 * ★入れて よい コマか。
 *
 *   ★★★終わりが はじまりより あと で ある こと。
 *   ★★名前が ある こと。★空の 行を 作りません。
 */
export function periodOk(row) {
  const s = toMin(row && row.start);
  const e = toMin(row && row.end);
  if (!String((row && row.name) || "").trim()) return false;
  if (s == null || e == null) return false;
  return e > s;
}
export function whyPeriodBad(row) {
  if (!String((row && row.name) || "").trim()) return "名前を 入れて ください。";
  const s = toMin(row && row.start);
  const e = toMin(row && row.end);
  if (s == null || e == null) return "時刻を 9:00 の 形で 入れて ください。";
  if (e <= s) return "終わりを、はじまりより あとに して ください。";
  return "";
}

/**
 * ★重なって いる コマ（★印を つける だけ。★止めません）。
 *
 *   ★★★学校に よっては、★重ねる ことも あります（★午前・午後の 別 など）。
 *     ★★こちらで 決めません。★見える ように する だけ です。
 */
export function overlaps(rows) {
  const 出 = [];
  const 並 = [...(rows || [])].sort((a, b) => Number(a.start_min) - Number(b.start_min));
  for (let i = 1; i < 並.length; i += 1) {
    if (Number(並[i].start_min) < Number(並[i - 1].end_min)) {
      出.push([並[i - 1].id, 並[i].id]);
    }
  }
  return 出;
}
export const OVERLAP_WORD = "前の コマと 重なって います";

/** ★場所は 名前 だけ です。★同じ 名前を 2つ 作りません。 */
export function placeOk(name, rows) {
  const n = String(name || "").trim();
  if (!n) return false;
  return !(rows || []).some((r) => String(r.name).trim() === n);
}
export function whyPlaceBad(name, rows) {
  if (!String(name || "").trim()) return "名前を 入れて ください。";
  if (!placeOk(name, rows)) return "同じ 名前が すでに あります。";
  return "";
}

export const DELETE_ASK = "消しますか。";
export const DELETE_NOTE = "使って いる ところからは 消えません。これからの ぶん だけ です。";
export const FAILED_LINE = "いま 直せませんでした。もう一度 お試し ください。";
