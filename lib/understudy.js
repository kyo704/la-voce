// ============================================================================
// ★★★代役を 立てる ── ★決めを 持つのは この ファイル だけ です
//
//   ★出どころ  裁定178
//     ／ 見本 `SC['代役を 立てる']`
//        woolsong-2026-09-21_1.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//        ★2026-09-24 に 確かめ
//
//   ★★★自動では 呼びません。★押した ときだけ、★その日の 呼び出しに 入ります。
//     ★見本の 註 ──「誰を 立てるかは、その日の 判断です（声の 調子・演出の 意向）。
//                      だから こちらでは 決めません。」
//   ★★★だから ここに「おすすめ」も「自動で 立てる」も 作りません。
//     ★並べ替えも しません ── ★上に 出た 方が 選ばれ やすく なります。
//     ★★台帳（`koen_understudy_needed`）が 返した 順の まま 出します。
//
//   ★★★「声の 調子」は **その日の 判断** の 中に あります。
//     ★けれど この 画面は 体の 記録を 1つも 読みません。
//     ★★人が 見て 決める こと であって、★仕組みが 当てる ことでは ありません。
// ============================================================================

/** ★台帳が 返した 行を、★画面の 形に します。★並べ替えません。 */
export function understudyRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((r) => ({
    slotId: r.slot_id,
    slotLabel: r.slot_label || "",
    absentName: r.absent_name || "",
    understudyId: r.understudy_id || null,
    understudyName: r.understudy_name || ""
  }));
}

/** ★その 枠に 代役が いるか。 */
export function hasUnderstudy(row) {
  return Boolean(row && row.understudyId);
}

/** ★押せる 枠の 数（★代役が いる もの だけ）。 */
export function callableCount(rows) {
  return (Array.isArray(rows) ? rows : []).filter(hasUnderstudy).length;
}

/** ★見本の 言葉（★1字 も 足しません）。 */
export const US_HEAD = "代役を 立てる";
export const US_WHY = "休みの 方の 枠と、その 枠を 継ぐ 代役です。自動では 呼びません。押した ときだけ、その日の 呼び出しに 入ります。";
export const US_ABSENT = "休み：";
export const US_CALL = " を 呼ぶ";
export const US_NONE = "代役が いません";
export const US_CALLED = "さんを 呼び出しに 入れました";
export const US_NOTE = Object.freeze([
  "誰を 立てるかは、その日の 判断です（声の 調子・演出の 意向）。",
  "だから こちらでは 決めません。"
]);
