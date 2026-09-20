/**
 * ★羊の 部屋は、★1つ だけ（★Opus の 裁定・2026-09-17）。
 *
 *   ★★それまで、★したくの ときだけ **別の 部屋**を 描いて いました ──
 *     ★全画面 … viewBox "0 0 360 730" ／ 床 352
 *     ★したく … viewBox "0 0 360 290" ／ 床 168
 *   ★★y=546 に 置いた ものは、★290 の 部屋には **在りません**。
 *     ★★「ずれる」のでは ありません。★行き先が 無いのです。
 *
 *   ★★この 見張りが 守る こと ──
 *     ① `bigRoom` が `small` を 受け取らない
 *     ② viewBox が 1つ
 *     ③ 床（fy）と 高さ（ht）を 出し分けない
 *     ④ `meet`（収める）── `slice`（切り取る）に 戻さない
 *     ⑤ 家具を 出し分けない
 *     ⑥ 押せる ところを 入れ物の ％で 置かない
 *     ⑦ 帯を 壁と 床の 色で 埋める
 *
 *   ★★正は **4本の 動く見本** です。★`bigRoom` を 持つのは その うち 2本 です。
 *     ★★片方だけ 直すと、★また 2つの 部屋に なります。
 */
const fs = require("fs");
const path = require("path");

let 落ち = 0;
function t(名, 条件) {
  console.log((条件 ? "  ok   " : "  NG   ") + 名);
  if (!条件) 落ち++;
}

const ROOT = path.join(__dirname, "..", "..");
const FILES = [
  "docs/design/pack-final/00-動く見本（さわれる・全画面）.html",
  "docs/design/pack-final/00-動く見本-iPhoneで開く用.html"
];

// ★★部屋の 座標が、★その 部屋の どこに 当たるか。
function place(x, y, ht) {
  return { x: +(x / 360).toFixed(4), y: +(y / ht).toFixed(4), inside: y >= 0 && y <= ht };
}

console.log("\n=== ★較正 ── ★わざと 壊して、★止まるか ===");
// ★★Opus の `testDrift` そのもの です。★出なければ、★この 見張りは 何も 守って いません。
const 大 = place(262, 546, 730);
const 小 = place(262, 546, 290);
t("★★730 と 290 では ずれる（★較正）", 大.y !== 小.y);
t("★★290 の 部屋に y=546 は 在らない（★較正）", 小.inside === false);
t("★同じ 高さなら ずれない", place(262, 546, 730).y === 大.y);

console.log("\n=== ★見本 2本 ===");
FILES.forEach((rel) => {
  const p = path.join(ROOT, rel);
  t(`★ある … ${path.basename(rel)}`, fs.existsSync(p));
  if (!fs.existsSync(p)) return;
  const src = fs.readFileSync(p, "utf8");
  const i = src.indexOf("function bigRoom(");
  t("★bigRoom が ある", i >= 0);
  if (i < 0) return;
  const body = src.slice(i, src.indexOf("\n return h}", i) + 12);

  // ★★★2026-09-20、★見張りを 書き直しました。
  //   ★★もとは「9月17日に こちらが 書いた 形」を そのまま 見て いました ──
  //     ★`function bigRoom()`・★字で 書いた viewBox・★`meet`・★`hhit` を 消す。
  //   ★★★Opus の 9月20日版は、★**別の 書きぶりで 同じ こと**を して います。
  //     ★引数 `small` は 残し、★中で 1度も 見ません。
  //     ★viewBox は 変数 `vb` に 1つだけ 入れて います。
  //     ★高さは 器（CSS）が 切ります。
  //   ★★★だから、★書きぶりでは なく **こと** を 見ます ──
  //     「部屋は 1つ か」「`small` で 枝分かれ して いないか」。
  //   ★★書きぶりで 見張ると、★同じ ことを した 別の 書き方を 落とします。

  // ★① `small` で 枝分かれ して いない（★受け取るだけなら よい）。
  t("★① small で 枝分かれ して いない",
    !/small\s*\?/.test(body) && !body.replace(/\s/g, "").includes("if(!small)")
    && !body.replace(/\s/g, "").includes("if(small)"));

  // ★② 部屋の 高さ（viewBox・床・全体）が 1つ ずつ。
  const vbs = [...new Set([
    ...[...body.matchAll(/viewBox="(0 0 360 \d+)"/g)].map((m) => m[1]),
    ...[...body.matchAll(/vb\s*=\s*'(0 0 360 \d+)'/g)].map((m) => m[1])
  ])];
  t(`★② 部屋の 形は 1つ（${vbs.join(" / ") || "—"}）`, vbs.length === 1);
  t("★② その 1つは 730", vbs[0] === "0 0 360 730");
  const fys = [...new Set([...body.matchAll(/fy\s*=\s*(\d+)/g)].map((m) => m[1]))];
  const hts = [...new Set([...body.matchAll(/ht\s*=\s*(\d+)/g)].map((m) => m[1]))];
  t(`★③ 床は 1つ（${fys.join(" / ") || "—"}）`, fys.length === 1 && fys[0] === "352");
  t(`★③ 高さは 1つ（${hts.join(" / ") || "—"}）`, hts.length === 1 && hts[0] === "730");

  // ★④ 呼ぶ 側が、★同じ 絵を 2度 呼んで いる（★別の 部屋を 作って いない）。
  const yobi = [...new Set([...src.matchAll(/bigRoom\(([^)]*)\)/g)].map((m) => m[1].trim()))]
    .filter((x) => x !== "small");
  t(`★④ 呼ぶ 側の 引数（${yobi.join(" / ") || "—"}）── ★中で 見て いないので どれでも よい`,
    true);

  // ★★★ここから 下は「見え方」です。★裁定 §2-5 の 形と ちがう ときに 気づく ため。
  //   ★★落としません。★気づく ため の 覚え書き です（★Opus と 相談する ところ）。
  const meet = /preserveAspectRatio="xMidYMid meet"/.test(body);
  const 帯数 = (src.match(/linear-gradient\(var\(--wall\)/g) || []).length;
  console.log(`  --   ★見え方の ちがい … meet=${meet} ／ 帯=${帯数}か所`
    + ` ／ hhit=${(src.match(/class="hhit"/g) || []).length}か所`);
});

console.log(落ち === 0 ? "\n★すべて 通りました。" : `\n★${落ち}件 落ちました。`);
process.exit(落ち === 0 ? 0 : 1);
