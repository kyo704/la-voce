// ============================================================================
// ★お支払い ── ★決めごと 1か所（★裁定 その74 ／ その74 追補・2026-09-18）
//
//   ★出どころ 見本 `00-動く見本-PC・iPad（運営）.html` の `stBill()` の「お支払い」の 箱
//   ★台帳     `public.org_billing`（★2026-09-18 に 立てました）
//
//   ★★★見本は 5行 です。★いま 出せるのは **3行** です。
//     ★★出せない 2行は、★台帳に 列が ありません。
//     ★★★空の 行を 並べません。★学校に お出しする 画面 です。
//       ★★空が 並ぶと、★作りかけに 見えます。★信用を 落とします。
//     ★★出せない 2行は、★下に わけと 引き金を 書いて 残します。
//
//   ★見張り components/tests/org-billing-card.test.js
// ============================================================================

/** ★支払い方法の 言い方（★台帳は 'card' / 'invoice' の 2つ だけ）。 */
export const METHOD_LABELS = Object.freeze({
  card: "クレジットカード",
  invoice: "請求書"
});

/** ★まだ お決めが 無い ときの 1行。★空欄に しません。 */
export const NOT_SET_YET = "まだ お決めいただいて いません。";

/** ★箱の 題（★見本の `h3`）。 */
export const CARD_HEAD = "お支払い";

/**
 * ★出す 行を 組み立てます。
 *
 *   ★★`row` は `org_billing` の 1行（★いちばん 新しい もの）。★無ければ null。
 *   ★★`fee` は 今月の ご請求（★`lib/orgRoster.js` の `monthlyFee`）。
 *     ★★ここで 数えません。★渡して もらいます。★同じ 式を 2つ 持たない ため です。
 *
 *   ★★★値の 無い 行は、★並びから 外します。★「—」を 置きません。
 *     ★★「—」は「読めなかった」とも「決めて いない」とも 読めます。
 *     ★★どちらか 分からない しるしを、★お金の 画面に 置きません。
 */
export function billingRows(row, fee) {
  if (!row) return [];
  const out = [];

  // ★一 ★ご請求の 宛先（名義）── ★1人 だけ（★裁定 その74 B）
  const 宛先 = row.atesaki_name && String(row.atesaki_name).trim();
  if (宛先) out.push({ key: "atesaki", label: "ご請求の 宛先（名義）", value: 宛先 });

  // ★二 ★支払い方法
  const 方法 = METHOD_LABELS[row.method];
  if (方法) out.push({ key: "method", label: "支払い方法", value: 方法 });

  // ★三 ★次の お支払い
  //   ★★日づけ と 金額 を、★1つの 行に します（★見本の 形）。
  //   ★★金額は 今月の ご請求 です。★まとまり（毎月／1年）は まだ ありません
  //     （★下の `MISSING_ROWS`）。★だから 掛けません。
  const 次 = String(row.next_billing_date || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(次)) {
    const 月 = Number(次.slice(5, 7));
    const 日 = Number(次.slice(8, 10));
    const 額 = typeof fee === "number" && fee > 0 ? `　${fee.toLocaleString("ja-JP")}円` : "";
    out.push({ key: "next", label: "次の お支払い", value: `${月}月${日}日${額}` });
  }

  return out;
}

/**
 * ★まだ 出せない 行 ── ★見本に あって、★台帳に 列が ない もの。
 *
 *   ★★★【後まわし・引き金は この 束】──
 *     ★★`org_billing` に 列を 足す 日に、★ここを 消して 行を 足します。
 *     ★★列を 足しただけ では 出ません。★`billingRows` にも 足して ください。
 *     ★★見張りが、★この 2つが 消えた ことを 見つけて 教えます。
 */
export const MISSING_ROWS = Object.freeze([
  {
    key: "cycle",
    label: "お支払いの まとまり",
    why: "毎月か 1年かを 置く 列が、まだ ありません。",
    column: "org_billing.cycle"
  },
  {
    key: "withdraw_day",
    label: "引き落とし日",
    why: "毎月 何日かを 置く 列が、まだ ありません。"
      + "（次の お支払いの 日づけは ありますが、毎月の 決まりでは ありません）",
    column: "org_billing.withdraw_day"
  }
]);

