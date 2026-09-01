#!/usr/bin/env node
/**
 * 退会のとき、外部キーで詰まらないか（2026-09-01）
 *
 * ★本番で pg_constraint を調べたところ、auth.users / profiles を指す
 *   外部キーのうち★8つが ON DELETE NO ACTION でした。
 *   NO ACTION は「一緒に消えない」＝親を消そうとすると失敗します。
 *
 *     entry_comments.created_by
 *     lessons.created_by / student_id / teacher_id
 *     org_invitations.used_by / invited_by
 *     organizations.created_by
 *     teacher_invitations.used_by_student_id
 *
 * ★何が起きていたか（2026-09-01 に判明）
 *   purgeAccount は22テーブルを .eq("user_id", …) で消しますが、
 *   lessons と entry_comments には★user_id 列がありません。
 *   PostgREST の「column ... does not exist」を isMissingTable が
 *   「表が無い」と誤読して握りつぶし、0件扱いで先へ進んでいました。
 *   そして auth.users の削除で外部キー違反。
 *   ★記録は消えたのに、アカウントだけが残ります。
 */
const { readCode } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

// ★本番で確認した8つ（pg_constraint・2026-09-01）
const NO_ACTION_COLUMNS = [
  // ★entry_comments は 2026-09-01 に表ごと削除しました（憲章 §10）。
  //   表が無いので、この列も外部キーの一覧から消えます。
  ["lessons", "created_by"],
  ["lessons", "student_id"],
  ["lessons", "teacher_id"],
  ["org_invitations", "used_by"],
  ["org_invitations", "invited_by"],
  ["organizations", "created_by"],
  ["teacher_invitations", "used_by_student_id"]
];

(async () => {
  const d = await import("../../lib/accountDeletion.js");

  console.log("=== ★8つの列が、どこかで必ず扱われている ===");
  const covered = (table, column) => {
    if (d.SPECIAL_DELETES.some((x) => x.table === table && x.column === column)) return "行ごと削除";
    if (d.NULLED_REFERENCES.some((x) => x.table === table && x.column === column)) return "null にする";
    if (d.PENDING_FK_DECISIONS.some((x) => x.table === table && x.column === column)) return "★判断待ち";
    return null;
  };
  NO_ACTION_COLUMNS.forEach(([t, c]) => {
    const how = covered(t, c);
    assertTrue(how !== null, `${t}.${c} → ${how || "★どこにも無い（退会が失敗します）"}`);
  });

  console.log("\n=== ★entry_comments が復活していない ===");
  // 生徒の記録への自由記述コメント。憲章 §10 が禁じています。
  const vt = readCode("components", "VocalTracker.jsx");
  ["entry_comments", "handleCreateComment", "fetchCommentsForLink", "fetchMyRecentComments",
   "studentComments", "myRecentComments", "newCommentDraft"].forEach((n) => {
    assertTrue(!vt.includes(n), `★${n} が残っていない`);
  });
  assertTrue(!d.USER_OWNED_TABLES.includes("entry_comments"), "★削除の一覧からも外れている");
  const charter = readCode("docs", "lavoce-設計憲章.md");
  assertTrue(/生徒の記録に対するコメント・ひとこと・反応を作らない/.test(charter),
    "★憲章 §10 に、作らないことが書いてある");

  console.log("\n=== ★判断待ちは、理由が書いてある ===");
  d.PENDING_FK_DECISIONS.forEach((x) => {
    assertTrue(typeof x.note === "string" && x.note.length > 10,
      `${x.table}.${x.column} に理由がある`);
  });
  // ★2026-09-01、判断待ちは空になりました。8列すべてを実際に扱っています。
  assertTrue(d.PENDING_FK_DECISIONS.length === 0,
    "★判断待ちが無い（＝先生の退会が外部キーで詰まらない）");
  NO_ACTION_COLUMNS.forEach(([t, c]) => {
    const handled =
      d.SPECIAL_DELETES.some((x) => x.table === t && x.column === c) ||
      d.NULLED_REFERENCES.some((x) => x.table === t && x.column === c);
    assertTrue(handled, `★${t}.${c} が実際に処理されている（保留ではない）`);
  });

  console.log("\n=== ★同じ列を2か所で扱っていない ===");
  const seen = new Set();
  [...d.SPECIAL_DELETES, ...d.NULLED_REFERENCES, ...d.PENDING_FK_DECISIONS].forEach((x) => {
    const k = `${x.table}.${x.column}`;
    assertTrue(!seen.has(k), `${k} は1か所だけ`);
    seen.add(k);
  });

  console.log("\n=== ★isMissingTable が、列の不足を握りつぶさない ===");
  const code = readCode("lib", "accountDeletion.js");
  assertTrue(/column .\* does not exist/.test(code) || /column .*does not exist/i.test(code),
    "列のエラーを見分ける分岐がある");
  // 実際に動かして確かめる
  const mod = code.slice(code.indexOf("function isMissingTable"), code.indexOf("}", code.indexOf("return /relation")) + 1);
  const isMissingTable = new Function("return " + mod)();
  assertTrue(isMissingTable({ message: 'relation "public.lessons" does not exist' }) === true,
    "表が無いときは握りつぶす（環境差なので）");
  assertTrue(isMissingTable({ message: "column lessons.user_id does not exist" }) === false,
    "★列が無いときは握りつぶさない");
  assertTrue(isMissingTable({ message: "Could not find the 'user_id' column of 'lessons'" }) === false,
    "★PostgREST の言い回しでも握りつぶさない");
  assertTrue(isMissingTable({ message: 'violates foreign key constraint "lessons_teacher_id_fkey"' }) === false,
    "外部キー違反は、当然に失敗として数える");
  assertTrue(isMissingTable(null) === false, "エラーが無ければ false");

  console.log("\n=== 順序：子 → 親 → auth.users ===");
  const purge = code.slice(code.indexOf("export async function purgeAccount"));
  const iSever = purge.indexOf("severConnections");
  const iNull = purge.indexOf("NULLED_REFERENCES");
  const iProfile = purge.indexOf('from("profiles").delete()');
  const iAuth = purge.indexOf("auth.admin.deleteUser");
  assertTrue(iSever < iNull && iNull < iProfile && iProfile < iAuth,
    "★紐付けを外す → profiles → auth.users の順になっている");
  assertTrue(purge.indexOf("failures.length > 0") < iAuth,
    "★1つでも失敗したら、認証ユーザーを消さない門番が先にある");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
})();
