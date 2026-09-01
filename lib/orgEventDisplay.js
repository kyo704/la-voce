// ============================================================================
// 組織の予定を、利用者にどう見せるか（Opus の裁定・2026-09-02）
//
//   ★写しを作りません。利用者が持つのは「出ます」という印だけです。
//     だから、写しと元がずれることも、同期も、ありません。
//     ここで決めるのは★「何を、いつまで、どう言うか」だけです。
//
//   ★取り下げられた予定の行は、消しません（withdrawn_at を入れます）。
//     消すと、出ると印をつけた人の画面から★黙って消えます。
//     気づかないうちに予定が無くなっているのが、いちばん困ります。
//
//   ★日付が変わっても、印を自動で外しません。
//     外すと、出るつもりだった人が★外れたことに気づけません。
//     新しい日付が都合悪ければ、本人が外します。
//
//   ★文の主語は「予定」です。人ではありません。
//     「◯◯先生が取り下げました」は書きません（誰がやったかは見せない）。
//     「あなたの出席登録は取り消されました」も書きません（人が取り消された
//     ように読めます）。取り下げられたのは★予定のほうです。
// ============================================================================

/** 画面に出す状態。 */
export const ORG_EVENT_STATES = ["normal", "withdrawn", "moved", "hidden"];

/**
 * 取り下げの知らせ。★主語は予定。
 * ★「確認してください」と書かないこと（急かす言葉）。
 */
export const WITHDRAWN_MESSAGE = "この予定は取り下げられました";

/** 知らせを画面から消すボタン。★押すまで消えません。 */
export const DISMISS_LABEL = "表示から消す";

/**
 * 日付が変わったときの1行。
 * ★変わった事実だけを言います。理由も、誰がやったかも書きません。
 */
export function movedMessage(fromDate, toDate, formatDate) {
  const f = typeof formatDate === "function" ? formatDate : (d) => d;
  return `${f(fromDate)}から${f(toDate)}に変わりました`;
}

/**
 * その予定を、いまどう見せるか。
 *
 * @param {object} event        org_events の1行
 * @param {object|null} joined  org_event_participants の1行（無ければ null）
 * @param {string} todayISO     今日（YYYY-MM-DD）
 * @returns {"normal"|"withdrawn"|"moved"|"hidden"}
 *
 * ★過ぎた予定は、ふつうに流れていきます。
 *   過ぎたあとに取り下げられても、何も出しません。
 *   その日の記録があるなら、それは★本人が書いたもので、
 *   予定とは無関係に、そのまま残ります。
 */
export function orgEventState(event, joined, todayISO) {
  if (!event) return "hidden";
  // 過ぎた予定には、取り下げも日付変更も出しません。
  if (event.event_date < todayISO) return "hidden";

  if (event.withdrawn_at) {
    // ★本人が「表示から消す」を押したときだけ、消えます。
    if (joined && joined.dismissed_at) return "hidden";
    return "withdrawn";
  }
  if (event.previous_date && event.previous_date !== event.event_date) return "moved";
  return "normal";
}

/**
 * 出ると印をつけているか。
 * ★日付が変わっても、取り下げられても、印はそのまま残ります。
 *   外すのは本人だけです。
 */
export function isJoined(joined) {
  return !!joined;
}

/**
 * 当日の記録画面に、活動の種類を先に選んでおくための対応表。
 *
 * ★これは「提案」です。本人が保存するまで、entries には1行も書きません
 *   （guessTodayActivityKind と同じ考え方。外れても実害がない形）。
 * ★ここで負荷の重みを決めているのではありません。重みの正は
 *   lib/vocalDose.js の VOCAL_LOAD_WEIGHT です。
 */
export const EVENT_KIND_TO_ACTIVITY = {
  "本番": "本番",
  "試験": "本番",      // ★試験は本番と同じ重さで扱われることが多いため
  "合わせ": "リハーサル",
  "練習": "自主練習",
  "休講": "休養",
  "その他": null       // ★決めません。本人が選びます
};

/**
 * その日に出ると印をつけている予定から、活動の種類の候補を返す。
 * ★複数あるときは、いちばん重いものを返しません。決めきれないので null です。
 *   （勝手に決めると、本人が選んだことになってしまいます）
 */
export function suggestActivityKind(eventsForDay) {
  const kinds = (eventsForDay || [])
    .filter((e) => e && !e.withdrawn_at)
    .map((e) => EVENT_KIND_TO_ACTIVITY[e.kind])
    .filter(Boolean);
  const unique = [...new Set(kinds)];
  return unique.length === 1 ? unique[0] : null;
}

/**
 * ★書いてはいけない言い回し。
 *   検査（components/tests/org-event-display.test.js）が見ています。
 */
export const FORBIDDEN_EVENT_PHRASES = [
  "参加予定が無効になりました",      // 強すぎる
  "あなたの出席登録は取り消されました", // 人が取り消されたように読める
  "確認してください"                  // 急かす言葉
];