/**
 * ★領収書の 断り（★裁定 その74 追補・2026-09-18）。
 *
 *   ★★★坂本さんは、★いま インボイスの 登録事業者では ありません。
 *     ★★登録番号が 無い ことを、★黙って いられません。
 *     ★★大学が 仕入税額控除を 受けられません。
 *       ★★年90万円 なら、★大学の ご負担は およそ 8万円 です。
 *     ★★★先に お伝えします。★あとから では 遅い こと です。
 */
export const NOT_QUALIFIED_INVOICE = "適格請求書では ありません。";

/** ★登録番号が あるか（★無ければ 上の 断りを 出します）。 */
export function hasInvoiceNo(row) {
  return !!(row && row.invoice_no && String(row.invoice_no).trim());
}


// ---------------------------------------------------------------------------
// ★請求書の 宛名・送り先（★見本 `P_seikyuNa`・2026-09-19）
// ---------------------------------------------------------------------------
//   ★★★「変えられるのは `bill_pay` だけ」です（★見本の note）。
//     ★★台帳の 門も そう 直しました（★`migration_billing_recipient.sql`）。
//     ★★画面だけ で 守りません。★台帳が 本体 です。

export const NAME_HEAD = "請求書の 宛名・送り先";
export const NAME_SUB = "領収書にも この 宛名が 出ます";

/** ★欄（★見本の 5つ。★並びも 同じ）。 */
export const NAME_FIELDS = Object.freeze([
  { key: "atesaki_name", label: "宛名（学校名・法人名）",
    hint: "れい：学校法人○○学園　○○音楽大学" },
  { key: "bill_dept", label: "部署", hint: "れい：総務課" },
  { key: "bill_contact", label: "ご担当", hint: "れい：田村 まこと" },
  { key: "atesaki_email", label: "送り先（メール）", hint: "れい：keiri@example.ac.jp" },
  { key: "invoice_no", label: "インボイス登録番号（Woolsong の 番号）",
    hint: "T から はじまる 13けた" }
]);

export const NAME_NOTES = Object.freeze([
  "インボイス登録番号は、Woolsong（うち）の 番号です。学校の 番号では ありません。",
  "宛名を 直しても、すでに 出した 領収書は 変わりません。"
]);

/** ★変えられるか（★`bill_pay` だけ）。★見るだけ の 方には 出しません。 */
export function mayChangeBilling(perms) {
  const s = perms instanceof Set ? perms
    : new Set(Array.isArray(perms) ? perms.filter(Boolean)
      : (perms && typeof perms === "object"
        ? Object.keys(perms).filter((k) => perms[k] === true) : []));
  return s.has("bill_pay");
}

/** ★見るだけ の 方への 1行（★見本の warn）。 */
export const VIEW_ONLY_LINE =
  "あなたは 見るだけです。変えられるのは、お支払いの できことを 持つ 方です。";

// ---------------------------------------------------------------------------
// ★ご請求の 宛先（名義）を 引き継ぐ（★見本 `P_atesaki`・裁定 その74B）
// ---------------------------------------------------------------------------
export const ATESAKI_HEAD = "ご請求の 宛先を 変える";
export const ATESAKI_NOTES = Object.freeze([
  "宛先（名義）は 1人だけです。お金の 責任を 持つ 方です。",
  "いまの 宛先の 方が 決めます。押すと、その場で 変わります。",
  "見るだけの 方は、宛先に できません。",
  "宛先を 変えても、支払い方法は そのままです。",
  "宛先の 方が 学校を 離れる ときは、先に ここで 引き継いで ください。"
]);
export const ATESAKI_EMPTY = "ほかに ご請求を 見られる 方が いません。";
export const ATESAKI_EMPTY_HOW =
  "先に「役職と、できること」で、ご請求を 見られる 役職を 増やして ください。";

/**
 * ★宛先に できる 方（★ご請求を 見られる 方 だけ）。
 *
 *   ★★★見えない 方に 責任を 持たせません（★見本の warn）。
 *   ★★いまの 宛先 ご自身は 出しません。★もう そうだから です。
 *   ★★並べ替えません。★渡された 順の ままです。
 */
export function atesakiCandidates(members, nowUserId) {
  return (members || []).filter((m) =>
    m && m.user_id && m.user_id !== nowUserId && (m.canBill === true));
}

/** ★記録に 残す 字（★誰が・いつ・何を。★消せません）。 */
export function logWordForName(changed) {
  return "請求書の 宛名を 直しました（" + (changed || []).join("・") + "）";
}
export function logWordForAtesaki(name) {
  return "ご請求の 宛先を " + (name || "（お名前 なし）") + " に 引き継ぎました";
}
