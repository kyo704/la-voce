// ============================================================================
// ひつじの画面の 絵を、裏で 先に 読む（2026-09-08 夜・案2）
//
//   ★★守ること
//     ・★読むのは「いま着ている・置いている物」だけ
//     ・★★一覧の 414点を 読まないこと（★そこが 肝です）
//     ・★手が空いたときに 読む（★記録の画面の じゃまを しない）
//     ・★同じ絵を 2度 読まない
//     ・★止められること
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

console.log("■ ★読むもの");
const code = readCode("lib", "preloadRoom.js");
// ★★一覧を 読まないこと。★414点を 先読みしたら、案2の 意味が 消えます。
ok("★★一覧（SHEEP_ITEMS／INTERIOR_ITEMS の 全部）を 読んでいない",
  !/SHEEP_ITEMS/.test(code) && !/INTERIOR_ITEMS/.test(code));
ok("★着ているものを 読む", /eq\.wardrobe/.test(code));
ok("★置いているものを 読む", /placedKeys\(eq\)/.test(code));
ok("★羊の土台と 顔を 読む",
  /SHEEP_BASE\.body/.test(code) && /HEAD_NOFACE/.test(code) && /facePreloadList\(\)/.test(code));
ok("★同じ絵を 2度 数えない", /\[\.\.\.new Set\(/.test(code));

console.log("■ ★読み方");
ok("★手が空いたときに 読む", /requestIdleCallback/.test(code));
// ★★無い ブラウザでも 落ちないこと。
ok("★無い ブラウザでも 落ちない", /window\.setTimeout\(fn, 120\)/.test(code));
ok("★1枚ずつ（★まとめて 投げない）", /idle\(step\);/.test(code));
ok("★同じ絵を 2度 読まない", /const done = new Set\(\);/.test(code));
ok("★止められる", /return \(\) => \{ stopped = true; \};/.test(code));
ok("★画面が 無ければ 何もしない", /typeof window === "undefined"/.test(code));

console.log("■ ★呼び方");
const vt = readCode("components", "VocalTracker.jsx");
ok("★ひつじタブを 開いていなくても 読む",
  /return preloadUrls\(roomAssetUrls\(characterEquipped\)\);/.test(vt));
// ★★出ない方に 読ませないこと。
ok("★★門の中の方だけ", /if \(!wardrobeOn\) return;\s*\n\s*if \(!characterEquipped\) return;/.test(vt));
// ★★片づけること。
ok("★離れたら 止める", /useEffect\(\(\) => \{\s*\n\s*if \(!wardrobeOn\) return;[\s\S]{0,200}return preloadUrls/.test(vt));

console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
process.exit(failed === 0 ? 0 : 1);
