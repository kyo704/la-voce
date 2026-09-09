// ============================================================================
// ★部屋の カメラ（★2026-09-08 の お決め「安いほうの形」／ 実装 2026-09-10）
//
//   ★出どころ 坂本さん（2026-09-10）
//     「★カメラは 追う、寄る、★奥ゆきは 付けない
//      ★『うごかす』を 押したら、★カメラを 部屋全体に 戻す
//      ★これにより、★家具を 掴んで 動かす際の 問題が、構造的に 消える」
//
//   ★★この 文書は docs/opus/ に ありません。
//     ★上の 3行が、★手元にある すべてです。★ここに 書き写しておきます。
//
//   ★★なぜ「安い」か。
//     ★1枚の 場面ぜんぶに、★1つの transform を かけるだけです。
//     ★★層ごとに 別の 速さで 動かしません（★それが「奥ゆき」です）。
//       ★奥ゆきを 付けると、★層ごとに 座標が ずれ、
//       ★家具を 掴む 位置の 計算が、★層の 数だけ 増えます。
//
//   ★★「うごかす」で 元に 戻す ことの、★本当の 意味。
//     ★★変形が かかったまま 掴むと、★指の 位置と 家具の 位置が ずれます。
//       ★getBoundingClientRect は 変形後の 大きさを 返すからです。
//     ★★うごかす あいだ カメラを 1倍・ずれ 0 に 戻せば、
//       ★変形が 恒等に なり、★ずれる 余地が ありません。
//     ★★「気をつけて 計算する」では なく、★「計算する 必要を なくす」形です。
//
//   ★見張り components/tests/room-camera.test.js
// ============================================================================

/** ★寄り具合。★1 は 部屋ぜんぶ。 */
export const ZOOM = 1.6;

/**
 * ★追いつく 速さ。
 *
 *   ★★羊の 歩く 速さと、★同じ 数から 取ります。★ここで 決めません。
 *
 *   ★★2026-09-10、★実機で こう ご報告を いただきました ──
 *     「★カメラが、羊の 移動先へ 先に 動いてしまい、
 *       ★羊が、置いてけぼりに なっています」
 *   ★★原因は 2つ ありました。
 *     ① 速さが ちがう　★羊 WALK_MS ／ カメラ 900ms（★別の 数でした）
 *     ② 進み方が ちがう ★羊は 歩くあいだ linear、★カメラは ease-in-out。
 *        ★★ease-in-out は はじめが 速いので、★先に 行きます。
 *   ★★はじめ「ゆっくりの ほうが 酔わない」と 考えて 別の 数に しました。
 *     ★逆でした。★ずれる ほうが 酔います。
 *   ★★羊が いつも 同じ 所に 見えるには、★1フレームも ずれないこと。
 *     ★同じ 数・同じ 進み方で なければ なりません。
 */
//   ★★ここに 数を 置きません。★呼ぶ側（CharacterHome）が、
//     ★羊と 同じ WALK_MS を 渡します。★lib/sheepInteriorV2.js の 1つだけです。
//   ★★ここで import しないのは、★見張りが この ファイルを
//     ★単体で 読み込むためです（★別名「@/」が 解けません）。

/**
 * ★狙う 点を、★足もとから すこし 上げる 割合（★羊の 高さに 対して）。
 *
 *   ★★羊の top は 足もとです（translate(-50%, -100%)）。
 *     ★そこを 真ん中に 置くと、★体が ぜんぶ 上半分に 寄ります。
 *   ★★体の まんなか あたりを 狙います。
 */
export const AIM_ABOVE = 0.5;

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * ★カメラの 置き場所を 出します。
 *
 *   ★返す形 { x, y, z } ── ★x・y は 場面の 幅／高さに 対する ％、★z は 倍率。
 *   ★使い方 transform: `translate(x%, y%) scale(z)` ／ transformOrigin: "0 0"
 *
 *   ★★この 順番で 掛けると、★場面の p％の 点は x + p×z ％に 来ます。
 *     ★真ん中（50％）に 置きたいので、★x = 50 − p×z です。
 *
 *   ★★端を 越えさせません。★場面の 外（何も 無い ところ）を 映しません。
 *     ★場面は [x, x + 100z] を 覆います。★箱は [0, 100] です。
 *     ★だから x ≦ 0 かつ x + 100z ≧ 100。
 *
 *   @param o.leftPct   羊の 横の 位置（★0〜100）
 *   @param o.topPct    羊の 足もとの 縦の 位置（★0〜100）
 *   @param o.sheepPct  羊の 高さ（★部屋の 高さに 対する ％）。★無ければ 0
 *   @param o.editMode  「うごかす」の あいだ true
 *   @param o.on        カメラを 使うか（★門の中だけ）
 *   @param o.zoom      倍率（★既定 ZOOM）
 */
export function cameraOf(o) {
  const opt = o || {};
  const z = typeof opt.zoom === "number" && opt.zoom > 0 ? opt.zoom : ZOOM;

  // ★★「うごかす」の あいだは、★部屋ぜんぶに 戻します。
  //   ★★これが この 形の 肝です。★変形が 恒等なら、★掴む 位置は ずれません。
  //   ★カメラを 使わない方も、★同じ 恒等です。
  if (!opt.on || opt.editMode || z <= 1) return { x: 0, y: 0, z: 1 };

  const left = Number(opt.leftPct);
  const top = Number(opt.topPct);
  // ★★位置が まだ 分からない ときは、★動かしません。★勝手に 寄りません。
  if (!Number.isFinite(left) || !Number.isFinite(top)) return { x: 0, y: 0, z: 1 };

  const sheep = Number(opt.sheepPct);
  const aimTop = top - (Number.isFinite(sheep) ? sheep * AIM_ABOVE : 0);

  const lo = 100 - 100 * z;
  return {
    x: clamp(50 - clamp(left, 0, 100) * z, lo, 0),
    y: clamp(50 - clamp(aimTop, 0, 100) * z, lo, 0),
    z
  };
}

/**
 * ★そのまま style に 入れられる形。
 *
 *   @param o.editMode 「うごかす」の あいだ true ── ★すぐ 戻します
 *   @param o.walking  羊が 歩いている あいだ true
 *
 *   ★★羊の 書き方と、★1文字ずつ 同じに すること。
 *     ★歩くあいだ　`left WALK_MS linear, top WALK_MS linear`
 *     ★止まるとき　`left WALK_MS ease-in-out, top WALK_MS ease-in-out`
 *   ★★片方だけ 直すと、★また ずれます。
 */
export function cameraStyle(cam, o) {
  const c = cam || { x: 0, y: 0, z: 1 };
  const opt = (o && typeof o === "object") ? o : { editMode: !!o };
  return {
    position: "absolute", left: 0, top: 0, right: 0, bottom: 0,
    transformOrigin: "0 0",
    transform: `translate(${c.x}%, ${c.y}%) scale(${c.z})`,
    // ★★「うごかす」に 入った 瞬間だけは、★すぐ 戻します。
    //   ★★掴んでいる あいだ 部屋が まだ 動いていると、★指と ずれます。
    transition: opt.editMode
      ? "none"
      : `transform ${Number(opt.walkMs) > 0 ? Number(opt.walkMs) : 0}ms ${opt.walking ? "linear" : "ease-in-out"}`,
    // ★★奥ゆきを 付けません。★層ごとに 別の 速さで 動かしません。
    willChange: "transform"
  };
}
