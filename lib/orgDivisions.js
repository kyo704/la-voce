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


// ---------------------------------------------------------------------------
// ★ひとりの 方の 形（★見本 `P_setPost` の 3つの 札・2026-09-19）
// ---------------------------------------------------------------------------
//   ★★★`memberships.division_id` は **1つ** です。
//     ★★学科を 選ぶと、★上の 学部は `parent_id` から 出ます。★2つ 持ちません。
//     ★★事務の 方は、★分野を 選びます。★同じ 1つの 列に 入ります。
//   ★★★同じ ことを 2か所に 書かない ため の 形 です。
//     ★★学部と 学科を 別々に 持つと、★食い違う 日が 来ます
//       （★「音楽学部／情報学科」の ような 行が できます）。

/** ★その方の いまの 形（★`division_id` から 引きます）。 */
export function divisionOf(rows, member) {
  if (!member || !member.division_id) return null;
  return (rows || []).find((r) => r && r.id === member.division_id) || null;
}

/**
 * ★画面に 出す 3行（★見本の `sub` と 同じ 並び）。
 *
 *   ★★無い ものは「—」に します（★見本と 同じ）。
 *   ★★★学部は 選ばせません。★学科から 出します。
 */
export function shapeLineOf(rows, member) {
  const d = divisionOf(rows, member);
  if (!d) return { faculty: "—", department: "—", field: "—" };
  if (d.kind === "field") return { faculty: "—", department: "—", field: d.name };
  if (d.kind === "department") {
    return { faculty: parentNameOf(rows, d) || "—", department: d.name, field: "—" };
  }
  return { faculty: d.name, department: "—", field: "—" };
}

/** ★選べる もの（★学科と 分野 だけ。★学部は 学科から 出ます）。 */
export function choosableFor(rows) {
  return (rows || []).filter((r) => r && (r.kind === "department" || r.kind === "field"));
}

export const SHAPE_HEAD = "学校の 形";
export const SHAPE_HINT =
  "学科を えらぶと、上の 学部は ひとりでに つきます。えらび直せます。";
export const SHAPE_NONE = "まだ えらんで いません。";
export const SHAPE_EMPTY =
  "この学校の 形が まだ ありません。設定の「学校の 形」で 足して ください。";


// ---------------------------------------------------------------------------
// ★消す 前の 確かめ（★見本 `askShow` ／ `orgDelAsk`・2026-09-19）
// ---------------------------------------------------------------------------
//   ★★★見本は 1枚を 出します ── ★題・名・わけ・「やめる」「消す」。
//     ★★きょうまで 1押しで 消えて いました。★戻せません。
//
//   ★★★見本の 註は「学部を 消すと、その中の 学科も いっしょに 消えます」です。
//     ★★この 蔵は そう して いません ── ★下に ある ものが あれば **消せません**。
//     ★★★書いた ものを、★まとめて 消す 道を 作りません。
//       ★★学科には、★その 学科の 方が ぶら下がって います。
//     ★★どちらに するかは 坂本さんの ご判断 です。★台帳 08-20 に 記しました。

export const DEL_TITLE = "消しますか";

/** ★消す 前に お見せする わけ。★この 蔵の 決めに 合わせて 書きます。 */
export function delNote(rows, row) {
  const 下 = (rows || []).filter((r) => r && r.parent_id === (row || {}).id);
  const 頭 = "この ことばを 使って いる 方が 1人でも いると、消せません。";
  const 中 = 下.length
    ? `この 中に ${下.length}つ あります。先に そちらを 消して ください。`
    : "";
  return [頭, 中, "消した あと、もとには 戻せません。"].filter(Boolean).join("\n");
}
