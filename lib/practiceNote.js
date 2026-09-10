// ============================================================================
// ★稽古の メモ ── ★何を 聞くか（★2026-09-11）
//
//   ★出どころ docs/design/pack-final/裁定-9月10日夜の7点（役職名…）.md §1
//     「★私の 手落ちです。『＋』を 押しても 同じ 白紙が 出ていました。
//       ★書くことが 違うので、聞く項目を 分けました」
//
//     稽古の メモ　★その日 言われたことを 残す
//       いつ ／ だれに ／ みた曲（レパートリーから）
//       ★言われたこと（そのまま）
//       ★次に 自分が すること（1つ）
//       できるように なったこと（書かなくてよい）
//
//   ★★「どちらにも 出来ばえ・点数の 欄は ありません」
//     ★★作らないこと。★あとから 足さないこと。
//
//   ★★「みた曲」は、★レパートリーから 選びます。★自由に 打たせません。
//     ★★打たせると、★同じ曲が 2つの 名前で 増えます。
//       ★★そうなると「その曲の 稽古の メモ」が 引けません。
//
//   ★★書かなくても 出します。★1つも 必須に しません。
//     ★書けない 日が あります。★空の ままでも 残せます。
//
//   ★見張り components/tests/practice-note.test.js
// ============================================================================

/**
 * ★稽古の メモの 欄（★裁定の 並びの まま）。
 *
 *   key   … 表の 列の 名前
 *   label … 見本の 文字。★1文字も 変えないこと
 *   kind  … date ／ text ／ area ／ repertoire
 *   note  … 下に そえる 1行（★無ければ null）
 */
export const PRACTICE_FIELDS = Object.freeze([
  { key: "lesson_on", label: "いつ", kind: "date", note: null },
  { key: "teacher_label", label: "だれに", kind: "text", note: null },
  { key: "repertoire_name", label: "みた曲", kind: "repertoire", note: null },
  { key: "said_text", label: "言われたこと", kind: "area", note: "そのまま 書いてください。まとめなくて かまいません。" },
  { key: "next_action", label: "次に 自分が すること", kind: "area", note: "1つだけ。" },
  { key: "gained_text", label: "できるように なったこと", kind: "area", note: "書かなくて かまいません。" }
]);

const KEYS = PRACTICE_FIELDS.map((f) => f.key);

/** ★曲の 台帳に 足した 4つ（★裁定 §1「曲を 足す」）。 */
export const REPERTOIRE_FIELDS = Object.freeze([
  { key: "composer", label: "作曲家", kind: "text" },
  { key: "position_in", label: "役・曲集の中の位置", kind: "text" },
  { key: "bottom_note", label: "いちばん低い音", kind: "text" },
  { key: "status", label: "ようす", kind: "choice" }
]);

/** ★ようすの 4つ。★表の check と 1文字ずつ 同じに すること。 */
export const REPERTOIRE_STATUS = Object.freeze([
  "はじめたばかり", "さらい中", "本番済み", "しばらく置く"
]);

/** ★稽古の メモか。 */
export function isPractice(kind) {
  return kind === "practice";
}

/** ★空の 稽古の メモ。★きょうを 受け取ります。★時計を 見ません。 */
export function emptyPractice(todayISO) {
  return {
    lesson_on: todayISO || null,
    teacher_label: "",
    repertoire_name: "",
    said_text: "",
    next_action: "",
    gained_text: ""
  };
}

/** ★知らない 欄を 落とします。★書き込む 前に 通します。 */
export function pickFields(o) {
  const src = o || {};
  const out = {};
  KEYS.forEach((k) => {
    const v = src[k];
    if (v == null) { out[k] = null; return; }
    const s = String(v).trim();
    out[k] = s === "" ? null : s;
  });
  return out;
}

/** ★1つでも 書いてあるか。★空の ままでも 残せますが、★一覧の 見え方に 使います。 */
export function hasAnything(o) {
  const f = pickFields(o);
  // ★★「いつ」だけは 数えません。★はじめから 入っているからです。
  return KEYS.filter((k) => k !== "lesson_on").some((k) => f[k]);
}

/**
 * ★一覧に 出す 見出し。
 *
 *   ★★稽古の メモは、★本文が ありません。★言われたことの 1行目を 使います。
 *     ★それも 無ければ、★みた曲。★それも 無ければ null。
 *   ★★点も 出来ばえも 出しません。
 */
export function practiceTitle(o) {
  const f = pickFields(o);
  if (f.said_text) {
    const first = f.said_text.split("\n").map((l) => l.trim()).find((l) => l);
    if (first) return first;
  }
  return f.repertoire_name || null;
}

/** ★一覧の 2行目。★みた曲と、だれに。 */
export function practiceSub(o) {
  const f = pickFields(o);
  return [f.repertoire_name, f.teacher_label].filter(Boolean).join("　") || null;
}

/**
 * ★その曲の 稽古の メモ（★新しい順）。
 *
 *   ★★裁定「稽古で『みた曲』を 選ぶと、
 *     ★レパートリーの その曲にも 同じメモが 出ます」
 *   ★★写しを 作りません。★同じ 1件を、★別の 入口から 見ます。
 */
export function notesForRepertoire(notes, name) {
  const n = String(name || "").trim();
  if (!n) return [];
  return (notes || [])
    .filter((x) => x && isPractice(x.kind) && !x.deleted_at)
    .filter((x) => String(x.repertoire_name || "").trim() === n)
    .sort((a, b) => String(b.lesson_on || b.created_at || "").localeCompare(String(a.lesson_on || a.created_at || "")));
}
