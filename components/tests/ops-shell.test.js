#!/usr/bin/env node
// ============================================================================
// 運営モード（第3便・見本⑪）の 見張り
//
//   ★出どころ docs/opus/woolsong-教室機能の正（9月9日・最終稿）.md §3-3・§1-1・§4-7
//
//   ★★いちばん大事な 一文（★§3-3）
//     「★この画面から、★生徒の健康の記録には たどりつけません
//       　（★画面そのものが ありません）」
//
//   ★★確かめること
//     ① 役割ごとの 下タブが §3-3 の 表の とおりであること。
//     ② teacher が 入れないこと。★入口も 出ないこと。
//     ③ お金は owner だけ であること。
//     ④ ★健康側の 画面を 1つも import して いないこと（★§7-7）。
//     ⑤ §4-7 の 一覧だけが パソコン。★運営モード全体は iPhone でも 出ること。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}
function eq(a, b, label) {
  const ja = JSON.stringify(a), jb = JSON.stringify(b);
  t(ja === jb, label + (ja === jb ? "" : `  期待:${jb} 実際:${ja}`));
}

(async () => {
  // ★★別名（@/lib/…）は Next のビルドが 解きます。★ここでは 道を 書き換えます。
  //   ★2026-09-11、★opsShell が opsPerms を 取り寄せるように なりました。
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "opsShell.js"), "utf8")
    .replace(/from "@\/lib\/([a-zA-Z0-9]+)"/g, (mm, n) => `from "${
      "file://" + path.join(__dirname, "..", "..", "lib", n + ".js")}"`);
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const label = (r) => m.tabsFor(r).map((x) => x.label);

  console.log("=== ① ★できことごとの 下タブ（★A2・2026-09-18） ===");
  // ★★★きょうまで、★ここは **役割の 名**で 数えて いました
  //   （`tabsFor("owner")` が 6つ、など）。
  //   ★★A2 で、★役割の 名では 何も 開かなく なりました。
  //     ★★**決めが 変わった** のです。★見張りが まちがって いた のでは ありません。
  //   ★★いまの 決め ──「★できことを 持たない 方には、★1枚も 出さない」。
  // ★★できことの 名は `lib/opsPerms.js` の `TAB_RULES` の とおり です。
  //   ★★見当で 書きません ── ★`home` や `schedule` は **タブの 鍵**で あって、
  //     ★できことの 名では ありません。★2026-09-18、★そこで つまずきました。
  eq(label(["meibo", "sched_all", "gyoji", "renraku_all", "koma"]),
    ["ホーム", "日程", "名簿", "行事", "連絡", "設定"], "★できこと 5つ → 6枚");
  eq(label(["sched_mine"]), ["ホーム", "日程"], "★自分の 日程だけ → 2枚");
  eq(label([]), [], "★できことが 無ければ 0枚");
  eq(m.OPS_TABS.length, 6, "帯は 6つ");

  console.log("\n=== ①' ★★役割の 名では、★何も 開かない（★較正） ===");
  // ★★これが この 直しの 肝 です。★わざと 役割の 名を 渡します。
  //   ★★1枚でも 出れば、★落ち道が 残って います。
  ["owner", "admin", "staff", "teacher", "しらない役割"].forEach((r) => {
    eq(label(r), [], "★" + r + " の 名では 0枚");
  });

  console.log("\n=== ② 入れるか ===");
  eq(m.mayEnterOps(["meibo"]), true, "★できことが あれば 入れる");
  eq(m.mayEnterOps([]), false, "★できことが 無ければ 入れない");
  eq(m.mayEnterOps(null), false, "★役職が 無ければ 入れない（★null）");
  eq(m.mayEnterOps("owner"), false, "★★owner の 名では 入れない（★較正）");
  eq(m.maySeeMoney(["bill"]), true, "★bill が あれば お金を 見られる");
  eq(m.maySeeMoney("owner"), false, "★★owner の 名では 見られない（★較正）");
  eq(m.mayEditRoster(["meibo"]), true, "★meibo が あれば 名簿を 直せる");
  eq(m.mayEditRoster("admin"), false, "★★admin の 名では 直せない（★較正）");

  console.log("\n=== ③ お金は『ご請求を 見る』だけ（★A2 の あと） ===");
  // ★★きょうまで「owner だけ」でした。★A2 で、★名前では 開かなく なりました。
  //   ★★守りたい ことは 同じ です ── ★お金は いちばん 重い ところ。
  //     ★★変わったのは「★誰が それを 持つか」の 決め方 だけ です。
  eq(m.maySeeMoney(["bill"]), true, "★bill を 持つ 方は 見られる");
  eq(m.maySeeMoney(["meibo"]), false, "★名簿だけ の 方は 見られない");
  eq(m.maySeeMoney([]), false, "★できことが 無ければ 見られない");
  eq(m.maySeeMoney("owner"), false, "★★owner の 名では 見られない（★較正）");
  eq(m.maySeeMoney("teacher"), false, "teacher も 見られない");

  console.log("\n=== ④ ★健康側の 画面を 持たない（★§3-3・§7-7） ===");
  const ui = readCode("components", "OpsShell.jsx");
  const imports = (ui.match(/^import[\s\S]*?from "[^"]+";/gm) || []).join("\n");
  m.NEVER_IN_OPS.forEach((name) => {
    t(!new RegExp(`\\b${name}\\b`).test(imports), `★${name} を import して いない`);
  });
  // ★★記録そのものへも たどりつけないこと
  ["entries", "throatCondition", "voiceQuality", "sleepHours", "throat_symptoms"].forEach((w) => {
    t(!ui.includes(w), `★「${w}」に 触れていない`);
  });
  t(!/supabase|createClient/.test(ui), "★この画面じしんが データベースを 引かない");

  console.log("\n=== ⑤ §4-7 は 撤回。★残るのは「うごかす」だけ ===");
  // ★★2026-09-09・Opus の裁定。★見ることは iPhone でも できます。
  t(typeof m.mayShowWideTable === "undefined", "★「一覧はパソコンだけ」の判定は、もう無い");
  eq(m.mayDragBlocks(390), false, "★iPhone では コマを 動かせない");
  eq(m.mayDragBlocks(834), false, "★iPad も 見るだけ（★見本⑧）");
  eq(m.mayDragBlocks(1024), true, "パソコンなら 動かせる");
  eq(m.mayDragBlocks(null), false, "★はばが 分からないうちは 動かせない");
  eq(m.DRAG_NOTE, "コマの入れ替えは、パソコンでできます。", "★1行だけの 断り");
  t(!/ご利用いただけません|使えません|対応していません/.test(m.DRAG_NOTE),
    "★責める言葉に なっていない");
  // ★★シェルは、★もう はばを 見ないこと
  t(!/useWidth|innerWidth/.test(readCode("components", "OpsShell.jsx")),
    "★シェルは はばを 見ない（★見せ方は 日程の画面が 決める）");

  console.log("\n=== ★運営モード全体は、iPhone でも 出る ===");
  // ★★2026-09-09 の お決め。★はばで シェルごと 止めていないこと。
  t(!/mayShowWideTable\(width\)\s*\)\s*return null/.test(ui),
    "★はばで シェルごと 止めていない");
  t(!/innerWidth\s*<\s*\d+[\s\S]{0,40}return null/.test(ui), "★はばで 早く 返していない");
  {
    // ★★早く 返す 行を、★1つずつ 見ます。
    //   ★はじめ「最初の return ( まで」で 切りましたが、
    //   ★useWidth の「return () => …」に 当たって いました。
    //   ★★境目を 探して 切らない。★行で 見ます。
    const early = ui.split("\n").filter((l) => /return null;/.test(l));
    t(early.length > 0, `★早く 返す 行が ある（${early.length}行）`);
    t(early.every((l) => /tabs\.length === 0/.test(l)),
      "★止めるのは 役割だけ（★はばでは ない）：" + early.map((l) => l.trim()).join(" / "));
  }
  t(/env\(safe-area-inset-bottom\)/.test(readRaw("components", "OpsShell.jsx")),
    "★iPhone の 下の 余白を よけている");

  console.log("\n=== 呼ぶ側（★入口と、別のシェル） ===");
  {
    const vt = readCode("components", "VocalTracker.jsx");
    // ★★入口は、★入れる役割にだけ
    t(/myOrgs\.filter\(\(mm\) => mayEnterOps\(mm\.role\)\)/.test(vt),
      "★入口は、入れる役割にだけ 出る");
    // ★★別のシェルであること（★個人のアプリと 重ねない）
    // ★★2026-09-11、★文字数の 窓（400）で 数えていました。
    //   ★注記を 足したら 窓から あふれて 落ちました。★数え方が もろい。
    //   ★★見張るのは「順番」です。★文字数では ありません。
    //     ★opsOrgId の 判じ → OpsShell を 返す → その あとに 個人の 画面。
    {
      const at = vt.indexOf("if (opsOrgId) {");
      const shellAt = vt.indexOf("<OpsShell", at);
      const opsRet = vt.indexOf("return (", at);
      t(at > 0 && shellAt > at && opsRet > at && opsRet < shellAt,
        "★運営モードは、個人のアプリより 前に 返す（★重ねない）");
      // ★★その あいだに、個人の 画面を 描いていない こと。
      t(!/<HomeV2|<RecordV2Head|<LookBackV2/.test(vt.slice(at, shellAt)),
        "★返すまでに 個人の 画面を 描いていない");
    }
    // ★★★2026-09-18（★A2）、★受け皿（`|| role`）を 外しました。
    //   ★★きょうまで、★役職が 無ければ 役割の 名に 戻して いました。
    //   ★★台帳に 尋ねた 結果、★落ちて いたのは 3人、★どれも 試しの 口 でした。
    t(/mayEnterOps\((role|gate)\)/.test(vt), "★入れるかを 確かめてから 描く");
    t(/const gate = permsOfMember\([^)]*\);/.test(vt),
      "★できこと だけ を 渡して いる");
    t(!/permsOfMember\([^)]*\) \|\| role/.test(vt),
      "★★受け皿（`|| role`）が 残って いない");
    // ★★もどれること
    t(/onBack=\{\(\) => setOpsOrgId\(null\)\}/.test(vt), "★もどると、個人のアプリへ 帰る");
    // ★★役割を 画面で 決めていないこと
    t(!/role === "owner" \|\| role === "admin"/.test(readCode("components", "OpsShell.jsx")),
      "★役割の 判定を 画面に 書いていない（★決めは lib 1か所）");
  }

  console.log("\n=== もどる道（★§3-3） ===");
  t(/もどる/.test(readRaw("components", "OpsShell.jsx")), "★左上に「もどる」が ある");
  t(/onBack/.test(ui), "★呼ぶ側へ 帰れる");

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
