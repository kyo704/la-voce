#!/usr/bin/env node
// ============================================================================
// ★門下に 招く（★見本 `P_monkaInvite` ②・裁定 その108）の 見張り
//
//   ★★★裁定 その108 ──「新しい 表は 作らない。★3列 足すだけで 足りるか 確認」。
//     ★★確かめた 答え ── ★3列 ＋ **学生が 読む 道 1本** で 足ります。
//
//   ★★★確かめる こと
//     ①`monka_invitations` の 表を 作って いない
//     ②3つの 顔（招く／招待中／入って います）
//     ③名簿に いる 方 だけ（★名簿の 外を 探せない）
//     ④こちらから 入れない（★相手の 画面に 出る だけ）
//     ⑤学生は ご自分 宛て だけ 読める
//     ⑥同じ 方に いくつも 開いた ままに しない
//
//   ★★較正 ── ★在る ものと 無い ものの 両方で 試します。
// ============================================================================

const assert = require("assert");
const { readCode, readRaw, loadLib } = require("./_source");
const fs = require("fs");
const path = require("path");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const m = await loadLib("lib", "monkaInvite.js");
  const sql = readRaw("supabase", "migration_monka_invite.sql");
  const 本文 = sql.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");
  const ui = readCode("components", "OpsMonkaInvite.jsx");
  const vt = readCode("components", "VocalTracker.jsx");

  見る("①`monka_invitations` を 作って いない", () => {
    const 蔵 = path.join(__dirname, "..", "..", "supabase");
    const みな = fs.readdirSync(蔵).filter((f) => f.endsWith(".sql"))
      .map((f) => fs.readFileSync(path.join(蔵, f), "utf-8"))
      .join("\n").split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");
    assert.ok(!/create table[^\n]*monka_invitations/.test(みな), "★表を 作って います");
    // ★★足したのは 3列 だけ。
    ["target_user_id", "invited_at", "kind"].forEach((c) =>
      assert.ok(new RegExp("add column if not exists " + c).test(本文),
        "★" + c + " が ありません"));
  });

  見る("②3つの 顔", () => {
    const 状 = { monka: ["A"], invites: [{ target_user_id: "B", used_at: null }] };
    assert.strictEqual(m.stateOf("A", 状), "joined");
    assert.strictEqual(m.stateOf("B", 状), "sent");
    assert.strictEqual(m.stateOf("C", 状), "none");
    // ★★使われた 招きは「招待中」に しません。
    assert.strictEqual(m.stateOf("D",
      { monka: [], invites: [{ target_user_id: "D", used_at: "t" }] }), "none");
    assert.strictEqual(m.mayInvite("none"), true);
    ["sent", "joined"].forEach((s) =>
      assert.strictEqual(m.mayInvite(s), false, "★" + s + " で 押せます"));
  });

  見る("③名簿に いる 方 だけ", () => {
    assert.ok(m.LIST_NOTES.join("").includes("名簿の 外を 探す ことは できません"),
      "★その 断りが ありません");
    // ★★画面が 名簿から 作って いる こと。
    assert.ok(/orgEnrollments\[opsOrgId\]/.test(vt), "★名簿から 出して いません");
  });

  見る("④こちらから 入れない", () => {
    const 字 = m.LIST_NOTES.join("") + m.BOTTOM_NOTES.join("");
    assert.ok(字.includes("こちらから 入れる ことは できません"), "★その 断りが ありません");
    assert.ok(字.includes("ご本人が 承知して はじめて"), "★承知の ことを 書いて いません");
    assert.ok(字.includes("さがす 仕組みは ありません"), "★芯の 1行が ありません");
    // ★★招く 側が `assignments` を 作って いない こと。
    const i = vt.indexOf("async function handleInviteToMonka");
    const なか = vt.slice(i, i + 1200);
    assert.ok(!/from\("assignments"\)/.test(なか), "★担当を 直に 作って います");
  });

  見る("⑤学生は ご自分 宛て だけ 読める", () => {
    assert.ok(/create or replace function public\.get_my_monka_invites/.test(本文),
      "★読む 道が ありません");
    assert.ok(/target_user_id = auth\.uid\(\)/.test(本文), "★宛て先を 見て いません");
    assert.ok(/used_at is null/.test(本文) && /expires_at > now\(\)/.test(本文),
      "★済んだ ものや 切れた ものを 出して います");
    // ★★よその 方の 招きを 返して いない こと。
    assert.ok(!/kind = 'open'/.test(本文.slice(本文.indexOf("get_my_monka_invites"))),
      "★合言葉の ぶんまで 返して います");
  });

  見る("⑥同じ 方に いくつも 開いた ままに しない", () => {
    assert.ok(/create unique index[^\n]*teacher_invitations_named_open_uniq/.test(本文),
      "★束ねが ありません");
    assert.ok(/where kind = 'named' and used_at is null/.test(本文),
      "★条件が ちがいます");
  });

  見る("★先生の 画面も 道から 読む（★合言葉を 返さない）", () => {
    assert.ok(/rpc\("get_my_named_invites"/.test(vt), "★道を 使って いません");
    assert.ok(!/from\("teacher_invitations"\)\s*\n?\s*\.select\(/.test(vt),
      "★表を 直に 引いて います");
    // ★★道が 返す ものに 合言葉が 無い こと。
    const i = 本文.indexOf("get_my_named_invites");
    const なか = 本文.slice(i, i + 500);
    assert.ok(!/\bi\.code\b/.test(なか), "★合言葉を 返して います");
    assert.ok(/monka_teacher_id = auth\.uid\(\)/.test(なか), "★ご自分の ぶん だけ に なって いません");
  });

  見る("★合言葉の 作り（★まぎれにくい 字・8文字）", () => {
    assert.strictEqual(m.CODE_LENGTH, 8);
    assert.ok(!/[IL01O]/.test(m.CODE_CHARS), "★まぎれる 字が 入って います");
    const c = m.makeCode(() => 0);
    assert.strictEqual(c.length, 8);
    assert.ok(/^[A-Z2-9]+$/.test(c), "★字が ちがいます: " + c);
  });

  console.log("\n★" + 数 + "つ 通りました。");
})();
