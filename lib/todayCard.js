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


// ============================================================================
// 羊の ひとこと（★見本 S_kyou の .card）
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//     の S_kyou（★git hash 7c7c720）
//
//     (S.R.nodo||S.R.deki ? 'きょうの ぶんを 書いてくれて ありがとう'
//                         : 'きょうも 来てくれて ありがとう')
//     '羊は「記録した行為」に 反応します。中身には 反応しません'
//
//   ★★2026-09-11、★比較画像で 3つ 見つかりました。
//     ★① 句点が 2つ ありました（「…ありがとう。。」）。
//       ★VocalTracker が SHEEP_LINE + "。" と 足して いました。
//       ★SHEEP_LINE 自身が すでに 句点を 持って いました。
//     ★② 見本に 句点は ありません。
//     ★③ 下の 1行（羊は「記録した行為」に…）が 出て いませんでした。
//
//   ★★羊は「記録した行為」に 反応します。「記録の中身」には 反応しません。
//     ★だから、★書いたか どうかだけを 見ます。★中身を 見ません。
// ============================================================================

/** ★まだ 書いていない 日。★1文字も 変えないこと。 */
export const SHEEP_THANKS_YET = "きょうも 来てくれて ありがとう";

/** ★もう 書いた 日。★1文字も 変えないこと。 */
export const SHEEP_THANKS_DONE = "きょうの ぶんを 書いてくれて ありがとう";

/** ★下の 1行。★1文字も 変えないこと。 */
export const SHEEP_SUB = "羊は「記録した行為」に 反応します。中身には 反応しません";

/**
 * ★きょうの ひとこと。
 *
 *   ★★見本は のどの調子 か 声の出来 の どちらかが 入って いれば
 *     ★「書いてくれて ありがとう」に なります。
 *   ★★中身は 見ません。★「よい」でも「わるい」でも 同じ 文です。
 */
export function sheepThanks(entry) {
  const e = entry || {};
  const wrote = e.throatCondition != null || e.voiceQuality != null;
  return wrote ? SHEEP_THANKS_DONE : SHEEP_THANKS_YET;
}

/**
 * ★きょうの 画面の いちばん下の 3行（★見本 S_kyou の .note）。
 *
 *   ★出どころ 動く見本 613行
 *   ★★1文字も 変えないこと。
 *   ★★どれも「出しません」と 書いてある 行です。
 *     ★見張りが 禁じ手の 語を 探す ときは、★この 3行を 先に 外すこと。
 */
export const TODAY_NOTE = Object.freeze([
  "点数も、きょうの調子の 判定も 出しません。",
  "羊を 押しても 何も 起きません（飾りでは なく 状態です）。",
  "「連続◯日」を 出しません。"
]);

// ============================================================================
// 本番の 朝に 返す ことば（★見本 S_kyou・577〜582行）
//
//   ★出どころ Opus の 裁定（★2026-09-11・その15）②
//     「アプリは、1文字も足さず、要約もせず、知らせも出さず、書くよう誘わない」
//
//   ★★4つの 決まり。★どれも 守ります。
//     ① 1文字も 足しません。★書かれた ままを 出します。
//     ② 要約しません。★短く しません。★行を まとめません。
//     ③ 知らせを 出しません。★通知も、印も、赤い 丸も 出しません。
//     ④ 書くように 誘いません。★「書きませんか」と 言いません。
//       ★★書いて いない 方には、★何も 出ません。★枠も 出しません。
//
//   ★★出すのは、★本番の 日の 朝だけです。
//     ★前の日でも、★次の日でも ありません。★その日 1日だけ。
//     ★★見本は HONBAN.d === '2026年9月9日' と、★その日を 直に くらべて います。
//
//   ★★列　performances.morning_words
//     ★supabase/2026-09-11-本番の朝に返すことば.sql
//     ★★アプリは この 字を 読みません。★そのまま 出すだけです。
//       ★要約しません。★数えません。★分析に 使いません。
// ============================================================================

/** ★下に そえる 1行（★見本 .usu）。★1文字も 変えないこと。 */
export const MORNING_WORDS_FOOT = "前に あなたが 書いた ことばです";

/**
 * ★きょうの 朝に 返す ことば。★無ければ null。
 *
 *   ★★その日の 本番だけを 見ます。★前の日も 次の日も 見ません。
 *   ★★書いて いなければ null です。★枠ごと 出しません。
 *   ★★1つも 足しません。★空白を 詰めるだけの 手も 入れません。
 *
 *   @param performances ★[{ performed_on, label, morning_words, … }]
 *   @param todayISO     ★きょう（YYYY-MM-DD）
 *   @returns { words, label } ★または null
 */
export function morningWordsFor(performances, todayISO) {
  if (!Array.isArray(performances) || !todayISO) return null;
  const hit = performances.find((p) => {
    if (!p) return false;
    const d = String(p.performed_on || p.date || "");
    if (d !== todayISO) return false;
    // ★★空白だけの ときは 出しません。★枠だけが 立つのを 防ぎます。
    return typeof p.morning_words === "string" && p.morning_words.trim().length > 0;
  });
  if (!hit) return null;
  // ★★書かれた ままを 返します。★trim も しません。
  //   ★★前後の 改行も、★書いた 方の ものです。
  return { words: hit.morning_words, label: hit.label || "" };
}
