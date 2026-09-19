// ============================================================================
// ★さがす（⌘K）── ★決めごと 1か所（★裁定 その78 §6 ／ その81 §4-5）
//
//   ★出どころ docs/opus/visual-*/pack/ruling-78-ops-layout.md §6
//
//   ★★★これは **ナビの 代わりでは ありません**。★足すだけ です。
//     ★★裁定 §6-1 ──「★パレットは ★ナビを 補強する もので、★置き換えでは ない」
//     ★★「★settings を ナビから 消して ⌘K に 隠すと、
//       ★★初日の ユーザーは 設定画面を 見つけられない」
//     ★★★だから、★ここに 入れた から と いって、★ナビから 外しません。
//
//   ★★★持って いない ものは 出しません（★役職で 出し分け）。
//     ★★出して 押させて、★何も 起きない のが いちばん 悪い 形 です（★§8⑤）。
//
//   ★★★できこと の 決めは `lib/opsPerms.js` が 持ちます。★ここでは 決めません。
//     ★★ここが 持つのは「★その 行を 出すには、★どの できことが 要るか」の 対応 だけ です。
//
//   ★見張り components/tests/ops-search.test.js
// ============================================================================

import { permSet } from "@/lib/opsPerms";
import { navGroupsFor } from "@/lib/opsNav";

/** ★開く／閉じる（★裁定 §6-2）。 */
export const OPEN_KEY = "k";
export const CLOSE_KEY = "Escape";

/** ★題（★見本の 字）。 */
export const SEARCH_HEAD = "さがす";
export const SEARCH_HINT = "画面の 名を 打つと、そこへ 行けます。";

/** ★1つも 見つからない ときの 字。★「0件」と 出しません。 */
export const NOTHING_LINE = "その 名の ものは ありません。";

// ----------------------------------------------------------------------------
// 【一】★よく する こと（★裁定 §6-2 の 2つ目の まとまり）
// ----------------------------------------------------------------------------
//   ★★`any` … ★どれか 1つ 持って いれば 出ます。
//   ★★`tab` … ★どの 帯の 中に ある か（★行き先）。
export const ACTIONS = Object.freeze([
  { key: "shukketsu", label: "出欠つけ", any: ["shukketsu"], tab: "home" },
  { key: "sched_build", label: "日程を組む", any: ["sched_all", "sched_mine"], tab: "schedule" },
  { key: "gyoji_new", label: "行事を出す", any: ["gyoji"], tab: "events" },
  { key: "renraku_new", label: "お知らせを書く", any: ["renraku_all", "monka_write"], tab: "threads" },
  { key: "invite", label: "招く", any: ["meibo"], tab: "roster" }
  // ★★★「採点」は 置いて いません（★裁定 §6-2 は 6つ 挙げて います）。
  //   ★★この 蔵に、★採点の 画面が ありません。★できことも ありません。
  //     ★★`PERMS` の 14 に、★採点に あたる 名は 1つも ありません。
  //   ★★★無い ものへ 行く 行を 置くと、★押しても 何も 起きません（★§8⑤）。
  //   ★★引き金 ── ★採点の 画面が でき、★その できことが `PERMS` に 入った 日。
  //     ★★その 日に、★ここへ 1行 足して ください。
  //     ★★台帳 docs/ledgers/08-保留している決め.md 08-6
]);

// ----------------------------------------------------------------------------
// 【二】★決まり（★裁定 §6-2 の 3つ目の まとまり）
// ----------------------------------------------------------------------------
export const RULES = Object.freeze([
  { key: "posts", label: "役職の一覧", any: ["post"], tab: "settings" },
  { key: "master", label: "評価の型", any: ["master"], tab: "settings" },
  { key: "koma", label: "コマを決める", any: ["koma"], tab: "settings" },
  { key: "places", label: "場所を決める", any: ["koma"], tab: "settings" }
]);

/** ★まとまりの 見出し（★裁定の 順・裁定の 字）。 */
export const GROUP_HEADS = Object.freeze(["画面", "よく する こと", "決まり"]);

function 通る(s, row) {
  return row.any.some((k) => s.has(k));
}

/**
 * ★さがすの 中身（★その 方に 出る ぶん だけ）。
 *
 *   ★★1つ目の まとまり（画面）は、★ナビと **同じ 出どころ** から 取ります。
 *     ★★★書き写しません。★ナビに 出る のに さがすに 出ない、が 起きません。
 */
export function searchGroups(perms) {
  const s = permSet(perms);
  const 画面 = navGroupsFor(perms)
    .reduce((a, g) => a.concat(g.items), [])
    .map((x) => ({ key: x.key, label: x.label, tab: x.key }));
  const 出る = [
    { head: GROUP_HEADS[0], items: 画面 },
    { head: GROUP_HEADS[1], items: ACTIONS.filter((r) => 通る(s, r)) },
    { head: GROUP_HEADS[2], items: RULES.filter((r) => 通る(s, r)) }
  ];
  return 出る.filter((g) => g.items.length > 0);
}

/**
 * ★打った 字で しぼる。
 *
 *   ★★字が 空の ときは ぜんぶ 出します（★開いた 直後）。
 *   ★★大小・前後の 空きは 見ません。
 */
export function filterGroups(groups, word) {
  const w = String(word || "").trim();
  if (!w) return groups;
  return (groups || [])
    .map((g) => ({ head: g.head, items: g.items.filter((x) => x.label.includes(w)) }))
    .filter((g) => g.items.length > 0);
}

/** ★何件 出て いるか（★空かどうかを 判じる ため）。 */
export function countItems(groups) {
  return (groups || []).reduce((a, g) => a + g.items.length, 0);
}
