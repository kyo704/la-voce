// ============================================================================
// ★この 教室の 運営 ── ★入口の 1枚（★2026-09-25・design-v76）
//
//   ★見本 `SC['教室の運営']`。
//
//   ★★★なぜ この 画面が できたか ──
//     ★Opus が「『運営』は 何の 運営か」と 尋ね、★実装を 数えて 答えました ──
//       ★**学校・教室ごと** です（★公演でも Woolsong 自体でも ありません）。
//     ★★その 答えを 受けて、★見本に この 1枚が 足されました。
//
//   ★★★下の 2行は **約束** です。★消さないこと ──
//     ★「この 教室の ことだけです。ほかの 教室とは 混ざりません。」
//       ★★★空きを 入れないこと ── ★見本は「ことだけです」です（★2026-09-26 に 数えました）。
//       ★★`opsOrgId` 1つで 絞って います。★ほかの 教室の 行は 混ざりません。
//     ★「生徒の 健康の 記録には たどりつけません（画面そのものが ありません）。」
//       ★★運営の どの 節にも `entries` を 引く 道が ありません。
//       ★★1つでも 作ったら、★この 行を **先に** 外します。
//
//   ★★★行は できこと（`perms`）で 出し分けます。★役職の 名では 決めません。
//     ★★判じるのは `lib/opsPerms.js` です。★ここでは どの できことか を 言うだけ。
//
//   ★見張り components/tests/kyoshitsu-ops.test.js
// ============================================================================

import { tx } from "@/lib/t";
import { permSet } from "@/lib/opsPerms";

/** ★戻る 先（★見本 `bk('学校の機能')` ── ★束の 題 は「学校・教室」）。 */
export const BACK_TO = tx("学校・教室");

/** ★題（★見本 ── `○○音楽大学　の 運営`）。★名は 呼ぶ 側が 渡します。 */
export function titleOf(orgName) {
  return String(orgName || tx("教室")) + tx("　の 運営");
}

/**
 * ★題の 下の 1行（★見本 ── `学長　坂本 響　／　できること 10`）。
 *
 *   ★★できことの 数は **数えます**。★書き写しません。
 *   ★★役職か お名前が 無い ときは、★その ぶんを 詰めます。
 */
export function subLineOf(o) {
  const v = o || {};
  const 名 = [v.postName, v.myName].filter((x) => x && String(x).trim()).join("　");
  const 数 = permSet(v.perms).size;
  const 右 = tx("できること ") + String(数);
  return 名 ? 名 + "　／　" + 右 : 右;
}

/**
 * ★6行（★見本の 並び そのまま）。
 *
 *   ★`to` …… ★行き先の 名（★呼ぶ 側の 表が 引きます）
 *   ★`name` …… ★行の 字（★1文字も 変えないこと）
 *   ★`sub` …… ★下に 添える 小さな 字
 *   ★`any` …… ★どれか 1つ 持って いれば 出す できこと
 */
export const ROWS = Object.freeze([
  Object.freeze({ to: tx("名簿"), name: tx("名簿"), sub: "", any: ["meibo"] }),
  Object.freeze({ to: tx("招く"), name: tx("生徒を 招く"), sub: tx("招待コードで"), any: ["meibo"] }),
  Object.freeze({ to: tx("役職の一覧"), name: tx("役職"), sub: "", any: ["post", "master"] }),
  Object.freeze({ to: tx("組織"), name: tx("学部・学科"), sub: tx("階層で"), any: ["master"] }),
  Object.freeze({ to: tx("場所を決める"), name: tx("場所"), sub: tx("ホール・教室"), any: ["koma"] }),
  Object.freeze({ to: tx("プランを選ぶ"), name: tx("プラン"), sub: tx("1人あたりの 段"),
    any: ["bill", "bill_pay"] })
]);

/**
 * ★いま 出す 行。
 *
 *   ★★2つ とも 揃って いる ものだけ です ──
 *     ①★できこと（`any`）を 持って いる
 *     ②★呼ぶ 側が「そこへ 行ける」と 答えた（`canGo`）
 *   ★★★②が 無いと、★押しても 何も 起きない 札に なります。
 *     ★★束の 入口（`lib/moreBundles.js`）と 同じ 形 です。
 */
export function rowsOf(o) {
  const v = o || {};
  const s = permSet(v.perms);
  const 行ける = typeof v.canGo === "function" ? v.canGo : () => true;
  return ROWS.filter((r) => r.any.some((k) => s.has(k))).filter((r) => 行ける(r.to));
}

/**
 * ★右に 添える 字（★見本 ── `216人` ／ `10役職`）。
 *
 *   ★★★数は 呼ぶ 側が 数えます。★ここでは **言い方** だけ を 決めます。
 *     ★★字が 2か所に あると、★片方だけ 変わります。
 *   ★★★0 の ときは 空を 返します ── ★「0人」と 書きません。
 *     ★★まだ 読めて いない のか、★本当に 0 なのか、★見た方に 区別が つきません。
 *     ★★見本も 右の 字が 無い 行を 持って います（★`mLi` の 4つめ が 無い 行）。
 *   ★★★渡す ものが 無い 行（★学部・学科 など）は 触りません。
 *
 *   ★戻す 形 …… ★`{ "名簿": "216人", "役職の一覧": "10役職" }`
 */
export function rightWords(o) {
  const v = o || {};
  const 出 = {};
  const 人 = Number(v.memberCount);
  const 役 = Number(v.postCount);
  if (Number.isFinite(人) && 人 > 0) 出[tx("名簿")] = String(人) + tx("人");
  if (Number.isFinite(役) && 役 > 0) 出[tx("役職の一覧")] = String(役) + tx("役職");
  return 出;
}

/** ★下の 断り（★約束。★消さないこと）。 */
export const NOTES = Object.freeze([
  tx("この 教室の ことだけです。ほかの 教室とは 混ざりません。"),
  tx("生徒の 健康の 記録には たどりつけません（画面そのものが ありません）。")
]);

/** ★太字に する 行（★見本の `<b>`）。 */
export const NOTES_STRONG = Object.freeze([0, 1]);
