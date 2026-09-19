// ============================================================================
// ★学校の 形 ── ★学部・学科・分野（★見本 `stOrg`・裁定 その98 BLOCKER_1）
//
//   ★★★「学部・学科・分野」という 日本の 音大の 形を、★構えに 埋め込みません。
//     ★★`parent_id` で つなぎます。★深さは 学校が 決めます。
//     ★★見本の 字 ──「音楽教室なら 初等科・中等科・研究科、養成所なら 本科・専科」。
//
//   ★★★学年は ここに ありません（★2026-09-19）。
//     ★★いまは `enrollments.grade_label`（名簿の 中の 字）が 持って います。
//     ★★裁定 その98 の 構えは 3つ（`faculty` `department` `field`）です。
//     ★★★見本の `stOrg` は 4つ 出して います。★食い違って います。
//       ★★どちらに 寄せるかは 坂本さんの ご判断 です。★下の `GRADE_NOT_HERE` に 書きました。
//
//   ★見張り components/tests/org-divisions.test.js
// ============================================================================

export const HEAD = "学校の 形";

export const LEAD =
  "大学だけでは ありません。修士・博士・研究生・専攻科・別科も、ここで 足せます。"
  + "その学校の ことばで お書きください。";

/**
 * ★種（★台帳の `kind` と 同じ 字）。
 *
 *   `parent` … ★上に つく 種（★無ければ null）
 */
export const KINDS = Object.freeze([
  { key: "faculty", label: "学部・研究科", hint: "れい：音楽教育学部", parent: null },
  { key: "department", label: "学科・コース", hint: "れい：音楽教育", parent: "faculty" },
  { key: "field", label: "事務の 分野", hint: "れい：広報", parent: null }
]);

/** ★学年は ここに ありません、と はっきり 書きます。 */
export const GRADE_NOT_HERE =
  "学年は、いま 名簿の 中に 1人ずつ 書いて います。ここでは 足せません。";

/** ★その 種の もの（★渡された 順の まま。★並べ替えません）。 */
export function ofKind(rows, kind) {
  return (rows || []).filter((r) => r && r.kind === kind);
}

/** ★上に つく ものの 名（★学科 → その 学部）。 */
export function parentNameOf(rows, row) {
  if (!row || !row.parent_id) return "";
  const p = (rows || []).find((r) => r && r.id === row.parent_id);
  return p ? p.name : "";
}

/**
 * ★足せるか。
 *
 *   ★★名が 空 なら 足しません。
 *   ★★同じ 種の 中に 同じ 名が あれば 足しません（★2つ あると 選べません）。
 *   ★★上が 要る 種（学科）で、★上が 選ばれて いなければ 足しません。
 */
export function mayAdd(rows, kind, name, parentId) {
  const 名 = String(name || "").trim();
  if (!名) return false;
  const k = KINDS.find((x) => x.key === kind);
  if (!k) return false;
  if (k.parent && !parentId) return false;
  return !ofKind(rows, kind).some((r) =>
    String(r.name || "").trim() === 名
    && (!k.parent || r.parent_id === parentId));
}

/** ★足せない わけ（★押せない 札の 代わりに、★言葉で お伝えします）。 */
export function whyCannotAdd(rows, kind, name, parentId) {
  const 名 = String(name || "").trim();
  if (!名) return "名を お書きください。";
  const k = KINDS.find((x) => x.key === kind);
  if (k && k.parent && !parentId) return "先に 上の ものを お選びください。";
  if (!mayAdd(rows, kind, name, parentId)) return "同じ 名が すでに あります。";
  return "";
}

/**
 * ★消せるか（★見本の note ──「使われて いる ものは 消せません」）。
 *
 *   ★★★使って いる 方が 1人でも いれば 止めます。
 *     ★★`memberships.division_id` が 指して いる ものです。
 *   ★★下に ぶら下がる ものが あれば 止めます（★学部を 消すと 学科が 迷子に なります）。
 */
export function mayDelete(rows, row, usedCount) {
  if (!row) return false;
  if (Number(usedCount) > 0) return false;
  return !(rows || []).some((r) => r && r.parent_id === row.id);
}

export function whyCannotDelete(rows, row, usedCount) {
  if (Number(usedCount) > 0) {
    return "この 形の 方が " + Number(usedCount) + "人 います。消せません。";
  }
  if ((rows || []).some((r) => r && r.parent_id === row.id)) {
    return "下に ぶら下がる ものが あります。先に そちらを 消して ください。";
  }
  return "";
}

export const NOTES = Object.freeze([
  "使われて いる ものは 消せません（その方が 1人でも いると 止めます）。",
  "名を 直すと、その 形の 方 全部に かかります。",
  "ここで 決めた ものが、名簿と 役職の 画面に 出ます。"
]);
