#!/usr/bin/env node
// STRIP: B（見える 字）
// ============================================================================
// ★★★配役を 決める ── ★見本 `P_haiyaku`
//   ★出どころ 裁定141 ／ design-v36 の 直し ①④
//     ／ woolsong-2026-09-21_8.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 b5c54333）
//
//   ★★守る こと
//     ① 決めを 画面で 作って いない（`lib/koenCast.js` から 借りる）
//     ② ★A・B の マスが **押せる**（design-v36 ①・押せないと 名前を 入れられない）
//     ③ ★人数は **打ち込み**（design-v36 ④・37人 の ような 数が ある）
//     ④ ★体の ことを 1つも 受け取って いない（裁定141）
//     ⑤ ★期限が 切れた 公演は 直せない
//     ⑥ 但し書きが 見本の まま ／ ⑦ 字は tx() ／ ⑧ 押す ところは 44 以上
// ============================================================================
const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let 落ち = 0;
function t(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { console.log("  NG   " + label); 落ち++; }
}

(async () => {
  const 画 = readCode("components", "KoenCast.jsx");
  const 生 = readRaw("components", "KoenCast.jsx");
  const src = fs.readFileSync(path.join(ROOT, "lib", "koenCast.js"), "utf8");
  const L = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① 決めを 画面で 作って いない");
  ["castRows", "isGroupSlot", "readPeople", "canEditKoen", "canAddRole", "newRole"]
    .forEach((n) => t(new RegExp("\\b" + n + "\\b").test(画), "★" + n + " を 借りて いる"));
  t(!/COLS_SLOT\s*=/.test(画), "★列の 名を 画面で 作って いない");
  t(!/\.select\(\s*["'`]\*/.test(画), "★`select('*')` を 書いて いない");

  console.log("\n② A・B の マスが 押せる");
  const AB = 画.slice(画.indexOf('["a", "b"]'), 画.indexOf('["a", "b"]') + 900);
  t(/\["a", "b"\]/.test(画), "★A と B を 並べて いる");
  t(/<button/.test(AB) && /onClick=\{\(\) => set選/.test(AB), "★どちらも 押せる");
  t(/disabled=\{!直せる \|\| busy\}/.test(AB), "★直せない ときは 押せない");

  console.log("\n③ 人数は 打ち込み");
  t(/isGroupSlot\(x\.slot\)/.test(画), "★まとまりの 役 だけに 出す");
  const 人 = 画.slice(画.indexOf("isGroupSlot(x.slot)"), 画.indexOf("isGroupSlot(x.slot)") + 900);
  t(/<input/.test(人), "★打ち込む 枠が ある");
  t(!/\[4,|\[8,|\[12,/.test(人), "★札で 選ばせて いない");
  t(L.readPeople("37") === 37, "★37 を 受け取れる");
  t(L.readPeople("") === null, "★空は null（★0 では ない）");
  t(L.readPeople("あ") === null && L.readPeople("-1") === null, "★数でない ものは 受け取らない");

  console.log("\n④ 体の ことを 受け取って いない");
  ["体調", "condition", "throat", "voice_quality", "health", "entries"].forEach((w) =>
    t(!new RegExp(w, "i").test(画), "★「" + w + "」が ない"));

  console.log("\n⑤ 期限が 切れた 公演");
  t(L.canEditKoen({ status: "open" }) === true, "★開いて いれば 直せる");
  t(L.canEditKoen({ status: "open", valid_until: "2020-01-01" }) === false, "★期限切れは 直せない");
  t(L.canEditKoen(null) === false, "★公演が 無ければ 直せない");

  console.log("\n⑥ 但し書きが 見本の まま");
  const 見 = fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
    "00-動く見本-PC・iPad（運営）.html"), "utf8");
  const 素 = (s) => s.replace(/<[^>]*>/g, "").replace(/[\s　]+/g, "");
  [...L.CAST_NOTE, L.CAST_HOW, L.CAST_PICK_NOTE, L.CAST_EMPTY].forEach((line) =>
    t(素(見).includes(素(line)), "★見本に ある …… " + line.slice(0, 22)));

  console.log("\n⑦ 字は tx() を 通す");
  const 裸 = (生.match(/>[^<>{}\n]*[ぁ-んァ-ヶ一-龠][^<>{}\n]*</g) || [])
    .filter((s) => !/^>\s*<$/.test(s));
  t(裸.length === 0, "★JSX に 裸の 日本語が ない" + (裸.length ? "（" + 裸[0].slice(0, 30) + "）" : ""));

  console.log("\n⑧ 押す ところは 44 以上");
  const 高 = 生.match(/minHeight:\s*(\d+)/g) || [];
  t(高.length > 0, "★高さを 決めて いる（" + 高.length + "か所）");
  t(高.every((h) => Number(h.replace(/\D/g, "")) >= 44), "★どれも 44 以上");

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();
