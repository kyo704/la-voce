// ============================================================================
// ★設定の 節 ── ★何を 出し、★どれが まだ か（★見本 `P_settei`）
//
//   ★★★裁定 その97（2026-09-19）── ★1画面ずつ、★**機能まで**。
//     ★★この 蔵は「設定」の 骨 です。★左に 一覧、★右に 中身。
//
//   ★★★見本は 12の 節を、★できことで 出し分けて います。
//     ★★実装は 4つ しか ありませんでした（ご請求・役職・ひと・授業の型）。
//     ★★★残りは「まだ」です。★押せる 札に しません（★§8⑤）。
//       ★★出さないのでは なく、★「まだ」と 名ざしで お伝えします。
//       ★★何が 無くて できないのかも、★一緒に 書きます。
//
//   ★★決めを ここに 1つ だけ 置きます。★画面で 判じません。
//
//   ★見張り components/tests/ops-settings-nav.test.js
// ============================================================================

import { permSet } from "@/lib/opsPerms";

/**
 * ★節（★見本 `P_settei` の 並びの とおり）。
 *
 *   `key`   … ★どの 中身を 出すか
 *   `label` … ★見本の 字。★1文字も 変えないこと
 *   `any`   … ★出す できこと（★1つでも 持って いれば 出します）
 *   `ready` … ★中身が ある か（★false なら「まだ」）
 *   `needs` … ★まだ の とき、★何が 足りないか
 */
export const SETTING_SECTIONS = Object.freeze([
  { key: "miyasu", label: "見やすさ（文字の 大きさ）", any: null, ready: true },
  // ★★★ご請求 ── ★数の ほかに、★請求書の 宛名と ご請求の 宛先が 入りました
  //   （★2026-09-19・見本 `P_seikyuNa` ／ `P_atesaki`）。
  //   ★★変えられるのは `bill_pay` を 持つ 方 だけ です。★台帳の 門も そう です。
  { key: "bill", label: "ご請求", any: ["bill", "bill_pay"], ready: true },
  // ★★★2026-09-20 に できました（★`export_log` に 記録が 残ります）。
  { key: "export", label: "書き出す（校務システムへ）", any: ["meibo", "sched_all"],
    ready: true },
  // ★★★見本は **両方** です ── `can('meibo')&&can('master')`（★2026-09-20 に 気づきました）。
  //   ★★`any`（どれか 1つ）で 書いて いました。★片方 だけ の 方にも 出ます。
  //   ★★名簿を 丸ごと 書き換える 力 です。★狭い ほうに 揃えます。
  // ★★★2026-09-20 に できました（★裁定 その109・`roster_drafts`）。
  { key: "import", label: "読み込む（校務システムから）", all: ["meibo", "master"],
    ready: true },
  // ★★★2026-09-20 に できました（★`org_periods`）。
  { key: "koma", label: "時間の 割り方（コマ）", any: ["koma", "koma_mine"], ready: true },
  // ★★★2026-09-20 に できました（★`org_places`）。
  { key: "place", label: "場所", any: ["koma"], ready: true },
  // ★★★2026-09-20 ── ★表は もとから あります（★`my_periods` ／ `my_timetable`）。
  //   ★★画面も あります（★`components/MyTimetable.jsx`）。
  //   ★★★2枚目を 作りません。★同じ 決めを 2か所に 置きません。
  //   ★★★門を 広げました（★2026-09-20・坂本さんの お決め D103）。
  //     ★★見本は `can('sched_mine')` だけ です。★学長・事務長には 出ません。
  //     ★★★学長も 事務長も、★ご自分で 教える ことが あります。
  //       ★★ご自分の 予定は、★その 方の もの です。★出さない 理由が ありません。
  //     ★★Opus に お尋ね中 です。★戻す ことに なったら、★`any` から
  //       ★★`sched_all` を 外すだけ です（★1か所）。
  { key: "mine", label: "自分の 予定（レッスン いがい）",
    any: ["sched_mine", "sched_all"], ready: true },
  { key: "jugyo", label: "授業の 型", any: ["meibo"], ready: true },
  // ★★★2026-09-20 に できました（★`eval_items` ／ 点を 入れる 画面）。
  { key: "saiten", label: "評価の 型", any: ["master"], ready: true },
  // ★★★2026-09-19（★裁定 その98 BLOCKER_1）── ★表が できました。
  //   ★★`org_divisions`（`parent_id` で つなぐ）／`memberships.division_id`。
  { key: "org", label: "学校の 形", any: ["master"], ready: true },
  // ★★★学校の ようす（★裁定183 P3・P4 ／ 2026-09-24）。
  //   ★★見本では 設定の 1節 です（`stYousu`）。★別の タブに しません。
  //     ★毎月 1日に こちらで 作る ものです。★毎日 見る ものでは ありません。
  //   ★★中身は「半年の まとめ」と「はじめの 1週間」の 2つ です。
  { key: "yousu", label: "学校の ようす", any: ["master"], ready: true },
  // ★★★門下の 決め方（★裁定186 ／ 2026-09-24）。
  //   ★★見本では 設定の 1節 です（`stMonkaWay`）。
  //   ★★★`master` だけ。★学校の 形の 決め なので、★事務の 札では 開きません。
  { key: "monkaway", label: "門下の 決め方", any: ["master"], ready: true },
  // ★★★契約者（★裁定 その116・2026-09-20）。
  //   ★★出すのは 契約者 ご本人 だけ です。★できことでは 出しません
  //     （★裁定 その115 Q2 ── ★役職の 一覧に 出さない）。
  //   ★★だから `any` を 使いません。★呼ぶ 側が 契約者か どうかで 出します。
  { key: "contract", label: "契約者を 変える", any: null, contractOwnerOnly: true, ready: true },
  { key: "post", label: "役職と、できること", any: ["post", "master"], ready: true },
  { key: "people", label: "ひとと 役職", any: ["post", "master"], ready: true }
]);

