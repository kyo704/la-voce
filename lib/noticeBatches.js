// ============================================================================
// お知らせの束と、その宛先（TASK A・2026-09-03）
//
//   ★これは notice_batches / notice_targets を★読む側です。
//     表と同じ日に書きました（共通ゲート E）。
//
//   ★なぜ、宛先を凍らせるのか
//     lib/noticeAudience.js は cohort をその場で読んで宛先を決めます。
//     配信の直前までは、それで正しいのです。
//     ですが★送ったあとに cohort が変わると、
//     「誰に送ったか」が★後から変わってしまいます。
//       ・先行公開が終わって tester → general に移した
//       ・あとから is_internal を立てた
//     どちらも、あとで一覧を出し直すと★答えが変わります。
//     ★届かなかった方を探すときに、その人が一覧から消えていたら、
//       永久に見つかりません。
//     だから、決めた時点の id を★そのまま保存します。
//     以後は cohort を二度と読み直しません。
//
//   ★3つの条件（Opus の裁定）
//     ① 束は「型」を持ちます。この同意のお知らせは、その1例にすぎません。
//        ★「A-2の再同意」専用の列を作りません。次のお知らせで作り直しになります。
//     ② 宛先の状態を★上書きしません。時刻の列を並べ、それぞれ一度だけ入れます。
//        ★「送った」を「開いた」で上書きすると、送った事実が消えます。
//     ③ 退会された方の宛先の行は★消します（その方のことだからです）。
//        束のほうは、決めた時点の人数だけを持ち、★個々の削除に影響されません。
// ============================================================================

/**
 * お知らせの型。★増やせます。
 * ★「同意の取り直し」は、そのうちの1つにすぎません。
 */
export const NOTICE_TYPES = [
  "consent_renewal",   // 同意をもう一度お願いする
  "policy_update",     // 規約・プライバシーポリシーの改定
  "feature",           // 新しい機能のお知らせ
  "maintenance",       // 停止のお知らせ
  "research"           // 研究への協力のお願い
];

/**
 * 宛先に並ぶ時刻の列。★それぞれ一度だけ入り、二度と消えません。
 *
 * ★状態を1つの列で持ちません。
 *   status を 'sent' → 'opened' と書き換えると、
 *   ★いつ送ったかが消えます。届かなかった方を探せなくなります。
 */
export const TARGET_TIMESTAMPS = ["sent_at", "opened_at", "progressed_at"];

/**
 * その宛先が、いまどこまで進んだか。★列は書き換えません。読むだけです。
 *
 * @returns {"未送信"|"送信済み"|"開いた"|"応じた"}
 */
export function targetStage(target) {
  if (!target) return "未送信";
  if (target.progressed_at) return "応じた";
  if (target.opened_at) return "開いた";
  if (target.sent_at) return "送信済み";
  return "未送信";
}

/**
 * ★もう一度お送りしてよいか。
 *
 * ★応じてくださった方には、二度と送りません。
 * ★開いてくださった方にも送りません。読んだうえで動かない、は
 *   その方の選択です。急かしません。
 */
export function canResend(target) {
  if (!target || !target.sent_at) return false;
  return !target.opened_at && !target.progressed_at;
}

/**
 * 束の宛先を決める。★ここで凍ります。
 *
 * @param {object[]} profiles  profiles の行（is_internal / cohort を持つ）
 * @param {string[]} activeGroups  lib/noticeAudience.js の NOTICE_ROLLOUT の1段
 * @param {function} shouldNotify  noticeAudience の shouldNotify
 * @returns {string[]} 保存する id の一覧
 *
 * ★判定そのものは noticeAudience に任せます。書き写しません。
 *   書き写すと、片方だけ直されて食い違います。
 */
export function freezeTargets(profiles, activeGroups, shouldNotify) {
  return (profiles || [])
    .filter((p) => shouldNotify(p, activeGroups))
    .map((p) => p.id);
}

/**
 * 束の集計。★退会された方を数え落とさないための形です。
 *
 * ★frozen_count は「決めた時点で何人だったか」で、動かしません。
 *   いま残っている宛先の行を数えると、退会のたびに★過去が変わります。
 *   「30人に送った。うち3人が退会された」と言えるようにします。
 */
export function batchSummary(batch, targets) {
  const rows = targets || [];
  return {
    決めた時点: batch ? batch.frozen_count : 0,
    いま残っている宛先: rows.length,
    送信済み: rows.filter((t) => t.sent_at).length,
    開いた: rows.filter((t) => t.opened_at).length,
    応じた: rows.filter((t) => t.progressed_at).length,
    // ★退会された方の数。引き算で出します。行はもうありません。
    退会された方: Math.max(0, (batch ? batch.frozen_count : 0) - rows.length)
  };
}
