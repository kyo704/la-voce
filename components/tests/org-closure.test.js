#!/usr/bin/env node
/**
 * オーナーの退会と、教室を閉じる（2026-09-01）
 *
 * ★何を守るか
 *   ① ほかに人がいる教室があるなら、退会は★何も消さずに止まる
 *   ② ほかに誰もいない教室は、行ごと消える
 *   ③ 生徒（enrollments）も「ほかの方」として数える
 *   ④ 止める知らせは、★2つとも押せる
 *   ⑤ 引き継ぎのメールの件名に、★教室のIDが入る
 *   ⑥ 教室を閉じる手段が、実際にある（無いと、ただの締め出しになる）
 *
 * ★なぜ ④ を検査するか
 *   最初の案は「教室を閉じる」だけがボタンで、引き継ぎは押せない文字でした。
 *   それでは★戻せないほうだけが押せます。人は押せるものを押します。
 */
const fs = require("fs");
const path = require("path");
const { readRaw } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const root = path.join(__dirname, "..", "..");
async function load(rel) {
  const src = fs.readFileSync(path.join(root, rel), "utf8")
    .replace(/from "\.\/supabaseErrors(\.js)?"/g, 'from "data:text/javascript;base64,' +
      Buffer.from(fs.readFileSync(path.join(root, "lib/supabaseErrors.js"), "utf8")).toString("base64") + '"');
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
}

/** 偽のクライアント。表ごとに行を持たせる。 */
function fakeClient(tables) {
  const deleted = [];
  const api = {
    deleted,
    from(table) {
      let rows = (tables[table] || []).slice();
      const q = {
        _filters: [],
        select() { return q; },
        eq(col, val) { q._filters.push([col, val]); rows = rows.filter((r) => r[col] === val); return q; },
        // ★2026-09-02、listOperatedOrgs が .in を使うので足しました。
        //   （役割を owner/admin の2つで絞るため）
        in(col, vals) { q._filters.push([col, vals]); rows = rows.filter((r) => vals.includes(r[col])); return q; },
        maybeSingle() { return Promise.resolve({ data: rows[0] || null, error: null }); },
        delete() {
          return {
            eq(col, val) {
              deleted.push({ table, column: col, value: val });
              tables[table] = (tables[table] || []).filter((r) => r[col] !== val);
              return Promise.resolve({ error: null });
            }
          };
        },
        then(res) { return Promise.resolve({ data: rows, error: null }).then(res); }
      };
      return q;
    }
  };
  return api;
}

