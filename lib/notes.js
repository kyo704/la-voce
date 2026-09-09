// ============================================================================
// ノート ── Apple メモ方式（2026-09-09・見本⑥）
//
//   ★出どころ docs/opus/woolsong-見本-画面11点（9月9日）.png ⑥
//     「★タイトル欄は ありません。★保存ボタンも ありません。」
//     「★開いてから 1文字目までを、★いちばん短く。」
//
//   ★★見出しは、★本文の 1行目から 作ります。★列に しません。
//     ★★列に すると、★同じことが 2か所に 住みます。
//     ★★書き換えたのに 見出しが 古いまま、★が 起こります。
//
//   ★★保存ボタンが ありません。★黙って 上書きします。
//     ★★だから、★消えないことに いちばん 気を配ります。
//     ★手が 止まってから 少し 待って 送ります（★AUTOSAVE_MS）。
//     ★画面を 離れるとき、★待たずに 送ります（★呼ぶ側の 仕事です）。
//
//   ★★消しても、★行を 消しません（★deleted_at を 入れるだけ）。
//     ★「受け取ったもの・書いたものを 黙って 消さない」という 決めです。
//
//   ★見張り components/tests/notes.test.js
// ============================================================================

/** ★帯（★見本⑥の 4つ）。★増やしません。 */
export const NOTE_KINDS = Object.freeze([
  { key: "practice", label: "稽古" },
  { key: "repertoire", label: "レパートリー" },
  { key: "studio", label: "門下" },
  { key: "clinic", label: "受診用" }
]);

export const DEFAULT_KIND = "practice";

/** ★知らない 帯は 既定に 戻します。★勝手に 通しません。 */
export function kindOrDefault(kind) {
  return NOTE_KINDS.some((k) => k.key === kind) ? kind : DEFAULT_KIND;
}

export function kindLabel(kind) {
  const k = NOTE_KINDS.find((x) => x.key === kind);
  return k ? k.label : "";
}

/** ★手が 止まってから、★これだけ 待って 送ります。 */
export const AUTOSAVE_MS = 900;

/** ★一覧に 出す 見出しの 長さ。 */
export const TITLE_MAX = 40;

/**
 * ★見出し（★本文の 1行目）。
 *
 *   ★★1行目が 空なら、★次の 中身の ある行を 探します。
 *     ★改行から 書きはじめる方が います。★そこで 諦めません。
 *   ★何も 書いていなければ null。★「無題」と 書きません。
 *     ★★書いていないものに、★こちらが 名前を つけません。
 */
export function titleOf(body) {
  const lines = String(body || "").split("\n");
  const first = lines.map((l) => l.trim()).find((l) => l.length > 0);
  if (!first) return null;
  return first.length > TITLE_MAX ? first.slice(0, TITLE_MAX) : first;
}

/** ★見出しの あとの 本文（★一覧の 2行目に 出します）。 */
export function previewOf(body) {
  const lines = String(body || "").split("\n").map((l) => l.trim());
  const i = lines.findIndex((l) => l.length > 0);
  if (i === -1) return null;
  const rest = lines.slice(i + 1).filter((l) => l.length > 0).join(" ");
  return rest ? rest.slice(0, 60) : null;
}

/** ★何も 書いていない ノートか（★空のまま 残さないため）。 */
export function isEmpty(note) {
  return !note || String(note.body || "").trim().length === 0;
}

/** ★消していない ものだけ。★deleted_at が 入っていれば 出しません。 */
export function alive(notes) {
  return (notes || []).filter((n) => n && !n.deleted_at);
}

/**
 * ★並び。★新しい順です。
 *
 *   ★★updated_at で 並べます。★書き足した ものが 上に 来ます。
 */
export function sortNotes(notes) {
  return [...(notes || [])].sort((a, b) => {
    const x = String((a && a.updated_at) || (a && a.created_at) || "");
    const y = String((b && b.updated_at) || (b && b.created_at) || "");
    return x < y ? 1 : x > y ? -1 : 0;
  });
}

/**
 * ★この中から さがす（★見本⑥）。
 *
 *   ★★本文だけを 見ます。★日付や 帯では 探しません。
 *     ★書いた 言葉で 探すのが、★この欄の 役目です。
 *   ★大文字・小文字を 分けません。
 */
export function searchNotes(notes, q) {
  const s = String(q || "").trim().toLowerCase();
  if (!s) return notes || [];
  return (notes || []).filter((n) => String((n && n.body) || "").toLowerCase().includes(s));
}

/**
 * ★その帯の ノートを、★探して・消していないものだけ・新しい順で。
 *
 *   ★★1つの 関数に します。★画面で 3回 つなぎません。
 */
export function visibleNotes(notes, kind, q) {
  const k = kindOrDefault(kind);
  return sortNotes(searchNotes(alive(notes).filter((n) => n.kind === k), q));
}

/** ★「9月8日（月）」。 */
const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

export function dayWord(iso) {
  const s = String(iso || "");
  if (s.length < 10) return "";
  const y = Number(s.slice(0, 4)), m = Number(s.slice(5, 7)), d = Number(s.slice(8, 10));
  const w = WEEK[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}月${d}日（${w}）`;
}
