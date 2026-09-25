// ============================================================================
// ★公演の 一覧 ── ★公演は いくつも 同時に 動きます（★2026-09-25・D群）
//
//   ★見本 `SC['公演の一覧']`（★design-v63）。
//
//   ★★★坂本さんの ご指摘 ──「公演が 1つ 前提に なって いる」。
//     ★Opus の わけ ──「★台帳は 元々 複数対応して いたが 見本だけ 1つ 前提だった」。
//     ★★台帳を 確かめました（2026-09-25・本番）── ★そのとおり です ──
//       ★`koen_members` は `(koen_id, user_id)` の 行 です。★何行でも 持てます。
//       ★`koen` の 決まりは `koen_select` 1本 ── ★入って いる 公演が 返ります。
//
//   ★★★3つの 約束（★見本の `.note`・1文字も 変えないこと）──
//     ①「掛け持ちの 公演は、お互いに 見えません。」
//     ②「稽古が 重なるときは、「きょう」に お知らせします（動かすのは あなたです）。」
//     ③「終わった 公演も 残ります（見るだけに なります）。」
//
//   ★★★①は 決まりが 守って います ── ★`koen_members` に 自分の 行が ある
//     ★公演 だけ が 返ります。★ほかの 出演者から 見て、★その方が どの 公演に
//     ★出て いるかは 分かりません。
//
//   ★★★②は「お知らせします」だけ です ── ★**動かしません**。
//     ★重なりを 直すのは その方 です。★こちらで 寄せません。
//
//   ★★★③は 取り上げない 決め です（★CLAUDE.md）── ★終わっても 消しません。
//     ★`koen.status` で 見分けます。★行を 消しません。
//
//   ★★★数を 出しません ── ★見本の「3つ」は 件数 です。
//     ★「あと◯」も「◯％」も 出しません。
// ============================================================================
import { COLS_KOEN } from "@/lib/koenInfo";

/** ★引く 列（★`lib/koenInfo.js` の ものを そのまま 使います）。★並べ直しません。 */
export { COLS_KOEN };

/** ★自分の 出番の 列 だけ。 */
export const COLS_MY_MEMBER = "koen_id, part, can_manage";

/** ★台帳の 関数（★つぎの 予定を 出す ため）。 */
export const SCHEDULE_FN = "my_koen_schedule";

/** ★題と 戻り先（★見本）。 */
export const TITLE = "公演";
export const BACK_TO = "もっと";

/** ★小見出し（★見本「3つ　／　押すと その公演へ」）。★数だけ です。 */
export function subLine(n) {
  return String(Number(n) || 0) + "つ　／　押すと その公演へ";
}

/** ★いま 見て いる 公演の 印（★見本 `いま`）。 */
export const NOW_MARK = "いま";

/** ★押しどころ（★見本の `.btn.g`）。 */
export const BTN_JOIN = "＋ 公演に 入る";

/** ★1つも 無い とき。★責めません。★入り方を 書きます。 */
export const EMPTY_LINE = "まだ 入って いません。";
export const EMPTY_HOW = "合言葉か お招きで 入れます。";

/**
 * ★終わった 公演か。
 *
 *   ★★★終わっても 消しません（★約束③）。★見るだけに します。
 *   ★★知らない 字は「終わって いない」に 倒します ── ★見えなく しません。
 */
export const DONE_STATUSES = Object.freeze(["done", "closed", "ended"]);
export function isDone(koen) {
  return DONE_STATUSES.includes(String((koen || {}).status || ""));
}
export const DONE_MARK = "見るだけ";

/**
 * ★1行 ぶんを 組みます。
 *
 *   ★★`org` …… 主催の 名。★無い ことが あります（★市民オペラ には 学校が ありません）。
 *     ★★★無い ときは 空に します ──「主催なし」と 書きません。
 *   ★★`next` …… つぎの 予定（★`my_koen_schedule` の いちばん 近い もの）。
 */
export function rowOf(koen, member, orgName, next) {
  const k = koen || {};
  const 役 = (member || {}).part || "";
  return {
    id: k.id,
    title: k.title || "",
    org: orgName || "",
    part: 役,
    openOn: k.opens_on || "",
    next: next || "",
    done: isDone(k)
  };
}

/**
 * ★並べ替え ── ★本番の 日が 近い ものから。★終わった ものは 後ろ。
 *
 *   ★★★「よく 使う 順」に しません ── ★数えて いる ように 見えます。
 */
export function sortRows(rows) {
  const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
  return [...list].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return String(a.openOn || "9999").localeCompare(String(b.openOn || "9999"));
  });
}

