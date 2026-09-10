// ============================================================================
// 運営モード ── 別のシェル（2026-09-09・第3便）
//
//   ★出どころ docs/opus/woolsong-教室機能の正（9月9日・最終稿）.md §3-3・§1-1・§4-7
//     「★「きょう」の右上の歯車 →「◯◯の運営」→ ★運営モードへ
//      ★運営モードの左上に「もどる」→ 個人のアプリへ
//      → ★2つのアプリが 1つに入っている形です」
//
//   ★★いちばん大事な 一文（★§3-3）
//     「★この画面から、★生徒の健康の記録には たどりつけません
//       　（★画面そのものが ありません）」
//     ★★これは 設定では ありません。★画面が 無い、ということです。
//     ★見張りが、★健康側の画面を import していないことを 確かめます（★§7-7）。
//
//   ★★iPhone でも 使えます（★2026-09-09・坂本さんの お決め）。
//     ★★「パソコン幅のときだけ」という 制限は、★設けません。
//     ★下タブ6つを、★iPhone の 幅に 収めます。
//     ★★§4-7 の「管理者の一覧は パソコンだけ」は、★撤回されました
//       （★2026-09-09・Opus の 裁定）。★見ることは iPhone でも できます。
//     ★残るのは「★うごかす（コマの入れ替え）は パソコン」だけです。
//
//   ★見張り components/tests/ops-shell.test.js
// ============================================================================

/** ★役割 4つ（★§1-1）。 */
import { tabsForPerms, can, permSet } from "@/lib/opsPerms";

export const ROLES = Object.freeze(["owner", "admin", "teacher", "staff"]);

// ★★2026-09-11、★役職への 一本化（★裁定 §7）の 2段目。
//   ★決めは lib/opsPerms.js が 持ちます。★ここでは 決めません。

/**
 * ★運営モードの 下タブ。
 *
 *   ★★役割で 変わります（★§3-3 の 表の とおり）。
 *   ★★teacher は 入りません。★§3-2 の 帯で 足ります。
 *   ★★staff は 日程だけ。★事務の方に、★名簿も 連絡も 出しません。
 */
export const OPS_TABS = Object.freeze([
  { key: "home", label: "ホーム" },
  { key: "schedule", label: "日程" },
  { key: "roster", label: "名簿" },
  { key: "events", label: "行事" },
  { key: "threads", label: "連絡" },
  { key: "settings", label: "設定" }
]);

const BY_ROLE = Object.freeze({
  owner: ["home", "schedule", "roster", "events", "threads", "settings"],
  admin: ["home", "schedule", "roster", "events", "threads"],
  staff: ["schedule"],
  teacher: []
});

/** ★その役割で 出す 下タブ。★知らない役割は 空です（★勝手に 開けません）。 */
/**
 * ★渡されたのが「できること」か、★古い 4つの 役割か。
 *
 *   ★★2026-09-11、★役職への 一本化の 2段目です（★裁定 §7）。
 *     ★★入口だけ 足しました。★いまの 動きは 1つも 変えていません。
 *     ★役職（org_posts）を 持つ 方が 出てきたら、★そちらが 効きます。
 *     ★まだ 誰も 持っていないので、★みな これまでどおりです。
 *   ★★3段目で、★呼ぶ 側が「できること」を 渡すように 変えます。
 */
function isPerms(x) {
  return Array.isArray(x) || x instanceof Set
    || (x && typeof x === "object" && !Array.isArray(x));
}

export function tabsFor(roleOrPerms) {
  // ★★できことを 渡されたら、★そちらで 決めます（★裁定 §7-3）。
  //   ★役職の 名前で 分けません。
  if (isPerms(roleOrPerms)) return tabsForPerms(roleOrPerms);
  const keys = BY_ROLE[roleOrPerms] || [];
  return OPS_TABS.filter((t) => keys.includes(t.key));
}

