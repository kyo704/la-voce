// ============================================================================
// 古い22点を、新しい着せかえへ引き上げる（2026-09-07）
//
//   ★★坂本さんの決め
//     判断1  先に配って、あとで消す
//     判断2  character_inventory の記録は消さない
//     判断3  22点すべてを新しいほうに置きかえる（★お箸とフォークの絵が届いた）
//     判断4  いずれ消すことを、あらかじめ伝える
//
//   ★★ここで見張るのは、★「配る前に消していないか」です。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

(async () => {
  const src = fs.readFileSync(path.join(ROOT, "lib", "legacyWearables.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const idx = require(path.join(ROOT, "docs", "assets", "sheep-items-index.json"));
  const bySlot = {};
  for (const it of idx.items) bySlot[it.key] = it.slot;
  m.setNewSlotIndex(bySlot);

  console.log("■ 対応表");
  const chr = readRaw("lib", "character.js");
  const olds = [...chr.matchAll(/\{ key: "([^"]+)", category: "(?:hat|outfit|accessory)"/g)]
    .map((x) => x[1]);
  ok("古い22点が、すべて表にある", olds.every((k) => m.isLegacyWearable(k)),
    olds.filter((k) => !m.isLegacyWearable(k)).join(", "));
  ok("表に、余分な鍵がない", m.LEGACY_KEYS.every((k) => olds.includes(k)),
    m.LEGACY_KEYS.filter((k) => !olds.includes(k)).join(", "));
  // ★★行き先が実在しないと、★配れません。
  const dead = m.LEGACY_KEYS.filter((k) => !bySlot[m.newKeyFor(k)]);
  ok("行き先が、すべて実在する", dead.length === 0, dead.join(", "));
  // ★★代わりの無い品を、残していないこと（★判断3）。
  ok("代わりの無い品が、1つもない",
    m.LEGACY_KEYS.every((k) => m.newKeyFor(k) !== null));

  console.log("■ お箸とフォーク（2026-09-07 に足した2点）");
  for (const k of ["propChopsticks", "propFork"]) {
    const it = idx.items.find((i) => i.key === k);
    ok(`${k} が一覧にある`, !!it);
    ok(`${k} の絵がある`,
      it && fs.existsSync(path.join(ROOT, "public", "sheep", it.file || "")));
    ok(`${k} は持ちもの`, it && it.slot === "prop");
  }
  ok("お箸の行き先が、新しい絵", m.newKeyFor("accessory_chopsticks") === "propChopsticks");
  ok("フォークの行き先が、新しい絵", m.newKeyFor("accessory_fork") === "propFork");

  console.log("■ 身につけたままの方の移行");
  {
    const r = m.migrateEquipped({ hat: "hat_straw", wardrobe: {} });
    ok("麦わら帽子が、新しい鍵に移る", r.wardrobe.hat === "hatStraw");
    ok("同じ品として扱う", r.moved[0] && r.moved[0].kind === "same");
    // ★★ご本人が選ばれたものを、上書きしないこと。
    const r2 = m.migrateEquipped({ hat: "hat_straw", wardrobe: { hat: "hatKnit" } });
    ok("すでに着ておられるものは、上書きしない", r2.wardrobe.hat === "hatKnit");
    ok("そのときは、動かさない", r2.moved.length === 0);
    // ★★古いほうを消さないこと。
    const src2 = { hat: "hat_straw", wardrobe: {} };
    m.migrateEquipped(src2);
    ok("元の値を、書きかえていない", src2.hat === "hat_straw");
  }

  console.log("■ 配る SQL が、消していないか（★判断2）");
  const sql = readCode("supabase", "2026-09-07-古い22点を新しい着せかえへ配る.sql");
  ok("delete を含まない", !/\bdelete\b/i.test(sql));
  ok("truncate を含まない", !/\btruncate\b/i.test(sql));
  // ★★古い列を消していないこと。
  ok("古い hat / outfit / accessory を消していない",
    !/character_equipped\s*-\s*'hat'/.test(sql) && !/#-\s*'\{hat\}'/.test(sql));
  ok("配るのは insert だけ", /insert into public\.character_inventory/.test(sql));
  ok("すでに持っていたら、増やさない", /not exists/.test(sql));
  ok("確かめが、配り漏れを見る", /配り漏れ/.test(sql));

  // ★★2026-09-07、★実際に1件、移りませんでした。
  //   ★jsonb_set は、★path の途中の段が無いと、★何もせず、そのまま返します。
  //     ★create_if_missing は「最後の1段」にしか効きません。
  //   ★★character_equipped に wardrobe の段が無い方に、★黙って素通りでした。
  //     ★失敗もしないので、★流したあとの照会でしか分かりませんでした。
  //   ★★{wardrobe,○○} を jsonb_set で書かないこと。★|| で混ぜること。
  ok("★jsonb_set で {wardrobe,…} を書いていない",
    !/jsonb_set\s*\([^;]*\{wardrobe,/.test(sql));
  ok("★|| で混ぜている（段が無くても作れる）",
    /jsonb_build_object\(\s*'wardrobe'/.test(sql));
  ok("★wardrobe の段を、必ず作っている",
    /coalesce\(p\.character_equipped->'wardrobe', '\{\}'::jsonb\)/.test(sql));

  // ★やり直しの SQL にも、同じ形が要ります。
  const redo = readCode("supabase", "2026-09-07-④のやり直し-wardrobeの段が無い方.sql");
  ok("やり直しも、jsonb_set を使っていない",
    !/jsonb_set\s*\([^;]*\{wardrobe,/.test(redo));
  ok("やり直しも、1行も消さない",
    !/\bdelete\b/i.test(redo) && !/\btruncate\b/i.test(redo));
  ok("やり直しは、先に形を見せる", /wardrobe の段があるか/.test(redo));

  console.log("■ お知らせ（★判断4：先に伝える）");
  ok("見出しがある", typeof m.LEGACY_NOTICE_TITLE === "string" && m.LEGACY_NOTICE_TITLE.length > 0);
  ok("★いずれ無くなることを、先に伝えている", /なくなるときは/.test(m.LEGACY_NOTICE_BODY));
  ok("見た目が変わることを、伝えている", /見た目が変わって/.test(m.LEGACY_NOTICE_BODY));
  // ★★お詫びにしないこと。★増えたことのお知らせです。
  ok("お詫びの言い方をしていない", !/申し訳|お詫び|ご迷惑/.test(m.LEGACY_NOTICE_BODY));
  // ★★急かさないこと。
  ok("急かす言葉がない", !/今すぐ|お早め|期限|あと\d/.test(m.LEGACY_NOTICE_BODY));

  console.log("■ 押しても何も起きないボタンを、出していないか");
  const panel = readCode("components", "WardrobePanel.jsx");
  ok("左右の絵がある品だけ、置き場所を選ばせる",
    /sheepItemByKey\(wearing\.prop\)\.files/.test(panel));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
