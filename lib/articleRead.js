// ============================================================================
// ★読んだ印は、★その方の 端末に だけ 残ります（★2026-09-25・坂本さんの お決め）
//
//   ★★見本が こう 約束して います ──
//     `記事`      「読んだ印（✓）は、ご自分の 端末にだけ 残ります。
//                  誰が 読んだかは 記録しません（数だけ 数えます）。」
//     `もっと深く`  「読んだ印は、ご自分の 端末にだけ 残ります。
//                  誰が 読んだかは 記録しません。どこまで 読んだかも 数えません。」
//
//   ★★★台帳は そう なって いませんでした。★`article_progress` に
//     ★`read_at`・`first_read_at` を、★人の 番号と 一緒に 書いて いました。
//     ★決まりで 誰にも 見えませんでしたが、★「記録しません」とは 言えません。
//
//   ★坂本さんの お決め ──「誰が読んだかを記録しない形に実装を修正してください」
//
//   ★★★だから この 1つの 決めごとを、★この 1か所に 置きます ──
//     ★★「読んだ印は どこに あるか」。★画面では 決めません。
//
//   ★★移行 `article_read_off_ledger`（2026-09-25・本番）で、
//     ★`read_at`・`first_read_at`・`bookmarked` を 台帳から 外しました。
//     ★外す 前の 中身は `docs/records/2026-09-25-article_progress-外した3列の中身.md`。
//
//   ★★★まだ 字の とおりでは ない ところ（★隠しません）──
//     ★`article_progress` には `box`・`next_due_at`・`last_answered_at` が 残って います。
//     ★これは「間を あけて 出し直す」予定 で、★その方の 持ちもの です。
//     ★端末だけに すると、★端末を 替えた ときに 消えます。★消しません。
//     ★★だから「どこまで 読んだかも 数えません」は、★まだ 半分 です。
//       ★坂本さんに お尋ねして います（★docs/ledgers/08-保留している決め.md）。
// ============================================================================

/** ★覚え場所の 名前。★端末ごと。★サーバに 送りません。 */
export const READ_KEY = "woolsong-article-read";

/**
 * ★数える ほうの 関数の 名（★台帳側）。
 *
 *   ★★`bump_article_read(p_article_id)` は 人の 番号を **引数に 取りません**。
 *     ★中で `auth.uid()` を 1度も 使いません。★入るのは 数 だけ です。
 *   ★★`article_read_counts` に 人の 列が ありません ──
 *     ★だから あとから「誰が 読んだか」を 出す ことが できません。
 */
export const BUMP_FN = "bump_article_read";

/**
 * ★端末から 読み出します。
 *
 *   ★★返すのは `{ [articleId]: true }` です。★**時刻を 持ちません**。
 *     ★★★時刻を 持つと、★いつ 読んだかが 残ります。★印だけで 足ります。
 *   ★★読めない ときは 空で 返します。★落ちません
 *     （★内緒の 窓・site data を 切って いる 方・絵の 取り込み）。
 */
export function readMarks() {
  try {
    const raw = window.localStorage.getItem(READ_KEY);
    if (!raw) return {};
    const v = JSON.parse(raw);
    if (!v || typeof v !== "object" || Array.isArray(v)) return {};
    const out = {};
    for (const k of Object.keys(v)) if (v[k]) out[k] = true;
    return out;
  } catch (e) {
    return {};
  }
}

/**
 * ★端末に 書きます。★返すのは 書いた あとの 形 です。
 *
 *   ★★2つめの 返りは「★数える ほうを 押すか」です。
 *     ★★★**はじめて 印が ついた とき だけ** 押します。
 *       ★同じ 記事を 何度 開いても、★数は 1つ しか 増えません。
 *       ★★これで「読んだ 人数」に 近い 数に なります ── ★端末の 数 です。
 *       ★人を 見分けて いないので、★同じ方が 2台 お使いなら 2 です。
 *         ★★それが 数えられる 限りで、★見分ける つもりは ありません。
 */
export function writeMark(marks, articleId, read) {
  const next = { ...marks };
  const はじめて = !!read && !marks[articleId];
  if (read) next[articleId] = true; else delete next[articleId];
  try {
    window.localStorage.setItem(READ_KEY, JSON.stringify(next));
  } catch (e) {
    // ★書けなくても 画面は 動きます。★印が 残らない だけ です。
  }
  return { marks: next, 数える: はじめて };
}

/** ★読んだ 数（★その方の 端末の 中 だけ）。★誰にも 送りません。 */
export function readCountOf(marks, articleIds) {
  const ids = Array.isArray(articleIds) ? articleIds : [];
  return ids.filter((id) => !!marks[id]).length;
}

/**
 * ★画面に 出す 約束の 字（★見本の とおり）。
 *
 *   ★★1文字も 変えないこと。★これは 約束 です。
 */
export const READ_PROMISE = Object.freeze([
  "読んだ印（✓）は、ご自分の 端末にだけ 残ります。",
  "誰が 読んだかは 記録しません（数だけ 数えます）。"
]);
