// ============================================================================
// ★役職を 変えた 記録 ── ★決めごと 1か所（★裁定194・2026-09-24）
//
//   ★出どころ 見本 `P_permLog`（00-動く見本-PC・iPad（運営）.html）
//            裁定194「★消さないと 決めたら、★誰が どこで 読むかも 決める」
//
//   ★★★なぜ 作ったか ──
//     ★`lib/opsAudit.js` の `NEVER_PURGE` は「消しては いけない」を 4つ 挙げて います。
//     ★★その うち `org_post_perm_log` に、★**読む 画面が ありません** でした。
//     ★★★「消しません」は 守りの 約束 です。★けれど **読めない 記録は
//       ★守りに なりません**。★誰かが できことを こっそり 変えても、
//       ★気づく 道が ありません でした（★2026-09-24・段3a で 見つけました）。
//
//   ★★★誰が 読めるか ── ★決めるのは **台帳** です。★画面では ありません。
//     ★`org_post_perm_log_select` …… `has_can(org,'post') OR has_can(org,'master')`
//     ★★裁定194 §2 は「★master だけ」と 書いて います。
//       ★★台帳と 見本は「post と master」です。★2つが 合って います。
//       ★★★だから ここでは 台帳に 従います。★食いちがいは 記録に 残しました
//         （`docs/ledgers/08-保留している決め.md`）。
//     ★★画面で 絞りません ── ★絞ると、★決めが 2か所に なります。
//
//   ★★★出す もの（★裁定194 §2）── ★いつ・誰が・どの 役職を・何を。
//     ★★名前は **そのときの 名前**（`post_name_at`）で 出します。
//       ★★役職が あとで 消されても、★記録は 読めます。
//     ★★★変えた 人の 名は、★台帳に 残って いません（`changed_by` は id だけ）。
//       ★★だから 名簿から 引きます。★引けない ときは 埋めません。
//         ★「不明」と 書きません ── ★退会された 方かも しれません。
//
//   ★見張り components/tests/perm-log.test.js
// ============================================================================

/** ★引く 列（★`select('*')` を 書きません）。 */
export const COLS_PERM_LOG =
  "id, changed_at, changed_by, changed_by_kind, post_id, post_name_at, added, removed, op";

export const HEAD = "役職を 変えた 記録";
export const SUB = "できること を 足した・切った 記録";
export const BACK_LABEL = "ひとと 役職";

/** ★表の 見出し（★見本の まま）。 */
export const COLUMNS = Object.freeze(["変えた人", "いつ", "どの 役職", "何を"]);

/**
 * ★誰が 変えたか。
 *
 *   ★★★`changed_by_kind = 'system'` は、★人では ありません。
 *     ★★見本の 中の 品を 片付けた ときなどに 付きます。
 *     ★★「不明」と 書きません ── ★人が 隠れて いるように 読めます。
 *   ★★人の ときは 名簿から 引きます。★引けない ときは 空の まま。
 *     ★★退会された 方かも しれません。★「不明」は 責める 字 です。
 */
export const SYSTEM_WORD = "仕組み";
export const NO_NAME_WORD = "―";
export function whoOf(row, nameOf) {
  if (!row) return NO_NAME_WORD;
  if (row.changed_by_kind === "system") return SYSTEM_WORD;
  const n = typeof nameOf === "function" ? nameOf(row.changed_by) : "";
  return (n && String(n).trim()) || NO_NAME_WORD;
}

/**
 * ★何を したか（★足した／外した）。
 *
 *   ★★★数を 出しません。★何を 足し、★何を 外したかを、★そのまま 並べます。
 *   ★★`op` は `insert` / `update` / `delete`。★作った・消した ときも 残ります。
 */
export const ADDED_WORD = "足した";
export const REMOVED_WORD = "外した";
export const MADE_WORD = "作った";
export const GONE_WORD = "消した";
export function whatOf(row) {
  if (!row) return "";
  const 足 = Array.isArray(row.added) ? row.added : [];
  const 外 = Array.isArray(row.removed) ? row.removed : [];
  const 出 = [];
  if (row.op === "insert") 出.push(MADE_WORD);
  if (row.op === "delete") 出.push(GONE_WORD);
  if (足.length) 出.push(ADDED_WORD + " " + 足.join("・"));
  if (外.length) 出.push(REMOVED_WORD + " " + 外.join("・"));
  return 出.join("　／　");
}

/** ★いつ（★年は 出します ── ★記録だから です）。 */
export function whenOf(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** ★1行を 画面の 形に します（★画面では 組み立てません）。 */
export function rowsOf(rows, nameOf) {
  return (Array.isArray(rows) ? rows : []).map((r) => ({
    id: r.id,
    who: whoOf(r, nameOf),
    when: whenOf(r.changed_at),
    post: r.post_name_at || NO_NAME_WORD,
    what: whatOf(r)
  }));
}

/** ★1つも 無い とき。★急かしません。 */
export const EMPTY_HEAD = "まだ ありません。";
export const EMPTY_SUB = "役職の できことを 足した・切った ときに、ここに 残ります。";

/**
 * ★下の 註（★見本 `P_permLog` の `.note`）。
 *
 *   ★★3行 とも 確かめました ──
 *     ★「消せません」…… `lib/opsAudit.js` の `NEVER_PURGE` に 入って います。
 *       ★`purge_ops_audit_log()` は `ops_audit_log` しか 消しません。
 *     ★「見られるのは post と master」…… ★台帳の 決まりの とおり です。
 *     ★「人に 役職を 渡した 記録は べつ」…… ★あちらは `post_change_log` です。
 */
export const NOTES = Object.freeze([
  "役職の できことを 足した・切った ときに、台帳が 自動で 残します。消せません。",
  "見られるのは、役職を 変えられる方と、学校の 形を 直せる方です。",
  "人に 役職を 渡した 記録は べつに 残ります（「ひとと 役職」の 各人）。"
]);
