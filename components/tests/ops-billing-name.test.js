#!/usr/bin/env node

// ============================================================================
// ★見張り ── ★請求書の 宛名 ／ ご請求の 宛先（★見本 `P_seikyuNa` ／ `P_atesaki`）
//
//   ★★守る こと
//     ★① 変えられるのは `bill_pay` だけ（★画面も 台帳も）
//     ★② カード番号・口座番号を 置かない（★欄が ない）
//     ★③ 宛先に なれるのは、★ご請求を 見られる 方 だけ
//     ★④ 変えた ことが 記録に 残る。★消せない
//     ★⑤ 0行を 成功に しない
//
//   ★★★較正 ── ★わざと 当たる ものを 作り、★見つかる ことを 確かめます。
// ============================================================================

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { loadLib, readCode } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

const ROOT = path.join(__dirname, "..", "..");
const SQL = path.join(ROOT, "supabase", "migration_billing_recipient.sql");
if (!fs.existsSync(SQL)) {
  console.log("★★ありません: supabase/migration_billing_recipient.sql");
  console.log("　★数えません。★止まります。");
  process.exit(1);
}
const 素 = fs.readFileSync(SQL, "utf8")
  .split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");

(async () => {
  const B = await loadLib("lib", "orgBilling.js");
  const 画面 = readCode("components", "OpsBillingName.jsx");
  const 蔵 = readCode("components", "VocalTracker.jsx");

  見る("道具の 較正", () => {
    assert.ok(/bill_pay/.test("has_can(org_id, 'bill_pay')"), "★道具が 壊れて います");
  });

  見る("① 変えられるのは `bill_pay` だけ ── ★台帳", () => {
    const 直す = 素.slice(素.indexOf("create policy org_billing_update_bill"));
    assert.ok(/has_can\(org_id, 'bill_pay'\)/.test(直す.slice(0, 260)),
      "★書く 門が `bill_pay` で ありません");
    const 読む = 素.indexOf("org_billing_select_bill");
    assert.ok(読む < 0 || /has_can\(org_id, 'bill'\)/.test(素.slice(読む, 読む + 200)),
      "★読む 門を 変えて います");
  });

  見る("① 変えられるのは `bill_pay` だけ ── ★画面", () => {
    assert.ok(B.mayChangeBilling(["bill_pay"]), "★持って いる 方が 変えられません");
    assert.ok(!B.mayChangeBilling(["bill"]), "★見るだけ の 方が 変えられます");
    assert.ok(!B.mayChangeBilling([]), "★何も 持たない 方が 変えられます");
    assert.ok(/mayChangeBilling/.test(画面), "★画面が lib を 呼んで いません");
    assert.ok(!/"bill_pay"|'bill_pay'/.test(画面), "★画面が できことを 名ざしで 見て います");
  });

  見る("② カード番号・口座番号を 置かない", () => {
    for (const 語 of ["card_number", "カード番号を", "口座番号を", "cvv", "security_code"]) {
      assert.ok(!new RegExp(語).test(素), "★台帳に あります: " + 語);
    }
    const 欄 = B.NAME_FIELDS.map((f) => f.key);
    for (const 語 of ["card", "bank", "account"]) {
      assert.ok(!欄.some((k) => k.includes(語)), "★欄に あります: " + 語);
    }
  });

  見る("③ 宛先に なれるのは、★ご請求を 見られる 方 だけ", () => {
    const み = [
      { user_id: "a", canBill: true }, { user_id: "b", canBill: false },
      { user_id: "c", canBill: true }
    ];
    const 出 = B.atesakiCandidates(み, "c");
    assert.deepStrictEqual(出.map((x) => x.user_id), ["a"], "★選び方が ちがいます");
    // ★★いまの 宛先 ご自身は 出しません。
    assert.ok(!出.some((x) => x.user_id === "c"), "★いまの 宛先が 出て います");
    // ★★並べ替えません。
    const 元 = [{ user_id: "z", canBill: true }, { user_id: "a", canBill: true }];
    assert.deepStrictEqual(B.atesakiCandidates(元, null).map((x) => x.user_id),
      ["z", "a"], "★並べ替えて います");
  });

  見る("④ 記録は 残り、★消せない", () => {
    assert.ok(/create table if not exists public\.org_billing_log/.test(素),
      "★記録の 表が ありません");
    const 権 = 素.slice(素.indexOf("grant select, insert on public.org_billing_log"),
                       素.indexOf("grant select, insert on public.org_billing_log") + 120);
    assert.ok(!/update|delete/i.test(権), "★直す・消すを 渡して います");
    assert.ok(/actor_id = auth\.uid\(\)/.test(素), "★誰が 書いたかを 縛って いません");
    assert.ok(/logWordForName|logWordForAtesaki/.test(蔵), "★記録の 字を 残して いません");
  });

  見る("⑤ 0行を 成功に しない", () => {
    const i = 蔵.indexOf("async function handleSaveBilling");
    const 手 = 蔵.slice(i, i + 1800);
    assert.ok(/\.select\("id"\)/.test(手), "★何行 動いたかを 見て いません");
    assert.ok(/data\.length === 0/.test(手), "★0行を 成功に して います");
    const j = 蔵.indexOf("async function handleHandOverBilling");
    const 手2 = 蔵.slice(j, j + 1800);
    assert.ok(/data\.length === 0/.test(手2), "★引き継ぎで 0行を 成功に して います");
  });

  見る("★取り上げが 先、★渡すのが あと", () => {
    const r = 素.indexOf("revoke all on public.org_billing_log");
    const g = 素.indexOf("grant select, insert on public.org_billing_log");
    assert.ok(r > 0 && g > r, "★渡しが 先に なって います");
  });

  // ★★★2026-09-23、★記録を 書く ところを **台帳の 引き金** に 移しました
  //   （★坂本さんの お決め「A 承認」）。
  //   ★★もとは 画面が `org_billing_log` に 直に 入れて いました。
  //     ★★引き金も 付けた ので、★両方 だと 1回の 変更で 2行 残ります。
  //   ★★★「書かない」だけ を 見ると、★誰も 書かなく なった ときに 気づけません。
  //     ★★だから 引き金が ある ことも、★同じ 見張りで 見ます。
  見る("★画面の 側は org_billing_log に 直に 入れて いない", () => {
    assert.ok(!/from\(["']org_billing_log["']\)[\s\S]{0,80}\.insert/.test(蔵),
      "★画面が まだ 直に 入れて います");
  });
  見る("★台帳の 引き金が 書く（org_billing_log_change）", () => {
    const 引 = fs.readFileSync(path.join(__dirname, "..", "..",
      "supabase/migrations/20260923200000_opus_06_1_2_triggers.sql"), "utf8");
    assert.ok(/create trigger org_billing_log_change[\s\S]{0,160}execute function public\.log_org_billing_change\(\)/.test(引),
      "★引き金が ありません");
    assert.ok(/on public\.org_billing\b/.test(引), "★付ける 先が ちがいます");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
