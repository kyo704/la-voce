// ============================================================================
// ★運営の ホーム ── ★どの 節を 出すか（★裁定 その79・2026-09-18）
//
//   ★出どころ 見本 `P_home` ／ `P_homeS` ／ `P_homeT`
//
//   ★★★見本は 役職で **3つの 画面** に 分けて います。
//     ★★実装は **1つ** です。★裁定 その79 で、★1つの ままと 決まりました。
//     ★★★わけ ──
//       ★★「学長・副学長」「事務」「先生」は、★**役職の 名** で 束ねて います。
//       ★★役職は 学校が 自由に 作れます（★裁定 その75）。
//       ★★「特任教授」を 作った 日に、★どの 画面を 出すか 決められません。
//       ★★★A2 の 決め ──「出し分けは できことから 導く」── と 同じ 向き です。
//
//   ★★節ごとに、★できことで 出す／出さない を 決めます。
//     ★★★ここに 役職の 名を 書きません。★1つも 書きません。
//
//   ★見張り components/tests/ops-home-sections.test.js
// ============================================================================

import { permSet, tabsForPerms } from "@/lib/opsPerms";

/**
 * ★節と、★出す 条件（★裁定 その79 の 表 そのまま）。
 *
 *   ★★`any` の うち 1つでも 持って いれば 出します。
 *   ★★並びは、★見本の 上から 下の 順 です。
 */
export const HOME_SECTIONS = Object.freeze([
  { key: "nagare", label: "きょうの ながれ", any: ["sched_all", "sched_mine"] },
  { key: "lesson", label: "きょうの レッスン", any: ["sched_mine"] },
  { key: "monka", label: "門下の 連絡", any: ["monka_write"] },
  { key: "gyoji", label: "近い 行事", any: ["gyoji"] },
  { key: "oshirase", label: "お知らせ", any: ["renraku_all"] },
  { key: "bill", label: "ご請求の 要約", any: ["bill", "bill_pay"] }
]);

/**
 * ★数の 札（★見本の `kpi`）── ★何を 出し、★どこへ 行くか。
 *
 *   ★★★見本は 役職で 枚数が 変わります ── ★学長 4 ／ 先生 3 ／ 職員 2。
 *     ★★実装は ずっと 4枚 でした（★2026-09-19 に 数えました）。
 *     ★★★「名簿の 人数」を、★名簿の できことを 見ずに 出して いました。
 *
 *   ★★行き先 ── ★見本は 押すと その 一覧へ 行きます。
 *     ★★★きょうまで 押せません でした（★裁定 その92 くらべ D2）。
 *       ★★行き先は 前から あります。★渡して いなかった だけ です。
 *
 *   ★★`any` …… ★その 札を 出す できこと
 *   ★★`tab` …… ★押した ときに 行く 帯
 */
export const HOME_STATS = Object.freeze([
  { key: "lessonToday", label: "きょうの レッスン", unit: "件",
    any: ["sched_all", "sched_mine"], tab: "schedule" },
  { key: "roster", label: "名簿の 人数", unit: "人", any: ["meibo"], tab: "roster" },
  { key: "monka", label: "門下の 人数", unit: "人", any: ["monka_write"], tab: "monka" },
  { key: "teachers", label: "先生", unit: "人", any: ["meibo"], tab: "settings" },
  { key: "overlap", label: "重なり", unit: "件",
    any: ["sched_all", "sched_mine"], tab: "schedule" }
]);

/**
 * ★その方に 出す 数の 札。
 *
 *   ★★`tappable` …… ★行き先の 帯が、★その方に 開いて いるか。
 *     ★★★開いて いない のに 押せる 札を 置きません（★§8⑤）。
 *       ★★押しても 何も 起きない 札は、★壊れて 見えます。
 *     ★★出すか どうか（`any`）と、★押せるか どうか（`tab`）は 別 です。
 *       ★★例 ── ★名簿だけ の 方に「先生」の 数は 出ますが、
 *         ★★設定の 帯が 無ければ 押せません。★数は 見えます。
 */
export function homeStats(perms) {
  const s = permSet(perms);
  const 帯 = new Set((tabsForPerms(perms) || []).map((t) => t.key));
  return HOME_STATS
    .filter((x) => x.any.some((k) => s.has(k)))
    .map((x) => ({ ...x, tappable: 帯.has(x.tab) }));
}

