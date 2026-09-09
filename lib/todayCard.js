// ============================================================================
// 「きょう」の画面の 数と 言葉（2026-09-09・見本①）
//
//   ★出どころ Woolsong 画面の見本（2026年9月9日）① きょう／生徒
//
//   ★★見本の 決まり
//     ★グラフを 1つも 置きません。
//     ★点数を 出しません。★「69/100」も「4.0/5」も 出しません。
//     ★★出すのは「★きょうの ことば」と「★あなたの ふだん」だけです。
//
//   ★★「あなたの ふだん」は、★その方の 中央値です。
//     ★★よそと くらべません。★くらべるのは、いつもの ご自分とだけです。
//     ★★平均では なく 中央値です。★1日の 大きな ぶれに 引きずられません。
//
//   ★★足りないときは、★黙って 空けます。
//     ★「データ不足」と 書かないこと（★2026-09-08 の 決め）。
//     ★書くと、★足りない ことが 責めに なります。
//
//   ★見張り components/tests/today-card.test.js
// ============================================================================

/** ★「ふだん」を 出すのに いる 日数。★これ未満なら 出しません。 */
export const USUAL_MIN_DAYS = 5;

/** ★さかのぼる 日数。 */
export const USUAL_WINDOW_DAYS = 30;

/**
 * ★こえの調子の 言葉（★1〜5 を 3つに まとめます）。
 *
 *   ★★見本③の 3択と、★同じ 言葉に そろえます。
 *     出た ／ ふつう ／ 出づらい
 *   ★★数を 出しません。★言葉だけです。
 */
export function conditionWord(v) {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  if (v >= 4) return "出た";
  if (v <= 2) return "出づらい";
  return "ふつう";
}

/**
 * ★ねむりを、★数と 単位に 分けます。
 *
 *   ★★見本① は 6<s>時間</s>20<s>分</s> の 形です。
 *     ★数は 26px 700、★単位は 12px 400。★大きさが ちがいます。
 *   ★★だから、★1本の 文字列では 出せません。★分けて 返します。
 *
 *   ★返す形 [{ n: "6", u: "時間" }, { n: "20", u: "分" }]
 */
export function sleepParts(hours) {
  if (typeof hours !== "number" || !Number.isFinite(hours) || hours <= 0) return null;
  let h = Math.floor(hours);
  let m = Math.round((hours - h) * 60);
  // ★★59分30秒を 丸めると 60分に なります。★「6時間60分」と 書かないこと。
  if (m === 60) { h += 1; m = 0; }
  return [{ n: String(h), u: "時間" }, { n: String(m), u: "分" }];
}

/**
 * ★ねむりの 言葉（★6時間20分 の 形）。
 *
 *   ★★sleepParts から 作ります。★丸め方を 2か所に 書きません。
 *     ★書くと、★片方だけ 直ります。
 */
export function sleepWord(hours) {
  const parts = sleepParts(hours);
  if (!parts) return null;
  return parts.map((p) => p.n + p.u).join("");
}

/** ★中央値。★空なら null。 */
export function median(xs) {
  const a = (xs || []).filter((x) => typeof x === "number" && Number.isFinite(x)).sort((p, q) => p - q);
  if (a.length === 0) return null;
  const i = Math.floor(a.length / 2);
  return a.length % 2 ? a[i] : (a[i - 1] + a[i]) / 2;
}

/**
 * ★「あなたの ふだん」。
 *
 *   ★★きょうを 含めません。★きょうと くらべる ものだからです。
 *   ★★日数が 足りなければ null。★黙って 空けます。
 *
 *   @param entries  {日付: 記録}
 *   @param todayISO きょう
 *   @param pick     記録から 数を 取り出す関数
 */
export function usualOf(entries, todayISO, pick) {
  const from = shiftISO(todayISO, -USUAL_WINDOW_DAYS);
  if (!from) return null;
  // ★★暦の 30日で 切ります。★「記録した 30回」では ありません。
  //   ★★半年 前の 記録を「あなたの ふだん」と 呼ぶわけには いきません。
  //   ★★まばらな 方には 出ませんが、★それで よいのです。★黙って 空けます。
  const days = Object.keys(entries || {}).filter((d) => d >= from && d < todayISO);
  const xs = days.map((d) => pick(entries[d])).filter((x) => typeof x === "number" && Number.isFinite(x));
  if (xs.length < USUAL_MIN_DAYS) return null;
  return median(xs);
}

/**
 * ★ISO の 日付を 前後に ずらします。★時計を 見ません。
 *
 *   ★★UTC で 組み立てます。★端末の 時差で ずれないためです。
 */
export function shiftISO(iso, days) {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const t = Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
  return new Date(t + days * 86400000).toISOString().slice(0, 10);
}
