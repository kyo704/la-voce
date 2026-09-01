// ============================================================================
// 先生とのつながりの記録（G4-26 / 作業指示-教室プラン D-3）
//
//   ★この1ファイルが持つ決めごと
//     ① 同意した文面の版（agreementVersion）
//     ② 積む行の形
//     ③ 「外した」を記録するときの書き方
//
//   ★何を記録しないか（Opus の裁定・2026-09-01）
//     ・org_id          … 教室ごとの共有への扉になるため、持たせません
//     ・共有範囲（scope）… 2026-09-01 に廃止した考え方です
//
//   ★このつながりは「記録を見せる」同意ではありません。
//     先生は、生徒の記録の中身を見られません。
//     記録した日も、件数も、記録があるかどうかも見られません（憲章 §10）。
//     同意しているのは、★レッスンの予定を一緒に見ることです。
// ============================================================================

/**
 * 同意した文面の版。
 *
 * ★画面の文言を変えたら、必ずここを上げてください。
 *   上げないと、「あの人は何に同意したのか」を後から答えられなくなります。
 *
 *   v1（2026-09-01）
 *     「つながると、この先生とレッスンの予定を共有できるようになります。
 *       あなたの記録の中身は、先生には見えません。」
 *
 *   ★v1 より前は、共有範囲を9つのチェックで選ばせていました。
 *     その仕組みごと廃止したので、v1 は前の版の続きではありません。
 */
export const LINK_AGREEMENT_VERSION = "link-2026-09-01";

/** 誰が外したか。★片方が退会した場合は null にします（推測で埋めないこと）。 */
export const UNLINKED_BY = ["student", "teacher"];

/**
 * つながったときに積む行。
 *
 * ★unlinked_at は入れません。null が「いまも続いている」という意味です。
 */
export function buildLinkConsentRow({ studentId, teacherId, now }) {
  return {
    student_id: studentId,
    teacher_id: teacherId,
    linked_at: (now || new Date()).toISOString(),
    agreement_version: LINK_AGREEMENT_VERSION
  };
}

/**
 * 外したときに入れる値。
 *
 * ★行は消しません。上書きもしません。いま続いている行に、終わりの時刻を入れます。
 */
export function buildUnlinkPatch({ by, now }) {
  return {
    unlinked_at: (now || new Date()).toISOString(),
    unlinked_by: UNLINKED_BY.includes(by) ? by : null
  };
}

/**
 * いま続いているつながりの行を選ぶ（unlinked_at が null のもの）。
 * ★複数あってはいけませんが、あっても落ちないように、いちばん新しいものを返します。
 */
export function findOpenConsent(rows, teacherId) {
  const open = (rows || []).filter(
    (r) => r.teacher_id === teacherId && !r.unlinked_at
  );
  if (open.length === 0) return null;
  return open.sort((a, b) => String(b.linked_at).localeCompare(String(a.linked_at)))[0];
}