/** ★その方に 出す 節。★並びは 上の とおり です。 */
export function homeSections(perms) {
  const s = permSet(perms);
  return HOME_SECTIONS.filter((x) => x.any.some((k) => s.has(k)));
}

/**
 * ★1つも 出ない ときの 1行（★裁定 その79 の note）。
 *
 *   ★★★空の 画面を 出しません。★白い 紙は「壊れた」と 読まれます。
 *   ★★何が できる かを 1行 書きます。★何が できないかでは ありません。
 *
 *   ★★★いま、★ひな型 10役職 の どれも 1つ以上 出ます（★数えました・2026-09-18）。
 *     ★★いちばん 少ないのは 職員の 1つ（きょうの ながれ）です。
 *     ★★★けれど 学校は 役職を 自由に 作れます。
 *       ★★できことを 1つも 付けない 役職も 作れます。★そのときの ため です。
 */
export const EMPTY_LINE =
  "いまの 役職では、ここに 出す ものが ありません。左の 帯から お選びください。";

/** ★節の 題（★見本の h3 そのまま）。★字を 画面に 書きません。 */
export const SECTION_HEADS = Object.freeze({
  nagare: "きょうの ながれ",
  lesson: "きょうの レッスン",
  monka: "門下の 連絡",
  gyoji: "近い 行事",
  oshirase: "お知らせ",
  bill: "ご請求の 要約"
});

/**
 * ★節の 中が 空の ときの 1行。
 *
 *   ★★★「ありません」と 書かない もの と、★書く もの が あります。
 *     ★★きょうの 予定が 無い のは、★ふつうの こと です。★黙ります。
 *     ★★お知らせが 1つも 無い のは、★出す ものが 無い という こと です。
 *       ★★その 節 ごと 出しません。★空の 箱を 置きません。
 */
export const NOTHING_YET = Object.freeze({
  monka: "まだ 書き込みが ありません。",
  oshirase: "まだ お知らせが ありません。",
  bill: "まだ お決めいただいて いません。"
});

/** ★開いた 記録の 1行（★裁定 その76）。★数 だけ です。★誰が 見たかは 出しません。 */
export const OPENED_LOG_LABEL = "門下を 開いた記録";

/**
 * ★画面に 出す 但し書き（★見本 `P_home` の note）。
 *
 *   ★★★きょうまで、★註（コメント）には 書いて ありました。
 *     ★★画面の 字に なって いません でした（★2026-09-19 に 見つけました）。
 *   ★★見て いる 方に 伝わらない 約束は、★約束では ありません。
 */
export const HOME_NOTES = Object.freeze([
  "売上の 予測を 出しません。出欠の 達成率（％）も 出しません。",
  "数の 札を 押すと、その 一覧へ 行きます。",
  "この画面から、生徒の 健康の 記録には たどりつけません（画面そのものが ありません）。"
]);

/**
 * ★出欠の 画面へ 行ける か（★裁定 その79 Q2）。
 *
 *   ★★★出欠に 帯（タブ）は 作りません。
 *     ★★出欠は「いつ・誰の」が 要ります。★帯だけ では 入口が 決まりません。
 *     ★★帯を 足すと「まず 日づけを 選ぶ」画面が 1つ 増えます。
 *
 *   ★★入口は 2つ です ──
 *     ★① ホーム → きょうの ながれ → その 行
 *     ★② 日程 → コマを 押す
 *
 *   ★★★どちらも 日程の できことで 開きます。
 *     ★★だから「出欠は 持って いるのに、★日程を 1つも 持たない」方は
 *       ★★どちらにも 行けません。
 *     ★★2026-09-18 に 数えました ── ★ひな型 10役職に そういう 方は **いません**。
 *     ★★★けれど 学校は 役職を 自由に 作れます。★起こり得ます。
 *       ★★その ときは「きょうの ながれ」を 出します（★裁定 その79 の 逃げ道）。
 */
export function canReachAttendance(perms) {
  const s = permSet(perms);
  return s.has("sched_all") || s.has("sched_mine");
}

/** ★出欠は 持つ のに、★どこからも 行けない 方か。 */
export function attendanceOrphan(perms) {
  const s = permSet(perms);
  return s.has("shukketsu") && !canReachAttendance(perms);
}
