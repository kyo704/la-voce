// ============================================================================
// おうちの 置き場所 9か所（★見本 J02 ／ Opus の 裁定）── 見張り
//
//   ★出どころ docs/opus/裁定-羊のおうち J02・J03（9月10日）.md
//            docs/reports/2026-09-11-家具27点の仕分け.md
//
//   ★★見張るのは 5つ。
//     ① 名まえが、裁定の とおり（★「たな」では なく「とだな」）
//     ② 1か所につき 最低2点（★裁定 §2-2）
//     ③ 行き先の 無い 品が、★思っている ものだけ
//     ④ 動かせない ものと 動かせる ものが、混ざっていない
//     ⑤ 1点も 取り上げていない（★裁定 §4 ⑤）
// ============================================================================

const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) console.log("  ok  " + label);
  else { console.log("  NG  " + label); failed++; }
}

(async () => {
  const src = readRaw("lib", "roomSlots.js")
    .replace(/import \{ INTERIOR_ITEMS \}[^\n]*\n/, "const INTERIOR_ITEMS = [];\n");
  const R = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const items = require("../../docs/assets/sheep-interior-index.json").items;

  console.log("① 名まえ（★裁定 §1-1・§3-2）");
  ok(R.SLOTS.length === 9, "★9か所（いまは " + R.SLOTS.length + "）");
  ok(R.SLOTS.map((s) => s.label).join("／")
    === "まど／かべ（左）／かべ（右）／とだな／いす／つくえ／ゆか／とびら／てんじょう",
    "★裁定の 名まえと 同じ・同じ 順");
  // ★★これが 根です。★J04 の「たな」と 重なっていた 言葉です。
  ok(!R.SLOTS.some((s) => s.label === "たな"), "★「たな」を 置き場所に 使っていない");
  ok(R.SLOTS.some((s) => s.label === "とだな"), "★「とだな」に なっている");

  console.log("② 1か所につき 最低2点（★裁定 §2-2）");
  ok(R.MIN_PER_SLOT === 2, "★下限は 2点");
  // ★★2026-09-11、★slotCounts() を 消しました。
  //   ★出どころ 「9月10日・回答-とだなの数字はどこか §3」＋ 坂本さんの お決め。
  //   ★★あの 数は どの 画面にも 出ていませんでした。★進捗バーの 一種です。
  //   ★★見張りは 残します。★ここで 数えます。
  //     ★試験が 自分で 数えるのは、★出す ためでは ないので かまいません。
  const counts = R.SLOTS.map((s2) => ({
    label: s2.label, count: R.itemsForSlot(s2.key, items).length }));
  counts.forEach((c) => {
    ok(c.count >= R.MIN_PER_SLOT, `★${c.label} が ${c.count}点（2点以上）`);
  });
  ok(counts.every((c) => c.count >= 2), "★どこも 空に ならない");
  // ★★数える 関数を、★lib に 残していない こと。
  ok(typeof R.slotCounts === "undefined", "★slotCounts を 消した");
  ok(!readCode("lib", "roomSlots.js").includes("enough"), "★「足りている」の 判じも 消した");

  console.log("③ 行き先の 無い 品");
  const orphan = items.filter((i) => R.slotOfItem(i) === null);
  const byCat = {};
  orphan.forEach((i) => { byCat[i.category] = (byCat[i.category] || 0) + 1; });
  // ★★庭14点は、部屋では なく 外です。★別の 場面です。
  //   ★★かべ紙・床材138点は、★敷くもので、★置くもの では ありません。
  //   ★★縁側1点（showa_19）は、★Opus に お尋ね中です（★2026-09-11）。
  ok(byCat.garden === 14, "★庭14点は 部屋の 外（★別の 場面）");
  ok(byCat.tile === 138, "★かべ紙・床材138点は 別の 層");
  ok(byCat.showa === 1 && orphan.some((i) => i.key === "showa_19"),
    "★行き先 未定は 縁側1点だけ（★お尋ね中）");
  ok(Object.keys(byCat).sort().join(",") === "garden,showa,tile",
    "★思っていない ものが 落ちていない（" + JSON.stringify(byCat) + "）");

  console.log("④ 動かせない ものと、動かせる もの");
  // ★★まど・とびらは「部屋の 形そのもの」です（★裁定 §3-2）。
  const fixed = R.SLOTS.filter((s) => s.fixed).map((s) => s.key).sort();
  ok(fixed.join(",") === "door,window", "★動かせないのは まど と とびら の 2つ");
  ok(!R.SLOTS.some((s) => s.fixed && !["door", "window"].includes(s.key)),
    "★家具を、動かせない 側に 入れていない");

  console.log("⑤ 見本から 取った 数と、そうでない 数を、言い分けている");
  // ★★見本に 無い ものを、★見本から 取ったように 書かないこと。
  const notFromMockup = R.SLOTS.filter((s) => s.fromMockup === false).map((s) => s.key).sort();
  ok(notFromMockup.join(",") === "ceiling,door",
    "★とびらと てんじょうは、見本に 無いと 断ってある");
  const raw = readRaw("lib", "roomSlots.js");
  ok(/まだ 描いていない/.test(raw), "★「無い」ではなく「まだ 描いていない」と 書いてある");

  console.log("⑥ 1点も 取り上げていない（★裁定 §4 ⑤）");
  // ★★置き場所に 行けない 品が あっても、★持ち物からは 消しません。
  const code = readCode("lib", "roomSlots.js");
  ok(!/\.delete\(|character_inventory|item_acquisitions/.test(code),
    "★持ち物・台帳に 触れていない");
  // ★★品の 鍵で 書いていること。★名まえで 当てると、言葉を 直したときに 外れます。
  ok(!/name ===|\.name\)/.test(code), "★名まえで 当てていない（★鍵で 書いている）");

  console.log("⑦ 座標は 消していない");
  const vt = readCode("components", "VocalTracker.jsx");
  ok(/Positions/.test(vt), "★書いてある 座標の 欄が、まだ ある");

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
