// ============================================================================
// ★契約者（★裁定 その115 Q2 ／ その116・2026-09-20）
//
//   ★★★「できこと」と「契約上の 立場」は 別の もの です。
//     ★できこと … ★学校が 決めます。★誰にでも 渡せます（★役職に 付けます）。
//     ★契約者 …… ★学校が 決める ものでは ありません。★契約が 決めます。
//   ★★★だから `has_can(org,'owner')` の 形に しません（★裁定 その115 Q2 の DO_NOT）。
//     ★★できことの 一覧に `owner` が 並ぶと、★学校が 渡せる ように 見えます。
//     ★★役職の 一覧にも「契約者」を 出しません。★渡せない ものを
//       ★★渡せる ところに 置きません。
//
//   ★★★もとの 名は `ORG_OPERATOR_ROLES` でした。★`ROLES` の 名が、
//     ★★できことと 同じ 層に 見せて いました（★裁定 その115 Q2 の RENAME）。
//
//   ★★決めは ここ 1か所 です。★画面でも 台帳でも、★同じ ことを 言います。
//
//   ★見張り components/tests/org-contract.test.js
// ============================================================================

/** ★その方が、★その 学校の 契約者か。 */
export function isContractOwner(org, userId) {
  if (!org || !userId) return false;
  return String(org.contract_owner_user_id || "") === String(userId);
}

/**
 * ★引き継げる 相手か（★裁定 その116 TRANSFER）。
 *
 *   ★★その 学校に 居て、★`master` を 持つ 方 だけ です。
 *   ★★★契約を 引き継ぐ 以上、★学校 ぜんぶを 扱える 必要が あります。
 *   ★★決めは ここ と 台帳（`transfer_contract_owner`）の 2か所に ありますが、
 *     ★★★台帳が 本体 です。★ここは 札を 出すか どうか だけ です。
 */
export function mayReceive(member, permsOf) {
  if (!member || !member.user_id) return false;
  const s = permsOf ? permsOf(member) : null;
  const set = s instanceof Set ? s
    : new Set(Array.isArray(s) ? s.filter(Boolean)
      : (s && typeof s === "object" ? Object.keys(s).filter((k) => s[k] === true) : []));
  return set.has("master");
}

/** ★引き継げる 方の 並び。★ご自分は 入りません。 */
export function candidates(members, permsOf, meId) {
  return (members || [])
    .filter((m) => String(m.user_id) !== String(meId))
    .filter((m) => mayReceive(m, permsOf));
}

/**
 * ★退会できるか（★裁定 その116 RULE）。
 *
 *   ★★★契約者は、★引き継いで からでないと 退会できません。
 *     ★★契約者が 居なく なると、★学校を 閉じられなく なります。
 *   ★★学校を 閉じた あとは、★退会できます（★正しい 順序）。
 */
export function mayLeave({ orgs, userId }) {
  // ★★★「閉じた 学校」は、★行ごと 消えて います（★2026-09-20 に 確かめました）。
  //   ★★`lib/orgClosure.js` の `CLOSE_ORG_DELETE_ORDER` は、
  //     ★★最後に `organizations` の 行を 消します。★印を 立てません。
  //   ★★★だから ここでは `closed_at` を 見ません。★渡された 並びに
  //     ★★入って いない ＝ 閉じて いる、です。
  //   ★★「消すときは 消す。★隠して 済ませない」（★CLAUDE.md）と 同じ 向き です。
  const 止 = (orgs || []).filter((o) => isContractOwner(o, userId));
  return { ok: 止.length === 0, blocked: 止 };
}

// ---------------------------------------------------------------------------
// ★字
// ---------------------------------------------------------------------------

export const CONTRACT_HEAD = "契約者を 変える";
export const CONTRACT_SUB =
  "この 学校の 契約を 引き継ぐ 方を、いまの 契約者が 決めます。";
export const CONTRACT_NOW = "いまの 契約者";
export const CONTRACT_PICK = "引き継ぐ 方";
export const CONTRACT_DO = "引き継ぐ";
export const CONTRACT_NONE =
  "この学校に、引き継げる方が いません。";
export const CONTRACT_NONE_HOW =
  "先に どなたかに、学校全部の 札を 渡してください。";
export const CONTRACT_ASK_NOTE =
  "押すと、その場で 移ります。相手の 承諾を 待ちません。取り消せません。";
export const LEAVE_BLOCKED =
  "先に、契約者を 引き継いでください。";
export const LEAVE_BLOCKED_HOW =
  "もっと → 学校 → 契約者を 変える";
export const NOTICE_KEY = "contract_owner:";
export function noticeLine(fromName) {
  return `${fromName || "どなたか"} さんから、この 学校の 契約を 引き継ぎました。`;
}

/** ★お決めの 理由（★裁定 その106 の 16 の 対象外・台帳に 書きます）。 */
export const WHY_NOT_A_PERM = Object.freeze({
  key: "contract_owner",
  line: "契約者は できこと に しません",
  why: "できことは 学校が 渡す もの、契約者は 契約が 決める もの。"
    + "渡せない ものを、渡せる ところ（役職）に 置きません",
  ruling: "裁定 その115 Q2 ／ その116"
});
