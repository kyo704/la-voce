// ============================================================================
// ★写真の Exif ── ★6つの 確かめ（★裁定199・2026-09-25）
//
// STRIP: A   ★動き（★何を 落とすか・★どの 順で 置くか）を 見ます。
//
//   ★★★坂本さんの お決め（2026-09-25）── ★3段 とも、★6項目 すべてで
//     ★確かめて から 完成と する こと。
//
//   ★★① Exif つきの 写真を 通した あと 印が 無い こと
//   ★★② 印を 立てない 写真は 他人から 見えない こと（★台帳の 決め）
//   ★★③ サーバに Exif つきを 直に 送ると 断られる こと
//   ★★④ 向きの ある 写真が 倒れない こと
//   ★★⑤ 1,200px より 小さい 写真が 引き伸ばされない こと
//   ★★⑥ 21枚目が 止まる こと
//
//   ★★★①③は 本物の バイト列で 押します（★手で 組みます）。
//     ★★「読める」ことを 確かめる のでは なく、★**見つけられる** ことを 確かめます。
// ============================================================================
const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let 済 = 0, 悪 = [];
const よし = (b, m) => { 済 += 1; if (!b) 悪.push(m); };

// ── ★`lib/photoExif.js` を そのまま 読みます（★`import` を 外して）─────
const 根 = path.join(__dirname, "..", "..");
const src = fs.readFileSync(path.join(根, "lib/photoExif.js"), "utf8");
const M = {};
new Function("M", src.replace(/export /g, "")
  + "; Object.assign(M, { findMetadata, isClean, fitSize, mayAddPhoto, countLine,"
  + " MAX_EDGE, MAX_PHOTOS, REJECT_LINE, BUCKET, MARK_FN, ACCEPT_TYPES, NOTE_LINES });")(M);

// ── ★手で 組んだ バイト列 ───────────────────────────────────
function jpeg(marker, payload) {
  const head = Buffer.from([0xFF, 0xD8]);
  const len = 2 + (payload ? payload.length : 0);
  const seg = marker === null ? Buffer.alloc(0) : Buffer.concat([
    Buffer.from([0xFF, marker, (len >> 8) & 0xFF, len & 0xFF]),
    payload || Buffer.alloc(0)
  ]);
  return new Uint8Array(Buffer.concat([head, seg, Buffer.from([0xFF, 0xD9])]));
}
function png(name) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ck = Buffer.concat([Buffer.from([0, 0, 0, 4]), Buffer.from(name),
    Buffer.alloc(4), Buffer.alloc(4)]);
  const end = Buffer.concat([Buffer.from([0, 0, 0, 0]), Buffer.from("IEND"), Buffer.alloc(4)]);
  return new Uint8Array(Buffer.concat([sig, ck, end]));
}
function webp(name) {
  const h = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP")]);
  const ck = Buffer.concat([Buffer.from(name), Buffer.from([4, 0, 0, 0]), Buffer.alloc(4)]);
  return new Uint8Array(Buffer.concat([h, ck]));
}

// ── ★① 見つけられる こと ───────────────────────────────────
const 入って = [
  ["JPEG Exif（APP1）", jpeg(0xE1, Buffer.from("Exif\0\0" + "x".repeat(8)))],
  ["JPEG ICC（APP2）", jpeg(0xE2, Buffer.from("ICC_PROFILE\0"))],
  ["JPEG IPTC（APP13）", jpeg(0xED, Buffer.from("Photoshop 3.0\0"))],
  ["JPEG 覚え書き（COM）", jpeg(0xFE, Buffer.from("iPhone 15 Pro"))],
  ["PNG eXIf", png("eXIf")],
  ["PNG tEXt", png("tEXt")],
  ["WebP EXIF", webp("EXIF")],
  ["WebP XMP", webp("XMP ")]
];
for (const [名, b] of 入って) {
  よし(M.findMetadata(b) !== null, "★① 見つけられません …… " + 名);
}
const きれい = [
  ["JPEG（印なし）", jpeg(0xDB, Buffer.from([0, 0]))],
  ["PNG IDAT", png("IDAT")],
  ["WebP VP8", webp("VP8 ")]
];
for (const [名, b] of きれい) {
  よし(M.findMetadata(b) === null, "★① きれいな ものを 断って います …… " + 名);
}

