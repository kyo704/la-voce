// ============================================================================
// 行事 ── 出したり 消したり（2026-09-09・第3便・見本④）
//
//   ★出どころ docs/opus/woolsong-見本-運営モード8点（9月9日）.jpg ④
//     「★出したり消したり、★対象の方の「きょう」に 出ます」
//     「★取り下げても、★除いて 出しません。★勝手に 書き換えません。」
//     「★選び忘れている 中は 出しません。★数だけです。」
//
//   ★★「出ます」の 数え方
//     ★★分母は、★対象に なっている 人数です。
//     ★★分子は、★「出ます」と 押した 人数です。
//     ★★まだ 押していない方の 中身は 出しません。★数だけです（★見本④）。
//       ★★誰が まだかを 並べると、★催促の 一覧に なります。
//
//   ★★取り下げ（withdrawn）
//     ★★行を 消しません。★静かに 1行 残します（★見本④）。
//     ★★「無かったこと」に しません。★出す と 決めた事実は 残ります。
//
//   ★★％を 出しません。★「41/54」と、★数で 書きます。
//     ★★割合に すると、★教室どうしを くらべたく なります。
//
//   ★見張り components/tests/org-events-view.test.js
// ============================================================================

import { mayShowGroup } from "@/lib/smallGroups";

/** ★行事の ようす。★数だけで 決まります。 */
export const EVENT_STATES = Object.freeze({
  WITHDRAWN: "withdrawn",   // ★取り下げた
  NOTICE: "notice",         // ★おしらせ（★出欠を 取らない）
  READY: "ready",           // ★そろいました
  OPEN: "open"              // ★受付中
});

/**
 * ★その行事の ようす。
 *
 *   @param ev       ★行事（withdrawn_at・kind を 持ちます）
 *   @param joined   ★「出ます」と 押した 人数
 *   @param target   ★対象の 人数
 *
 *   ★★対象が 0 のときは「おしらせ」です。★0/0 と 書きません。
 *     ★休講の おしらせなど、★出欠を 取らない ものが あります。
 */
export function eventState(ev, joined, target) {
  if (ev && ev.withdrawn_at) return EVENT_STATES.WITHDRAWN;
  const tg = Number(target);
  if (!Number.isFinite(tg) || tg <= 0) return EVENT_STATES.NOTICE;
  return Number(joined) >= tg ? EVENT_STATES.READY : EVENT_STATES.OPEN;
}

/** ★ようすの 言葉（★見本④の とおり）。 */
export function stateLabel(state) {
  if (state === EVENT_STATES.WITHDRAWN) return "取り下げました";
  if (state === EVENT_STATES.NOTICE) return "おしらせ";
  if (state === EVENT_STATES.READY) return "そろいました";
  return "受付中";
}

/**
 * ★「出ます」の 数（★見本④の「41/54」）。
 *
 *   ★★％を 返しません。★数だけです。
 *   ★対象が 0 なら null。★0/0 と 書かないためです。
 *   ★★対象が 5人に 満たなければ、★出しません（★2026-09-10）。
 *     ★★「3人のうち 2人」は、★出ない 1人を 名指しします。
 *     ★決めるのは lib/smallGroups.js だけです。★ここで 数を 決めません。
 */
export function joinedWord(joined, target) {
  const tg = Number(target);
  if (!Number.isFinite(tg) || tg <= 0) return null;
  if (!mayShowGroup(tg)) return null;
  return `${Number(joined) || 0}/${tg}`;
}

/**
 * ★行事ごとの まとめを 作ります。
 *
 *   @param events       ★行事の 並び
 *   @param participants ★org_event_participants の 並び
 *   @param targetOf     ★その行事の 対象の 人数を 返す 関数
 *
 *   ★★取り下げた ものも 残します。★除いて 出しません（★見本④）。
 *   ★日にちの 古い順です。
 */
export function buildEvents(events, participants, targetOf) {
  const joinedBy = new Map();
  (participants || []).forEach((p) => {
    if (!p || !p.org_event_id) return;
    joinedBy.set(p.org_event_id, (joinedBy.get(p.org_event_id) || 0) + 1);
  });
  return (events || [])
    .filter(Boolean)
    .map((ev) => {
      const target = targetOf ? targetOf(ev) : 0;
      const joined = joinedBy.get(ev.id) || 0;
      const state = eventState(ev, joined, target);
      return {
        ev, joined, target, state,
        label: stateLabel(state),
        countWord: state === EVENT_STATES.NOTICE ? null : joinedWord(joined, target)
      };
    })
    .sort((a, b) => (String(a.ev.event_date) < String(b.ev.event_date) ? -1 : 1));
}

/**
 * ★この行事で できること（★見本④）。
 *
 *   ★★取り下げた ものには、★何も できません。★もう 済んだ ことです。
 *   ★「取り下げる」は、★静かに 1行 残ります。
 */
export const EVENT_ACTIONS = Object.freeze([
  { key: "move", label: "時間と場所を 直す" },
  { key: "retarget", label: "対象を 変える" },
  { key: "withdraw", label: "取り下げる", note: "静かに1行 残ります" }
]);

export function actionsFor(state) {
  return state === EVENT_STATES.WITHDRAWN ? [] : EVENT_ACTIONS;
}
