#!/usr/bin/env node
/**
 * auth.users を指している列が、すべて退会の掃除に入っているか（2026-09-01）
 *
 * ★同じ壊れ方を3回やったので、作りました。
 *   ① lessons / entry_comments … 一覧にあるのに user_id 列が無く、
 *      「列が無い」を握りつぶして静かに何もしていなかった
 *   ② organizations.created_by … NOT NULL で null にできず、退会が失敗した
 *   ③ events … ★そもそも一覧に無く、掃除から丸ごと漏れていた。
 *      記録を1回でも開いた人は events に行があるので、
 *      ★ほとんどの利用者が退会できませんでした
 *
 * ★3回とも原因は同じです。全体像がどこにも無く、人の記憶で一覧を
 *   書いていたことです。だから、台帳（lib/authUserReferences.js）と
 *   実際の一覧が食い違ったら、ここで落とします。
 *
 * ★この検査だけでは足りません。
 *   「DBにあって台帳に無い列」は、コードからは見えません。
 *   supabase/check_auth_user_references.sql を実行して確かめてください。
 */
const fs = require("fs");
const path = require("path");
const { readRaw } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const root = path.join(__dirname, "..", "..");

/**
 * lib/ のモジュールを、そのまま読み込む。
 *
 * ★相対 import は、中身ごと data URL に差し替えます。
 *   import の行を消す形にすると「import { a, b } ;」が残って
 *   構文エラーになります（実際にやりました）。
 */
function inline(rel, depth = 0) {
  // ★同じモジュールを2回読んでも、そのつど埋め込みます。
  //   「もう見た」で空モジュールを返すと、2つめの import が
  //   「export named 'isMissingTable' が無い」で落ちます（実際に落ちました）。
  //   循環は無いので、深さだけで止めます。
  if (depth > 5) throw new Error(`import が深すぎます: ${rel}`);
  const src = fs.readFileSync(path.join(root, rel), "utf8");
  return src.replace(/from "(\.\/[A-Za-z0-9_]+)(\.js)?"/g, (m, spec) => {
    const dep = path.join(path.dirname(rel), spec + ".js");
    return 'from "data:text/javascript;base64,' +
      Buffer.from(inline(dep, depth + 1)).toString("base64") + '"';
  });
}
function loadModule(rel) {
  return import("data:text/javascript;base64," + Buffer.from(inline(rel)).toString("base64"));
}

