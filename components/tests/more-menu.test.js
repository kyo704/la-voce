// ============================================================================
// A10「もっと」の 見張り（★2026-09-11）
//
//   ★出どころ docs/design/pack-final/screens/A10-歯車もっと.html（★HTML が 正）
//            坂本さんの お決め（2026-09-11）
//
//   ★★確かめること
//     ① 題が「もっと」で あること。★規約が この語で 書かれています。
//     ② シートに していないこと（★1画面の まま）。
//     ③ まだ 置かない 行が、★置かれていないこと。
//        ★「毎日、聞いてほしいこと」… ★調べて ご報告してから（★2026-09-11 置きました）。
//        ★★「同意を とりけす」… ★2026-09-15、★**置きました**。
//          ★★前は「押した先が まだ ありません」が わけ でした。
//            ★★いまは あります（`activeTab === "withdrawConsent"`）。
//            ★★わけが 無くなったので、★見張りを **裏返し** ます。
//          ★★消しません。★裏返して 残します。
//            ★消すと、★なぜ 置いたのかが 分からなく なります。
//     ④ 中身を 1つも 消していないこと（★隠すだけ）。
//     ⑤ 門の外（38人）は、★これまでどおり ぜんぶ 縦に 並ぶこと。
//     ⑥ 出口が あること（★戻る 道）。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) { console.log("  ok  " + label); }
  else { console.log("  NG  " + label); failed++; }
}

