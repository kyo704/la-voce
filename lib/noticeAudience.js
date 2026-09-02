// ============================================================================
// お知らせを、誰に出すか（2026-09-03）
//
//   ★これは profiles.is_internal を★読む側です。
//     列だけ足して読む人がいない、を作らないために、同じ日に書きました
//     （共通ゲート E・docs/lavoce-G4-受け入れ確認.md）。
//
//   ★名前で判定しません。
//     ・display_name … ごく一部にしか入っていません（試験用の口座だけ）
//     ・name         … 「テスター」の文字は★1件も入っていません
//     管理画面の「テスター」は、cohort から★描画時に付けている札です
//     （app/admin/page.js:240-241）。保存された文字ではありません。
//     ★空の列で対象を決めると、黙って誰にも届きません。
//
//   ★姓の一致で人を同定しません。同姓の別人が居ます。
//     帰属は、運営者がメールアドレスで1件ずつ決め、is_internal に入れます。
// ============================================================================

/** お知らせの宛先の区分。★順番は、配信の順番でもあります。 */
export const NOTICE_GROUPS = ["operator", "tester", "general", "internal"];

/**
 * その人は、どの区分か。
 *
 * @param {object} profile  profiles の行（is_internal / cohort を持つ）
 * @returns {"operator"|"tester"|"general"|"internal"}
 *
 * ★internal が先です。試験用の器は、ほかの何であっても通知しません。
 * ★operator は「founder かつ 試験用でない」。
 *   founder が2つあり、片方は器、片方は実際に使われている口座です。
 *   ★メールアドレスをコードに書きません（増えたら書き換えになります）。
 */
export function noticeGroupOf(profile) {
  if (!profile) return "general";
  if (profile.is_internal === true) return "internal";
  if (profile.cohort === "founder") return "operator";
  if (profile.cohort === "tester") return "tester";
  return "general";
}

/**
 * いま配信している区分に、この人は入るか。
 *
 * @param {object} profile
 * @param {string[]} activeGroups  例：["operator"] → まず運営者だけ
 *
 * ★internal は、activeGroups に入れても出しません。
 *   「全員に出す」と書いたときに、試験用の器へ出さないためです。
 *   ★出したいときは、その口座の is_internal を false に戻します。
 */
export function shouldNotify(profile, activeGroups) {
  const group = noticeGroupOf(profile);
  if (group === "internal") return false;
  return Array.isArray(activeGroups) && activeGroups.includes(group);
}

/**
 * 配信の順番。★1つずつ広げます。
 *   ① 運営者ご自身の口座だけ（画面を最初に確かめる）
 *   ② テスター（お知らせに一言添える）
 *   ③ そのほかの方
 * ★是内部（internal）は、どの段にも入りません。
 */
export const NOTICE_ROLLOUT = [
  ["operator"],
  ["operator", "tester"],
  ["operator", "tester", "general"]
];

/**
 * ★数えるときは、internal を外します。
 *   通知の対象人数に、試験用の器を混ぜないためです。
 * ★削除・バックアップ・書き出しからは外しません。そちらは本人の記録です。
 */
export function notifiableProfiles(profiles) {
  return (profiles || []).filter((p) => noticeGroupOf(p) !== "internal");
}
