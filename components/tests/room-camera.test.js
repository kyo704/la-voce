// ============================================================================
// ★部屋の カメラの 見張り（★2026-09-10）
//
//   ★★確かめること
//     ① 「うごかす」の あいだは、★恒等（1倍・ずれ 0）で あること。
//        ★★これが、★掴む 位置が ずれない ことの すべてです。
//     ② 門の外では、★1つも 変わらないこと。
//     ③ 場面の 外（何も 無い ところ）を 映さないこと。
//     ④ 羊を 真ん中に 置くこと。
//     ⑤ 奥ゆきを 付けていないこと（★層ごとの 別の 動きが 無いこと）。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) { console.log("  ok  " + label); }
  else { console.log("  NG  " + label); failed++; }
}
function near(a, b, label) { ok(Math.abs(a - b) < 1e-6, label + "  （得た値: " + a + "）"); }

(async () => {
  const ROOT = path.join(__dirname, "..", "..");
  const src = fs.readFileSync(path.join(ROOT, "lib", "roomCamera.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const { cameraOf, cameraStyle, ZOOM } = m;
  // ★羊の 歩く 速さ。★カメラは、★これと 同じ 数・同じ 進み方で なければ なりません。
  const sheepSrc = fs.readFileSync(path.join(ROOT, "lib", "sheepInteriorV2.js"), "utf8");
  const WALK_MS = Number((sheepSrc.match(/export const WALK_MS = (\d+)/) || [])[1]);

  console.log("① 「うごかす」の あいだは 恒等");
  const moving = cameraOf({ on: true, editMode: true, leftPct: 20, topPct: 80 });
  ok(moving.x === 0 && moving.y === 0 && moving.z === 1, "★1倍・ずれ 0");
  // ★★これが 崩れると、★家具を 掴む 位置が ずれます。
  //   ★「気をつけて 計算する」では なく、★計算する 必要を なくす 形です。
  ok(/if \(!opt\.on \|\| opt\.editMode \|\| z <= 1\) return \{ x: 0, y: 0, z: 1 \};/.test(src),
    "★早い ところで 返している（★あとの 計算に 入らない）");

  console.log("② 門の外では 1つも 変わらない");
  const off = cameraOf({ on: false, leftPct: 20, topPct: 80 });
  ok(off.x === 0 && off.y === 0 && off.z === 1, "★カメラを 使わない方は 恒等");

  console.log("③ 場面の 外を 映さない");
  [[0, 0], [100, 100], [50, 50], [3, 97], [97, 3]].forEach(([L, T]) => {
    const c = cameraOf({ on: true, leftPct: L, topPct: T });
    ok(c.x <= 1e-9 && c.x >= 100 - 100 * c.z - 1e-9, `★横が はみ出さない（${L}）`);
    ok(c.y <= 1e-9 && c.y >= 100 - 100 * c.z - 1e-9, `★縦が はみ出さない（${T}）`);
  });

  console.log("④ 羊を 真ん中に");
  // ★端から 離れた 場所なら、★ちょうど 真ん中に 来ます。
  const mid = cameraOf({ on: true, leftPct: 50, topPct: 50, sheepPct: 0 });
  near(mid.x + 50 * mid.z, 50, "★横は 真ん中");
  near(mid.y + 50 * mid.z, 50, "★縦は 真ん中");
  // ★足もとでは なく、★体の まんなか あたりを 狙います。
  const feet = cameraOf({ on: true, leftPct: 50, topPct: 60, sheepPct: 20 });
  const aimed = cameraOf({ on: true, leftPct: 50, topPct: 50, sheepPct: 0 });
  ok(feet.y === aimed.y, "★足もとから 羊の 高さの 半分 上を 狙う");

  console.log("⑤ 奥ゆきを 付けていない");
  ok(!/perspective|translateZ|parallax|rotateX|rotateY/.test(src), "★奥ゆきの 語が 1つも ない");
  const st = cameraStyle(cameraOf({ on: true, leftPct: 30, topPct: 70 }), { walkMs: WALK_MS });
  ok(/^translate\(-?[0-9.]+%, -?[0-9.]+%\) scale\([0-9.]+\)$/.test(st.transform),
    "★変形は ずらす と 寄る の 2つだけ  （得た値: " + st.transform + "）");
  ok(st.transformOrigin === "0 0", "★基準は 左上（★％の 計算と 合っている）");
  ok(cameraStyle(cameraOf({ on: true, editMode: true }), { editMode: true }).transition === "none",
    "★掴んでいる あいだは、★部屋が まだ 動いていない");

  console.log("⑥ ★羊と 同じ 速さで 追う（★2026-09-10・実機のご指摘）");
  // ★★「カメラが 先に 動いて、羊が 置いてけぼりに なる」と ご報告を いただきました。
  //   ★★原因は 2つ ── ★速さが ちがう ／ ★進み方が ちがう。
  //   ★★羊は 歩くあいだ linear、★カメラは ease-in-out でした。
  //     ★ease-in-out は はじめが 速いので、★先に 行きます。
  ok(WALK_MS > 0, "★羊の 歩く 速さが 読めた（" + WALK_MS + "ms）");
  const walking = cameraStyle(cameraOf({ on: true, leftPct: 30, topPct: 70 }),
    { walking: true, walkMs: WALK_MS });
  ok(walking.transition === `transform ${WALK_MS}ms linear`,
    "★歩くあいだは、★羊と 同じ 速さ・linear  （得た値: " + walking.transition + "）");
  const still = cameraStyle(cameraOf({ on: true, leftPct: 30, topPct: 70 }),
    { walking: false, walkMs: WALK_MS });
  ok(still.transition === `transform ${WALK_MS}ms ease-in-out`,
    "★止まるときは、★羊と 同じ 速さ・ease-in-out  （得た値: " + still.transition + "）");
  // ★★数を 書き写していないこと。★羊の 側を 変えたら、★カメラも 一緒に 変わること。
  ok(!/900|EASE_MS/.test(readCode("lib", "roomCamera.js")),
    "★カメラの 側に 別の 速さを 書いていない");
  ok(/walkMs: WALK_MS/.test(readRaw("components", "CharacterHome.jsx")),
    "★画面が、★羊と 同じ WALK_MS を 渡している");
  ok(/walking: isWalking/.test(readRaw("components", "CharacterHome.jsx")),
    "★歩いているかどうかも 渡している");

  console.log("⑥ 画面の 側");
  const ui = readCode("components", "CharacterHome.jsx");
  ok(/cameraOf\(/.test(ui) && /cameraStyle\(/.test(ui), "★画面は lib に 尋ねている");
  ok(!/ZOOM|1\.6/.test(ui.slice(ui.indexOf("function RoomScene"), ui.indexOf("function RoomScene") + 6000)),
    "★倍率を 画面に 書き写していない");
  const raw = readRaw("components", "CharacterHome.jsx");
  ok(/editMode: editMode/.test(raw) || /editMode,/.test(raw), "★「うごかす」を カメラに 渡している");

  console.log("⑦ 門の外（38人）の 部屋を 変えない");
  ok(/cameraOn = false/.test(readRaw("components", "CharacterHome.jsx")),
    "★既定は 切（★渡さなければ 恒等）");
  ok((readRaw("components", "VocalTracker.jsx").match(/cameraOn=\{layoutV2\}/g) || []).length === 2,
    "★名簿に 載っている方にだけ 渡している（★2か所 とも）");
  // ★★「うごかす」の 押しどころは、★カメラの 外に 置くこと。
  //   ★中に 入れると、★寄ったとき 一緒に 大きくなり、★端で 画面の外へ 出ます。
  {
    const r = readRaw("components", "CharacterHome.jsx");
    const camAt = r.indexOf("<div style={cameraStyle(cam, {");
    const endAt = r.indexOf("      </div>\n      {(placedFurniture.length > 0");
    const btnAt = r.indexOf("setEditMode((v) => !v)", camAt);
    ok(camAt > 0 && endAt > camAt, "★カメラの 入れ物が 閉じている");
    ok(btnAt > endAt, "★「うごかす」の 押しどころは、★カメラの 外に ある");
  }

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
