#!/usr/bin/env node
/**
 * 羊の着せかえ ── ★決めごとの見張り（2026-09-05 夜・Stage 1）
 *
 *   出どころ docs/assets/羊-着せかえ一式-読んでください（決定版11・217点）.md
 *            docs/lavoce-作業指示-羊StageAとアイテム.md（D・禁止事項）
 *
 *   実行  node components/tests/sheep-wardrobe.test.js
 */

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");

let pass = 0;
let fail = 0;
function ok(label, cond) {
  if (cond) { pass += 1; console.log("  ✓ " + label); }
  else { fail += 1; console.log("  ✗ " + label); }
}

(async () => {
  const b64 = Buffer.from(fs.readFileSync(path.join(ROOT, "lib", "sheepWardrobe.js"))).toString("base64");
  const m = await import("data:text/javascript;base64," + b64);
  const idx = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "assets", "sheep-items-index.json"), "utf-8"));
  const keys = new Set(idx.items.map((i) => i.key));

  console.log("\n① ★★絵が、全部そろっていること");
  ok(`★品数が 217（いま ${idx.items.length}）`, idx.items.length === 217);
  const missing = idx.items.filter((i) => {
    const files = i.files ? Object.values(i.files) : [i.file];
    return files.some((f) => !fs.existsSync(path.join(ROOT, "public", "sheep", f)));
  });
  ok(`★指している絵が、全部ある${missing.length ? "（★" + missing.slice(0, 3).map((x) => x.key).join(" ") + "）" : ""}`,
    missing.length === 0);
  ok("★土台の2枚がある",
    fs.existsSync(path.join(ROOT, "public", "sheep", idx.base.body))
      && fs.existsSync(path.join(ROOT, "public", "sheep", idx.base.head)));

  console.log("\n② ★重ね順を、変えないこと");
  // ★★頭より前に服を描くと、★首が消えます。
  ok("★index と、決めの重ね順が同じ",
    JSON.stringify(m.LAYER_ORDER) === JSON.stringify(idx.order));
  ok("★服は、頭より前", m.LAYER_ORDER.indexOf("garment") < m.LAYER_ORDER.indexOf("head"));
  ok("★帽子は、頭より後ろ", m.LAYER_ORDER.indexOf("hat") > m.LAYER_ORDER.indexOf("head"));
  ok("★持ち物が、いちばん上", m.LAYER_ORDER[m.LAYER_ORDER.length - 1] === "prop");

  console.log("\n③ ★★まだ、誰にも出さないこと");
  // ★門（freeTier）とは、逆に倒します。★あちらは「止めない側」が安全。
  //   ★こちらは「出さない側」が安全です。
  ok("★公開の印が、切ってある", m.WARDROBE_PUBLIC === false);
  ok("★★一覧が空なら、誰にも出さない", m.mayUseWardrobe("who", {}) === false);
  ok("★渡し忘れても、出さない", m.mayUseWardrobe("who", null) === false);
  ok("★一覧に居る方には、出す",
    m.mayUseWardrobe("me", { NEXT_PUBLIC_WARDROBE_USER_IDS: "me" }) === true);
  ok("★一覧に居ない方には、出さない",
    m.mayUseWardrobe("you", { NEXT_PUBLIC_WARDROBE_USER_IDS: "me" }) === false);

  console.log("\n④ ★季節（★入手の期限にしないこと）");
  ok("★9月は、秋", m.currentSeason("2026-09-05") === "autumn");
  ok("★3月は、春", m.currentSeason("2026-03-01") === "spring");
  ok("★7月は、夏", m.currentSeason("2026-07-15") === "summer");
  ok("★1月は、冬", m.currentSeason("2026-01-10") === "winter");
  ok("★読めない日付でも、落ちない", m.SEASONS.includes(m.currentSeason("こわれた")));
  const 秋服 = idx.items.find((i) => i.key === "coatAutumnCamel");
  const 春服 = idx.items.find((i) => i.key === "coatSpringCardigan");
  ok("★秋の服は、9月に店に並ぶ", m.inShopNow(秋服, "2026-09-05") === true);
  ok("★春の服は、9月には並ばない", m.inShopNow(春服, "2026-09-05") === false);
  // ★★持っている方からは、取り上げないこと。
  ok("★★持っていれば、季節に関わらず着られる",
    m.mayWear(春服, ["coatSpringCardigan"]) === true);
  ok("★持っていなければ、着られない", m.mayWear(春服, []) === false);
  // ★季節でないものは、いつでも並ぶこと。
  ok("★季節でないものは、いつでも並ぶ",
    m.inShopNow(idx.items.find((i) => i.group === "opera"), "2026-09-05") === true);

  console.log("\n⑤ ★★達成で開く品物が、実在すること");
  // ★2026-09-05、私は鍵の名前を作ってしまいました。★確かめが止めました。
  const unlockKeys = Object.values(m.UNLOCKS).flat();
  const bad = unlockKeys.filter((k) => !keys.has(k));
  ok(`★全部、実在する${bad.length ? "（★" + bad.join(" ") + "）" : ""}`, bad.length === 0);
  ok("★5つの鍵が、全部ある", Object.keys(m.UNLOCKS).length === 5);
  ok("★達成で開くものは、そう分かる", m.isUnlockItem("propBouquet") === true);
  ok("★ふつうの品物は、そうでない", m.isUnlockItem("hatStraw") === false);
  ok("★開いた鍵から、品物が出る",
    m.unlockedItemKeys({ firstPerformance: true }).includes("propBouquet"));
  ok("★開いていなければ、出ない", m.unlockedItemKeys({}).length === 0);

  console.log("\n⑥ ★禁止事項（★作業指示 D）");
  const src = readCode("lib", "sheepWardrobe.js");
  // ✕ ポイントを、体調に連動させない
  ok("★体調を見ていない", !/throat|condition|score|体調/.test(src));
  // ✕ 連続が途切れたら、しおれる・減る・催促する
  ok("★連続を見ていない", !/streak|consecutive|連続/.test(src));
  // ✕ professions を、買える／買えないに使わない
  ok("★職業で、買えなくしていない", !/profession/.test(src));
  // ✕ season を、入手の期限に使わない
  ok("★持っているものを、季節で取り上げていない",
    /mayWear[\s\S]{0,200}owned/.test(src) && !/mayWear[\s\S]{0,200}season/.test(src));
  // ✕ WebGL / Three.js
  ok("★WebGL を入れていない", !/three|webgl|canvas3d/i.test(src));

  console.log("\n⑦ ★並び順（★B-2）");
  const sorted = m.sortForShop(idx.items, { todayISO: "2026-09-05", unlockedFlags: { firstPerformance: true } });
  ok("★いまの季節のものが、いちばん前", m.seasonOfItem(sorted[0]) === "autumn");
  ok("★数が減っていない", sorted.length === idx.items.length);

  console.log("\n⑧ ★画面につながっていること（2026-09-05 夜）");
  const vt = readCode("components", "VocalTracker.jsx");
  ok("★出す・出さないを、lib に聞いている", /mayUseWardrobe\(userId/.test(vt));
  ok("★環境変数を渡している", /NEXT_PUBLIC_WARDROBE_USER_IDS/.test(vt));
  // ★★いまの SVG の羊を、触っていないこと。
  //   ★別の鍵（wardrobe）に入れます。★戻すのも簡単です。
  ok("★別の鍵に入れている", /character_equipped[\s\S]{0,200}wardrobe|wardrobe: next/.test(vt));
  ok("★いまの羊の鍵（hat/outfit/accessory）を消していない",
    !/delete characterEquipped\.(hat|outfit|accessory)/.test(vt));
  // ★解放の判定を、作り直していないこと。
  ok("★解放は、いまある関数から取っている", /computeUnlocked\(entries\)/.test(vt));
  // ★保存できなかったら、黙らないこと。
  ok("★保存に失敗したら、理由を残す", /着せかえを保存できませんでした/.test(vt));

  const panel = readCode("components", "WardrobePanel.jsx");
  // ★★ぼかさないこと。★出さないなら、はじめから出さない（線引き §6-3）。
  ok("★ぼかしていない", !/blur|filter: *['\"]?blur/.test(panel));
  // ★★催促しないこと。
  ok("★「あと◯日」を出していない", !/あと\s*\{?[0-9a-zA-Z_. ]*\}?\s*日/.test(panel));
  ok("★禁じた言い方を使っていない", !/できません|見られません/.test(panel));
  // ★季節で、持っているものを取り上げないこと。
  ok("★季節の札は「お店にありません」と言っている", /お店にありません/.test(panel));

  const dressed = readCode("components", "SheepDressed.jsx");
  // ★★重ね順を、画面で書き直さないこと。
  ok("★重ね順は、lib から取っている", /LAYER_ORDER/.test(dressed));
  ok("★画面で、順番を並べ直していない", !/"garment", *"neck"/.test(dressed));

  console.log("\n⑨ ★歩き（★案B の第1段・2026-09-06）");
  const dressed2 = readCode("components", "SheepDressed.jsx");
  // ★★1枚ずつ動かさないこと。★服と体が、ずれます。
  ok("★かたまりの外側を、動かしている", /sheep-dressed-move/.test(dressed2));
  ok("★1枚ずつには、動きを付けていない",
    !/layers\.map[\s\S]{0,400}animation:/.test(dressed2));
  ok("★歩きの動きがある", /@keyframes sheepWalk/.test(dressed2));
  // ★足もとを軸にすること。★頭を軸にすると、浮いて見えます。
  ok("★足もとを軸にしている", /transformOrigin: "50% 92%"/.test(dressed2));
  // ★★動きを減らす設定の方には、動かさないこと。
  ok("★動きを減らす設定を、見ている", /prefers-reduced-motion: reduce/.test(dressed2));
  // ★裏返しと、はずみを、同じ入れ物でやらないこと（★打ち消し合います）。
  ok("★裏返しは外側、はずみは内側", /facingLeft \? "scaleX\(-1\)"/.test(dressed2));
  ok("★止まっているのが、既定", /motion = "still"/.test(dressed2));

  const panel2 = readCode("components", "WardrobePanel.jsx");
  ok("★試しのボタンがある", /歩かせてみる/.test(panel2));
  ok("★止められる", /止める/.test(panel2));

  console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
