// ============================================================================
// ★部屋の 舞台 ── ★比を 決めて、★箱に 合わせて 切り抜く（★2026-09-14）
//
//   ★出どころ 2026-09-14、★坂本さん ──
//     「★したくの 画面は、★ながめるの 画面と 別々に 計算された
//       ★似た 見た目では なく、★**同じ 場面を そのまま 拡大して 切り抜いた もの**
//       ★に して ほしい」。
//
//   ★★なぜ 要るか。
//     ★★家具の 縦位置は「★箱の 高さに 対する ％」でした。
//     ★★ところが、★箱の 比が 2つの 画面で ちがいました ──
//       ★ながめる … 画面いっぱい。★高さは 端末しだい
//       ★したく　 … `aspectRatio: 4/3` の 固定
//     ★★同じ ％でも、★比が ちがえば 床の 線からの 見え方が ずれます。
//     ★★羊の 大きさも 同じ ％で 渡して いました ──
//       ★ながめる 390×634 → 29.4％ ／ したく 390×293 → **63.5％**
//       ★★同じ 羊なのに 倍 ちがいます。★カメラが 余計に 上を 向きました。
//
//   ★★きょう 起きた ずれは「別々の 計算」では ありません。
//     ★**同じ 計算に、★ちがう 箱を 渡して いた** ことでした。
//
//   ★★直し方。★中身を **比の 決まった 1枚の 舞台**に 載せ、
//     ★舞台ごと 箱に 合わせて 拡大し、★はみ出しを 切ります。
//     ★★そう すると、★％は どの 画面でも 同じ 場所に なります。
//       ★合わせ込みでは なく、★**形で** そろいます。
//
//   ★★引き換え。★縦長の 端末では、★上下か 左右が 切れます。
//     ★★それが「切り抜き」です（★2026-09-14・坂本さんの お決め ㋐）。
//
//   ★★`lib/roomCamera.js` と `lib/sheepInteriorV2.js` は 触りません。
//     ★舞台の 比が 決まれば、★あちらの 数は そのままで 合います。
//
//   ★見張り components/tests/room-stage.test.js
// ============================================================================

/**
 * ★舞台の 比（★幅 ÷ 高さ）。
 *
 *   ★★7:5 に します。★「広い 部屋」の 札が これまで 使って いた 比です
 *     （★`aspectRatio: "7 / 5"`）。★ふつうの 部屋は 4:3 でした。
 *   ★★広い ほうに そろえます。★横に 長い ほうが、★家具を 置けます。
 *   ★★1つ だけ 持ちます。★部屋の 広さで 変えません。
 *     ★★変えると、★また 2つの 比が できます。★それが 元の 不具合でした。
 */
export const STAGE_ASPECT = 7 / 5;

/**
 * ★箱に 合わせた、★舞台の 大きさ。
 *
 *   ★★箱を **覆う** 大きさに します（★はみ出しは 切ります）。
 *     ★★余白を 作りません。★壁の 外の 色が 見えると、★部屋に 見えません。
 *
 *   ★boxW・boxH … 箱の 実寸（★`offsetWidth` / `offsetHeight`）
 *   ★返り … `{ w, h }`（★どちらも 実寸）
 */
/**
 * ★舞台を、★箱の 中に **収める** 大きさ（★切りません）。
 *
 *   ★★`stageSize` は 箱を 覆います（★はみ出しを 切ります）。
 *     ★★ながめるの 箱は 縦長です。★覆うと 横の 半分以上が 切れます。
 *       ★2026-09-14、★実際に そう なりました（★窓だけが 画面いっぱい）。
 *   ★★こちらは 収めます。★部屋ぜんぶが 見えます。
 *     ★★余った ところは、★壁の 色と 床の 色で 伸ばします。
 *       ★★舞台の 上は 壁、★下は 床です。★色を そのまま 続ければ、
 *         ★背の 高い 部屋に 見えます。★継ぎ目は 出ません。
 *     ★★家具は 舞台の ％の ままです。★足もとは ずれません。
 */
export function stageFit(boxW, boxH, aspect) {
  const a = Number(aspect) > 0 ? Number(aspect) : STAGE_ASPECT;
  const w = Number(boxW);
  const h = Number(boxH);
  if (!(w > 0) || !(h > 0)) return { w: 0, h: 0 };
  // ★★箱の ほうが 横に 長ければ、★高さを 合わせます（★左右に 余ります）。
  if (w / h >= a) return { w: h * a, h: h };
  // ★★箱の ほうが 縦に 長ければ、★幅を 合わせます（★上下に 余ります）。
  return { w: w, h: w / a };
}

