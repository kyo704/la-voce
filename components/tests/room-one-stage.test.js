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

  t("★① small を 受け取らない", /^function bigRoom\(\)\s*\{/.test(body));
  const vbs = [...new Set([...body.matchAll(/viewBox="(0 0 360 \d+)"/g)].map((m) => m[1]))];
  t(`★② viewBox は 1つ（${vbs.join(" / ")}）`, vbs.length === 1);
  t("★② その 1つは 730", vbs[0] === "0 0 360 730");
  t("★③ 床を 出し分けない", /var fy=352, ht=730;/.test(body));
  t("★③ small の 三項が 無い", !/small\s*\?/.test(body));
  t("★④ meet（収める）", /preserveAspectRatio="xMidYMid meet"/.test(body));
  t("★④ slice（切り取る）に 戻して いない", !/slice/.test(body));
  t("★⑤ 家具を 出し分けない", !body.replace(/\s/g, "").includes("if(!small)"));
  t("★⑥ 押せる ところは SVG の 中",
    /<rect x="234" y="256" width="112" height="92" fill="transparent"/.test(body));
  t("★⑥ 入れ物の ％で 置いて いない", !/style="left:\d+%;top:\d+%/.test(body));

  // ★★帯は CSS の 側 です。★`bigRoom` の 外を 見ます。
  const 帯 = /background:linear-gradient\(var\(--wall\) 0 48\.219%,var\(--floor\) 48\.219% 100%\)/g;
  const 数 = (src.match(帯) || []).length;
  t(`★⑦ 帯を 壁と 床で 埋めて いる（${数} か所 ── hroom と hcard）`, 数 === 2);
  t("★⑦ hhit の 札を 使って いない", !src.includes('class="hhit"'));

  // ★★呼ぶ 側にも 引数が 残って いない こと。
  t("★呼ぶ 側に bigRoom(1) / bigRoom(0) が 無い",
    !src.includes("bigRoom(1)") && !src.includes("bigRoom(0)"));
});

console.log(落ち === 0 ? "\n★すべて 通りました。" : `\n★${落ち}件 落ちました。`);
process.exit(落ち === 0 ? 0 : 1);
