/**
 * ★㋕ ── ★「ながめる で 見える ところ」の 枠（★裁定 その71・追補・2026-09-17）。
 *
 *   ★★したくでは 部屋ぜんぶが 見えます。★ながめるは 寄って 切り取ります。
 *     ★★窓の 上に 時計を 掛けても、★ながめるで 窓が 見えない ことが あります。
 *     ★★「窓の 上」という 構図を 確かめられません。★飾る 作業が 成り立ちません。
 *
 *   ★★裁定の 決め ──
 *     ・細い 破線 1本。★塗らない
 *     ・色を 使わない
 *     ・★枠の 外を 暗くしない（★「置くな」に 見えます）
 *     ・★枠の 外にも 置ける。★禁じない
 *     ・添える 1行
 *     ・★枠は `camView` から 引く（★同じ 関数）
 */
const { readCode, readRaw, loadLib } = require("./_source");

let 落ち = 0;
function t(名, 条件) {
  console.log((条件 ? "  ok   " : "  NG   ") + 名);
  if (!条件) 落ち++;
}

(async () => {
  const cam = await loadLib("lib", "roomCamera.js");
  const ch = readCode("components/CharacterHome.jsx");
  const vt = readCode("components/VocalTracker.jsx");
  const si = await loadLib("lib", "sheepInteriorV2.js");

  console.log("\n=== ① 枠は 同じ 関数から 引く ===");
  t("★visibleBandPct が ある", typeof cam.visibleBandPct === "function");
  // ★★較正 ── ★きょう 実機で 測った 帯と 合うか。
  const b = cam.visibleBandPct({ x: -30, y: -32, z: 1.6 });
  t("★★左端 18.75（★較正・実測と 一致）", Math.abs(b.left - 18.75) < 0.001);
  t("★★幅 62.5（★較正・実測と 一致）", Math.abs(b.width - 62.5) < 0.001);
  t("★上端 20", Math.abs(b.top - 20) < 0.001);
  t("★高さ 62.5", Math.abs(b.height - 62.5) < 0.001);

  console.log("\n=== ★較正 ── ★寄って いなければ 出さない ===");
  t("★★z=1 なら null（★出す 意味が ない）", cam.visibleBandPct({ x: 0, y: 0, z: 1 }) === null);
  t("★z<1 でも null", cam.visibleBandPct({ x: 0, y: 0, z: 0.8 }) === null);
  t("★空でも 落ちない", cam.visibleBandPct(null) === null);
  // ★★倍率が 上がれば、★帯は 狭く なる。★逆なら 式が 壊れて います。
  const 濃 = cam.visibleBandPct({ x: -50, y: -50, z: 2.1 });
  t("★★2.1倍の ほうが 狭い（★較正）", 濃.width < b.width);

  console.log("\n=== ② 推し量って いない ===");
  t("★ながめるの cam を 覚えて いる", /lastViewCamRef/.test(ch));
  t("★★したくで 計算し直して いない",
    /const viewBand = !cameraOn \? visibleBandPct\(lastViewCamRef\.current\) : null;/.test(ch));
  t("★覚えが 無ければ 出ない（null を 渡す）",
    /visibleBandPct\(lastViewCamRef\.current\)/.test(ch));
  t("★寄って いる あいだは 出さない", /!cameraOn \? visibleBandPct/.test(ch));

  console.log("\n=== ③ 見た目（★裁定の とおり）===");
  // ★★★枠の 札 だけ を 切ります。★周りを 混ぜません。
  //   ★★2026-09-17、★広く 切りすぎて、★隣の `inset: 0` を
  //     ★「外を 暗くして いる」と 読み違えました。★測る 場所の 誤り です。
  const 始 = ch.indexOf("{viewBand ? (");
  const 終 = ch.indexOf(") : null}", 始);
  const 塊 = 始 >= 0 && 終 > 始 ? ch.slice(始, 終) : "";
  t("★枠が ある", 塊.length > 0);
  t("★★破線 1本", /border: `1px dashed/.test(塊));
  t("★★塗って いない", /background: "transparent"/.test(塊));
  t("★★外を 暗くして いない",
    !/rgba\(0, ?0, ?0/.test(塊) && !/backdrop/.test(塊) && !/inset: 0/.test(塊));
  t("★押しどころを 奪って いない", /pointerEvents: "none"/.test(塊));
  t("★色を 使って いない（★線は inkFaint）", /C\.inkFaint/.test(塊));
  t("★★カメラの 外に ある（★枠ごと 寄らない）",
    ch.indexOf("{viewBand ? (") < ch.indexOf("cameraStyle(cam, {"));

  console.log("\n=== ④ 添える 1行 ===");
  t("★字が lib に ある", Array.isArray(si.VIEW_BAND_NOTE) && si.VIEW_BAND_NOTE.length === 2);
  t("★★「外にも 置けます」と 言って いる",
    si.VIEW_BAND_NOTE.some((l) => l.includes("外にも 置けます")));
  t("★★「置けません」と 言って いない",
    !si.VIEW_BAND_NOTE.some((l) => /置けません|置かないで|禁/.test(l)));
  t("★画面が 出して いる", /VIEW_BAND_NOTE\.map\(/.test(vt));
  // ★★★したくの ときだけ です（★2026-09-17・実機で 測って 分かりました）。
  //   ★★この 枝は 2つの 画面で 共通で、★`cameraOn` の 引数が 変わる だけ です。
  //     ★★枝を そのまま 使うと、★ながめるにも 出ます（★y=781 に 出て いました）。
  t("★★したくの ときだけ 出す",
    /\{homeState === DRESS \? \([\s\S]{0,400}VIEW_BAND_NOTE\.map\(/.test(vt));
  si.VIEW_BAND_NOTE.forEach((line) => {
    t(`★画面に 書き写して いない …「${line.slice(0, 10)}…」`, !vt.includes(line));
  });

  console.log(落ち === 0 ? "\n★すべて 通りました。" : `\n★${落ち}件 落ちました。`);
  process.exit(落ち === 0 ? 0 : 1);
})();
