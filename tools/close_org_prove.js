#!/usr/bin/env node
// ★「教室を 閉じる」が、★最後まで 通るか（★2026-09-23 の 事故の あと）
//
//   ★★★きょうの 事故は、★**試して いなかった から** 気づけません でした。
//     ★行事・役職・場所・ご請求を 持つ 学校で 閉じた ことが ありません でした。
//   ★★だから、★その 4つを 持つ 学校を 作って から 閉じます。
//
//   ①行事・役職・場所・ご請求を 持つ 学校を 作る
//   ②`CLOSE_ORG_DELETE_ORDER` の 順で 消す（★画面と 同じ 道）
//   ③学校が 消えて いる
//   ④ぶら下がって いた ものも 消えて いる
//   ⑤記録（ops_audit_log）は **残る**・★そのときの 学校の 名前が 読める
//   ⑥★門下を 開いた 記録（monka_read_log）が、★学校を 閉じても **残る**（★裁定172）
//   ⑦その 記録から、★そのときの 学校の 名前が 読める
const fs = require("fs"), path = require("path");
const { execFileSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..");

const 台 = (sql, write) => execFileSync("python3",
  [path.join(ROOT, "tools/ask_ledger.py"), "--test", ...(write ? ["--write", "--ok"] : []), sql],
  { encoding: "utf8" });
const 数える = (sql) => { const m = /^\s*(\d+)\s*$/m.exec(台(sql)); return m ? Number(m[1]) : NaN; };

let 数 = 0, 落 = 0;
const みる = (名, ok, 註) => { 数 += 1; if (!ok) 落 += 1;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${名}${註 ? "  -- " + 註 : ""}`); };

const ORG = "88888888-8888-4888-8888-888888888881";
const MOTO = "eafa63c2-4592-4996-8c7c-18ecbec5a34f";

// ★★画面と 同じ 順 です。★`lib/orgClosure.js` の `CLOSE_ORG_DELETE_ORDER` を 写します。
//   ★★写しでは なく **読み込み** ます。★2つに 分かれると、★片方が 古く なります。
const 順 = (() => {
  const src = fs.readFileSync(path.join(ROOT, "lib/orgClosure.js"), "utf8");
  const i = src.indexOf("CLOSE_ORG_DELETE_ORDER = [");
  const 塊 = src.slice(i, src.indexOf("];", i));
  return [...塊.matchAll(/table:\s*"([a-z_]+)",\s*column:\s*"([a-z_]+)"/g)]
    .map((m) => ({ table: m[1], column: m[2] }));
})();

(async () => {
  console.log("★画面の 順 ……", 順.map((x) => x.table).join(" → "));

  console.log("\n=== 一 学校を 作ります（行事・役職・場所・ご請求 つき）===");
  台(`delete from public.organizations where id = '${ORG}'`, true);
  台(`insert into public.organizations (id, name, kind, created_by)
      values ('${ORG}', '★閉じる ための 試し', 'studio', '${MOTO}')`, true);
  台(`insert into public.org_posts (org_id, name, perms)
      values ('${ORG}', '学長', '{"master": true}'::jsonb)`, true);
  台(`insert into public.memberships (org_id, user_id, role, post_id)
      values ('${ORG}', '${MOTO}', 'owner',
              (select id from public.org_posts where org_id = '${ORG}' limit 1))`, true);
  台(`insert into public.org_events (org_id, event_date, kind, title, created_by)
      values ('${ORG}', current_date + 3, '合わせ', '★試しの 行事', '${MOTO}')`, true);
  台(`insert into public.org_places (org_id, name) values ('${ORG}', '★試しの 部屋')`, true);
  台(`insert into public.org_billing (org_id) values ('${ORG}')`, true);
  台(`insert into public.enrollments (org_id, student_id, status)
      values ('${ORG}', '${MOTO}', 'active')`, true);
  // ★★★門下を 開いた 記録を 1行（★裁定172 の 確かめ）。
  //   ★★`org_name_at` は sql/16 が 入れます。★ここでは 入れません。
  //     ★★入れて しまうと、★「入って いる」ことしか 確かめられません。
  台(`insert into public.monka_read_log (org_id, viewer_user_id, target_monka_id, reason, reason_kind, name_at)
      values ('${ORG}', '${MOTO}', '${MOTO}', '★ためし', 'jiko', '★くらべ用 たろう')`, true);
  // ★★いまの 行に 名前を 入れる のは sql/16 の ② です。★同じ ことを ここで します
  //   （★sql/16 は もう 当たって いるので、★あとから 入った 行には 入りません）。
  台(`update public.monka_read_log l set org_name_at = o.name
        from public.organizations o where o.id = l.org_id and l.org_name_at is null`, true);

  const 前 = {};
  for (const t of ["org_posts", "org_events", "org_places", "org_billing",
                   "memberships", "enrollments"]) {
    前[t] = 数える(`select count(*) from public.${t} where org_id = '${ORG}'`);
  }
  みる("①4つ とも 入った", Object.values(前).every((n) => n > 0), JSON.stringify(前));

  console.log("\n=== 二 画面と 同じ 順で 閉じます ===");
  const 記録前 = 数える("select count(*) from public.ops_audit_log");
  let 落ちた = null;
  for (const { table, column } of 順) {
    const out = 台(`delete from public.${table} where ${column} = '${ORG}'`, true);
    if (/番=\d/.test(out)) { 落ちた = table + " …… " + out.replace(/\s+/g, " ").slice(0, 90); break; }
  }
  みる("②最後まで 通った", 落ちた === null, 落ちた || "落ちません でした");

  console.log("\n=== 三 消えた ことを 数えます ===");
  みる("③学校が 消えて いる",
    数える(`select count(*) from public.organizations where id = '${ORG}'`) === 0);
  const 残 = {};
  for (const t of ["org_posts", "org_events", "org_places", "org_billing",
                   "memberships", "enrollments"]) {
    残[t] = 数える(`select count(*) from public.${t} where org_id = '${ORG}'`);
  }
  みる("④ぶら下がって いた ものも 消えて いる",
    Object.values(残).every((n) => n === 0), JSON.stringify(残));

  console.log("\n=== 四 記録は 残ります ===");
  const 記録後 = 数える("select count(*) from public.ops_audit_log");
  みる("⑤記録が 増えて いる（★消した ことも 残る）", 記録後 > 記録前, `${記録前} → ${記録後}`);
  const 名 = 台(`select count(*) from public.ops_audit_log
                  where org_id = '${ORG}' and org_name_at is not null`);
  みる("⑥そのときの 学校の 名前が 読める",
    /^\s*[1-9]\d*\s*$/m.test(名), 名.replace(/\s+/g, " ").slice(0, 40));

  console.log("\n=== 五 門下を 開いた 記録は、★学校を 閉じても 残る（裁定172）===");
  {
    const 残 = 数える(`select count(*) from public.monka_read_log where viewer_user_id = '${MOTO}'`);
    みる("⑥記録が 残って いる", 残 > 0, `${残}行`);
    const 名 = 数える(`select count(*) from public.monka_read_log
                        where viewer_user_id = '${MOTO}' and org_name_at is not null`);
    みる("⑦そのときの 学校の 名前が 読める", 名 > 0, `${名}行`);
    const 空 = 数える(`select count(*) from public.monka_read_log
                        where viewer_user_id = '${MOTO}' and org_id is null`);
    みる("⑧学校の id は 空に なって いる（★連鎖で 消えて いない）", 空 > 0, `${空}行`);
    台(`delete from public.monka_read_log where viewer_user_id = '${MOTO}'`, true);
  }

  console.log(`\n  ${数 - 落} / ${数}`);
  process.exit(落 ? 1 : 0);
})();