(async () => {
  const ROOT = path.join(__dirname, "..", "..");
  const src = fs.readFileSync(path.join(ROOT, "lib", "moreMenu.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const { MORE_ROWS, moreSections, mayShowMoreRow, rightOf } = m;
  const v = readRaw("components", "VocalTracker.jsx");
  const vCode = readCode("components", "VocalTracker.jsx");

  console.log("① 題は「もっと」");
  ok(/<ScreenHead title="もっと"/.test(v), "★題が「もっと」");
  // ★★規約が この語で 書かれています。★変えると 規約の ほうが 間違いに なります。
  ok(/もっと ＞ 設定/.test(vCode), "★規約の 案内が「もっと ＞ 設定」の まま");
  ok(MORE_ROWS.some((r) => r.label === "設定"), "★「設定」の 行が ある");

  console.log("② シートに していない");
  // ★★見本は 下から出る シートですが、★1画面の ままに する お決めです。
  //   ★同意の 撤回と 退会が、★重なりの 中に 埋もれないためです。
  const at = v.indexOf('activeTab === "more" && (');
  let i = v.lastIndexOf("{", at), d = 0, end = -1;
  for (; i < v.length; i++) {
    if (v[i] === "{") d++;
    else if (v[i] === "}") { d--; if (d === 0) { end = i; break; } }
  }
  const more = v.slice(at, end + 1);
  ok(!/sheetmod|position: "fixed"[\s\S]{0,120}bottom: 0/.test(more), "★下から出る シートに していない");

  console.log("③ 置く 行・置かない 行");
  // ★★2026-09-15、★裏返しました（★坂本さんの お決め）。
  //   ★★前は「置いて いないこと」を 見て いました。
  //     ★わけは「★押した先が まだ ありません」。
  //   ★★いまは あります。★だから「★置いて あること」を 見ます。
  //   ★★きっかけは、★もっとに この 注記を 足した ことです ──
  //     「★法律の 行き先を、この 1か所に 集めています。」
  //     ★★約束を 書いた のに、★行き先は 3段 奥 の ままでした。
  ok(MORE_ROWS.some((r) => r.label === "同意を とりけす"),
    "★「同意を とりけす」の 行が ある（★2026-09-15 置きました）");
  ok(/activeTab === "withdrawConsent"/.test(v),
    "★★押した先の 画面が ある（★これが 無い あいだは 置きません でした）");
  // ★★2026-09-11、★調べ終わったので 置きました。
  ok(MORE_ROWS.some((r) => /聞いてほしい/.test(r.label)),
    "★「毎日、聞いてほしいこと」は 置いた（★調べ終わりました）");
  ok(MORE_ROWS.some((r) => r.right === "5つまで"), "★右に「5つまで」が 出る");
  // ★★置かない 理由が、★どこかに 書いてあること。★黙って 落とさないため。
  ok(/押せない 行を 置くのは/.test(src), "★置かない 理由が 書いてある");

  console.log("④ 中身を 1つも 消していない");
  // ★★display で 隠すだけです。★枠を 動かしていません。
  ok(/return moreSection === section \? undefined : "none";/.test(v),
    "★隠すだけ（★消さない・動かさない）");
  {
    const at = v.indexOf('activeTab === "more" && (');
    let i = v.lastIndexOf("{", at), d = 0, end = -1;
    for (; i < v.length; i++) {
      if (v[i] === "{") d++;
      else if (v[i] === "}") { d--; if (d === 0) { end = i; break; } }
    }
    const block = v.slice(at, end + 1);
    const cards = (block.match(/className="rounded-2xl p-[45] border"/g) || []).length;
    const tagged = (block.match(/display: inMore\("/g) || []).length;
    ok(cards > 0, "★「もっと」に 枠が ある（" + cards + "）");
    // ★★数を 書きません。★枠が 増えるたびに 落ちます。
    //   ★「ぜんぶに 印が ついている」ことだけを 見ます。
    ok(tagged >= cards, "★枠 ぜんぶに 印が ついている（★枠 " + cards + " ／ 印 " + tagged + "）");
  }
  // ★★書きかけも 残ります。★display なので、★中の 状態が 消えません。
  ok(!/moreSection === section && </.test(v), "★条件で 外していない（★状態が 消えない）");

  console.log("⑤ 門の外（38人）は これまでどおり");
  ok(/if \(!layoutV2\) return undefined;/.test(v), "★門の外では、★出し分けを しない");
  ok(/layoutV2 && moreSection === null \?/.test(v), "★一覧は 門の中だけ");

  console.log("⑥ 出口が ある");
  // ★★2026-09-16、★条件が 1つ 増えました ── `&& !attendingOrgId`。
  //   ★★通っている ところの **中身**を 開くと、★その 1枚が 自分の 戻る 道を 持ちます。
  //     ★★パンくずも 出て いると、★戻る 道が **2つ** 並びます。
  //     ★★撮って、★はじめて 見えました。★どちらを 押すか 迷います。
  //   ★★だから「奥を 開いて いない ときは 出る」に なりました。
  //   ★★2026-09-16、★もう 1つ 増えました ── `&& moreSection !== "合言葉で入る"`。
  //     ★★合言葉の 1枚も、★自分の 戻る 道（「‹ 通っている ところ」）を 持ちます。
  //     ★★「もっと ／ 合言葉で入る」と 2つ 並ぶと、★帰り先が 2つに なります。
  //   ★★★2026-09-26、★形が 変わりました（★坂本さんの お決め・DECISION_1）──
  //     ★★見本に パンくずは ありません。
  //     ★★こちらが 作った 新しい 画面は、★見本の とおり **自分の 戻る 札**を 持ちます。
  //       ★★パンくずも 出て いると、★また 2つ 並びます（★上の 2件と 同じ 形）。
  //     ★★★だから 名を 並べるのを やめ、★`lib/moreCrumb.js` が 1つで 決めます。
  //       ★★どの 画面が 自分の 札を 持つ かは `components/tests/more-crumb.test.js` が
  //         ★実際の 部品と 突き合わせて 数えます（★覚えません）。
  ok(/layoutV2 && showCrumb\(moreSection\) && !attendingOrgId \?/.test(v),
    "★戻る 道は 1つ（★`lib/moreCrumb.js` が 決める）");
  ok(/from "@\/lib\/moreCrumb"/.test(v), "★決めを `lib/moreCrumb.js` から 受け取って いる");
  // ★★★「無いこと」は `vCode`（注記を 外した 本文）で 数えます ──
  //   ★★上の 註が その 名を 引用して います。★生の 本文だと 自分の 註で 落ちます。
  ok(!/moreSection !== "合言葉で入る"/.test(vCode), "★画面の 紙に 名を 並べて いない");
  ok(/setMoreSection\(null\)/.test(v), "★押すと 一覧へ 戻る");

  console.log("⑦ 教室の 行は、★入れる方だけ");
  ok(mayShowMoreRow("運営", { hasOrgRole: true }) === true, "★役職が あれば 出る");
  ok(mayShowMoreRow("運営", { hasOrgRole: false }) === false, "★無ければ 出ない");
  ok(mayShowMoreRow("設定", {}) === true, "★ほかの 行は いつも 出る");
  const secs = moreSections({ hasOrgRole: false });
  ok(!secs.some((x) => x.group === "教室"), "★役職が 無ければ、★小見出しごと 出ない");

  console.log("⑧ ★2026-09-24 に 足した 2行");
  // ★★授業の 時間を 出す …… ★学校と つながって いる 方 だけ（★裁定183 P2）
  ok(mayShowMoreRow("授業の時間", { isEnrolled: true }) === true, "★在籍して いれば 出る");
  ok(mayShowMoreRow("授業の時間", { isEnrolled: false }) === false, "★して いなければ 出ない");
  ok(mayShowMoreRow("授業の時間", {}) === false, "★★分からない ときは 出さない");
  // ★★担当の 先生を 選ぶ …… ★学校が そう して いる ときだけ（★裁定186）
  ok(mayShowMoreRow("担当の先生", { canPickTeacher: true }) === true, "★学校が そう して いれば 出る");
  ok(mayShowMoreRow("担当の先生", { canPickTeacher: false }) === false, "★して いなければ 出ない");
  ok(mayShowMoreRow("担当の先生", {}) === false, "★★分からない ときは 出さない");
  // ★★★この 2行を「いつも 出る」に して しまわない こと
  const 何も = moreSections({ hasOrgRole: true });
  const 行 = 何も.flatMap((x) => x.rows.map((r) => r.key));
  ok(!行.includes("授業の時間"), "★★条件を 渡さなければ、★授業の 時間は 出ない");
  ok(!行.includes("担当の先生"), "★★条件を 渡さなければ、★担当の 先生は 出ない");

  // -------------------------------------------------------------------------
  // ★⑨ 2026-09-24 ── ★見本 `SC['もっと']` と 読みくらべて（★段3a A群）
  // -------------------------------------------------------------------------
  console.log("⑨ ★あなたの ページ（★裁定129 P1・裁定131）");
  {
    const 行 = MORE_ROWS.find((r) => r.key === "経歴");
    ok(行.label === "あなたの ページ", "★名が 見本の とおり");
    ok((行.group || null) === null, "★もっとの 直下（★じぶんの記録の 中では ない）");
    // ★★下の 字は、★在る もの だけ。★「紙」も「公開」も まだ です。
    ok(!/紙|公開/.test(行.sub || ""), "★無い ものを 下に 書いて いない");
    ok(rightOf(行, { portfolioCount: 13 }) === "13件 ›", "★書いた 数が 出る");
    ok(rightOf(行, { portfolioCount: 0 }) === "›", "★0は 数で 言わない");
    ok(rightOf(行, {}) === "›", "★渡されなければ 矢印だけ");
  }

  console.log("⑩ ★授業の 時間の 下の 字 ── ★約束 です");
  {
    const 行 = MORE_ROWS.find((r) => r.key === "授業の時間");
    ok(行.sub === "学校には 「授業」と だけ", "★見本の 字");
    // ★★★書いた 以上、★そう なって いる こと。
    const ls = readCode("lib", "lessonRound.js");
    const i = ls.indexOf("export function isClassSlot");
    const 本 = ls.slice(i, i + 420);
    ok(/return timetable\.some/.test(本) && !/name|title|subject/.test(本),
      "★授業の 名前を 返して いない");
    const ts = readCode("lib", "timetableShare.js");
    ok(/科目の 名前・教室・先生の 名前は 出ません/.test(ts), "★行き先にも 書いて ある");
  }

  console.log("⑪ ★下の 字は lib が 持つ");
  {
    const vt2 = readCode("components", "VocalTracker.jsx");
    ok(/\{r\.sub\}/.test(vt2), "★画面が 下の 字を 出して いる");
    ok(!/学校には 「授業」と だけ/.test(vt2), "★画面に 字を 書いて いない");
  }

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