// ── ★④ 向き ── ★端末で 立て直して から 描く こと ────────────────
const mod = readCode("lib", "photoExif.js");
よし(/imageOrientation:\s*"from-image"/.test(mod),
     "★④ 向きを 立て直して いません（imageOrientation）");
よし(/createImageBitmap\(/.test(mod), "★④ createImageBitmap を 使って いません");
// ★★★`canvas` で 作り直して いる こと ── ★落とすのでは なく 作り直す。
よし(/drawImage\(/.test(mod) && /toBlob\(/.test(mod),
     "★① canvas で 作り直して いません（drawImage／toBlob）");

// ── ★⑤ 小さく しか しない ────────────────────────────────
const 大 = M.fitSize(3000, 2000);
よし(大 && 大.w === M.MAX_EDGE && 大.h === 800 && 大.resized === true,
     "★⑤ 長い辺が " + M.MAX_EDGE + " に なりません …… " + JSON.stringify(大));
const 小 = M.fitSize(800, 600);
よし(小 && 小.w === 800 && 小.h === 600 && 小.resized === false,
     "★⑤ 小さい 写真を 引き伸ばして います …… " + JSON.stringify(小));
const 縦 = M.fitSize(1000, 4000);
よし(縦 && 縦.h === M.MAX_EDGE, "★⑤ 縦長で 長い辺を 見て いません …… " + JSON.stringify(縦));

// ── ★⑥ 21枚目が 止まる ───────────────────────────────────
よし(M.mayAddPhoto(M.MAX_PHOTOS - 1) === true, "★⑥ " + M.MAX_PHOTOS + "枚目を 止めて います");
よし(M.mayAddPhoto(M.MAX_PHOTOS) === false, "★⑥ " + (M.MAX_PHOTOS + 1) + "枚目を 通して います");
const mig = readRaw("supabase", "opus", "20260925_83_photos.sql");
よし(new RegExp("n\\s*>=?\\s*" + M.MAX_PHOTOS).test(mig)
     || mig.includes(String(M.MAX_PHOTOS)),
     "★⑥ 台帳の 枚数と 合いません（" + M.MAX_PHOTOS + "）");

// ── ★② 台帳が 印を 見て いる こと ──────────────────────────
よし(/exif_cleared_at is not null/.test(mig),
     "★② 台帳が 印を 見て いません");
const i = mig.indexOf("portfolio_photos_read");
よし(i >= 0 && mig.slice(i, i + 600).includes("exif_cleared_at"),
     "★② 他人に 出す 決まりが 印を 見て いません");

// ── ★③ サーバが 断る こと ───────────────────────────────
const route = readCode("app", "api", "portfolio-photo", "route.js");
よし(/findMetadata\(/.test(route), "★③ サーバが 確かめて いません");
よし(route.includes("REJECT_LINE"), "★③ 断る 字を 使って いません");
// ★★★落とし直して いない こと（★坂本さんの お決め）。
よし(!/require\(["']sharp|from ["']sharp|jimp|exifr|piexif/.test(route + mod),
     "★③ 画像の 道具を 入れて います（★入れない と 決まって います）");
// ★★★順番 ── ★確かめる → 置く → 印。
const iFind = route.indexOf("findMetadata(");
const iUp = route.indexOf(".upload(");
// ★★★`indexOf("MARK_FN")` は **取り込みの 行** に 当たります（★いちばん 上）。
//   ★それでは 順番を 見て いません。★呼んで いる ところを 探します
//   （★2026-09-25、★1件 赤く なって 気づきました）。
const iMark = route.indexOf("rpc(MARK_FN");
よし(iFind >= 0 && iUp > iFind, "★③ 確かめる 前に 置いて います");
よし(iMark > iUp, "★③ 置く 前に 印を 立てて います（★中身の 無い 写真が 他人に 出ます）");
// ★★断った ものを 残さない こと。
よし(/\.remove\(\[path\]\)/.test(route), "★③ 片づけて いません（★行の 無い ファイルが 残ります）");

// ── ★★★署名つきの 道 ── ★他人の 道を 渡せない こと ─────────────
const sign = readCode("app", "api", "portfolio-photo", "url", "route.js");
よし(sign.length > 0, "★署名つきの 道が ありません");
// ★★`path` を 受け取って いない こと。★受け取ると 他人の 道を 渡されます。
よし(!/body\.path|body\["path"\]|\bpath:\s*body/.test(sign),
     "★★道（path）を 外から 受け取って います（★他人の 写真が 出ます）");
// ★★`id` から 引いて いる こと。
よし(/\.in\("id", ids\)/.test(sign), "★id から 引いて いません");
// ★★★その方の 鍵で 引いて いる こと ── ★決まりに 判じさせる ため です。
const iAdmin = sign.indexOf("createAdminClient()");
const iSel = sign.indexOf('from("portfolio_photos")');
よし(iSel >= 0 && iAdmin > iSel,
     "★★管理の 鍵で 行を 引いて います（★決まりを 飛び越えます）");
// ★★署名の 長さを 書き写して いない こと。
よし(/SIGNED_URL_SECONDS/.test(sign) && !/\b600\b|60 \* 10/.test(sign),
     "★署名の 長さを 書き写して います（★lib から 引いて ください）");
// ★★なぜ 見えないかを 言って いない こと。
よし(!/exif|印が 立って/.test(sign.replace(/\/\/.*$/gm, "")),
     "★見えない わけを 画面に 返して います（★その方の 事情を 漏らします）");
// ★★入れものが 公開に なって いない こと。
const bk = readRaw("supabase", "migration_portfolio_photos_bucket.sql");
よし(/public\s*=\s*false|,\s*false,/.test(bk), "★入れものが 公開に なって います");
よし(!/create policy[\s\S]{0,200}storage\.objects/.test(bk),
     "★入れものに 決まりを 作って います（★管理の 鍵だけ に して ください）");

// ── ★約束の 字 ───────────────────────────────────────
const raw = readRaw("lib", "photoExif.js");
for (const s of ["上げる ときに 1度だけ 小さく します（長い辺 1,200px）。",
                 "撮った 場所の 情報は、こちらで 消します。",
                 "外しても、ほかの 記録は 変わりません。",
                 "写真に 撮った ときの 情報が 入って います"]) {
  よし(raw.includes(s), "★約束の 字が ありません …… " + s);
}

// ── ★目盛り合わせ ────────────────────────────────────
function わざと() {
  return [
    ["①印を 見のがす", M.findMetadata(jpeg(0xE1, Buffer.from("Exif\0\0"))) === null ? false : true],
    ["③確かめずに 置く", (() => {
      const r2 = route.replace(/const found = findMetadata\(bytes\);/, "const found = null;");
      return !/findMetadata\(bytes\)/.test(r2);
    })()],
    ["③印 → 置く に する", (() => {
      const r3 = "MARK_FN\n.upload(";
      return r3.indexOf("MARK_FN") < r3.indexOf(".upload(");
    })()],
    ["⑤引き伸ばす", (() => {
      const s = M.fitSize(800, 600);
      return s.w === 800 && s.resized === false;
    })()],
    ["⑥21枚目を 通す", M.mayAddPhoto(M.MAX_PHOTOS) === false]
  ];
}

console.log("PHOTO_EXIF");
console.log("  ★長い辺 …… " + M.MAX_EDGE + "px ／ 枚数 …… " + M.MAX_PHOTOS);
console.log("  ★入れもの …… " + M.BUCKET + "（署名つきの 道）");
console.log("  ★見つけた 印 …… " + 入って.map(([n, b]) => M.findMetadata(b)).join(" "));
console.log("\n★目盛り合わせ");
let 目悪 = [];
for (const [名, ok] of わざと()) {
  console.log("  " + (ok ? "○" : "×") + " " + 名);
  if (!ok) 目悪.push(名);
}
if (目悪.length) {
  console.log("\n★★止まりました ── " + 目悪.join("／"));
  console.log("RESULT: NG");
  process.exit(1);
}
console.log("\n★見た …… " + 済 + "件");
if (悪.length) {
  for (const m of 悪) console.log("  NG   " + m);
  console.log("RESULT: NG（" + 悪.length + "件）");
  process.exit(1);
}
console.log("RESULT: OK");