(async () => {
  const ref = await loadModule("lib/authUserReferences.js");
  const del = await loadModule("lib/accountDeletion.js");
  const oc = await loadModule("lib/orgClosure.js");

  const refs = ref.AUTH_USER_REFERENCES;
  const key = (r) => `${r.table}.${r.column}`;

  console.log("=== ★行き先の無い列が無い ===");
  {
    const unhandled = ref.findUnhandled();
    assertTrue(unhandled.length === 0,
      `★行き先の無い列: ${unhandled.map(key).join(", ") || "なし"}`);
    refs.forEach((r) => {
      if (!ref.HANDLERS.includes(r.handledBy)) {
        assertTrue(false, `★${key(r)} の行き先「${r.handledBy}」が不明`);
      }
    });
  }

  console.log("\n=== ★台帳 → 実際の一覧（書いてあるとおりに扱われているか） ===");
  {
    const owned = new Set(del.USER_OWNED_TABLES);
    const special = new Set(del.SPECIAL_DELETES.map((x) => `${x.table}.${x.column}`));
    const nulled = new Set(del.NULLED_REFERENCES.map((x) => `${x.table}.${x.column}`));

    refs.filter((r) => r.handledBy === "user_owned").forEach((r) => {
      assertTrue(owned.has(r.table) && r.column === "user_id",
        `${key(r)} が USER_OWNED_TABLES にある`);
    });
    refs.filter((r) => r.handledBy === "special").forEach((r) => {
      assertTrue(special.has(key(r)), `${key(r)} が SPECIAL_DELETES にある`);
    });
    refs.filter((r) => r.handledBy === "nulled").forEach((r) => {
      assertTrue(nulled.has(key(r)), `${key(r)} が NULLED_REFERENCES にある`);
    });
  }

  console.log("\n=== ★実際の一覧 → 台帳（黙って足されていないか） ===");
  {
    // ★こちら向きが無いと、一覧にだけ足して台帳を放置できてしまいます。
    //   そうなると台帳は「実物と合っている保証」を失い、ただの飾りになります。
    const inRefs = new Set(refs.map(key));
    del.USER_OWNED_TABLES.forEach((t) => {
      assertTrue(inRefs.has(`${t}.user_id`),
        `USER_OWNED_TABLES の ${t} が台帳にある`);
    });
    del.SPECIAL_DELETES.forEach((x) => {
      assertTrue(inRefs.has(`${x.table}.${x.column}`),
        `SPECIAL_DELETES の ${x.table}.${x.column} が台帳にある`);
    });
    del.NULLED_REFERENCES.forEach((x) => {
      assertTrue(inRefs.has(`${x.table}.${x.column}`),
        `NULLED_REFERENCES の ${x.table}.${x.column} が台帳にある`);
    });
  }

  console.log("\n=== ★events が入っている（③の再発を止める） ===");
  {
    assertTrue(del.USER_OWNED_TABLES.includes("events"),
      "★events が USER_OWNED_TABLES にある");
    const ev = refs.find((r) => r.table === "events");
    assertTrue(!!ev, "events が台帳にある");
    assertTrue(ev && ev.handledBy === "user_owned",
      "★events は user_id で先に消す（CASCADE に頼らない）");
    // ★行動ログは、CASCADE でも自分で消すこと。
    //   本人のデータなので、消えたことを確かめられる形で消します。
    assertTrue(ev && ev.verified === true, "events の扱いは確認ずみ");
  }

  console.log("\n=== ★確かめずに CASCADE へ頼っていないか ===");
  {
    // ★これが③（events）の原因そのものです。
    //   「移行ファイルに cascade と書いてある」を根拠に一覧から外すと、
    //   実物が NO ACTION だったときに★退会できなくなります。
    const unverified = ref.findUnverifiedCascades();
    assertTrue(unverified.length === 0,
      unverified.length === 0
        ? "確かめていない CASCADE は無い"
        : `★実物を確かめずに CASCADE に頼っている: ${unverified.map(key).join(", ")}`);

    // ★確かめていない列は、cascade ではなく pending と書きます。
    //   pending は「まだ決めていない」という記録で、消し忘れを防ぎます。
    const pending = refs.filter((r) => r.handledBy === "pending");
    const declared = new Set(ref.PENDING_VERIFICATION.map(key));
    pending.forEach((r) => {
      assertTrue(declared.has(key(r)),
        `★${key(r)} が PENDING_VERIFICATION に理由つきで書いてある`);
    });
    ref.PENDING_VERIFICATION.forEach((r) => {
      assertTrue(!!r.note && r.note.length > 20, `${key(r)} に理由が書いてある`);
    });
    if (pending.length > 0) {
      console.log(`  ⚠ ★未確認が ${pending.length} 件あります。`);
      pending.forEach((r) => console.log(`      ${key(r)}`));
      console.log("      supabase/check_auth_user_references.sql を実行して決めてください。");
    }
  }

  console.log("\n=== 台帳そのものの形 ===");
  {
    const seen = new Set();
    let dup = null;
    refs.forEach((r) => { if (seen.has(key(r))) dup = key(r); seen.add(key(r)); });
    assertTrue(!dup, `同じ列が2度書かれていない${dup ? `（${dup}）` : ""}`);
    assertTrue(refs.every((r) => r.table && r.column), "表と列が必ず書いてある");
    assertTrue(refs.some((r) => r.table === "profiles" && r.handledBy === "profiles_step"),
      "profiles は専用の一行で消す");
  }

  console.log("\n=== ★確かめ方が、手順として残っている ===");
  {
    const p = path.join(root, "supabase/check_auth_user_references.sql");
    assertTrue(fs.existsSync(p), "棚卸しの SQL がある");
    const sql = readRaw("supabase", "check_auth_user_references.sql");
    assertTrue(/pg_constraint/.test(sql), "pg_constraint を見る");
    assertTrue(!/information_schema\.(table_constraints|key_column_usage)/.test(sql),
      "★information_schema で外部キーを探さない（権限で結果が絞られる）");
    assertTrue(/confrelid = 'auth\.users'::regclass/.test(sql), "auth.users を指す列を探している");
    assertTrue(/NO ACTION/.test(sql), "★先に片付けないと退会できない列を目立たせている");
  }

  console.log("\n=== 教室を閉じる側とも、食い違っていない ===");
  {
    // ★closeOrg は org_id で消します。auth.users を指す列ではないので
    //   台帳には出ません。ただし lessons / assignments / enrollments を
    //   両方から消すので、順番の考え方がずれていないかだけ見ます。
    const closeTables = oc.CLOSE_ORG_DELETE_ORDER.map((x) => x.table);
    assertTrue(!closeTables.includes("entries"), "★教室を閉じても entries は消さない");
    assertTrue(!closeTables.includes("profiles"), "★教室を閉じても profiles は消さない");
    assertTrue(!closeTables.includes("events"), "★教室を閉じても events は消さない（本人のもの）");
  }

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
})();
