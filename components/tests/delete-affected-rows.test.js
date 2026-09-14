#!/usr/bin/env node

// ============================================================================
// ★消した つもりで、★0行の ままに なって いないこと
//
//   ★出どころ 2026-09-14、★修正の記録 No.014
//
//   ★★消した 曲が、★読み直すと 戻って いました。
//     ★★`repertoire_tessitura` に「消す 決まり」（★RLS の DELETE）が
//       ★ありませんでした。
//     ★★RLS は、★決まりが 無い ときに **黙って 0行**に します。
//       ★誤りを 返しません。★HTTP は 204 の ままです。
//     ★★だから 画面は「通った」と 読み、★手もとの 並びから 抜き、
//       ★読み直すと 戻って いました。
//
//   ★★決まりは 足しました（supabase/migration_…_delete_policy.sql）。
//     ★★それでも 画面を 直します。★片側だけ 直すと、
//       ★同じ 形が また どこかで 起きます（★No.002 と 同じ）。
//
//   ★★この 見張りが 見る こと
//     ★① 消す ときに `.select(` を 付けて いる（★行数が 返る）
//     ★② 0行を しくじりとして 扱う
//     ★③ 出す 言葉は もとの ままで、★中身を 見せない
// ============================================================================

const { readCode } = require("./_source");

let ok = 0;
let ng = 0;
const t = (c, l) => { if (c) { console.log("  ✓ " + l); ok++; } else { console.log("  ✗ " + l); ng++; } };

const vt = readCode("components", "VocalTracker.jsx");

// ★★曲を 消す ところ だけを 取り出します。
const i = vt.indexOf("async function handleDeleteRepertoire");
t(i > 0, "★曲を 消す ところが ある");
const seg = vt.slice(i, vt.indexOf("\n  }", vt.indexOf("finally", i)));

console.log("① 行数が 返る 形に なって いる");
t(/from\("repertoire_tessitura"\)[\s\S]{0,200}?\.select\("id"\)/.test(seg),
  "★repertoire_tessitura の 消しに .select(\"id\")");
// ★★役と 企画の 表には `id` の 列が ありません。
//   ★★2026-09-14、★そこに .select("id") を 付けて 42703 で 止まりました。
//   ★★行数は 要りません（★0行が 当たり前）。★付けては いけません。
t(!/from\("role_master"\)[\s\S]{0,160}?\.select\(/.test(seg),
  "★role_master に .select を 付けて いない（★id の 列が 無い）");
t(!/from\("project_master"\)[\s\S]{0,160}?\.select\(/.test(seg),
  "★project_master も 同じ");
t(/roleError\) throw roleError/.test(seg), "★役の 誤りは 見る");
t(/projError\) throw projError/.test(seg), "★企画の 誤りも 見る");

console.log("\n② 『あった はずの 行が 残った』ときだけ 止める");
// ★★2026-09-14 夕、★ここで つまずきました。
//   ★★「0行なら 止める」に して いました。
//   ★★音域の 表に 行が あるのは、★音域を 書いた 曲 だけ です。
//     ★ふつうの 曲には ありません。★0行が 当たり前 でした。
//   ★★そこで 止めたので、★念押しの「消す」が 何も しなく なりました。
t(/hadTessitura/.test(seg), "★あった はずかを 先に 見る");
t(/repertoireTessituraMap[\s\S]{0,120}isSameRepertoire/.test(seg),
  "★手もとの 台帳で 見る（★綴りの ゆれも 合わせる）");
t(/if \(hadTessitura && \(!delRows \|\| delRows\.length === 0\)\)/.test(seg),
  "★あった はず＋0行 の ときだけ 止める");
t(!/^\s*if \(!delRows \|\| delRows\.length === 0\)/m.test(seg),
  "★ただの 0行では 止めない");
t(/throw new Error\("REPERTOIRE_DELETE_NO_ROWS"\)/.test(seg),
  "★止める ときの 合図");
// ★★役と 企画は、★無い ことが 普通です。★0行で 止めては いけません。
t(!/roleRows\.length === 0/.test(seg) && !/projRows\.length === 0/.test(seg),
  "★役・企画は 0行でも 止めない（★無いのが 普通）");

console.log("\n③ 出す 言葉");
t(/setMergeResult\("消せませんでした。もう一度お試しください。"\)/.test(seg),
  "★もとの 言葉の まま（★中身を 見せない）");
t(!/REPERTOIRE_DELETE_NO_ROWS[\s\S]{0,80}setMergeResult/.test(seg),
  "★合図を そのまま 画面に 出して いない");

console.log("\n④ 台帳の 側の 直しが 置いて ある");
const fs = require("fs");
const path = require("path");
const sql = path.join(__dirname, "..", "..", "supabase",
  "migration_repertoire_tessitura_delete_policy.sql");
t(fs.existsSync(sql), "★決まりを 足す SQL が ある");
if (fs.existsSync(sql)) {
  const s = fs.readFileSync(sql, "utf8");
  t(/for delete/i.test(s), "★消す 決まりを 作って いる");
  t(/auth\.uid\(\) = user_id/.test(s), "★自分の 行だけ");
  t(/if not exists/i.test(s) || /not exists \(/.test(s), "★何度 流しても よい");
}

console.log("\n★★この 見張りが 見て いない こと");
console.log("　★字の 並びだけ を 見ます。★実際に 消えるかは 見て いません。");
console.log("　★台帳に 決まりが 入って いるかも 見て いません。");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
