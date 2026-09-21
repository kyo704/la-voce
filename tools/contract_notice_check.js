#!/usr/bin/env node
// ============================================================================
// ★契約者の 知らせ ── ★試しの 台帳の 行で、★出る／出ない を 確かめます
//   （★裁定 その116 の 直し・2026-09-21）
//
//   ★★★退会の 画面を 自動で 押しません。
//     ★★あの 画面の 先は「消す」です。★取り違えると 消えます。
//     ★★決める ところ（`lib/orgClosure.js` の `classifyOwnedOrgs`）を 呼びます。
//
//   ★★★行は **試しの 台帳から** 引きます（`tools/ask_ledger.py`）。★作りません。
//     ★★運ぶ ところ だけ 差し替えます。★判じる ところは 本物 です。
//   ★★★なぜ 運ぶ ところを 差し替えるか ──
//     ★★本物の 道（`app/api/account/delete/route.js:199`）は
//       ★**管理の 鍵**（service role）で 呼びます。★渡しの 決まりを 受けません。
//     ★★手元に その 鍵が ありません。★みなの 鍵（anon）で 呼ぶと、
//       ★★よその 行が 隠れ、★「運営できる 方が 0人」に 見え、
//       ★★いつも `blocked` に なります。★はじめ そう 呼び、
//       ★★止まった 先を「直した 行」と 読み違えました。
// ============================================================================
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const ORG = "11111111-1111-4111-8111-111111111111";
const TARO = "eafa63c2-4592-4996-8c7c-18ecbec5a34f";

/** ★台帳に 尋ねます（★読むだけ）。 */
function 尋ねる(sql) {
  const out = execFileSync("python3",
    [path.join(ROOT, "tools/ask_ledger.py"), "--test", "--raw", sql],
    { encoding: "utf8" });
  const 行 = [];
  let いま = null;
  out.split("\n").forEach((l) => {
    if (l.startsWith("── ")) { if (いま) 行.push(いま); いま = {}; return; }
    if (いま && l.includes(": ")) {
      const i = l.indexOf(": ");
      いま[l.slice(0, i).trim()] = l.slice(i + 2);
    }
  });
  if (いま) 行.push(いま);
  return 行;
}

/** ★運ぶ ところ だけ の 代わり。★行は 本物 です。 */
function 客(tables) {
  return {
    from(table) {
      let rows = (tables[table] || []).slice();
      const q = {
        select() { return q; },
        eq(c, v) { rows = rows.filter((r) => String(r[c]) === String(v)); return q; },
        in(c, vs) { rows = rows.filter((r) => vs.map(String).includes(String(r[c]))); return q; },
        maybeSingle() { return Promise.resolve({ data: rows[0] || null, error: null }); },
        then(res) { return Promise.resolve({ data: rows, error: null }).then(res); }
      };
      return q;
    }
  };
}

(async () => {
  const src = fs.readFileSync(path.join(ROOT, "lib/orgClosure.js"), "utf8")
    .replace(/from "(\.\/[^"]+?)(\.js)?"/g, (m, 名) => {
      const 先 = path.join(ROOT, "lib", 名.replace("./", "") + ".js");
      if (!fs.existsSync(先)) return m;
      return 'from "data:text/javascript;base64,'
        + Buffer.from(fs.readFileSync(先, "utf8")).toString("base64") + '"';
    });
  const oc = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  const memberships = 尋ねる("select org_id, user_id, role from memberships");
  const enrollments = 尋ねる("select org_id, student_id, status from enrollments");
  const organizations = 尋ねる(
    "select id, name, created_by, contract_owner_user_id from organizations");
  const 契約者 = (organizations.find((o) => o.id === ORG) || {}).contract_owner_user_id;

  console.log("★台帳から 引きました …… memberships " + memberships.length
    + " ／ enrollments " + enrollments.length + " ／ organizations " + organizations.length);
  console.log("★役割 …… " + memberships.filter((m) => m.org_id === ORG)
    .map((m) => m.role).sort().join(" / "));
  console.log("★契約者 …… " + 契約者 + (契約者 === TARO ? "（たろう）" : "（たろう では ない）"));

  const r = await oc.classifyOwnedOrgs(客({ memberships, enrollments, organizations }), TARO);
  const 止 = (r.blocked || []).length > 0;
  const 出 = (r.payer || []).length > 0;
  console.log("  blocked …… " + ((r.blocked || []).map((x) => x.name).join(", ") || "（なし）"));
  console.log("  payer   …… " + ((r.payer || []).map((x) => x.name).join(", ") || "（なし）"));
  if (止) {
    console.log("  ★★手前の `blocked` で 止まりました。★契約者の 行を 通って いません。");
  }
  const 通った = !止;
  const 正しい = 通った && (出 === (契約者 === TARO));
  console.log((正しい ? "\n  ○ " : "\n  ✗ ") + "知らせは "
    + (出 ? "出ました" : "出ません でした")
    + " ── ★たろうは " + (契約者 === TARO ? "契約者 です" : "契約者では ありません")
    + (通った ? "" : "（★枝を 通って いません）"));
  process.exit(正しい ? 0 : 1);
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
