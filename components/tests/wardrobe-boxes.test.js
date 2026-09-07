// ============================================================================
// よそおいの3つの箱（2026-09-07）
//
//   ★出どころ docs/opus/woolsong-裁定-219点の分け方と、追加38項目の安全性（9月7日・夜）.md §6
//
//   ★★§6 がCodeに求めていること
//     ③ ★box=2 と box=3 が1点も重ならないこと
//     ④ ★box=1 に購入経路が存在しないこと
//     ⑤ ★どの箱かを、1か所で持つこと（画面ごとに書かない）
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

(async () => {
  // ★lib は @/ を使うので、そのままは読み込めません。★書き換えて読みます。
  const src = fs.readFileSync(path.join(ROOT, "lib", "wardrobeBoxes.js"), "utf-8")
    .replace('import { UNLOCKS } from "@/lib/sheepWardrobe";',
      "const UNLOCKS = " + JSON.stringify(
        (() => {
          const w = fs.readFileSync(path.join(ROOT, "lib", "sheepWardrobe.js"), "utf-8");
          const m = w.slice(w.indexOf("export const UNLOCKS"));
          const body = m.slice(m.indexOf("{"), m.indexOf("});") + 1);
          // ★鍵の名前だけを拾います。★評価はしません。
          const out = {};
          for (const line of body.split("\n")) {
            const mm = line.match(/^\s*([A-Za-z0-9_]+):\s*\[([^\]]*)\]/);
            if (mm) out[mm[1]] = mm[2].split(",").map((x) => x.trim().replace(/^"|"$/g, "")).filter(Boolean);
          }
          return out;
        })()
      ) + ";");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  const impl = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "assets", "sheep-items-index.json"), "utf-8")).items;
  const cat = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "opus", "items.json"), "utf-8"));
  const byKey = {};
  cat.forEach((i) => { byKey[i.key] = i; });

  console.log("■ ⑤ どの箱かを、1か所で持っている");
  ok("箱の判定は lib/wardrobeBoxes.js だけにある", typeof m.boxOf === "function");
  // ★画面が、theme を見て自分で判定していないこと
  for (const f of ["WardrobePanel.jsx", "CharacterHome.jsx", "VocalTracker.jsx"]) {
    const code = readCode("components", f);
    ok(`${f} が theme で箱を決めていない`,
      !/theme\s*===\s*"(opera|stage)"/.test(code));
  }

  console.log("■ ③ 箱2と箱3が、1点も重ならない");
  const boxes = impl.map((i) => ({ key: i.key, box: m.boxOf(i, byKey[i.key]) }));
  const b2 = new Set(boxes.filter((x) => x.box === 2).map((x) => x.key));
  const b3 = new Set(boxes.filter((x) => x.box === 3).map((x) => x.key));
  const both = [...b2].filter((k) => b3.has(k));
  ok("重なりが無い", both.length === 0, both.join(", "));
  // ★★どの品も、必ずどれか1つの箱に入ること（数え落としを見つけます）。
  const noBox = boxes.filter((x) => ![1, 2, 3].includes(x.box));
  ok("箱の無い品が無い", noBox.length === 0, noBox.map((x) => x.key).join(", "));

  console.log("■ ④ 箱1に、買う道が無い");
  const b1 = boxes.filter((x) => x.box === 1).map((x) => x.key);
  ok("箱1が空ではない", b1.length > 0, "箱1: " + b1.length + "点");
  // ★★本物の品を渡すこと。★{ key } だけを作って渡さないこと。
  //   ★2026-09-07、★作り物を渡していて、★propSword を取りこぼしました。
  //   ★boxOf は group も見ます（★目録に無い品のための受け皿です）。
  const itemOf = (k) => impl.find((i) => i.key === k) || { key: k };
  const cantBuy = b1.filter((k) => m.mayBuyWithMoney(itemOf(k), byKey[k]));
  ok("箱1のものは、お金で買えない", cantBuy.length === 0, cantBuy.join(", "));
  const canExchange = b1.filter((k) => m.mayExchangeWithPoints(itemOf(k), byKey[k]));
  ok("箱1のものは、ポイントでも交換できない", canExchange.length === 0, canExchange.join(", "));
  // ★★達成で開く5点が、★theme に関わらず箱1であること。
  //   ★propMetronome は theme が "work" です。★theme だけで数えると漏れます。
  for (const k of m.unlockKeys()) {
    ok(`達成で開く「${k}」が箱1にある`, m.boxOf({ key: k }, byKey[k]) === 1);
  }

  console.log("■ 箱2は、70点そろっている");
  ok(`箱2が70点（いま ${m.BOX2_KEYS.length}）`, m.BOX2_KEYS.length === 70);
  ok("箱2に、同じ鍵が2つ入っていない", m.BOX2_KEYS.length === new Set(m.BOX2_KEYS).size);
  const haveKeys = new Set(impl.map((i) => i.key));
  const notImpl = m.BOX2_KEYS.filter((k) => !haveKeys.has(k));
  ok("箱2の鍵が、すべて実装されている", notImpl.length === 0, notImpl.join(", "));
  // ★★箱1と箱2は、★重ねられません。
  //   ★箱1は「買えない・交換もできない」箱です。
  //   ★2026-09-07、★§3-2 の一覧に propMetronome（達成で開く品）が
  //     ★入っていて、★実際に重なりました。★ここで見つけました。
  const clash = m.BOX2_KEYS.filter((k) => m.unlockKeys().includes(k));
  ok("★箱1と箱2が、重なっていない", clash.length === 0, clash.join(", "));
  // ★部位ごとの最低数（§3）を満たしていること
  const MIN = { top: 17, bottom: 11, outer: 9, shoes: 6, hat: 12, neck: 5, eyes: 2 };
  const bySlot = {};
  m.BOX2_KEYS.forEach((k) => {
    const it = impl.find((i) => i.key === k);
    if (it) bySlot[it.slot] = (bySlot[it.slot] || 0) + 1;
  });
  for (const [slot, n] of Object.entries(MIN)) {
    ok(`箱2の「${slot}」が ${n} 点以上（いま ${bySlot[slot] || 0}）`, (bySlot[slot] || 0) >= n);
  }

  console.log("■ 目録に無い2点も、正しい箱に入る");
  // ★★propSword は opera の持ちものです。★売り物に落としてはいけません。
  for (const [key, want] of [["propSword", 1], ["propUmbrella", 2]]) {
    const it = impl.find((i) => i.key === key);
    ok(`${key} が箱${want}`, it && m.boxOf(it, byKey[key]) === want,
      it ? "いま箱" + m.boxOf(it, byKey[key]) : "品が見つかりません");
  }

  console.log("■ 全身ものは、上・下・羽織りと同時に着られない");
  const sets = impl.filter((i) => i.slot === "garment");
  ok(`全身もの ${sets.length} 点すべてに occupies がある`,
    sets.every((i) => Array.isArray(i.occupies)
      && ["top", "bottom", "outer"].every((s) => i.occupies.includes(s))));

  console.log("■ 箱を、画面に出している（★2026-09-08）");
  {
    const wp = readCode("components", "WardrobePanel.jsx");
    // ★★判定は lib から取ること。★画面で theme を見ないこと。
    ok("★箱の判定を、lib から取っている", /boxOf\(it,/.test(wp));
    for (const label of ["記念のもの", "記録がたまると届きます", "よそおいのお届けで"]) {
      ok(`「${label}」の札がある`, wp.includes(label));
    }
    // ★★持っている品に、札を出さないこと。
    //   ★手に入れたあとで「有料」と出ていると、★取り上げられそうに見えます。
    ok("★持っている品には、札を出していない", /!have && box === BOX_KEEPSAKE/.test(wp)
      && /!have && box === BOX_RECORD/.test(wp) && /!have && box === BOX_DRESSUP/.test(wp));
    // ★★数を書かないこと ── ★ただし、見るのは「品物の札」だけです。
    //   ★2026-09-08、★ファイル全体を見て、★コーデの残り枠に当たりました。
    //     　あと{outfitsLeft(outfits)}着
    //   ★★あれは、★報酬までの距離ではありません。★入れ物の残りです。
    //     ★20着でいっぱいになったら「どれかを消してください」と伝える決めがあり、
    //     ★その数を隠すと、★何が起きたのか分からなくなります。
    //   ★禁じているのは「あと13ポイントで、これが受け取れます」のほうです。
    const grid = wp.slice(wp.indexOf("{items.map((it)"));
    for (const pat of [/あと\s*[0-9０-９{]/, /残り\s*[0-9０-９{]/, /[0-9０-９]\s*点中/]) {
      ok(`★品物の札に、数のついた言い方が無い（${pat}）`, !pat.test(grid));
    }
    // ★★コーデの残り枠は、★あってよいもの。★消えていないことを確かめます。
    ok("★コーデの残り枠は、出したまま", /outfitsLeft\(outfits\)/.test(wp));
    // ★★記念の棚は、★11月です。★いま作らないこと（裁定 §2）。
    ok("★記念のものの棚を、まだ作っていない", !wp.includes("記念のものの棚"));
  }

  console.log("■ 置き場所ごとに、分けている（★2026-09-08）");
  {
    const wp = readCode("components", "WardrobePanel.jsx");
    ok("★分け方を、lib から取っている", /groupBySlot\(items\)/.test(wp));
    // ★★中身のない置き場所に、見出しを出さないこと。
    const sw = fs.readFileSync(path.join(ROOT, "lib", "sheepWardrobe.js"), "utf-8");
    ok("★分け方が lib にある", /export function groupBySlot/.test(sw));
    ok("★置き場所の名前も lib にある", /SLOT_LABELS/.test(sw) && /持ちもの/.test(sw));
    // ★★見出しは、まとまりが2つ以上のときだけ。
    ok("★1つしかないときは、見出しを出さない", /groupBySlot\(items\)\.length > 1/.test(wp));
    // ★★描く順（LAYER_ORDER）と、探す順（SLOT_DISPLAY_ORDER）は、別のものです。
    ok("★描く順と、探す順を、混ぜていない",
      /SLOT_DISPLAY_ORDER/.test(sw) && !/SLOT_DISPLAY_ORDER = LAYER_ORDER/.test(sw));
  }

  console.log("■ レール（★仕様 §3・2026-09-08）");
  {
    const wp = readCode("components", "WardrobePanel.jsx");
    const sw = fs.readFileSync(path.join(ROOT, "lib", "sheepWardrobe.js"), "utf-8");
    ok("★レールの決めが lib にある", /export const RAIL_SLOTS/.test(sw));
    ok("★8つ（背中は入れない）",
      /"hat", "eyes", "neck", "top", "bottom", "outer", "shoes", "prop"/.test(sw));
    ok("★全身ものは、レールの外", /RAIL_GARMENT/.test(sw) && /全身もの/.test(wp));
    // ★★スクロールさせないこと（★仕様 §3）。
    //   ★★2026-09-08、★窓が下のまとまり列まで届いていました。
    //     ★あちらは、★横に流すのが正しい列です（名前が長いため）。
    //   ★見るのは、★レールを包んでいる箱だけです。
    const railOpen = wp.lastIndexOf("<div style={{ display: \"grid\"", wp.indexOf("railKeys.map"));
    const railBlock = wp.slice(railOpen, wp.indexOf("railKeys.map"));
    ok("★レールを、横に流していない", railOpen > 0 && !/overflow-x-auto|nav-scroll/.test(railBlock),
      JSON.stringify(railBlock.slice(0, 120)));
    ok("★画面幅に、そろえて入れている", /gridTemplateColumns: `repeat\(\$\{railKeys\.length\}/.test(wp));
    // ★★空の札を、出さないこと。
    ok("★品物のある置き場所だけ出す", /railSlotsWithItems\(groupItems\)/.test(wp));
    // ★★選びが無効になったとき、★空の画面にしないこと。
    ok("★選べない置き場所に移っても、空にならない", /const activeSlot =/.test(wp));
    ok("★状態を書き替えて直していない",
      !/useEffect\([^)]*setRailSlot/.test(wp));
    ok("★押していることが、読み上げにも分かる", /aria-pressed=\{activeSlot/.test(wp));
  }

  console.log("■ 一覧の見せ方（★仕様 §5・2026-09-08）");
  {
    const wp = readCode("components", "WardrobePanel.jsx");
    const sd = readCode("components", "SheepDressed.jsx");
    // ★★見本は「羊に着せた姿」。★服だけの絵を並べないこと。
    ok("★見本が、羊に着せた姿である", /<SheepDressed[\s\S]{0,200}thumb/.test(wp));
    ok("★1点だけ着せている", /wearing=\{\{ \[it\.slot\]: it\.key/.test(wp));
    // ★★80個 並ぶので、★1つずつが軽いこと。
    ok("★見本のときは、動きの定義を作らない", /\{!thumb && \(\s*<style>/.test(sd));
    ok("★見本のときは、動かさない", /const anim = thumb\s*\?\s*"none"/.test(sd));
    ok("★見本のときは、脚を描かない", /const showLegs = !thumb/.test(sd));
    // ★★「はずす」を先頭に固定（★仕様 §5）。
    ok("★「はずす」がある", wp.includes("はずす"));
    ok("★何も着ていない場所には、出さない", /\{wearing\[sec\.slot\] && \(/.test(wp));
    // ★★選んでいるしるしは、★色だけにしないこと。
    ok("★わくを太くしている", /\$\{worn \? 3 : 1\}px solid/.test(wp));
    ok("★右下に●も出している", /right: 5, bottom: 5/.test(wp));
    // ★★暗くしすぎないこと（★仕様 §5「買う気が失せます」）。
    ok("★持っていないものを、暗くしすぎていない", /opacity: \(!have\) \? 0\.62 : 1/.test(wp));
    ok("★鍵のしるしがある", wp.includes("🔒"));
  }

  console.log("■ 数を、出さない");
  // ★「あと13ポイント」を、どこにも出さないこと（坂本さんの決め・2026-09-07）。
  ok("配り方の言葉に、数字が入っていない",
    Object.values(m.DELIVERY_LINES).every((line) => !/[0-9０-９]/.test(line)));
  const vt = readCode("components", "VocalTracker.jsx");
  const wp = readCode("components", "WardrobePanel.jsx");
  for (const bad of ["あとポイント", "残りポイント", "まであと"]) {
    ok(`「${bad}」が画面に無い`, !vt.includes(bad) && !wp.includes(bad));
  }
  // ★★ポイントで、あと何点で買えるか、を出していないこと。
  ok("「あと◯ポイントで受け取れます」の形が無い",
    !/あと\s*\{[^}]*\}\s*ポイント/.test(vt) && !/ポイントで.{0,6}受け取れます/.test(vt));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
