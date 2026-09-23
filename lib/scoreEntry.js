// ============================================================================
// ★★★点を 入れる ── ★決めを 持つのは この ファイル だけ です
//
//   ★出どころ  裁定50（直した 点は 記録に 残す）／ 裁定165（審査員）
//     ／ 見本 `SC['点を入れる']`
//        woolsong-2026-09-21_1.zip ／ 00-動く見本-iPhoneで開く用.html（md5 67c56244）
//        ★2026-09-23 に 展開・docs/design/pack-final/ に 反映
//
//   ★★★点は **札で 選びます**。★手で 打ちません（★見本の 註）──
//     「（ホールの 暗がりで、細かい 数字を 打つのは 難しいからです）」
//   ★★★入れた あとは ちがいます。★確定した 点を 直す ときは、
//     ★台帳の `edit_confirmed_score(p_score_id, p_points, p_reason)` を 通します。
//     ★★わけを うかがい、★`score_log` に 残り、★学生に お知らせが 届きます（★裁定50）。
//
//   ★★項目と 満点は **学校が 決めた 型** から 出ます（`evaluation_items`）。
//     ★ここに 数字を 書きません。★こちらからの 既定は ありません。
//
//   ★★★締切の 前は、★ほかの 審査員の 点は 見えません（★見本の 註）。
//     ★止めるのは 台帳の 決め（`evaluation_scores_select`）です。
//     ★★この ファイルは、★自分の 点しか 受け取らない 形に して あります。
// ============================================================================

export const COLS_ITEM = "id, org_id, event_id, name, max_points, step, note, in_use, ord";
export const COLS_SCORE = "id, org_id, event_id, student_id, item_id, judge_id, points, confirmed_at, entered_at";
export const COLS_REVIEW = "id, org_id, event_id, student_id, judge_id, body, confirmed_at";

/**
 * ★札に 出す 点の 並び（★0 から 満点まで）。
 *
 *   ★★きざみは 学校が 決めます（`step` は 0.5 か 1）。
 *   ★★★満点を 超える 札は 作りません ── ★「満点を 超えたら 止まる」の いちばん 確かな 形 です。
 *     ★押せない ものを 出して から 止める、では ありません。★はじめから ありません。
 */
export function pointChoices(item) {
  if (!item) return [];
  const 満 = Number(item.max_points);
  const 刻 = Number(item.step) || 1;
  if (!Number.isFinite(満) || 満 <= 0 || 刻 <= 0) return [];
  const 出 = [];
  for (let v = 0; v <= 満 + 1e-9; v += 刻) 出.push(Math.round(v * 2) / 2);
  return 出;
}

/** ★使って いる 項目 だけ、★学校が 決めた 順に。 */
export function itemsInUse(items) {
  return (Array.isArray(items) ? items : [])
    .filter((x) => x && x.in_use !== false)
    .slice().sort((a, b) => (a.ord || 0) - (b.ord || 0));
}

/** ★いまの 点（★入って いなければ null）。 */
export function pointOf(scores, itemId) {
  const s = (Array.isArray(scores) ? scores : []).find((x) => x && x.item_id === itemId);
  return s && s.points != null ? Number(s.points) : null;
}

/** ★その 項目の 点の 行（★直す ときに 番号が 要ります）。 */
export function scoreRow(scores, itemId) {
  return (Array.isArray(scores) ? scores : []).find((x) => x && x.item_id === itemId) || null;
}

/**
 * ★合計。
 *
 *   ★★★入って いない 項目が 1つでも あれば null を 返します。
 *     ★入って いない ものを 0 と 数えると、★低い 合計が 出ます。
 *     ★★「まだ」と「0点」は ちがいます。
 */
export function total(items, scores) {
  const 使 = itemsInUse(items);
  if (使.length === 0) return null;
  let n = 0;
  for (const it of 使) {
    const v = pointOf(scores, it.id);
    if (v === null) return null;
    n += v;
  }
  return Math.round(n * 2) / 2;
}

/** ★満点の 合計（★学校が 決めた 型の 合計）。 */
export function maxTotal(items) {
  return itemsInUse(items).reduce((n, x) => n + (Number(x.max_points) || 0), 0);
}

/** ★入れて よいか（★ぜんぶ 入って いる とき だけ）。 */
export function canSubmit(items, scores) {
  return total(items, scores) !== null;
}

/** ★もう 確定して いるか（★1つでも 確定して いれば 確定 です）。 */
export function isConfirmed(scores) {
  return (Array.isArray(scores) ? scores : []).some((x) => x && x.confirmed_at);
}

/**
 * ★直す ときに わけが 要るか。
 *
 *   ★★★確定の あと だけ 要ります（★裁定50）。
 *     ★入れる 前は 何度 押しても かまいません。★まだ 誰にも 届いて いません。
 */
export function needsReason(scores) {
  return isConfirmed(scores);
}

/** ★わけが 書けて いるか（★空では 直せません）。 */
export function canEditWithReason(reason) {
  return String(reason == null ? "" : reason).trim() !== "";
}

/** ★型の 名（★見本 …「型：実技試験（4項目・合計）」）。 */
export function typeLine(typeName, items) {
  const n = itemsInUse(items).length;
  return "型：" + String(typeName || "") + "（" + n + "項目・合計）";
}

/** ★見本の 言葉（★1字 も 足しません）。 */
export const SCORE_REVIEW_HEAD = "講評";
export const SCORE_SUBMIT = "入れる";
export const SCORE_EDIT = "直す";
export const SCORE_OTHERS_HEAD = "ほかの 受験者";
export const SCORE_MAX_SUFFIX = "点満点";
export const SCORE_EDIT_ASK = "どこを 直しましたか。";
export const SCORE_DONE = "済";
export const SCORE_DOING = "入力中";
export const SCORE_YET = "未入力";

/**
 * ★下の 但し書き（★見本の .note。★1字 も 足しません）。
 *
 *   ★★★1行目・2行目は **なぜ そう したか** です。★消すと、★手で 打つ 形に 戻ります。
 *   ★★★4行目は 約束 です ── ★締切の 前は、ほかの 審査員の 点は 見えません。
 */
export const SCORE_NOTE = Object.freeze([
  "点は 札で 選びます。手で 打ちません。",
  "（ホールの 暗がりで、細かい 数字を 打つのは 難しいからです）",
  "項目と 満点は、貴学が 決めた 型から 出ています。",
  "締切の 前は、ほかの 審査員の 点は 見えません。"
]);
