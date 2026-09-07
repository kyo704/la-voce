// ============================================================================
// 記録がたまったときの、よそおいの配り（2026-09-07）
//
//   ★出どころ docs/opus/woolsong-裁定-219点の分け方と、追加38項目の安全性（9月7日・夜）.md §5
//
//   ★★守ること
//     ・★残高を作らない（★記録から出す。★欄に貯めない）
//     ・★数を出さない（「あと13ポイント」「あと◯回」「あと◯日」）
//     ・★ポイントを1点も動かさない（★箱2に値段はありません）
//     ・★同じ回なら、★同じ3点（★開くたびに変わらない）
//     ・★もう持っているものを、★出さない
//     ・★受け取れるかどうかは、★サーバが数え直す
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
  const src = fs.readFileSync(path.join(ROOT, "lib", "wardrobeBoxes.js"), "utf-8")
    .replace('import { UNLOCKS } from "@/lib/sheepWardrobe";', "const UNLOCKS = {};");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ 受け取れる回は、記録から出す");
  ok("30日で1回", m.box2Rounds(30) === 1);
  ok("29日では0回", m.box2Rounds(29) === 0);
  ok("90日で3回", m.box2Rounds(90) === 3);
  ok("日数がおかしければ0回", m.box2Rounds(-5) === 0 && m.box2Rounds("あ") === 0);

  console.log("■ もう受け取った数は、持ち物から数える");
  ok("何も持っていなければ0", m.box2ReceivedCount([], {}) === 0);
  ok("箱2のものを2つ持っていれば2",
    m.box2ReceivedCount(["top_01", "hats_01", "waAka"], {}) === 2);
  // ★★描き直しの4点は、数えないこと。
  //   ★古いお店で買った麦わら帽子が、新しい鍵でも持ち物に入ります。
  //   ★それを「箱2で受け取った」と数えると、★1回ぶん損をさせます。
  ok("★描き直しのぶんは、数えない",
    m.box2ReceivedCount(["hatStraw", "hats_06"], { hatStraw: "hats_06" }) === 0);
  ok("★古い鍵が無ければ、新しい鍵は数える",
    m.box2ReceivedCount(["hats_06"], { hatStraw: "hats_06" }) === 1);

  console.log("■ 同じ回なら、同じ3点");
  const a = m.pickBox2Choices([], 1);
  const b = m.pickBox2Choices([], 1);
  ok("3点でる", a.length === 3);
  ok("★何度呼んでも、同じ3点", JSON.stringify(a) === JSON.stringify(b), a + " / " + b);
  ok("★同じものが2つ入っていない", new Set(a).size === a.length);
  const c = m.pickBox2Choices([], 2);
  ok("回がちがえば、ちがう3点", JSON.stringify(a) !== JSON.stringify(c));
  console.log("■ もう持っているものは、出さない");
  const owned = a.slice(0, 2);
  const d = m.pickBox2Choices(owned, 1);
  ok("持っているものが混ざっていない", d.every((k) => !owned.includes(k)), d.join(", "));
  // ★残りが3点より少なければ、その分だけ
  const nearlyAll = m.BOX2_KEYS.slice(0, m.BOX2_KEYS.length - 2);
  ok("残りが2点なら、2点だけ出す", m.pickBox2Choices(nearlyAll, 1).length === 2);
  ok("残りが0点なら、何も出さない", m.pickBox2Choices(m.BOX2_KEYS, 1).length === 0);

  console.log("■ おまかせで届ける日");
  ok("同じ月なら、まだ届けない", m.shouldAutoDeliver("2026-09-01", "2026-09-30") === false);
  ok("★月が変わったら、届ける", m.shouldAutoDeliver("2026-09-30", "2026-10-01") === true);
  ok("日付が無ければ、届けない", m.shouldAutoDeliver(null, "2026-10-01") === false);
  // ★★new Date() を、この判定の中で呼んでいないこと。
  //   ★呼ぶと、検査で日を差し替えられません。
  // ★★コメントを剥がしてから調べること（CLAUDE.md の罠）。
  //   ★2026-09-07、★「new Date() を呼びません」という★自分の説明文で落ちました。
  const libCode = readCode("lib", "wardrobeBoxes.js");
  ok("★lib が、自分で今日を作っていない", !/new Date\(\)|Date\.now\(\)/.test(libCode));

  console.log("■ その回が、いつ受け取れるようになったか");
  const dates = Array.from({ length: 65 }, (_, i) =>
    "2026-" + String(Math.floor(i / 31) + 7).padStart(2, "0") + "-" + String((i % 31) + 1).padStart(2, "0"));
  ok("1回目は30日目", m.roundAvailableDate(dates, 1) === dates[29]);
  ok("2回目は60日目", m.roundAvailableDate(dates, 2) === dates[59]);
  ok("届いていない回は null", m.roundAvailableDate(dates, 3) === null);

  console.log("■ 数を、出さない");
  const gift = readCode("components", "Box2Gift.jsx");
  // ★★数のついた言い方だけを見ます。
  //   ★2026-09-07、★「この画面は残ります」で落ちました。
  //     ★「残ります」は、ふつうの日本語です。★禁じているのは「残り2回」です。
  for (const bad of ["ポイント", "回目", "回ぶん"]) {
    ok(`「${bad}」が画面に無い`, !gift.includes(bad));
  }
  for (const pat of [/あと\s*[0-9０-９{]/, /残り\s*[0-9０-９{]/, /[0-9０-９]\s*回/, /[0-9０-９]\s*点/]) {
    ok(`★数のついた言い方が無い（${pat}）`, !pat.test(gift));
  }
  ok("配り方の文は、lib から取っている", /DELIVERY_LINES\.record/.test(gift));
  // ★★選べるものは、必ず押せる形にすること。
  // ★★字で「選んでください」と書いて終わり、にしないこと。
  // ★★実物は <button key={key} type="button"> です。
  //   ★2026-09-07、★`<button type=` を探して、★見つけられませんでした。
  //   ★属性の並びを、★決め打ちにしないこと。
  const btnAt = gift.indexOf("<button");
  const chooseAt = gift.indexOf("onChoose && onChoose(key)");
  ok("★3点とも、押せるボタンである",
    btnAt >= 0 && chooseAt > btnAt && chooseAt - btnAt < 400,
    `button ${btnAt} / onChoose ${chooseAt}`);
  ok("★絵も、そのボタンの中にある", /<button[\s\S]{0,700}<img src=\{sheepItemSrc\(item\)\}/.test(gift));
  ok("★何を受け取るかが、読み上げでも分かる", /aria-label=\{`\$\{item\.name\}を受け取る`\}/.test(gift));

  console.log("■ ポイントを、動かさない");
  const route = readCode("app", "api", "character", "gift", "route.js");
  ok("受け取る道がある", route.length > 0);
  ok("★ポイントの列に、触れていない", !/character_points_spent/.test(route));
  ok("★受け取れるかを、サーバが数え直している",
    /box2Rounds\(recordedDays\)/.test(route) && /box2ReceivedCount\(owned/.test(route));
  ok("★見せた3点の中からしか受け取れない", /choices\.includes\(itemKey\)/.test(route));
  ok("★箱2のものしか受け取れない", /BOX2_KEYS\.includes\(itemKey\)/.test(route));
  ok("本人を確かめてから動く",
    route.indexOf("getUserWithTimeout") < route.indexOf("character_inventory"));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