/**
 * ★運営モードに 入れるか。
 *
 *   ★★teacher は 入りません。★§3-2 の 帯で 足ります。
 *   ★★入口を 出すかどうかも、★これで 決めます。
 *     ★入れないのに 入口を 出すと、★押しても 何も 起きません。
 */
export function mayEnterOps(roleOrPerms) {
  return tabsFor(roleOrPerms).length > 0;
}

/** ★設定（お金）は owner だけ（★§1-1「admin は お金以外」）。 */
/**
 * ★名簿の 中身を 直せるか（★学年・コース など）。
 *
 *   ★★owner と admin だけです。★先生・事務は 直せません。
 *   ★★役職の 名前で 分けません。★できること で 分けます
 *     （★引き継ぎ「画面の 出し分けは 権限から 導いてください」）。
 *     ★いまの この家の 役割は 4つで、★owner／admin が 名簿を 持ちます。
 */
export function mayEditRoster(roleOrPerms) {
  // ★★名簿を 直すのは「学校ぜんぶの 名簿を 見る・直す」です（★meibo）。
  if (isPerms(roleOrPerms)) return can(roleOrPerms, "meibo");
  return roleOrPerms === "owner" || roleOrPerms === "admin";
}

export function maySeeMoney(roleOrPerms) {
  // ★★お金は「ご請求を 見る」です（★bill）。
  if (isPerms(roleOrPerms)) return can(roleOrPerms, "bill");
  return roleOrPerms === "owner";
}

/**
 * ★その方の「できること」を 出します（★3段目の 入口）。
 *
 *   ★★役職が 決まっていれば、★その役職の できことです。
 *   ★★決まっていなければ、★null を 返します。
 *     ★★空の 一覧を 返しません。★「無い」と「まだ 決めていない」を
 *       ★1つの 形に すると、★役職の 無い 方が 締め出されます。
 *     ★呼ぶ 側は、★null なら これまでどおり role を 使います。
 *
 *   @param member    memberships の 1行（★post_id を 持ちます）
 *   @param postsById { [id]: { perms } }
 */
export function permsOfMember(member, postsById) {
  const id = member && member.post_id;
  if (!id) return null;
  const post = (postsById || {})[id];
  if (!post) return null;
  return permSet(post.perms);
}

/**
 * ★★§4-7 の「管理者の一覧は パソコンだけ」は、★撤回されました
 *   （★2026-09-09・Opus の 裁定）。
 *
 *   ★★見ることは、★iPhone でも できます。★止めません。
 *     ★見せ方を 3つに 分けて、★幅に あわせます（★lib/opsSchedule.js）。
 *
 *   ★★残るのは、★もっと 狭い1つだけです。
 *     ★見本⑧「★iPad は 見るだけ。★うごかす（コマの入れ替え）は パソコンです」
 *     ★★つまり「見る」では なく「うごかす」が、★パソコンだけ です。
 *     ★指で つまんで 動かすのは、★狭い画面では 誤って 落とします。
 *     ★★予定が 勝手に 動くのは、★見られないより ずっと 困ります。
 */
export const DRAG_MIN_WIDTH = 1024;

/** ★コマを つまんで 動かしてよいか。★見ることは、どの幅でも できます。 */
export function mayDragBlocks(width) {
  return typeof width === "number" && width >= DRAG_MIN_WIDTH;
}

/** ★動かせないときの 断り。★1行だけ。★責める言葉に しません。 */
export const DRAG_NOTE = "コマの入れ替えは、パソコンでできます。";

/**
 * ★★運営モードから たどりつけない もの（★§3-3・§7-7）。
 *
 *   ★見張りが、★この一覧の 部品を import していないことを 確かめます。
 *   ★★「出さない」では ありません。★「持たない」です。
 *     ★出し分けにすると、★条件を 1行 変えるだけで 出てしまいます。
 */
export const NEVER_IN_OPS = Object.freeze([
  "VocalTracker", "HomeV2", "LookBackV2", "CompareV2", "CountV2",
  "LookBackPanel", "RecordV2Head", "HealthInfo", "CharacterHome"
]);
