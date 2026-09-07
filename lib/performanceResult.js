// ============================================================================
// D+1 の一問 ── 本番の翌日に、1つだけ聞く（本番モード §7）
//
//   出どころ docs/opus/lavoce-仕様-本番モードの実装（9月6日・詳細版）.md §7
//            docs/opus/001-本番モード仕様書の状態（9月7日）.md
//
//   ★★これが無いと「前も、こうでした」が永久に作れません。
//     ★予報のための機能ではありません。★本番モードの芯です。
//     ★★2026-09-07、★予報を消したときに巻きこんでいないか確かめました。
//       ★そもそも一度も作られていませんでした。★これが最初です。
//
//   ★★決まり（★ここが肝）
//     ・これ以上、何も聞かない。★理由も、感想も、点数も聞かない
//     ・3つだけ。★「まあまあ」などを足さない
//     ・あとで、を押せる
//     ・答えたあと「良かったですね」「残念でしたね」と書かない。★評価はしません
// ============================================================================

/** ★3つの答え。★これ以上、増やさないこと。 */
export const RESULTS = Object.freeze([
  { key: "out",     label: "出た" },
  { key: "partial", label: "途中まで" },
  { key: "not_out", label: "出なかった" }
]);

export const RESULT_KEYS = Object.freeze(RESULTS.map((r) => r.key));

/** ★いつまで聞くか。★D+7 まで。★D+8 からは、もう聞きません。 */
export const ASK_UNTIL_DAYS = 7;

/** ★本番の種類のうち、★逆算の基準になるもの。★§1.1 で「これだけ」とされています。 */
export const BASE_KIND = "honban";

/**
 * ★★「今日」から見て、その本番は何日前か。
 *
 *   ★★端末のローカル日付で数えます（§1.3）。
 *     ★UTC で数えると、★イタリアにいらっしゃるとき、当日に「あと1日」と出ます。
 *   ★今日を、★呼ぶ側が渡します。★ここで時計を引きません。
 */
export function daysSince(performedOn, todayISO) {
  if (!performedOn || !todayISO) return null;
  const a = Date.parse(performedOn + "T00:00:00Z");
  const b = Date.parse(todayISO + "T00:00:00Z");
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86400000);
}

/**
 * ★その本番について、いま聞いてよいか。
 *
 *   ★★聞かない場合
 *     ・本番ではない（リハや移動）… ★逆算の基準は本番だけです
 *     ・まだ当日か、これから　　　… ★終わっていないことは聞きません
 *     ・D+8 以降　　　　　　　　　… ★記憶があいまいになります
 *     ・もう答えている　　　　　　… ★二度聞きません
 *     ・今日「あとで」を押された　… ★同じ日は、もう出しません
 */
export function shouldAsk({ performance, answered, snoozedOn, todayISO }) {
  if (!performance || performance.kind !== BASE_KIND) return false;
  if (answered) return false;
  if (snoozedOn && snoozedOn === todayISO) return false;
  const d = daysSince(performance.performed_on, todayISO);
  if (d == null) return false;
  return d >= 1 && d <= ASK_UNTIL_DAYS;
}

/**
 * ★いくつか本番があるとき、★どれを聞くか。
 *
 *   ★★いちばん新しいものを1つだけ。★まとめて聞きません。
 *     ★2つ並べると、★どちらの話か分からなくなります。
 */
export function pickToAsk(performances, { answeredIds, snoozedOn, todayISO }) {
  const done = new Set(answeredIds || []);
  const candidates = (performances || [])
    .filter((p) => shouldAsk({
      performance: p, answered: done.has(p.id), snoozedOn, todayISO
    }))
    .sort((a, b) => (a.performed_on < b.performed_on ? 1 : -1));
  return candidates[0] || null;
}

/** ★見出し。★「昨日の」と決め打たないこと。★D+7 まで聞くためです。 */
export function askTitle(performance, todayISO) {
  const d = daysSince(performance && performance.performed_on, todayISO);
  return d === 1 ? "昨日の本番、声は出ましたか？" : "この本番、声は出ましたか？";
}

/** ★日付の出し方。★「10月19日」。★年は出しません。 */
export function performedLabel(performance) {
  if (!performance || !performance.performed_on) return "";
  const s = performance.performed_on;
  const line = `${Number(s.slice(5, 7))}月${Number(s.slice(8, 10))}日`;
  const label = (performance.label || "").trim();
  return label ? `${line}　${label}` : line;
}

/**
 * ★答えたあとの言葉。
 *
 *   ★★どの答えでも、★同じ言葉です。
 *     ★「良かったですね」「残念でしたね」と書かないこと。★評価はしません。
 *   ★★2行目が、★この一問の意味です。
 */
export const THANKS_LINES = Object.freeze([
  "ありがとう。",
  "このことは、次の本番の前に思い出せます。"
]);

/** ★羊の一言。★どの答えでも同じ。★ねぎらいであって、評価ではありません。 */
export const SHEEP_LINE = "おつかれさま";

/** ★保存する形。★時計は、呼ぶ側が渡します。 */
export function buildResultRow({ userId, performanceId, result, now }) {
  if (!userId || !performanceId) return null;
  if (!RESULT_KEYS.includes(result)) return null;
  return {
    user_id: userId,
    performance_id: performanceId,
    result,
    answered_at: now
  };
}
