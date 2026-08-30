#!/usr/bin/env node
/**
 * 未成年を、教師と紐付けられないようにする（2026-08-30）
 *
 * 出典 docs/lavoce-判断の回答-配布前の決定-20260829.md §7-2 ②（案D）
 * 関連 設計憲章 §5「契約で禁じたことを、コードでも不可能にする」
 *
 * ★守りたいこと
 *   ① 判定はDB側（トリガー）。画面で隠すだけにしない
 *   ② ★RLS ではなくトリガー。RLS は service_role が素通りする
 *   ③ フェイルクローズ：未回答（null）も、profiles の行が無い場合も弾く
 *   ④ 2つの表を守る（teacher_student_links と assignments）
 *      ★assignments も「教師と生徒の対」です。片方だけでは意味がない
 *   ⑤ 画面には、生のDBエラーではなく日本語の理由を出す
 *   ⑥ ★既にある行を消さない（見えるようにするだけ）
 *
 * ★この試験はSQLの本文と画面側を見ます。DBの動きそのものは、
 *   移行ファイルの⑥（わざと失敗させて巻き戻す確認）で坂本さんが確かめます。
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const sql = readCode("supabase", "migration_block_minor_teacher_link.sql");
const sqlRaw = readRaw("supabase", "migration_block_minor_teacher_link.sql");
const vt = readCode("components", "VocalTracker.jsx");

console.log("=== ★DB側で弾く（画面だけにしない） ===");
assertTrue(/create or replace function public\.assert_student_is_adult\(\)/.test(sql), "判定の関数がある");
assertTrue(/returns trigger/.test(sql), "★トリガー関数である");
assertTrue(/security definer/.test(sql), "★教師の側から生徒の profiles を読めるようにしている");
assertTrue(/set search_path = public/.test(sql), "★security definer で search_path を固定している");

console.log("\n=== ★RLS ではなくトリガー（service_role も弾く） ===");
assertTrue(/create trigger trg_block_minor_teacher_link/.test(sql), "teacher_student_links にトリガー");
assertTrue(/create trigger trg_block_minor_assignment/.test(sql), "★assignments にもトリガー");
assertTrue(!/create policy/i.test(sql), "★RLSポリシーで済ませていない");
// ★2つとも before で、insert と update の両方に掛かること
["trg_block_minor_teacher_link", "trg_block_minor_assignment"].forEach((t) => {
  const at = sql.indexOf(`create trigger ${t}`);
  const blk = sql.slice(at, at + 260);
  assertTrue(/before insert or update of student_id/.test(blk),
    `${t}: ★insert と、student_id の update の両方に掛かる`);
  assertTrue(/for each row/.test(blk), `${t}: 行ごとに走る`);
});

console.log("\n=== ★フェイルクローズ ===");
// 「18歳以上だと答えた人だけ通す」という書き方であること。
assertTrue(/p\.is_under_18 is false/.test(sql), "★is false のときだけ通す");
assertTrue(/if not exists \(/.test(sql), "★該当が無ければ弾く（null も、行が無い場合も）");
// 逆向きの書き方（未成年だけ弾く）になっていないこと。null が通ってしまう。
assertTrue(!/is_under_18 is true\s*\)?\s*then\s*raise/.test(sql),
  "★「true のときだけ弾く」になっていない（null が通ってしまう）");
assertTrue(!/coalesce\(\s*p\.is_under_18\s*,\s*false\s*\)/.test(sql),
  "★未回答を false（成人）に読み替えていない");

console.log("\n=== ★既にある行を消していない ===");
assertTrue(!/delete from public\.(teacher_student_links|assignments)/i.test(sql),
  "★紐付けを消す文が無い");
assertTrue(!/update public\.(teacher_student_links|assignments)\s+set/i.test(sql),
  "★既存の行を書き換えていない");
assertTrue(/union all/.test(sql), "既にある未成年の紐付けを、一覧して見せている");

console.log("\n=== ★enrollments は対象外（判断どおり） ===");
assertTrue(!/create trigger[\s\S]{0,80}on public\.enrollments/.test(sql),
  "★enrollments にはトリガーを掛けていない（教師の名前を伴わないため）");

console.log("\n=== 画面側：理由を日本語で出す ===");
assertTrue(/function isMinorLinkBlocked\(error\)/.test(vt), "DBの目印を読む関数が1つある");
assertTrue(/MINOR_TEACHER_LINK_BLOCKED/.test(sql), "SQL 側に目印がある");
assertTrue(/MINOR_TEACHER_LINK_BLOCKED/.test(vt), "画面側が同じ目印を見ている");
assertTrue(/isTreatedAsMinor\(profile\)/.test(vt), "招待を受ける側で、事前にも止めている");
// ★画面側で「年齢の判断」を直にしていないこと。
//   読み込みの正規化（typeof ageRow.is_under_18 === "boolean"）は判断ではないので、
//   profile を相手にした比較だけを見ます（age-gate.test.js と同じ見方）。
assertTrue(!/profile\.is_under_18\s*===/.test(vt), "★画面が profile.is_under_18 を直に比べていない");
assertTrue(!/is_under_18\s*===\s*false/.test(vt), "★「false なら成人」と画面に書いていない");
// 2つの経路とも、日本語の理由を出すこと
assertTrue((vt.match(/保護者の方の確認の仕組みを準備しています/g) || []).length >= 2,
  "★招待を受ける側と、担当を割り当てる側の両方で理由を出す");

console.log("\n=== ★画面の事前チェックだけに頼っていない、と書いてある ===");
assertTrue(/ここを消しても、つながれるようにはなりません/.test(readRaw("components", "VocalTracker.jsx")),
  "★本当の歯止めがDB側であることが、コードのそばに書いてある");

console.log("\n=== 移行ファイルの作法 ===");
assertTrue(/drop trigger if exists/.test(sql), "★何度実行しても同じ結果になる");
assertTrue(/create or replace function/.test(sql), "関数も作り直せる");
assertTrue(/pg_trigger/.test(sql), "取り付けられたことを確かめる問い合わせがある");
assertTrue(/raise notice '✅ 弾かれました/.test(sqlRaw), "★実際に弾かれることを試す手順がある");

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
