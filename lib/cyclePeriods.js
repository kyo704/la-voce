// ============================================================================
// 周期の記録：日数の導出と集計（周期記録の設計.md §3・§5-2・§6）
//
// ★日数は保存しません（§3-1）。持っているのは開始日と、あれば終了日だけ。
//   「◯日目」も「周期◯日」も「出血◯日」も、すべてここで計算します。
//
// ★リアルタイムの位相（卵胞期・黄体期）は、この関数群では一切出しません（§6-2）。
//   位相は次の開始日が入って初めて後ろ向きに確定するもので、進行中の周期に
//   ラベルを貼ると必ず外れます。「次回の目安」だけを、必ず「ごろ」を添えて出します。
// ============================================================================

export const MIN_CYCLES_FOR_AVERAGE = 3;   // §5-2「3回に満たない場合は平均を出さない」

// §3-3 分析から除外する範囲。★除外はするが、ユーザーに「短すぎ」「長すぎ」と言わない。
export const CYCLE_LENGTH_MIN = 15;
export const CYCLE_LENGTH_MAX = 90;
export const BLEEDING_DAYS_MAX = 14;

function toDate(iso) { return new Date(`${iso}T00:00:00`); }
export function diffDays(fromISO, toISO) {
  return Math.round((toDate(toISO) - toDate(fromISO)) / 86400000);
}
export function addDaysISO(iso, n) {
  const d = toDate(iso);
  d.setDate(d.getDate() + n);
  // ★toISOString() を使わないこと。toDate はローカルの深夜を作るので、
  //   UTC へ変換すると日本時間(+9)では前日に転がる。日付を1日ずらす原因になる。
  //   ローカルの年月日から、そのまま文字列を組み立てる。
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

/** 開始日の新しい順に整える。壊れた行は落とす。 */
export function sortPeriods(periods) {
  return (periods || [])
    .filter((p) => p && p.start_date)
    .slice()
    .sort((a, b) => (a.start_date < b.start_date ? 1 : a.start_date > b.start_date ? -1 : 0));
}

// ---------------------------------------------------------------------------
// §3-2 入力の検証。画面側でもここを通すこと。
// ---------------------------------------------------------------------------
export function validateNewStart(startISO, periods, todayISO) {
  if (!startISO) return "startRequired";
  if (todayISO && startISO > todayISO) return "startInFuture";      // 未来にできない
  const list = sortPeriods(periods);
  if (list.some((p) => p.start_date === startISO)) return "duplicateStart";
  // 期間どうしが重ならない（終了日が入っている周期の中には入れない）
  if (list.some((p) => p.end_date && startISO >= p.start_date && startISO <= p.end_date)) return "overlapping";
  return null;
}

export function validateEnd(endISO, startISO, todayISO) {
  if (!endISO) return "endRequired";
  if (endISO < startISO) return "endBeforeStart";
  if (todayISO && endISO > todayISO) return "endInFuture";
  return null;
}

// ---------------------------------------------------------------------------
// §4-1 ホームに出す1行のためのデータ
// ---------------------------------------------------------------------------
/**
 * いまの状態。
 *   bleeding … 出血中（開始日があり、終了日がまだ入っていない）→「生理◯日目」
 *   cycle    … 出血は終わっている → 「周期◯日目」
 *   none     … まだ1件も記録が無い
 * ★押し忘れても、次の開始日が入った時点で自動的に閉じる（§4-1）。
 *   終了日は空のままにして、日数の計算にだけ使わない。
 */
export function currentCycleState(periods, todayISO) {
  const list = sortPeriods(periods);
  if (list.length === 0) return { state: "none" };
  const latest = list[0];
  if (todayISO < latest.start_date) return { state: "none" };
  const dayIndex = diffDays(latest.start_date, todayISO) + 1;
  if (!latest.end_date) {
    // ★「終わった」の押し忘れ。BLEEDING_DAYS_MAX を超えたら、出血中として扱わない。
    //   ここに上限が無かったため、押し忘れた人のホームに「生理101日目」と出ていた。
    //   カレンダーの帯は buildBleedingDayset が同じ上限で止めていたので、
    //   同じ「出血期間の最大」という決定が2か所にあって、片方だけ効いていた。
    //   ★上限はこの定数1つから両方が読むこと。
    if (dayIndex > BLEEDING_DAYS_MAX) {
      return { state: "cycle", dayIndex, periodId: latest.id, startDate: latest.start_date };
    }
    return { state: "bleeding", dayIndex, periodId: latest.id, startDate: latest.start_date };
  }
  if (todayISO <= latest.end_date) {
    return { state: "bleeding", dayIndex, periodId: latest.id, startDate: latest.start_date };
  }
  return { state: "cycle", dayIndex, periodId: latest.id, startDate: latest.start_date };
}

// ---------------------------------------------------------------------------
// §5-2 カレンダーの下に出す4つ。5つ目を足さないこと。
// ---------------------------------------------------------------------------
function median(xs) {
  const v = xs.slice().sort((a, b) => a - b);
  if (v.length === 0) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

/**
 * @returns {{
 *   enough: boolean, needMore: number,
 *   averageCycle: number|null, variability: number|null,
 *   averageBleeding: number|null, nextEstimate: string|null,
 *   usedCycles: number, totalCycles: number
 * }}
 */
export function cycleSummary(periods, todayISO) {
  const list = sortPeriods(periods);        // 新しい順
  const asc = list.slice().reverse();       // 古い順

  // 周期の長さ = 次の開始日 − この開始日
  const lengthsAll = [];
  for (let i = 0; i < asc.length - 1; i++) {
    lengthsAll.push(diffDays(asc[i].start_date, asc[i + 1].start_date));
  }
  const lengths = lengthsAll.filter((n) => n >= CYCLE_LENGTH_MIN && n <= CYCLE_LENGTH_MAX);
  const recent = lengths.slice(-6);          // §5-2「直近6周期」

  const bleedingAll = asc
    .filter((p) => p.end_date)
    .map((p) => diffDays(p.start_date, p.end_date) + 1);
  const bleeding = bleedingAll.filter((n) => n >= 1 && n <= BLEEDING_DAYS_MAX);

  const enough = recent.length >= MIN_CYCLES_FOR_AVERAGE;
  if (!enough) {
    return {
      enough: false,
      needMore: MIN_CYCLES_FOR_AVERAGE - recent.length,
      averageCycle: null, variability: null, averageBleeding: null, nextEstimate: null,
      usedCycles: recent.length, totalCycles: lengthsAll.length
    };
  }

  const avg = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
  // ばらつきは中央絶対偏差。少ない件数で1回の外れに振り回されないようにする。
  const med = median(recent);
  const variability = Math.round(median(recent.map((n) => Math.abs(n - med))) || 0);
  const averageBleeding = bleeding.length ? Math.round(bleeding.reduce((a, b) => a + b, 0) / bleeding.length) : null;

  // §5-2「次回の目安」= 直近の開始日 + 平均周期日数。単純な足し算。★必ず「ごろ」を添える。
  const nextEstimate = list.length ? addDaysISO(list[0].start_date, avg) : null;

  return {
    enough: true, needMore: 0,
    averageCycle: avg, variability, averageBleeding, nextEstimate,
    usedCycles: recent.length, totalCycles: lengthsAll.length
  };
}

// ---------------------------------------------------------------------------
// §5-1 カレンダーに重ねる帯。日付 → その日が出血期間かどうか。
// 終了日が空の周期は、今日までを出血中として塗る（押し忘れても破綻しないように）。
// ただし次の開始日が入っていれば、そこで閉じる（§4-1）。
// ---------------------------------------------------------------------------
export function buildBleedingDayset(periods, todayISO) {
  const asc = sortPeriods(periods).slice().reverse();
  const days = new Set();
  asc.forEach((p, i) => {
    let last = p.end_date;
    if (!last) {
      // ★終了日が無い周期の扱い。
      //   進行中（これが最後の周期）なら、今日まで塗る。まだ続いているため。
      //   すでに次の周期が始まっているなら、「終わった」の押し忘れであって、
      //   いつ終わったかは分からない。分からない日を塗ると、知らないことを
      //   知っているように見せてしまうので、開始日だけにとどめる。
      const isOngoing = !asc[i + 1];
      last = isOngoing ? todayISO : p.start_date;
      if (last < p.start_date) last = p.start_date;
    }
    // 塗りすぎを防ぐ上限。押し忘れたまま何ヶ月も塗り続けるのを避ける。
    const span = Math.min(diffDays(p.start_date, last), BLEEDING_DAYS_MAX - 1);
    for (let d = 0; d <= Math.max(0, span); d++) days.add(addDaysISO(p.start_date, d));
  });
  return days;
}
