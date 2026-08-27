// ============================================================================
// 発声量（vocal dose）— 統合実行ルートv4 G2-10.5 ／ 改善タスクv2 §3-1
//
// ★なぜこれが「他の分析の土台」なのか
//   声の障害をいちばんよく説明するのは「どれだけ声を使ったか」です。
//   受診用サマリーの「1日あたりの平均発声時間」が約0時間と出ていたのは、
//   計算が壊れていたからではありません。活動ブロックに「分」の欄はあるのに、
//   小さな数値欄なので、実際にはほとんど入力されないからです。
//   ★入力の手段が無いのではなく、入力の負担が重すぎた、が正確な診断です。
//   だから直し方は、計算式ではなく入力方法のほうです（開始／終了ボタン）。
//
// ★このファイルが持つ決定
//   1. 発声の種別と、その負荷の重み
//   2. 実測が無いときに使う、種別ごとの推定時間
//   3. ある日の発声時間が「実測」か「推定」か
//   この3つが画面のあちこちに散ると、片方だけ直る事故が必ず起きます。
// ============================================================================

// 種別。★「発話業務」は、歌わない人（アナウンサー・声優・講師）の本体です。
//   「歌っていない＝休養日」という誤った過小評価を正すために要ります。
export const VOCAL_SESSION_KINDS = ["自主練習", "レッスン", "リハーサル", "本番", "発話業務"];

// 負荷の重み。★既存の ACTIVITY_LOAD_WEIGHT と同じ値を使うこと。
//   発話業務は、既存の nonPerformanceSpeechMinutes と同じ 1.0。
export const VOCAL_LOAD_WEIGHT = {
  "休養": 0, "自主練習": 1.0, "レッスン": 1.2, "リハーサル": 1.3, "本番": 1.6, "発話業務": 1.0
};

// ---------------------------------------------------------------------------
// ★実測が無いときの推定時間（分）。
//
// これまでは、分が空の活動は負荷0として扱われていました。「レッスンに行った」と
// 記録した日が、声を1分も使わなかった日と同じ扱いになっていた、ということです。
// ACWR が動かない原因はここでした。
//
// 計算式は1文字も変えません。式に渡す「分」が空のときに、この値を代わりに渡します。
// ★推定を使ったことは必ず画面に出すこと（isEstimated）。実測と混ぜて見せない。
// ---------------------------------------------------------------------------
export const ESTIMATED_MINUTES_BY_KIND = {
  "自主練習": 60, "レッスン": 60, "リハーサル": 120, "本番": 90, "発話業務": 60
};

// ---------------------------------------------------------------------------
// 押し忘れ対策。
// ★「終了」を押し忘れたセッションを、そのまま何時間も記録しないこと。
//   周期記録で「終わった」の押し忘れを扱ったのと同じ考え方です。
//   いつ終わったか分からないものを、分かっているように保存しない。
// ---------------------------------------------------------------------------
export const SESSION_MAX_MINUTES = 240;          // これを超えたら、本人に確認する
export const SESSION_MIN_MINUTES = 1;            // 1分未満は数えない（誤タップ）

export function elapsedMinutes(startedAtMs, nowMs) {
  if (!startedAtMs || !nowMs || nowMs < startedAtMs) return 0;
  return Math.floor((nowMs - startedAtMs) / 60000);
}

/** 計測したセッションが、そのまま保存してよい長さか。 */
export function reviewSession(minutes) {
  if (minutes < SESSION_MIN_MINUTES) return { action: "discard", minutes: 0 };
  if (minutes > SESSION_MAX_MINUTES) return { action: "confirm", minutes };
  return { action: "save", minutes };
}

// ---------------------------------------------------------------------------
// 1つの活動ブロックの発声時間。
// source === "timer" のものだけが実測です。手入力も本人の申告なので実測に数えます。
// ★どちらでもない（分が空）ときだけ、推定に落とします。
// ---------------------------------------------------------------------------
export function activityMinutes(activity) {
  if (!activity) return { minutes: 0, isEstimated: false, kind: null };
  const kind = activity.kind || null;
  const raw = activity.minutes;
  const n = Number(raw);
  if (raw !== "" && raw != null && Number.isFinite(n) && n > 0) {
    return { minutes: n, isEstimated: false, kind };
  }
  const est = ESTIMATED_MINUTES_BY_KIND[kind];
  if (est == null) return { minutes: 0, isEstimated: false, kind };
  return { minutes: est, isEstimated: true, kind };
}

/**
 * 1日の発声量。
 * @returns {{ totalMinutes:number, byKind:Object, isEstimated:boolean,
 *             measuredMinutes:number, estimatedMinutes:number, sessionCount:number }}
 */
export function dayVocalDose(entry) {
  const acts = (entry && entry.activities) || [];
  const byKind = {};
  let measured = 0, estimated = 0, sessions = 0;
  acts.forEach((a) => {
    const { minutes, isEstimated, kind } = activityMinutes(a);
    if (minutes <= 0) return;
    sessions += 1;
    byKind[kind || "その他"] = (byKind[kind || "その他"] || 0) + minutes;
    if (isEstimated) estimated += minutes; else measured += minutes;
  });

  // 本番外の発話（既存項目）。★活動ブロックに「発話業務」がある日は、
  //   そちらが実測なので二重に数えないこと。
  const hasSpeechSession = acts.some((a) => a && a.kind === "発話業務");
  if (!hasSpeechSession && entry) {
    if (typeof entry.nonPerformanceSpeechMinutes === "number" && entry.nonPerformanceSpeechMinutes > 0) {
      measured += entry.nonPerformanceSpeechMinutes;
      byKind["発話業務"] = (byKind["発話業務"] || 0) + entry.nonPerformanceSpeechMinutes;
      sessions += 1;
    } else if (typeof entry.speakingLevel === "number" && entry.speakingLevel > 0) {
      // 旧3択からの概算。これは推定。
      const m = entry.speakingLevel * 22.5;
      estimated += m;
      byKind["発話業務"] = (byKind["発話業務"] || 0) + m;
      sessions += 1;
    }
  }

  return {
    totalMinutes: measured + estimated,
    byKind,
    isEstimated: estimated > 0,
    measuredMinutes: measured,
    estimatedMinutes: estimated,
    sessionCount: sessions
  };
}

/** 週ごとの合計（日曜はじまり）。グラフ用。 */
export function weeklyVocalDose(entries, startISO, endISO, weekStartOf) {
  const weeks = {};
  Object.keys(entries || {})
    .filter((d) => (!startISO || d >= startISO) && (!endISO || d <= endISO))
    .sort()
    .forEach((d) => {
      const dose = dayVocalDose(entries[d]);
      if (dose.totalMinutes <= 0) return;
      const wk = weekStartOf(d);
      const w = weeks[wk] || (weeks[wk] = { week: wk, minutes: 0, estimatedMinutes: 0 });
      w.minutes += dose.totalMinutes;
      w.estimatedMinutes += dose.estimatedMinutes;
    });
  return Object.values(weeks)
    .sort((a, b) => a.week.localeCompare(b.week))
    .map((w) => ({
      week: w.week,
      hours: Math.round((w.minutes / 60) * 10) / 10,
      // ★推定がまざっている週は、そのことを画面に出すために持ち回る。
      isEstimated: w.estimatedMinutes > 0,
      estimatedShare: w.minutes > 0 ? w.estimatedMinutes / w.minutes : 0
    }));
}