/**
 * ★`my_koen_schedule` の 行から、★公演ごとの いちばん 近い 予定を 出します。
 *
 *   ★★返すのは `{ [koen_id]: 字 }` です。
 *   ★★★字は 見本の 形 ──「稽古 10月3日」。★何の 予定かと、★日。
 */
export function nextByKoen(rows, kindWord) {
  const 出 = {};
  for (const r of (Array.isArray(rows) ? rows : [])) {
    if (!r || !r.koen_id || !r.starts_at) continue;
    const 前 = 出[r.koen_id];
    if (前 && String(前.at) <= String(r.starts_at)) continue;
    出[r.koen_id] = { at: r.starts_at, kind: r.kind };
  }
  const 字 = {};
  for (const id of Object.keys(出)) {
    const d = new Date(出[id].at);
    const 日 = Number.isNaN(d.getTime())
      ? "" : (d.getMonth() + 1) + "月" + d.getDate() + "日";
    const 名 = (kindWord && kindWord(出[id].kind)) || "";
    字[id] = [名, 日].filter(Boolean).join(" ");
  }
  return 字;
}

/** ★下の 3行（★出る 方・★見本の `.note`・1文字も 変えないこと）。 */
export const NOTE_LINES = Object.freeze([
  "掛け持ちの 公演は、お互いに 見えません。",
  "稽古が 重なるときは、「きょう」に お知らせします（動かすのは あなたです）。",
  "終わった 公演も 残ります（見るだけに なります）。"
]);

// ============================================================================
// ★★★同じ 名の 画面が 2つ あります ── ★幅で 見せ方が 変わる 1枚 です
//
//   ★電話の 見本 `SC['公演の一覧']` …… ★出る 方。★札（カード）で 並べます。
//   ★運営の 見本 `P_koenList`　　 …… ★作る 方。★表で 並べます
//     （★公演／本番／人数／期限）。
//
//   ★★★2つの 画面では ありません。★同じ 一覧の、★狭い ときと 広い とき です。
//     ★★`components/OpsShell.jsx` の 決め ──
//       「★幅で 中身を 止めません。★見せ方を 変えるだけです」（2026-09-09）。
//     ★★だから 1つの 部品が、★狭い ときは 札、★広い ときは 表に します。
//
//   ★★★表に する 幅は `lib/opsRosterTable.js` と 同じ 考え で 出します ──
//     ★列の 最小幅を 足します。★数を 書きません。
//     ★列を 足した 日に、★境目が ひとりでに 動きます。
// ============================================================================

/** ★表の 列（★運営の 見本の 見出しの まま）。★最小幅は 目で 測った 値 です。 */
export const TABLE_COLUMNS = Object.freeze([
  { key: "title", label: "公演", min: 240 },
  { key: "open", label: "本番", min: 180 },
  { key: "people", label: "人数", min: 90, num: true },
  { key: "until", label: "期限", min: 150 }
]);
export const TABLE_PADDING_X = 28;
export const TABLE_AT =
  TABLE_COLUMNS.reduce((n, c) => n + c.min, 0) + TABLE_PADDING_X;

/** ★表に するか。★幅が 分からない うちは 出しません（★狭い ほうへ 倒します）。 */
export function showTable(width) {
  return typeof width === "number" && width >= TABLE_AT;
}

/** ★作る 方の 押しどころ（★運営の 見本）。 */
export const BTN_NEW = "＋ 公演を 作る";

/** ★人数の 字（★運営の 見本「36 / 40」）。★％を 出しません。 */
export function peopleWord(n, cap) {
  const a = Number(n), b = Number(cap);
  if (!Number.isFinite(a)) return "";
  return Number.isFinite(b) ? a + " / " + b : String(a);
}

/** ★期限の 字（★運営の 見本「3月24日まで」）。★過ぎても 消しません。 */
export function untilWord(until) {
  const s = String(until || "").trim();
  return s ? s + "まで" : "—";
}

/**
 * ★作る 方の 下の 3行（★運営の 見本の `.note`・1文字も 変えないこと）。
 *
 *   ★★1行目に いまの 公演の 題が 入ります。★呼ぶ 側が 渡します。
 *   ★★★3行目は 出る 方の 3行目と 同じ 約束 です ── ★消しません。
 */
export function opsNoteLines(nowTitle) {
  return [
    "いま 開いているのは " + (nowTitle || "") + "です。",
    "ほかの 公演を 押すと、香盤表も 稽古も その公演の ものに 変わります。",
    "期限を 過ぎた 公演も 残ります（見るだけに なります）。"
  ];
}
