// ============================================================================
// ★下の 帯を 押したら、★その 画面の いちばん 上に 戻る（★2026-09-14）
//
//   ★出どころ 2026-09-14、★坂本さんの ご報告 ──
//     「★『きょう』で『時間割を 入れる』を 開いた まま、
//       ★もう一度『きょう』を 押しても、★時間割の ままで 戻らない」。
//
//   ★★実際に 動かして 確かめました。★押す前と 押した後の 字が、★完全に 同じでした。
//
//   ★★わけ。★帯は 名札を 変えるだけ でした ──
//     `<TabBarV2 onSelect={setActiveTab} />`
//   ★★同じ 帯を 押すと、★名札は すでに その 値です。★何も 起きません。
//   ★★名札の 下に、★別の 状態が いくつも 積んで ありました。
//
//   ★★この 1本が、★「どの 状態を 戻すか」を 決めます。
//     ★★決まりが 散らばって いると、★また 1つ 抜けます。
//       ★この 製品で 何度も 起きて きた 形です。
//
//   ★★自分の 中に 状態を 持つ 画面（★NotesV2）は、★ここでは 戻せません。
//     ★★`resetKey` を 増やして、★作り直します。
//     ★★NotesV2 は 台帳を 読みません（★親から もらいます）。★作り直しても 重く ありません。
//
//   ★見張り components/tests/tab-reset.test.js
// ============================================================================

/**
 * ★下の 帯の 名札（★V2 の 5つ）。
 *
 *   ★★`components/VocalTracker.jsx` の `TABS_V2_ORDER` と 同じ 並びです。
 */
export const TAB_KEYS = Object.freeze([
  "home", "today", "analysis", "notes", "garden"
]);

/**
 * ★帯を 押した とき、★戻す 状態。
 *
 *   ★★名札ごとに 書いて いません。★**どの 帯を 押しても ぜんぶ 戻します**。
 *     ★★「きょう」から「ノート」へ 移る ときも、
 *       ★きょうの 下の 状態は 戻って いる べきです。
 *       ★戻らないと、★あとで 帰って きた ときに 途中から 始まります。
 *     ★★名札ごとに 分けると、★足した 状態を 1つ 入れ忘れます。
 *
 *   ★★ここに 書くのは「画面の どこを 見て いるか」だけ です。
 *     ★★書きかけの 中身は 戻しません（★`formData` など）。
 *       ★書いた ものを 消す ことに なります。
 *
 *   ★key … 状態の 名前（★見張りが これを 使います）
 *   ★to　… 戻す 先
 */
export const TAB_RESETS = Object.freeze([
  // ★きょう
  { key: "showTimetable", to: false, why: "時間割の 画面を 閉じる" },
  // ★記録
  { key: "recordSheet", to: null, why: "下から 出る 1枚を 閉じる" },
  { key: "recordView", to: "voice", why: "記録の はじめの 節へ" },
  { key: "saveCardData", to: null, why: "出来上がりの 札を 閉じる" },
  // ★ノート
  { key: "tellLesson", to: null, why: "先生に 伝える 画面を 閉じる" },
  { key: "notesSubTab", to: "calendar", why: "ノートの はじめの 札へ" },
  // ★ふりかえる
  { key: "lessonRoleChoice", to: null, why: "学ぶの 選びを 戻す" },
  // ★運営（★どの 帯からでも 出られる ように）
  { key: "opsOrgId", to: null, why: "運営モードから 出る" }
]);

/**
 * ★ひつじの 画面は、★戻す 先が 外から 来ます（★`VIEW`）。
 *
 *   ★★数では ありません。★`CharacterHome` が 決めて いる 名前です。
 *     ★だから ここでは 名前だけ 持ち、★値は 呼ぶ 側から もらいます。
 */
export const HOME_STATE_KEY = "homeState";

/**
 * ★戻す ものを、★1つずつ 渡します。
 *
 *   ★★`setters` … `{ showTimetable: setShowTimetable, ... }`
 *   ★★`homeStateDefault` … ひつじの 画面の はじめの 姿
 *
 *   ★★無い ものは 飛ばします。★落ちません。
 *     ★★門の 外（38人）では、★まだ 無い 状態が あります。
 */
export function resetTabState(setters, homeStateDefault) {
  const s = setters || {};
  TAB_RESETS.forEach((r) => {
    const fn = s[r.key];
    if (typeof fn === "function") fn(r.to);
  });
  const h = s[HOME_STATE_KEY];
  if (typeof h === "function" && homeStateDefault !== undefined) {
    h(homeStateDefault);
  }
}

/**
 * ★自分の 中に 状態を 持つ 画面を、★作り直す ための 数。
 *
 *   ★★押すたびに 1つ 増えます。★`key` に 使うと、★React が 作り直します。
 *   ★★増えるだけ です。★戻りません。★同じ 数に ならないためです。
 */
export function nextResetKey(cur) {
  const n = Number(cur);
  return Number.isFinite(n) ? n + 1 : 1;
}