(async () => {
  const oc = await load("lib/orgClosure.js");

  const ME = "me-uuid";
  const OTHER = "other-uuid";

  console.log("=== ★ほかに誰もいない教室は solo ===");
  {
    const c = fakeClient({
      memberships: [{ org_id: "org1", user_id: ME, role: "owner" }],
      organizations: [{ id: "org1", name: "マイ教室", created_by: ME }],
      enrollments: []
    });
    const r = await oc.classifyOwnedOrgs(c, ME);
    assertTrue(r.solo.length === 1 && r.solo[0] === "org1", "ほかに誰もいなければ solo");
    assertTrue(r.blocked.length === 0, "止めるものは無い");
  }

  console.log("\n=== ★ほかの先生がいる教室は、退会を止める ===");
  {
    const c = fakeClient({
      memberships: [
        { org_id: "org1", user_id: ME, role: "owner" },
        { org_id: "org1", user_id: OTHER, role: "teacher" }
      ],
      organizations: [{ id: "org1", name: "うたの教室", created_by: ME }],
      enrollments: []
    });
    const r = await oc.classifyOwnedOrgs(c, ME);
    assertTrue(r.blocked.length === 1, "止める教室が1つ");
    assertTrue(r.blocked[0].otherCount === 1, "ほかの方は1人");
    assertTrue(r.blocked[0].name === "うたの教室", "教室の名前を持っている");
    assertTrue(r.solo.length === 0, "solo には入れない");
  }

  console.log("\n=== ★生徒（enrollments）も「ほかの方」に数える ===");
  {
    const c = fakeClient({
      memberships: [{ org_id: "org1", user_id: ME, role: "owner" }],
      organizations: [{ id: "org1", name: "マイ教室", created_by: ME }],
      enrollments: [{ org_id: "org1", student_id: OTHER, status: "active" }]
    });
    const r = await oc.classifyOwnedOrgs(c, ME);
    assertTrue(r.blocked.length === 1 && r.blocked[0].otherCount === 1,
      "★生徒が1人いるだけでも止める（数えないと、生徒ごと黙って消える）");
  }

  console.log("\n=== 抜けた生徒（left）は数えない ===");
  {
    const c = fakeClient({
      memberships: [{ org_id: "org1", user_id: ME, role: "owner" }],
      organizations: [{ id: "org1", name: "マイ教室", created_by: ME }],
      enrollments: [{ org_id: "org1", student_id: OTHER, status: "left" }]
    });
    const r = await oc.classifyOwnedOrgs(c, ME);
    assertTrue(r.solo.length === 1,
      "★自分で抜けた人を数えると、誰も居ない教室を永久に閉じられなくなる");
  }

  console.log("\n=== 同じ人を二重に数えない ===");
  {
    const c = fakeClient({
      memberships: [
        { org_id: "org1", user_id: ME, role: "owner" },
        { org_id: "org1", user_id: OTHER, role: "teacher" }
      ],
      organizations: [{ id: "org1", name: "マイ教室", created_by: ME }],
      enrollments: [{ org_id: "org1", student_id: OTHER, status: "active" }]
    });
    const r = await oc.classifyOwnedOrgs(c, ME);
    assertTrue(r.blocked[0].otherCount === 1, "講師と生徒を兼ねていても1人");
  }

  console.log("\n=== ★オーナーの membership が無い教室も拾う ===");
  {
    // ensureOwnOrg が membership の作成だけ失敗した場合。
    const c = fakeClient({
      memberships: [],
      organizations: [{ id: "org1", name: "マイ教室", created_by: ME }],
      enrollments: []
    });
    const r = await oc.classifyOwnedOrgs(c, ME);
    assertTrue(r.solo.length === 1,
      "★created_by だけの教室を拾わないと、誰にも消せない教室が残る");
  }

  console.log("\n=== 教室を閉じる：消す順番 ===");
  {
    const order = oc.CLOSE_ORG_DELETE_ORDER.map((x) => x.table);
    assertTrue(order[order.length - 1] === "organizations", "★教室そのものは、いちばん最後");
    assertTrue(order.indexOf("lessons") < order.indexOf("organizations"), "レッスンが先");
    assertTrue(order.indexOf("enrollments") < order.indexOf("organizations"), "在籍が先");
    assertTrue(order.indexOf("memberships") < order.indexOf("organizations"), "講師の所属が先");
    // ★entries は絶対に消さない
    assertTrue(!order.includes("entries"),
      "★生徒さんの記録（entries）を消さない。ご本人のものです");
    assertTrue(!order.includes("profiles"), "★人そのものを消さない");
  }

  console.log("\n=== ★止める知らせ：2つとも押せる ===");
  {
    const n = oc.departingOwnerNotice(3);
    assertTrue(n.lines[0] === "この教室には、ほかに 3人 の方がいます。", "1行目が指示どおり");
    assertTrue(n.lines[1] === "アカウントを削除すると、この教室の契約者がいなくなります。", "2行目が指示どおり");
    assertTrue(n.choices.length === 2, "選べるのは2つ");
    assertTrue(n.choices.every((c) => c.action === "button" || c.action === "mailto"),
      "★2つとも押せる（片方が『押せない文字』になっていない）");
    assertTrue(n.choices[0].label === "教室を閉じる", "1つめは 教室を閉じる");
    assertTrue(n.choices[1].label === "教室を残す", "2つめは 教室を残す");
    assertTrue(n.choices[0].lines.join("").includes("元に戻せません"),
      "★戻せないことを、閉じる側に書いている");
    assertTrue(n.choices[0].lines.join("").includes("生徒さんが書いた記録は消えません"),
      "★生徒さんの記録が残ることを、その場で言っている");
    assertTrue(n.choices[1].lines.join("").includes("3日以内"), "お返事の期日を言っている");
    assertTrue(n.choices[1].lines.join("").includes("迷っている場合も"),
      "★迷っている人の行き先が、こちらだと分かる");
  }

  console.log("\n=== ★引き継ぎのメール：件名に教室のID ===");
  {
    const brand = await import("data:text/javascript;base64," +
      Buffer.from(fs.readFileSync(path.join(root, "lib/brand.js"), "utf8")).toString("base64"));
    const url = oc.transferMailto({ orgId: "abc-123-def", name: "マイ教室" }, brand.OPERATOR_CONTACT_EMAIL);
    const subject = decodeURIComponent((url.match(/subject=([^&]*)/) || [])[1] || "");
    assertTrue(url.startsWith("mailto:"), "mailto: で開く");
    assertTrue(subject.includes("abc-123-def"),
      "★件名に教室のID。無いと、最初の返信が「どの教室ですか」から始まる");
    assertTrue(url.includes(brand.OPERATOR_CONTACT_EMAIL), "宛先は運営者の連絡先");
    assertTrue(decodeURIComponent(url).includes("教室ID: abc-123-def"), "本文にもIDが入る");
    // ★連絡先は1か所だけに書く
    const ocRaw = readRaw("lib", "orgClosure.js");
    assertTrue(!/@gmail\.com|@woolsong\.app/.test(ocRaw),
      "★アドレスを orgClosure に直書きしていない（lib/brand.js が唯一の正）");
  }

  console.log("\n=== ★退会は、何かを消す前に止まる ===");
  {
    const adRaw = readRaw("lib", "accountDeletion.js");
    const body = adRaw.slice(adRaw.indexOf("export async function purgeAccount"));
    const atClassify = body.indexOf("classifyOwnedOrgs");
    const atSever = body.indexOf("severConnections(admin, userId)");
    const atTables = body.indexOf("for (const table of USER_OWNED_TABLES)");
    assertTrue(atClassify > 0 && atClassify < atSever,
      "★教室の確認が、共有を切るより先");
    assertTrue(atClassify < atTables, "★教室の確認が、表を消すより先");
    assertTrue(/if \(orgs\.blocked\.length > 0\)[\s\S]{0,200}return/.test(body),
      "★止める教室があれば、その場で返す");
    // solo の削除は、created_by を null にするより前
    const atSolo = body.indexOf("closeOrg(admin, orgId)");
    const atNulled = body.indexOf("for (const { table, column } of NULLED_REFERENCES)");
    assertTrue(atSolo > 0 && atSolo < atNulled,
      "★solo の教室を消すのが、created_by を null にするより先");
  }

  console.log("\n=== ★閉じる手段が、実際にある ===");
  {
    assertTrue(fs.existsSync(path.join(root, "app/api/org/close/route.js")),
      "★教室を閉じる API がある（無いと、知らせがただの締め出しになる）");
    const route = readRaw("app/api/org/close", "route.js");
    assertTrue(/listOwnedOrgs/.test(route),
      "★退会の判定と同じ「オーナーとは誰か」で権限を見る");
    assertTrue(/owned\.orgIds\.includes\(orgId\)/.test(route), "他人の教室は閉じられない");
    assertTrue(/status: 403/.test(route), "権限が無ければ 403");
    const vt = readRaw("components", "VocalTracker.jsx");
    assertTrue(/api\/org\/close/.test(vt), "★画面から呼ばれている");
    assertTrue(/setDeleteStatus\("blocked"\)/.test(vt), "409 を受けて、止まった状態にする");
  }

  console.log("\n=== ★責任者（admin）の退会も止める（2026-09-02 の事故） ===");
  {
    // ★実際に起きたこと：+g4t3 は責任者で、教室を作った人でもなかった。
    //   listOwnedOrgs は role='owner' で絞っていたので★0件を返し、
    //   止める対象が無いまま退会が進み、ほかに3人いる教室から
    //   責任者の membership だけが消えました。
    const c = fakeClient({
      memberships: [
        { org_id: "org-1", user_id: ME, role: "admin" },      // ★私は責任者
        { org_id: "org-1", user_id: OTHER, role: "owner" }
      ],
      enrollments: [{ org_id: "org-1", student_id: "stu-1", status: "active" }],
      organizations: [{ id: "org-1", name: "音楽学校A", created_by: OTHER }]
    });
    const r = await oc.classifyOwnedOrgs(c, ME);
    assertTrue(r.blocked.length === 1, "★責任者の退会でも、止める教室が見つかる");
    assertTrue(r.blocked[0].otherCount === 2, "オーナーと生徒の2人が数えられている");
    assertTrue(r.solo.length === 0, "solo には入らない");
  }

  console.log("\n=== ★閉じる権限は、広げていない ===");
  {
    // ★listOwnedOrgs は /api/org/close の権限の判定に使われています。
    //   ここに責任者を足すと、★責任者が教室を消せるようになります。
    //   答えている問いが違うので、同じ関数で兼ねません。
    const c = fakeClient({
      memberships: [{ org_id: "org-1", user_id: ME, role: "admin" }],
      organizations: [{ id: "org-1", name: "音楽学校A", created_by: OTHER }]
    });
    const owned = await oc.listOwnedOrgs(c, ME);
    assertTrue(owned.orgIds.length === 0,
      "★責任者は「閉じてよい教室」を1つも持たない");
    const operated = await oc.listOperatedOrgs(c, ME);
    assertTrue(operated.orgIds.length === 1,
      "★ですが「抜けると困る教室」は持っている");
  }

  console.log("\n=== 作りかけの教室も、放り出さない ===");
  {
    // membership の作成だけ失敗した教室（created_by はある）
    const c = fakeClient({
      memberships: [],
      organizations: [{ id: "org-x", name: "作りかけ", created_by: ME }]
    });
    const r = await oc.listOperatedOrgs(c, ME);
    assertTrue(r.orgIds.includes("org-x"), "★created_by からも拾う");
  }

  console.log("\n=== 教室を閉じても、記録は残る（文言） ===");
  {
    assertTrue(oc.CLOSE_ORG_KEEP_LINE.includes("消えません"), "残ることを言っている");
    assertTrue(oc.CLOSE_ORG_KEEP_LINE.includes("ご本人のもの"), "誰のものかを言っている");
    assertTrue(oc.CLOSE_ORG_DELETE_LINE.includes("教室そのもの"), "消えるもの①");
    assertTrue(oc.CLOSE_ORG_DELETE_LINE.includes("先生と生徒の紐付け"), "消えるもの②");
    assertTrue(oc.CLOSE_ORG_DELETE_LINE.includes("レッスンの予定"), "消えるもの③");
    const vt = readRaw("components", "VocalTracker.jsx");
    assertTrue(/CLOSE_ORG_KEEP_LINE/.test(vt) && /CLOSE_ORG_DELETE_LINE/.test(vt),
      "★画面は文言を lib から読む（直書きしない）");
  }

  console.log("\n=== ★自動の引き継ぎを作っていない（判断C＝却下） ===");
  {
    const ocRaw = readRaw("lib", "orgClosure.js");
    const route = fs.existsSync(path.join(root, "app/api/org/close/route.js"))
      ? readRaw("app/api/org/close", "route.js") : "";
    const code = (ocRaw + route)
      .split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
    assertTrue(!/role:\s*["']owner["']/.test(code.replace(/eq\("role", "owner"\)/g, "")),
      "★誰かを勝手に owner にしていない（承諾なしに契約者にしない）");
  }

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
})();
