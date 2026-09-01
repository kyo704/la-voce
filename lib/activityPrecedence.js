// ============================================================================
// その日を代表する活動を1つ選ぶ（表示のため）
//
//   ★これは「表示のための判定」です。保存のための判定ではありません。
//     保存の側は deriveActivityTypeForStorage（VocalTracker.jsx）が持っていて、
//     ★いちばん長い活動を entries.activity_type に書きます。
//     2つは似ていますが、別の問いです。混ぜないでください。
//
//   ★なぜ要るのか（2026-09-01 に見つかった不具合）
//     声の高さの推移グラフは、点の色を activity_type（旧列）から作っていました。
//     あの列は★いちばん長い活動しか残しません。
//     90分の自主練習のあとに20分の本番があった日は「自主練習」の色になり、
//     ★いちばん体に効いた出来事がグラフから消えていました。
//
//   ★順位は新しく決めません
//     発声負荷の重み（ACTIVITY_LOAD_WEIGHT）が、すでに順位そのものです。
//       休養 0 ＜ 自主練習 1.0 ＜ レッスン 1.2 ＜ リハーサル 1.3 ＜ 本番 1.6
//     ここで別の順位表を書くと、2つが食い違います。
//     ★だから重みは引数で受け取ります。この中に書き写さないこと。
//
//   ★重みの正は components/VocalTracker.jsx の ACTIVITY_LOAD_WEIGHT です。
//     （lib/vocalDose.js にも同じ値の写しがあります。★2026-09-01 時点で
//       すでに2か所にあり、これはこのファイルとは別の課題です）
// ============================================================================

/**
 * その日を代表する活動ブロックを返す（★負荷がいちばん大きいもの）。
 *
 * @param {Array}  activities  entry.activities[]
 * @param {object} weights     ACTIVITY_LOAD_WEIGHT（kind → 数値）
 * @returns {object|null}      活動ブロック。無ければ null。
 *
 * ★同じ重みが並んだときは、長いほうを採ります。
 *   それも同じなら、先に記録されたほうを採ります（並び順で揺れないため）。
 */
export function pickRepresentativeActivity(activities, weights) {
  if (!Array.isArray(activities) || activities.length === 0) return null;
  const w = weights || {};
  const loadOf = (a) => {
    const v = w[a && a.kind];
    return typeof v === "number" ? v : 0;
  };
  return activities.reduce((best, cur) => {
    const lb = loadOf(best);
    const lc = loadOf(cur);
    if (lc > lb) return cur;
    if (lc < lb) return best;
    // 重みが同じなら、長いほう
    const mb = Number(best && best.minutes) || 0;
    const mc = Number(cur && cur.minutes) || 0;
    return mc > mb ? cur : best;
  });
}

/**
 * その日を代表する活動の「種類」だけを返す。
 *
 * ★休養だけの日は "休養" を返します。
 *   activities が空で recovery だけがある日（旧い書き方）にも備えます。
 */
export function representativeActivityKind(entry, weights) {
  if (!entry) return null;
  const activities = entry.activities || [];
  if (activities.length === 0) {
    return entry.recovery ? "休養" : (entry.activityType || null);
  }
  const rep = pickRepresentativeActivity(activities, weights);
  return rep ? rep.kind : null;
}

/**
 * 画面に添える説明。★色の決まりを、利用者に必ず伝えること。
 *
 * ★「決まりが間違っていた」と「決まりを説明していなかった」は別の問題です。
 *   色を直しても、説明が無ければ、もう一方は残ります。
 */
export const MULTI_ACTIVITY_LEGEND_NOTE =
  "※ 複数の活動があった日は、いちばん負荷の大きい活動の色になります。";
