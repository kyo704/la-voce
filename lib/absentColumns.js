// ============================================================================
// ★台帳に **無い** ことを 確かめた 列（★2026-09-16）
//
//   ★★この 蔵で 何度も 起きた 形 です ──
//     ★移行の ファイルを 書く → ★流さない → ★けれど コードは
//       ★その 列が 在る つもりで 書かれる → ★400 が 返る。
//     ★★`supabase/` に ファイルが ある ことは、★列が 在る 証しに なりません。
//       ★★SQL は、★坂本さんが 手で 貼った ものだけが 効いて います。
//
//   ★★だから「無い」と 確かめた ものを、★ここに 書き留めます。
//     ★★見張り（components/tests/no-phantom-columns.test.js）が、
//       ★引く 列の 並びに この 名が 混ざって いないかを 見ます。
//
//   ★★足す ときの 決め ──
//     ・★**台帳に 直に 尋ねて** 確かめた ものだけ。★紙で 見た だけの ものは 書かない。
//     ・★いつ・どこで 確かめたかを 書く。★根拠の 無い 行は 置かない。
//     ・★あとで 本当に 足した ときは、★この 行を 消す。
//       ★★消し忘れると、★正しい 列を 見張りが 止めます。
// ============================================================================

export const ABSENT_COLUMNS = Object.freeze([
  {
    table: "lessons",
    column: "held",
    // ★★2026-09-08、★坂本さんの 列の 一覧で 分かりました。
    //   ★★`supabase/migration_lesson_held.sql` は 書かれた だけ で、
    //     ★一度も 流れて いません。
    //   ★★2026-09-16、★もう一度 台帳で 確かめました ── ★やはり 在りません。
    //     ★実際の 列 … id / link_id / scheduled_at / duration_minutes / note /
    //       created_by / created_at / org_id / teacher_id / student_id /
    //       attendance / attendance_at / attendance_by /
    //       student_notice / student_notice_at
    confirmedOn: "2026-09-16",
    evidence: "台帳の列一覧（操作者が直接照会）",
    insteadUse: "attendance（came / absent / canceled / null）"
  }
]);

/** ★引く 列の 並びに、★無い はずの 名が 混ざって いないか。 */
export function phantomColumnsIn(table, selectList) {
  const names = String(selectList || "")
    .split(",")
    .map((x) => x.trim().split(/[\s:(]/)[0])
    .filter(Boolean);
  return ABSENT_COLUMNS
    .filter((a) => a.table === table && names.includes(a.column))
    .map((a) => a.column);
}
