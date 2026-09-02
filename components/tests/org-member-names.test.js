#!/usr/bin/env node
/**
 * 同じ教室の人の名前を、どう引くか（2026-09-02・Opus の裁定）
 *
 * ★確認された事実（+t5 のセッション・ブラウザのコンソール）
 *     ★名前を読めた人数が足りません: 2/3
 *   profiles を直接読んでも、全員ぶんは返りません。
 *
 * ★守ること
 *   ① profiles のポリシーをゆるめない（同じ行に健康の情報がある）
 *   ② 返す列は display_name だけ
 *   ③ 関数の中で、呼んだ人が教室に居ることを確かめる
 *   ④ 写しを作らない（名前を変えたときに古くならない）
 *   ⑤ 表示名を入れる画面に、見えることを先に書く
 */
const { readRaw, readCode } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const sql = readRaw("supabase", "migration_org_member_names.sql");
const src = readCode("components", "VocalTracker.jsx");

console.log("=== ★profiles をゆるめない ===");
{
  assertTrue(!/create policy[\s\S]{0,200}on public\.profiles/.test(sql),
    "★profiles にポリシーを足していない");
  assertTrue(!/alter table public\.profiles/.test(sql), "★profiles を作り変えていない");
  assertTrue(/security definer/.test(sql), "SECURITY DEFINER の関数で返す");
}

console.log("\n=== ★返す列は display_name だけ ===");
{
  assertTrue(/returns table\(user_id uuid, display_name text\)/.test(sql),
    "戻り値は user_id と display_name の2つ");
  ["allergies", "regular_medications", "is_under_18", "cycle", "line_user_id", "occupation", "school"]
    .forEach((col) => assertTrue(!new RegExp(`\\b${col}\\b`).test(sql.split("-- ---")[2] || sql),
      `★${col} を返していない`));
}

console.log("\n=== ★関数の中で、居ることを確かめる ===");
{
  assertTrue(/if auth\.uid\(\) is null then\s+return;/.test(sql), "ログインしていなければ何も返さない");
  assertTrue(/from public\.memberships m\s+where m\.org_id = p_org_id and m\.user_id = auth\.uid\(\)/.test(sql),
    "memberships で確かめる");
  assertTrue(/from public\.enrollments e\s+where e\.org_id = p_org_id and e\.student_id = auth\.uid\(\)/.test(sql),
    "enrollments でも確かめる（生徒も見られる）");
  assertTrue(/then\s+return;\s+end if;/.test(sql), "★居なければ0行（エラーにしない）");
  assertTrue(/revoke all on function public\.get_org_member_names\(uuid\) from public, anon/.test(sql),
    "★anon には渡さない");
}

console.log("\n=== ★画面がこの関数を使っている ===");
{
  assertTrue(/\.rpc\("get_org_member_names", \{ p_org_id: orgId \}\)/.test(src),
    "メンバー欄が関数を呼んでいる");
  assertTrue(!/from\("profiles"\)\.select\("id, display_name, vocal_profession"\)\.in\("id", Array\.from\(ids\)\)/.test(src),
    "★profiles を直接読む古い経路が残っていない");
  assertTrue(/migration_org_member_names\.sql を実行してください/.test(src),
    "★移行が未実行なら、そう分かる（黙って空にしない）");
}

console.log("\n=== ★写しを作らない ===");
{
  assertTrue(!/insert into public\.org_invitations[\s\S]{0,120}display_name/.test(sql),
    "★招待の行に名前を写していない");
  assertTrue(/写しはどこにもありません/.test(sql), "毎回 profiles を読むと書いてある");
}

console.log("\n=== ★見る人の役割で出し分けない ===");
{
  assertTrue(/function orgDisplayName\(userId\) \{/.test(src),
    "★引数は user_id だけ（見る人を受け取らない）");
  assertTrue(!/String\(userId\)\.slice\(0, 8\)/.test(src), "★uuid を画面に出さない");
}

console.log("\n=== ★表示名の画面に、見えることが書いてある ===");
{
  assertTrue(/const DISPLAY_NAME_CAUTION =/.test(src), "注意書きが1か所に定義されている");
  assertTrue(/同じ教室のメンバーにも表示されます/.test(src), "見えることを書いている");
  assertTrue(/生年月日/.test(src), "★避けたほうがよいものを具体的に書いている");
  const uses = (src.match(/\{DISPLAY_NAME_CAUTION\}/g) || []).length;
  assertTrue(uses === 2, `★表示名を入れる2か所とも出している（いま ${uses} か所）`);
  assertTrue(!/必ず|してください。さもないと|危険/.test(
    src.slice(src.indexOf("const DISPLAY_NAME_CAUTION"), src.indexOf("const DISPLAY_NAME_CAUTION") + 400)),
    "★脅かす書き方をしていない");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