/** ★その方に 出す 節（★並びは 上の とおり）。 */
export function sectionsFor(perms, opts) {
  const s = permSet(perms);
  const 契約者 = !!(opts && opts.isContractOwner);
  return SETTING_SECTIONS.filter((x) => {
    // ★★契約者 だけ の 節。★できことでは 開きません（★裁定 その115 Q2）。
    if (x.contractOwnerOnly) return 契約者;
    // ★★`all` …… ★すべて 要ります（★見本の `&&`）。
    if (x.all && !x.all.every((k) => s.has(k))) return false;
    // ★★`any` …… ★どれか 1つ（★見本の `||`）。
    if (x.any && !x.any.some((k) => s.has(k))) return false;
    return true;
  });
}

/** ★いま 触れる 節（★中身が ある ものだけ）。 */
export function readySections(perms, opts) {
  // ★★★`opts` を 落として いました（★2026-09-20 に 実機で 見つけました）。
  //   ★★画面は こちらを 使って 札を 並べます。★契約者の 節が 出ません でした。
  //   ★★同じ 決めを 2つの 道で 読むなら、★渡す ものも 同じに します。
  return sectionsFor(perms, opts).filter((x) => x.ready);
}

/** ★まだ の 節（★何が 足りないかを 添えて）。 */
export function notYetSections(perms, opts) {
  return sectionsFor(perms, opts).filter((x) => !x.ready);
}

/**
 * ★はじめに 開く 節。
 *
 *   ★★★中身の ある ものの うち、★いちばん 上 です。
 *     ★★「まだ」を 開いて 白い 紙を 出しません。
 *   ★★1つも 無ければ null。★そのときは 一覧だけ を 出します。
 */
export function firstSection(perms, opts) {
  const r = readySections(perms, opts);
  return r.length ? r[0].key : null;
}

/** ★その 節を、★その方が 開けるか。 */
export function mayOpen(perms, key, opts) {
  return readySections(perms, opts).some((x) => x.key === key);
}

/** ★左の 一覧の 幅（★見本 ── `flex:0 0 210px`）。 */
export const SIDE_WIDTH = 210;

/** ★2つに 分ける 幅（★運営の ほかの 画面と 同じ 境目）。 */
export const TWO_PANE_AT = 900;
export function isTwoPane(width) {
  return typeof width === "number" && width >= TWO_PANE_AT;
}

/** ★まだ の 節を まとめた 題と 1行。 */
export const NOT_YET_HEAD = "まだ できない こと";
export const NOT_YET_LINE =
  "作って いない ものです。押せる 札に しません。何が 足りないかを 書きます。";

/** ★題（★見本 ── ご請求を 持つ 方には「設定・ご請求」）。 */
export function headOf(perms) {
  const s = permSet(perms);
  return (s.has("bill") || s.has("bill_pay")) ? "設定・ご請求" : "設定";
}
