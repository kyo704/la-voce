#!/usr/bin/env node

// ============================================================================
// ★見張り ── ★経歴（ポートフォリオ）の 芯（★裁定 その94 §7・§10①）
//
//   ★★守る こと
//     ★① 若いと 分かる ものを、★台帳にも 蔵にも 置かない
//     ★② はじめは「自分だけ」
//     ★③ 18歳未満の 方に `link` を 出さない
//     ★④ 賞で 並べ替えない
//     ★⑤ 許しは ご本人 だけ（★紙の 上の 確かめ。★台帳は tools が 見ます）
//
//   ★★★較正 ── ★わざと 1件 当たる ものを 作り、★見つかる ことを 確かめます。
// ============================================================================

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { loadLib, readCode } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

const ROOT = path.join(__dirname, "..", "..");
const SQL = path.join(ROOT, "supabase", "migration_portfolio.sql");
if (!fs.existsSync(SQL)) {
  console.log("★★ありません: supabase/migration_portfolio.sql");
  console.log("　★数えません。★止まります。");
  process.exit(1);
}
const 素 = fs.readFileSync(SQL, "utf8")
  .split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");

(async () => {
  const P = await loadLib("lib", "portfolio.js");

  見る("道具の 較正 ── ★わざと 置いた 列を 見つけられる", () => {
    const 偽 = "create table x ( birthdate date, grade text );";
    const 当 = P.NEVER_STORED.filter((c) => new RegExp("\\b" + c + "\\b").test(偽));
    assert.ok(当.length >= 2, "★道具が 壊れて います");
  });

  見る("① 若いと 分かる 列を、★台帳に 置いて いない", () => {
    const 当 = P.NEVER_STORED.filter((c) => new RegExp("\\b" + c + "\\b").test(素));
    assert.deepStrictEqual(当, [],
      "★置かない と 決めた 列が あります: " + 当.join(" "));
  });

  見る("① 住む ところ では なく、★演奏する ところ", () => {
    assert.ok(/regions\s+text\[\]/.test(素), "★`regions` が ありません");
    assert.ok(!/\bprefecture\b|\bcity\b|\baddress\b/.test(素), "★住む ところの 列が あります");
  });

  見る("② はじめは「自分だけ」", () => {
    assert.strictEqual(P.DEFAULT_SCOPE, "self");
    assert.ok(/default 'self'/.test(素), "★台帳の 既定が ちがいます");
  });

  見る("③ 18歳未満の 方に `link` を 出さない", () => {
    const 子 = { age_band: "under15" };
    const 十代 = { age_band: "teen" };
    const 大人 = { age_band: "adult" };
    assert.ok(!P.scopesFor(子).some((s) => s.key === "link"), "★15歳未満に 出て います");
    assert.ok(!P.scopesFor(十代).some((s) => s.key === "link"), "★18歳未満に 出て います");
    assert.ok(P.scopesFor(大人).some((s) => s.key === "link"), "★大人に 出て いません");
    assert.ok(!P.mayUseScope(十代, "link"), "★18歳未満が 選べます");
    // ★★答えて いない 方は、★安全な 側（＝出さない）へ 倒します。
    assert.ok(!P.mayUseScope(null, "link"), "★分からない 方に 出て います");
  });

  見る("④ 賞で 並べ替えない", () => {
    const 元 = [{ t: "a" }, { t: "b" }, { t: "c" }];
    assert.deepStrictEqual(P.inGivenOrder(元), 元, "★並びが 変わりました");
    const もと = readCode("lib", "portfolio.js");
    assert.ok(!/\.sort\(/.test(もと), "★もとに 並べ替えが あります");
  });

  見る("⑤ 許しは ご本人 だけ（★いまは）", () => {
    assert.ok(/user_id = auth\.uid\(\)/.test(素), "★ご本人の 枝が ありません");
    assert.ok(!/enrollments|teacher_student_links|has_can/.test(素),
      "★まだ ほかの 方に 開いて います（★入口が できて から です）");
    // ★★取り上げが 先、★渡すのが あと。
    const r = 素.indexOf("revoke all on public.portfolios");
    const g = 素.indexOf("grant select, insert, update, delete on public.portfolios");
    assert.ok(r > 0 && g > r, "★渡しが 先に なって います");
    assert.ok(!/truncate/i.test(素), "★`truncate` を 渡して います");
  });

  見る("★字は lib が 持つ", () => {
    assert.ok(P.NOTES.length === 4, "★但し書きが 4行 で ありません");
    assert.ok(P.SCOPE_NOTES.some((x) => x.includes("18歳未満")), "★18歳未満の 1行が ありません");
    assert.ok(P.BIO_MAX === 400, "★400字 で ありません");
    assert.ok(P.bioTooLong("あ".repeat(401)) && !P.bioTooLong("あ".repeat(400)),
      "★長さの 見かたが ちがいます");
  });

  見る("★まだ 作って いない ものが、★名ざしで 書いて ある", () => {
    const k = P.NOT_YET.map((x) => x.key);
    // ★★★2026-09-19（★裁定 その94 §4f）── ★録画は できる ように なりました。
    //   ★★URL だけ に なった ので、★置き場（Storage）が 要りません。
    //   ★★だから `recordings` は もう ここに ありません。
    assert.ok(!k.includes("recordings"), "★録画が まだ「できない」側に あります");
    for (const x of ["photo", "public_page", "paper"]) {
      assert.ok(k.includes(x), "★書かれて いません: " + x);
    }
    assert.ok(P.NOT_YET.every((x) => x.needs), "★何が 要るかが 書かれて いません");
  });

  見る("★録画 ── ★`https` だけ を 通す", () => {
    assert.ok(P.urlOk("https://www.youtube.com/watch?v=abc"), "★https を 落として います");
    assert.ok(!P.urlOk("http://www.youtube.com/watch?v=abc"), "★http（s なし）が 通ります");
    assert.ok(!P.urlOk("javascript:alert(1)"), "★あぶない 字が 通ります");
    assert.ok(!P.urlOk("data:text/html,x"), "★あぶない 字が 通ります");
    assert.ok(!P.urlOk(""), "★空が 通ります");
    assert.ok(!P.urlOk(" https://x.example/ y"), "★空白の 入った ものが 通ります");
  });

  見る("★録画 ── ★どこへ 行くかを 出せる", () => {
    assert.strictEqual(P.hostOf("https://youtu.be/abc?t=3"), "youtu.be");
    assert.strictEqual(P.hostOf("https://www.example.com/a/b"), "www.example.com");
    assert.strictEqual(P.hostOf("ふつうの字"), "");
  });

  見る("★録画 ── ★台帳にも 同じ 縛りが ある", () => {
    const 録 = fs.readFileSync(
      path.join(ROOT, "supabase", "migration_portfolio_recordings.sql"), "utf8");
    assert.ok(/check \(url ~ '\^https:\/\//.test(録.replace(/\n/g, " ")),
      "★台帳に https の 縛りが ありません");
    assert.ok(/user_id = auth\.uid\(\)/.test(録), "★ご本人の 枝が ありません");
    assert.ok(!/truncate/i.test(録), "★`truncate` を 渡して います");
    const r = 録.indexOf("revoke all on public.portfolio_recordings");
    const g = 録.indexOf("grant select, insert, update, delete on public.portfolio_recordings");
    assert.ok(r > 0 && g > r, "★渡しが 先に なって います");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
