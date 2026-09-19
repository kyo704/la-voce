#!/usr/bin/env node
// ============================================================================
// ★未送信（★見本 `P_misou`・お決め D82）の 見張り
//
//   ★★★確かめる こと
//     ①下書きは 別の 表。★連絡の 表に 入って いない
//     ②読めるのは 書いた ご本人 だけ（★決まりは 1つ）
//     ③自動で 出さない ── ★押した ときだけ 出る
//     ④出すのと 消すのを 1つの 取引で（★2か所に 残さない）
//     ⑤2つに 分けて 出す（★下書き ／ 送れなかった）
//     ⑥読めない ときは 一覧を 出さない
//     ⑦消す 前に 一度 お尋ねする
//     ⑧機械の 字を そのまま 出さない
//
//   ★★較正 ── ★当たり（1件）と 外れ（読めて いない）で 試します。
// ============================================================================

const assert = require("assert");
const { readCode, readRaw, loadLib } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const m = await loadLib("lib", "opsMisou.js");
  const ui = readCode("components", "OpsMisou.jsx");
  const vt = readCode("components", "VocalTracker.jsx");
  const sql = readRaw("supabase", "migration_message_drafts.sql");
  const 本文 = sql.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");

  見る("較正 ── ★読めて いる", () => {
    assert.strictEqual(typeof m.split, "function");
    assert.ok(本文.includes("create table if not exists public.org_message_drafts"));
  });

  見る("①別の 表（★連絡の 表に 入れて いない）", () => {
    assert.ok(/org_message_drafts/.test(本文), "★表が ありません");
    // ★★`org_messages` に 下書きの 列を 足して いない こと。
    assert.ok(!/alter table public\.org_messages/.test(本文),
      "★連絡の 表を いじって います");
    assert.ok(/from\("org_message_drafts"\)/.test(vt), "★画面が 別の 表を 読んで いません");
  });

  見る("②読めるのは ご本人だけ", () => {
    assert.ok(/enable row level security/.test(本文), "★決まりが 効いて いません");
    assert.ok(/auth\.uid\(\) = author_id/.test(本文), "★ご本人の 決まりが ありません");
    // ★★決まりは 1つ だけ（★よその 道を 作らない）。
    assert.strictEqual((本文.match(/create policy/g) || []).length, 1,
      "★決まりが 2つ 以上 あります");
  });

  見る("③自動で 出さない", () => {
    assert.ok(m.WARN_LINES.join("").includes("自動で 出しません"),
      "★その 1行が ありません");
    assert.ok(/WARN_LINES/.test(ui), "★画面が 出して いません");
    // ★★台帳に 引き金（trigger）を 作って いない こと。
    assert.ok(!/create trigger/.test(本文), "★引き金が あります");
  });

  見る("④出すのと 消すのを 1つの 取引で", () => {
    const i = 本文.indexOf("send_message_draft");
    const なか = 本文.slice(i, i + 1400);
    assert.ok(/insert into public\.org_messages/.test(なか), "★移して いません");
    assert.ok(/delete from public\.org_message_drafts/.test(なか), "★消して いません");
    assert.ok(/author_id <> auth\.uid\(\)/.test(なか), "★ご本人か 見て いません");
    assert.ok(/rpc\("send_message_draft"/.test(vt), "★画面が 読み道を 呼んで いません");
  });

  見る("⑤2つに 分けて 出す", () => {
    assert.strictEqual(m.KINDS.length, 2);
    const 分 = m.split([{ kind: "draft" }, { kind: "failed" }, { kind: "draft" }]);
    assert.strictEqual(分.draft.length, 2);
    assert.strictEqual(分.failed.length, 1);
  });

  見る("⑥読めない ときは 一覧を 出さない", () => {
    assert.strictEqual(m.split(undefined), null);
    assert.strictEqual(m.split(null), null);
    assert.ok(/NOT_READ/.test(ui), "★読めない ときの 1行が ありません");
  });

  見る("⑦消す 前に 一度 お尋ねする", () => {
    assert.ok(/<Ask/.test(ui), "★お尋ねが ありません");
    assert.ok(/DELETE_ASK/.test(ui), "★字が ありません");
    assert.ok(m.NOTES.join("").includes("戻せません"), "★戻せない ことを 書いて いません");
  });

  見る("⑧機械の 字を そのまま 出さない", () => {
    assert.strictEqual(m.FAIL_WORD, "つながりませんでした");
    // ★★画面が `fail_reason` を そのまま 出して いない こと。
    assert.ok(!/fail_reason/.test(ui), "★機械の 字を 出して います");
    assert.ok(!/fail_reason/.test(vt.slice(vt.indexOf("fetchMisou"),
      vt.indexOf("fetchMisou") + 600)), "★読んで います");
  });

  見る("⑨入口が ある（★N-1）", () => {
    assert.ok(/<OpsMisou/.test(vt), "★置いて いません");
    assert.ok(/onGoMisou/.test(readCode("components", "Renraku.jsx")), "★札が ありません");
    assert.ok((vt.match(/fetchMisou/g) || []).length >= 3, "★読み道が 呼ばれて いません");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})();
