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
  // ★★2026-09-07、★お箸とフォークを足して 219 点になりました。
  //   ★古い22点を新しいほうへ一本化するため、★代わりの無かった2点を埋めました。
  //   ★元の一式は217点です（★決定版11）。
  // ★★2026-09-07、★ふだん着62点を取り込んで 281 点になりました。
  //   ★箱2（記録で交換する70点）に、★上・下・羽織り・目元が要りました。
  //   ★出どころ docs/opus/woolsong-確定-アイテムの全体像と、箱2の作り方（9月7日・夜・訂正版）.md §3-2
  // ★★2026-09-08、★166点の残り104点も取り込んで 385点になりました。
  //   ★目録384点＋実装だけの2点（傘・剣）− 目録から外した operaCarmen 1点。
  // ★★2026-09-08 夜、★マフラー28点が 加わりました（385 ＋ 28 ＝ 413）。
  ok(`★品数が 413（いま ${idx.items.length}）`, idx.items.length === 413);
  // ★★166点ぜんぶが、★入っていること。
  const daily = idx.items.filter((i) => i.group === "daily");
  // ★★マフラー28点も「ふだん着」です（166 ＋ 28 ＝ 194）。
  ok(`★ふだん着が 194 点（いま ${daily.length}）`, daily.length === 194);
  ok("★足したのは、お箸とフォークの2点だけ",
    ["propChopsticks", "propFork"].every((k) => idx.items.some((i) => i.key === k)));
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
  // ★★2026-09-06、★動きは5つになりました。★名前に動きが混ざります。
  //   ★混ぜないと、★画面に2匹いるとき、★あとの定義が先を消します。
  ok("★はずみの動きがある", /@keyframes sheepBob\$\{motion\}/.test(dressed2));
  ok("★歩く道のりの動きがある", /@keyframes sheepTravel\$\{motion\}/.test(dressed2));
  // ★★数字を、画面の側に書き写さないこと。★2か所になります。
  ok("★数字は lib が持っている", /motionOf\(motion\)/.test(dressed2));
  ok("★画面に数字を書いていない", !/bobY: \d/.test(dressed2));
  // ★足もとを軸にすること。★頭を軸にすると、浮いて見えます。
  ok("★足もとを軸にしている", /transformOrigin: "50% 92%"/.test(dressed2));
  // ★★動きを減らす設定の方には、動かさないこと。
  ok("★動きを減らす設定を、見ている", /prefers-reduced-motion: reduce/.test(dressed2));
  // ★裏返しと、はずみを、同じ入れ物でやらないこと（★打ち消し合います）。
  ok("★裏返しは外側、はずみは内側", /facingLeft \? "scaleX\(-1\)"/.test(dressed2));
  ok("★止まっているのが、既定", /motion = "still"/.test(dressed2));

  // ★★歩き（案B1・2026-09-06）。★脚をコードで描きました。絵は0枚です。
  //   ★★坂本さんのご指示：★弾ませないこと。★脚を動かすこと。
  console.log("■ 歩きが、跳ねる形に戻っていないか");
  const w = m.MOTIONS.walk;
  ok("★歩くとき、上下に弾まない", w.bobY === 0);
  ok("★つぶれもしない", w.squash === 1 && w.stretch === 1);
  ok("★脚を出す印がある", w.legs === true);
  // ★★速さが変わると、脚が動いていてもすべって見えます。
  ok("★歩くときは、速さが一定（linear）", /mo\.gait \? "linear"/.test(dressed2));
  const home3 = readCode("components", "CharacterHome.jsx");
  // ★★2026-09-09、★秒数を lib に 移しました（★2.2秒 → 3.2秒）。
  //   ★★見るのは「秒数」では なく「速さが 一定（linear）か」です。
  //     ★秒数で 見ると、★数を 変えるたびに ここが 落ちます。
  //     ★★守りたいのは「★すべって 見えないこと」です。
  ok("★おうちの羊も、歩くときは速さが一定",
    /isWalking\s*\n?\s*[\s\S]{0,400}?left \$\{WALK_MS\}ms linear/.test(home3));

  console.log("■ 脚のかたち");
  const L = m.LEGS;
  ok("★色は、体の絵から拾った色", L.color === "#EDE4CE");
  ok("★つけ根は、体に隠れる", L.topY < 951 - L.lift);
  ok("★体を、脚のために持ち上げていない", L.lift === 0, "実際は " + L.lift);
  ok("★ひづめは、箱からはみ出さない", L.bottomY <= 1024);
  ok("★体の下から、脚が見える", L.bottomY > 951 - L.lift);
  ok("★体の下に出るのは、ひかえめ（30まで）", L.bottomY - 951 <= 30,
    "実際は " + (L.bottomY - 951));
  // ★★いまの靴8点は、★動かしません（2026-09-06・訂正）。
  //   ★底の高さが1点ずつ違います（954〜988）。★測りました。
  //   ★下駄は台が高く、★わらじは平ら、★本番の靴はかかとがあります。
  //   ★★そろえて動かすと、★かえってずれます。
  ok("★いまの靴を、動かしていない", L.shoeDy === 0, "実際は " + L.shoeDy);
  // ★★166点の版の数字は、★別に持っています（LEGS_V4）。
  //   ★いま描くほうは、★いまの体の絵（下端951）に合わせています。
  ok("★仕様の数字を、失っていない",
    m.LEGS_V4.bottomY === 1002 && m.LEGS_V4.footW === 114);

  // ★★のりしろ（★2026-09-06、実機で「足がはみ出して見える」）。
  //   ★ひづめの上端が、★体の下端(951)より上にあること。
  //   ★すきまがあると、★足が浮いて見えます。
  const hoofTop = L.bottomY - L.hoofRy * 2;
  ok("★ひづめが、体の下へ差しこんである", hoofTop < 951,
    "ひづめの上端 " + hoofTop);
  ok("★差しこみは、8以上ある", 951 - hoofTop >= 8, "実際は " + (951 - hoofTop));
  // ★体のこぶは、下へ行くほど細くなります（y=945 で x381〜462、幅81）。
  //   ★足がそれより広いと、★こぶの外へはみ出します。
  ok("★足の幅が、こぶ(81)に収まる", L.footW <= 81, "実際は " + L.footW);
  ok("★左右は、体のこぶの中心に合わせている", L.leftX === 421 && L.rightX === 601);
  ok("★左右が、逆向きに振れる", L.swing > 0);

  console.log("■ 靴が、脚に隠れないか");
  // ★★2026-09-06、実機で「靴が脚に隠れる」「振れが大きすぎる」。
  //   ★どちらも原因は同じで、★軸の決め方でした。
  //   ★★fill-box は「そのかたまりの箱」を見ます。
  //     ★靴の絵は x=0・y=0 の1024角なので、★履いた瞬間に箱が画面ぜんたいへ
  //     ★広がり、★軸が (512,0) へ飛びます。★脚が羊を横切りました。
  ok("★軸を、かたまりの箱で決めていない",
    !/transformBox: "fill-box"/.test(dressed2));
  ok("★軸を、数字で決めている",
    /transformOrigin: `\$\{cx\}px \$\{LEGS\.topY\}px`/.test(dressed2));
  // ★靴は、脚より後に描くこと（後に描いたものが上に来ます）。
  // ★★2026-09-08 夕、★靴にも 色を塗るため、★別の部品へ移しました。
  //   ★★靴だけ svg の枝で描いていたので、★色が乗っていませんでした。
  //   ★描く順は、★変えていません。★脚の rect のあとに、靴の部品が来ます。
  const iRect = dressed2.indexOf("<rect");
  const iShoe = dressed2.indexOf("<ClothShoeImages");
  ok("★靴を、脚より後に描いている", iRect >= 0 && iShoe > iRect);
  // ★★靴も、★脚と同じ軸で 振れること。
  const shoeComp = fs.readFileSync(path.join(ROOT, "components", "ClothImage.jsx"), "utf-8");
  ok("★靴も、脚と一緒に振れる", /className="sheep-leg"/.test(shoeComp));
  ok("★靴にも、色が乗る", /usePaintedSrc\(itemKey, colorKey\)/.test(shoeComp));
  // ★靴を履いたら、ひづめは描かないこと（靴の下から足がはみ出します）。
  ok("★靴のときは、ひづめを描かない", /\{!shoeSrc && \(\s*<ellipse/.test(dressed2));

  console.log("■ 振れが、大きすぎないか");
  const arm = (L.bottomY - L.hoofRy) - L.topY;
  const move = 2 * arm * Math.sin(L.swing * Math.PI / 360);
  ok("★足先の動く量が、ひかえめ（1024のうち80まで）", move <= 80,
    "実際は " + move.toFixed(0));
  // ★★2026-09-08 夜、★坂本さんから「振れすぎ」とのご指摘をいただき、
  //   ★★swing を 14 → 7 に、★およそ半分にしました。
  //   ★下限も、それに 合わせます。★動きが 見えることは 変わりません。
  ok("★でも、動きが見える程度はある（15以上）", move >= 15,
    "実際は " + move.toFixed(0));
  // ★振れても、脚が体の下ぎわからはみ出さないこと。
  ok("★振れても、脚は体に隠れている",
    L.leftX - L.width / 2 - move / 2 >= 361,
    "左端 " + (L.leftX - L.width / 2 - move / 2).toFixed(0) + " ／ 体は 361 から");

  console.log("■ 画面に2匹いても、脚が止まらないか");
  // ★★組の名前で動きを書くと、★あとの羊の規則が先の羊にも効きます。
  //   ★止まっている羊が勝つと、★見本の脚が動かなくなります。
  ok("★脚の動きを、組の名前で書いていない",
    !/\.sheep-leg-[LR]\s*\{[^}]*animation/.test(dressed2));
  ok("★動きの名前に、動きが混ざっている",
    /@keyframes sheepLegL\$\{motion\}/.test(dressed2));
  // ★切り抜きの名前も、羊ごとに変えること（★靴が消えます）。
  ok("★切り抜きの名前を、羊ごとに変えている", /useId\(\)/.test(dressed2));
  ok("★動きを減らす設定では、脚も止まる",
    /\.sheep-leg \{ animation: none !important/.test(dressed2));

  console.log("■ 靴を、取り上げていないか");
  // ★★2026-09-06・直し。★靴を重ねの列から外したのが、誤りでした。
  //   ★脚の絵は体より後ろ(z=0)、★体と服の束はその上(z=1)。
  //   ★列から外して脚の絵へ移すと、★靴が体に塗りつぶされます。
  //   ★★列に残したまま、★描き方だけ変えます。
  ok("★靴を、重ねの列から外していない",
    !/slot === "shoes" && showLegs/.test(dressed2));
  ok("★靴に、印を付けている", /isShoe: slot === "shoes"/.test(dressed2));
  ok("★靴は、もとの重ねの場所で描く", /l\.isShoe && showLegs \?/.test(dressed2));
  // ★軸と動きは、★1か所で決めること（★脚と靴がずれないように）。
  ok("★軸と動きを、1か所で決めている", /const legGroupStyle = /.test(dressed2));
  ok("★靴の絵を、左右に切っている", m.SHOE_SPLIT_X === 511);

  // ★ほかの動きは、これまでどおりです。★巻きこまないこと。
  for (const k of ["still", "sleep", "celebrate", "farm"]) {
    ok(`★「${k}」には、歩き方の印を付けていない`, !m.MOTIONS[k].gait);
    ok(`★「${k}」では、脚を振らない`, !m.MOTIONS[k].legs);
  }

  // ★★規則：作ったものは、必ずどこかから呼ばれているか。
  //   ★動きを5つ作って、★2つしか使っていない、をここで止めます。
  console.log("■ 5つの動きが、すべて使われているか");
  const home2 = readCode("components", "CharacterHome.jsx");
  const panelSrc = readCode("components", "WardrobePanel.jsx");
  const usedIn = home2 + panelSrc + dressed2;
  for (const key of Object.keys(m.MOTIONS)) {
    ok(`★「${key}」を、どこかで使っている`,
      new RegExp('"' + key + '"').test(usedIn));
  }

  const panel2 = readCode("components", "WardrobePanel.jsx");
  ok("★試しのボタンがある", /歩かせてみる/.test(panel2));
  ok("★止められる", /止める/.test(panel2));

  console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