/**
 * ★舞台の 外を、★壁の 色と 床の 色で 伸ばす ための 形。
 *
 *   ★★返すのは 2枚 ── ★上（壁）と 下（床）。
 *   ★★舞台が 箱に ぴったりなら、★どちらも 高さ 0 です。
 *
 *   ★floorBottomPct … 舞台の 中で、★床が 占める 高さ（★％）
 */
export function stageBleed(boxW, boxH, aspect, floorBottomPct) {
  const f = stageFit(boxW, boxH, aspect);
  const h = Number(boxH);
  if (!(f.h > 0) || !(h > f.h)) return { topH: 0, bottomH: 0 };
  const gap = (h - f.h) / 2;
  return { topH: gap, bottomH: gap, floorPct: Number(floorBottomPct) || 0 };
}

export function stageSize(boxW, boxH, aspect) {
  const a = Number(aspect) > 0 ? Number(aspect) : STAGE_ASPECT;
  const w = Number(boxW);
  const h = Number(boxH);
  if (!(w > 0) || !(h > 0)) return { w: 0, h: 0 };
  // ★★箱の ほうが 横に 長ければ、★幅を 合わせます（★上下が 切れます）。
  if (w / h >= a) return { w: w, h: w / a };
  // ★★箱の ほうが 縦に 長ければ、★高さを 合わせます（★左右が 切れます）。
  return { w: h * a, h: h };
}

/**
 * ★舞台を 箱の まんなかに 置く ための 形。
 *
 *   ★★`position:absolute` と 中央寄せ だけ です。★変形は かけません。
 *     ★★変形（カメラ）は、★舞台の **中**で かかります。
 *       ★外で かけると、★掴む 位置が ずれます（★2026-09-08 の 直し）。
 */
export function stageStyle(boxW, boxH, aspect, focusLeftPct) {
  const s = stageSize(boxW, boxH, aspect);
  if (!(s.w > 0)) {
    // ★★まだ 測れて いません。★箱ぜんぶを 使います。
    //   ★★ここで 見当の 数を 置きません。★見当は ずれの もとです。
    return { position: "absolute", inset: 0 };
  }
  const dx = stageShiftX(boxW, s.w, focusLeftPct);
  const dy = stageShiftY(boxH, s.h);
  return {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: s.w,
    height: s.h,
    transform: "translate(-50%, -50%) translate(" + dx + "px, " + dy + "px)",
    willChange: "transform"
  };
}

/**
 * ★舞台を 横に ずらす 量（★px）。
 *
 *   ★★舞台が 箱より 広い とき、★見えるのは 舞台の 一部だけ です。
 *     ★★羊は 舞台の 16％〜84％ を 歩きます（★`SHEEP_WANDER`）。
 *       ★まんなかだけ 見せると、★端に 行った 羊が 消えます。
 *     ★★だから、★見たい ところ（★羊）が まんなかに 来るように ずらします。
 *
 *   ★★これは カメラの 仕事に 見えますが、★切り抜いて いるのは 舞台です。
 *     ★★カメラは 舞台の **中**で 動きます。★舞台の 外へは 出られません。
 *     ★★だから、★外側の ずれは ここで 持ちます。
 *
 *   ★★端では 止めます。★舞台の 外（★何も 無い ところ）を 見せません。
 *
 *   ★focusLeftPct … 見たい ところ（★舞台の 幅に 対する ％）。★無ければ まんなか。
 */
export function stageShiftX(boxW, stageW, focusLeftPct) {
  const b = Number(boxW);
  const w = Number(stageW);
  if (!(b > 0) || !(w > b)) return 0;
  const f = Number(focusLeftPct);
  if (!Number.isFinite(f)) return 0;
  // ★まんなかから、★見たい ところまでの ずれ（★px）。
  const want = (50 - f) / 100 * w;
  // ★端で 止める 量。★舞台が はみ出して いる ぶんの 半分です。
  const lim = (w - b) / 2;
  return Math.max(-lim, Math.min(lim, want));
}

/**
 * ★舞台を 縦に ずらす 量（★px）。
 *
 *   ★★縦は 動かしません。★床の 線の 高さが 変わって 見えます。
 *     ★★はみ出す ときは、★**上**を 切ります。★床を 残します。
 *       ★羊が 立つのは 床です。★床が 切れると 足もとが 消えます。
 */
export function stageShiftY(boxH, stageH) {
  const b = Number(boxH);
  const h = Number(stageH);
  if (!(b > 0) || !(h > b)) return 0;
  return (h - b) / 2;
}
