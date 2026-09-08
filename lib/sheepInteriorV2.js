import index from "@/docs/assets/sheep-interior-index.json";

// ============================================================================
// おうちの内装 120点（第2〜5便・2026-09-08）
//
//   ★出どころ assets/wardrobe-v3 の zip の中の acnh/interior/
//            （★中身の説明は、その zip の README.md が正です）
//
//   ★★いまの101点（lib/character.js の SHOP_ITEMS）とは、★別のものです。
//     ★鍵が、★1つも重なりません（★2026-09-08 に数えました）。
//     ★★だから「差し替え」ではなく、★足す形になります。
//     ★101点をどうするかは、まだ決まっていません
//       （docs/reports/2026-09-08-おうちの道具79点の行く先.md）。
//
//   ★★大きさが、★5種類あります。★1024 の1種類ではありません。
//     家具・庭・壁掛け・昭和   320×320  ★床に接する位置は y300
//     窓枠                     384×384  ★中は抜いてある（景色が透ける）
//     扉                       320×512
//     窓の外の景色             480×320
//     壁・床のタイル           256×256  ★敷き詰め用
//
//   ★★窓は「枠」と「景色」の★2枚です。
//     ★13枠 × 13景色 ＝ ★169通り。
//     ★重ね順は ★景色（view）→ 枠（window）。★枠が上です。
//
//   ★見張り components/tests/sheep-interior-v2.test.js
// ============================================================================

export const INTERIOR_INDEX = index;
export const INTERIOR_ITEMS = index.items;
export const INTERIOR_BASE = "/sheep/";

/** ★分類。★並べる順です（★探す順であって、描く順ではありません）。 */
export const INTERIOR_CATEGORIES = Object.freeze([
  { key: "furniture", label: "家具" },
  { key: "showa", label: "昭和の家具" },
  { key: "window", label: "窓枠" },
  { key: "view", label: "窓の外" },
  { key: "door", label: "扉" },
  { key: "wallart", label: "壁かけ" },
  { key: "garden", label: "庭の置物" },
  { key: "tile", label: "壁と床" }
]);

export function categoryLabel(key) {
  const c = INTERIOR_CATEGORIES.find((x) => x.key === key);
  return c ? c.label : key;
}

export function interiorItemByKey(key) {
  return INTERIOR_ITEMS.find((i) => i.key === key) || null;
}

export function interiorSrc(item) {
  return item ? INTERIOR_BASE + item.file : null;
}

export function itemsByCategory(category) {
  return INTERIOR_ITEMS.filter((i) => i.category === category);
}

/**
 * ★床に接する位置（★zip の README より）。
 *
 *   ★「家具は y300 が床の線です。320の画像の下20pxは余白なので、
 *     ★床のラインに y300 を合わせて置いてください。全点そろえてあります。」
 *
 *   ★★数を、ここ1か所で持ちます。★画面で書かないこと。
 */
export const FLOOR_LINE_Y = 300;
export const FURNITURE_CANVAS = 320;

/**
 * ★その絵の、床に着く線（★実測）。
 *
 *   ★★2026-09-08、★どの絵も y300 だとして置いていました。
 *     ★README に「全点そろえてあります」と書かれていたためです。
 *   ★★実際に測ったところ、★そろっていませんでした。
 *     家具 247 / 301 / 309　　庭 289〜311　　昭和 181〜309
 *     ★★扉は 503（★512の絵）。★300 を当てると、★2割ちかく浮きます。
 *     ★実機で「扉が壁に接していない」とご指摘をいただきました。
 *   ★★だから、★1点ずつの実測値（floorY）を使います。
 *     ★名簿に入っています。★無いときだけ FLOOR_LINE_Y に戻します。
 */
export function floorLineOf(item) {
  if (item && typeof item.floorY === "number") return item.floorY;
  return FLOOR_LINE_Y;
}

/** ★その絵の、下端から床の線までの割合（★置くときに使います）。 */
export function floorOffsetRatio(item) {
  const h = item && item.size ? item.size[1] : FURNITURE_CANVAS;
  return (h - floorLineOf(item)) / h;
}

/**
 * ★大きさの単位（★2026-09-08・坂本さんのご指摘）。
 *
 *   ★★「窓枠・庭・景色の大きさが合わない」とご指摘をいただきました。
 *     ★そのとおりでした。★分類ごとに、ばらばらの％を決め打ちしていました。
 *       家具22％　昭和22％　庭15％　壁かけ12％　扉16％　窓26％
 *     ★★どれも同じ 320 の絵なのに、★庭だけ小さく出していました。
 *   ★★だから、★1画素あたりの大きさを、★1つに決めます。
 *     ★絵の幅 × この単位 ＝ 部屋に対する％。
 *     ★320 の絵は 22％、★384 の窓枠は 26.4％、★512 の扉も 320幅なので 22％。
 *   ★★これで、★同じ大きさで描かれたものは、★同じ大きさに出ます。
 */
export const WIDTH_PER_CANVAS_PX = 22 / 320;

/**
 * ★置き場所の種類（★2026-09-08・Opus の placement-120.json）。
 *
 *   ★★9種類あります。★こちらでは決めません。★名簿が正です。
 *     ceiling　 天井から下げる　　7点
 *     wall　　　壁に掛ける　　　 13点
 *     tabletop　台の上に置く　　　3点
 *     floor　　 床に置く　　　　 35点
 *     structure 建物の一部　　　　1点
 *     outside　 外（★いちばん奥）14点
 *     opening　 窓枠・扉　　　　 25点
 *     view　　　窓の外の景色　　 13点
 *     surface　 壁材・床材　　　　9点
 *
 *   ★★2026-09-08 まで、★天井のものも 壁のものも、★床に置いていました。
 *     ★名簿に、その分けが 無かったためです。
 *     ★実機で「電球が床に置かれる」とご指摘をいただきました。
 */
export const PLACEMENTS = Object.freeze([
  "outside", "surface", "view", "opening", "wall", "structure",
  "floor", "tabletop", "ceiling"
]);

/**
 * ★基準点（★どこを合わせて置くか）。
 *
 *   ★★Opus の決め
 *     floor / tabletop / outside … bottom-center（★足もと）
 *     ceiling　　　　　　　　　　… top-center（★上端）
 *     wall / opening / view　　　… center（★まん中）
 *     surface　　　　　　　　　　… tile（★敷き詰め）
 */
export const ANCHORS = Object.freeze({
  floor: "bottom-center", tabletop: "bottom-center", outside: "bottom-center",
  ceiling: "top-center",
  wall: "center", opening: "center", view: "center",
  structure: "bottom-center", surface: "tile"
});

export function placementOf(item) {
  return (item && item.placement) || "floor";
}

export function anchorOf(item) {
  if (item && item.anchor) return item.anchor;
  return ANCHORS[placementOf(item)] || "bottom-center";
}

/**
 * ★重ね順（★小さい順に描く・Opus の決め）。
 *
 *   ★★羊は floor と同じ帯（70）に入れ、★足もとの y で 前後を決めます。
 *     ★だから、★羊の z は 決め打ちに しません（★13番）。
 */
export const SHEEP_Z_BAND = 70;

export function zOf(item) {
  return (item && typeof item.z === "number") ? item.z : 70;
}

/**
 * ★実際に使う重ね順。
 *
 *   ★★Opus の決め ── 羊は floor と同じ帯（70）に入れ、
 *     ★★足もとの y で 前後を決めます。
 *
 *   ★★だから、★帯の中に「足もとのぶん」の幅が要ります。
 *     ★z を100倍し、★足もとの％（0〜100）を足します。
 *       outside 500 ／ 壁材 1000 ／ view 2000 ／ opening 3000 ／ wall 4000
 *       structure 6000 ／ ★floor・tabletop・羊 7000＋足もと ／ ceiling 9000
 *   ★★これで、★帯の順は そのまま、★床の中だけで 前後が付きます。
 *
 *   ★★2026-09-08 まで、★羊は z=6 の決め打ちでした。
 *     ★窓が z=30 なので、★羊が 窓の後ろに隠れていました。
 *     ★実機でご報告をいただきました。★そのとおりです。
 *
 *   @param band    帯（★zOf の値）
 *   @param feetPct 足もとの高さ（★部屋の上からの％。★無ければ 0）
 */
export function zIndexOf(band, feetPct) {
  const b = typeof band === "number" ? band : 70;
  const f = typeof feetPct === "number" && Number.isFinite(feetPct)
    ? Math.max(0, Math.min(100, feetPct)) : 0;
  return b * 100 + Math.round(f);
}

/**
 * ★場面の いちばん上（★2026-09-08 夜）。
 *
 *   ★★場面の上に乗せる操作ボタン（★「うごかす」など）は、
 *     ★★場面のどの品物よりも 前に出ていなければ なりません。
 *
 *   ★★もとは CharacterHome に UI_CHROME_Z = 10 と 書いてありました。
 *     ★そこには「場面の要素は front(6) を超えてはいけない」と ありました。
 *     ★★内装を入れたときに、★その約束が こわれました。
 *       ★内装の帯は 500〜9100、★羊は 7000台です。
 *     ★★だから「うごかす」が、★床材や壁材の 後ろに 隠れていました。
 *       ★押せてはいましたが（★内装は pointerEvents:none）、★見えません。
 *
 *   ★★数を、決め打ちしません。★荷物の帯から 数えます。
 *     ★新しい帯が届いても、★ここが 勝手に 追いつきます。
 */
const MAX_BAND = INTERIOR_ITEMS.reduce(
  (m, i) => Math.max(m, zOf(i)), SHEEP_Z_BAND
);
export const SCENE_MAX_Z = zIndexOf(MAX_BAND, 100);
export const UI_CHROME_Z = SCENE_MAX_Z + 100;

/**
 * ★羊が歩く範囲（★2026-09-08・坂本さんのご指摘）。
 *
 *   ★★もとは 左右 50±18（★32〜68）でした。★画面の まん中3分の1だけです。
 *     ★実機で「まん中しか歩かない」とご指摘をいただきました。★そのとおりです。
 *
 *   ★★端まで歩けるようにします。★ただし、★壁にめり込ませないこと。
 *     ★羊は 部屋の幅の およそ19％。★まん中で置くので、半分の 9.5％が はみ出ます。
 *     ★だから、★左右に 12％ ずつ 残します。
 *
 *   ★★縦は、★床の帯（67〜97）の中で 動かします。
 *     ★★これで、★手前と奥が 生まれます。★重ね順が、足もとの y で 決まるためです。
 */
/**
 * ★羊の大きさ（★2026-09-08 夕・坂本さんのご要望）。
 *
 *   ★★「小さすぎる。★あつ森のように、もっと大きく」とのことでした。
 *   ★★92 → 140。★部屋の幅の およそ29％です。
 *     ★★これ以上 大きくすると、★歩ける幅が 狭くなります。
 *       ★羊が広いほど、★壁に めり込まない範囲が 減るためです。
 *   ★歩ける範囲（下）と、★合わせて 決めてあります。
 */
export const SHEEP_SIZE = 140;

export const SHEEP_WANDER = Object.freeze({
  centerLeft: 50,
  rangeLeft: 34,     // ★16〜84。★左右の端まで（★羊が140なので、少し内側）
  centerTop: 80,
  rangeTop: 10       // ★70〜90。★床の帯の中
});

/** ★羊の重ね順。★床のものと、同じ帯・同じ物差しです。 */
export function sheepZIndex(feetPct) {
  return zIndexOf(SHEEP_Z_BAND, feetPct);
}

/**
 * ★置く高さ（★部屋の上からの％）。
 *
 *   ★★天井のものは 上、★壁のものは 壁の帯、★床のものは 床の線。
 *   ★★これまで、★どれも 床に置いていました。
 */
export const CEILING_TOP_PCT = 2;      // ★天井から下げるものの、上端
export const WALL_CENTER_PCT = 30;     // ★壁に掛けるものの、まん中
export const TABLETOP_FEET_PCT = 74;   // ★台の上に置くものの、足もと
export const OUTSIDE_FEET_PCT = 66;    // ★外のものの、足もと（★床の線）

/**
 * ★置いてよい高さの帯（★部屋の上からの％）。
 *
 *   ★★2026-09-08、★一度でも動かすと、★家具が宙に浮きました。
 *     ★置き場所は「top が入っていないときだけ、床の線から出す」形でした。
 *     ★動かすと top が入るので、★床の線を見なくなっていました。
 *     ★実機で「置きかたが むずかしい」とご報告をいただきました。
 *
 *   ★★だから、★落とした先を、★帯の中に収めます。
 *     ★床のものは、★足もとが「床の帯」に入るところまで。
 *     ★壁のものは、★「壁の帯」の中まで。
 *   ★★これで、★もう浮きません。★床から離れることが、ありません。
 *
 *   ★床は、部屋の下から34％（★CharacterHome の ROOM_FLOOR_LINE = 66 と同じ）。
 */
export const FLOOR_BAND = Object.freeze([67, 97]);   // ★足もとの高さ（％）
export const WALL_BAND = Object.freeze([5, 58]);     // ★壁のものの上端（％）

export function clampToBand(v, band) {
  const [lo, hi] = band;
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.max(lo, Math.min(hi, v));
}

/** ★左右も、部屋の外へ出しません。★出ると、二度と掴めません。 */
export const LEFT_BAND = Object.freeze([6, 94]);

/** ★その絵の、部屋に対する幅（％）。★画面で決め打ちしないこと。 */
export function widthPctOf(item) {
  const w = item && item.size ? item.size[0] : FURNITURE_CANVAS;
  return w * WIDTH_PER_CANVAS_PX;
}

/**
 * ★右の壁に、ぴったり寄せる left（％）。
 *
 *   ★★2026-09-08、★扉が「壁に接していない」とご指摘をいただきました。
 *     ★★縦は合っていました（★実測 0.00％のずれ）。★横でした。
 *     ★扉の絵は 320 幅で、★中身は x14〜306。★右に13画素の余白があります。
 *     ★★left=89％ だと、★中身の右端は 99.11％。★0.89％ 内側に浮きます。
 *   ★★だから、★絵の端ではなく、★中身の端を、壁に合わせます。
 *     ★中身の範囲は、★名簿に入れました（contentX）。★1点ずつ実測した値です。
 */
export function flushRightLeftPct(item) {
  const w = widthPctOf(item);
  const cw = item && item.size ? item.size[0] : FURNITURE_CANVAS;
  const cx = item && Array.isArray(item.contentX) ? item.contentX : [0, cw];
  // ★中身の右端が 100％ に来る left。★中心で置くので、幅の半分を足します。
  return 100 - (cx[1] / cw) * w + w / 2;
}

// ---------------------------------------------------------------------------
// ★窓（★枠 ＋ 景色 ＝ 169通り）
// ---------------------------------------------------------------------------

/**
 * ★窓の重ね順。
 *
 *   ★★景色を先に描き、★枠を上に重ねます。
 *     ★枠の中は抜いてあるので、★景色が透けます。
 *   ★★逆にすると、★枠が景色に隠れます。
 */
export const WINDOW_LAYER_ORDER = Object.freeze(["view", "window"]);

export function windowFrames() {
  return itemsByCategory("window");
}

export function windowViews() {
  return itemsByCategory("view");
}

/**
 * ★いま選んでいる窓の、2枚。
 *
 *   ★★2026-09-08、★決めが変わりました（坂本さんの決め）。
 *     ★もとは「片方だけでも出す」でした。
 *     ★★ですが、★枠は 384×384、★景色は 480×320 で、★縦横比が違います。
 *       ★片方だけ置くと、★大きさが合わず、★おかしく見えます。
 *     ★★だから、★2枚そろって、はじめて1つの窓とします。
 *       ★片方だけのときは、★1枚も出しません。
 *
 * @param {object} chosen  { window: 鍵, view: 鍵 }
 */
/**
 * ★窓の既定（★2026-09-08・坂本さんの決め）。
 *
 *   ★★もとは「2枚そろわなければ、1枚も出さない」でした。
 *     ★★片方だけ選ぶと、★窓が消えます。★壁に穴が空いたように見えます。
 *   ★★だから、★いつも1組（枠1つ・景色1つ）にします。
 *     ★選んでいないほうは、★既定で埋めます。
 *     ★★「何も無い」を作らないこと。★おうちには、窓が要ります。
 */
export const DEFAULT_WINDOW = "window_01";
export const DEFAULT_VIEW = "view_01";

export function windowLayers(chosen) {
  const c = chosen || {};
  // ★★選んでいないほうは、★既定で埋めます。★片方だけにしません。
  const frame = interiorItemByKey(c.window) || interiorItemByKey(DEFAULT_WINDOW);
  const view = interiorItemByKey(c.view) || interiorItemByKey(DEFAULT_VIEW);
  if (!frame || !view) return [];
  return WINDOW_LAYER_ORDER.map((k) => (k === "window" ? frame : view));
}

/**
 * ★窓が、そろっているか。
 *   ★★画面が「あと片方です」と伝えるために使います。★黙らないためです。
 */
export function windowReady(chosen) {
  // ★★いつも1組です（★既定で埋めます）。★そろっていない状態は、ありません。
  return windowLayers(chosen).length === 2;
}

/**
 * ★いま出ている窓の、枠と景色。
 *   ★★選んでいなくても、★既定が返ります。★画面の印に使います。
 */
export function currentWindow(chosen) {
  const c = chosen || {};
  return {
    window: c.window || DEFAULT_WINDOW,
    view: c.view || DEFAULT_VIEW
  };
}

/**
 * ★枠の「抜けているところ」（★穴）。★1枚ずつ実測しました。
 *
 *   ★★2026-09-08、★どの枠も 74% だとして景色を置いていました。
 *     ★実測すると、★13枚とも違いました。
 *
 *       ふつうの枠　　0.805〜0.867（★ほぼ正方形・まん中）
 *       window_09 　　0.617（★小さい丸窓）
 *       window_11 　　幅0.867 × ★高0.302（★上から0.633 の、低くて横長）
 *       window_10 　　★穴ではなく、すりガラス（半透明）でした
 *
 *   ★★だから「割合を1つ」では、★合うはずがありませんでした。
 *     ★実機で「枠と景色が、まるで合っていない」とご指摘をいただきました。
 *
 *   ★★いまは、★穴の四角に、★景色を切り抜いてはめます。
 *     ★[左, 上, 幅, 高] を、★絵の大きさに対する割合で持ちます。
 *     ★景色は 480×320、★穴は正方形のこともあるので、
 *       ★★引き伸ばさず、★はみ出しを切ります（★cover）。
 *       ★引き伸ばすと、★空も山も ゆがみます。
 *
 *   ★★名簿に入っています。★画面で数を書かないこと。
 */
/**
 * ★枠の「抜けているところ」だけを、白にした型（★2026-09-08 の直し）。
 *
 *   ★★もとは「穴の四角」で切っていました。
 *     ★丸い枠の穴を測ると、★四角い範囲が返ります。
 *     ★その四角で切ると、★四隅に景色が残り、★丸の外へ はみ出しました。
 *   ★★枠の絵そのものを型にするのも、★誤りでした。
 *     ★枠の外側も 透けているので、★そこにも 景色が出ます。
 *   ★★だから、★「外から届かない、透けているところ」だけを 白にした
 *     ★型を、★13枚 作りました。★これで、どんな形でも はみ出しません。
 */
export function windowHoleMask(item) {
  return item && item.holeMask ? INTERIOR_BASE + item.holeMask : null;
}

export function windowHole(item) {
  const h = item && Array.isArray(item.hole) ? item.hole : null;
  // ★★穴が分からない枠は、★まん中に控えめに置きます。★消しません。
  return h && h.length === 4 ? h : [0.09, 0.09, 0.82, 0.82];
}

/** ★すりガラスか（★穴ではなく、半透明で透ける枠）。 */
export function isFrostedWindow(item) {
  return !!(item && item.frosted);
}

/** ★組み合わせの数。★画面には出しません（★数を見せない決めのため）。 */
export function windowCombinationCount() {
  return windowFrames().length * windowViews().length;
}

// ---------------------------------------------------------------------------
// ★置き場所（★1つの分類につき、1つだけ置けるもの）
// ---------------------------------------------------------------------------

/**
 * ★1つだけ置ける分類。
 *
 *   ★窓枠・窓の外・扉・壁と床は、★部屋に1つです。
 *   ★家具・庭・壁かけは、★いくつでも置けます。
 */
export const SINGLE_SLOT_CATEGORIES = Object.freeze(["window", "view", "door", "wallTile", "floorTile"]);

/**
 * ★★壁のタイルと、床のタイルは、★別のものです（★2026-09-08 の直し）。
 *
 *   ★9点のうち、★壁が5点、★床が4点です（★manifest の style で分かれています）。
 *   ★★私は、これを1つの「tile」として扱い、★部屋ぜんぶに敷いていました。
 *     ★だから、★床の柄を選ぶと、★壁まで変わっていました。
 *   ★ここで分けます。★画面で判じないこと。
 */
export function tileSurface(item) {
  if (!item || item.category !== "tile") return null;
  if (item.style === "壁") return "wallTile";
  if (item.style === "床") return "floorTile";
  return null;
}

export function wallTiles() {
  return itemsByCategory("tile").filter((i) => tileSurface(i) === "wallTile");
}

export function floorTiles() {
  return itemsByCategory("tile").filter((i) => tileSurface(i) === "floorTile");
}

export function isSingleSlot(category) {
  return SINGLE_SLOT_CATEGORIES.includes(category);
}

/**
 * ★置いているものの形。
 *
 *   ★★character_equipped の中に持ちます（★列を、足しません）。
 *     ★着せかえの印と、同じ入れ物です。★保存の道も、もう在ります。
 *
 *     interior: {
 *       window: "window_03",        ← 1つだけ
 *       view:   "view_07",          ← 1つだけ
 *       door:   "door_02",          ← 1つだけ
 *       tile:   "tile_04",          ← 1つだけ
 *       furniture: ["furniture_01", …],   ← いくつでも
 *       garden:    ["garden_02", …],
 *       wallart:   ["wallart_05", …]
 *     }
 */
export function interiorOf(equipped) {
  const v = equipped && equipped.interior;
  return v && typeof v === "object" ? v : {};
}

/**
 * ★1つ置く・外す。
 *
 *   ★★1つだけの分類は、★置き換えます。★同じものを押したら、外します。
 *   ★いくつでも置ける分類は、★足す・引くです。
 *   ★★元の入れ物を書き替えません。★新しいものを返します。
 */
export function toggleInterior(equipped, item) {
  if (!item || !item.category) return equipped || {};
  const cur = interiorOf(equipped);
  const c = item.category;
  // ★★タイルは、★壁と床を、★別の置き場所にします（★2026-09-08 の直し）。
  const c2 = c === "tile" ? tileSurface(item) : c;
  if (c2 && c2 !== c) {
    const next = { ...cur };
    if (next[c2] === item.key) delete next[c2];
    else next[c2] = item.key;
    return { ...(equipped || {}), interior: next };
  }
  if (isSingleSlot(c)) {
    const next = { ...cur };
    if (next[c] === item.key) delete next[c];
    else next[c] = item.key;
    return { ...(equipped || {}), interior: next };
  }
  const list = Array.isArray(cur[c]) ? cur[c] : [];
  const has = list.includes(item.key);
  return {
    ...(equipped || {}),
    interior: {
      ...cur,
      [c]: has ? list.filter((k) => k !== item.key) : [...list, item.key]
    }
  };
}

/**
 * ★動かせるものを、1つでも置いているか。
 *
 *   ★★2026-09-08、★「並べかえる」の押しどころが、
 *     ★旧い家具があるときだけ出ていました。
 *     ★★門の中では旧い家具が0点なので、★押しどころが出ず、
 *       ★新しい家具を、★1つも動かせませんでした。
 *     ★実機でご指摘をいただきました。★そのとおりでした。
 *   ★★動かせるのは、★床と壁に置くものです（★家具・昭和・庭・壁かけ）。
 *     ★窓・扉・タイルは、★置き場所が決まっています。
 */
export const MOVABLE_CATEGORIES = Object.freeze(["furniture", "showa", "garden", "wallart"]);

export function movableInteriorKeys(equipped) {
  const cur = interiorOf(equipped);
  return MOVABLE_CATEGORIES.flatMap((c) => (Array.isArray(cur[c]) ? cur[c] : []));
}

export function hasMovableInterior(equipped) {
  return movableInteriorKeys(equipped).length > 0;
}

/** ★いま置いているか。 */
export function isPlaced(equipped, item) {
  if (!item) return false;
  const cur = interiorOf(equipped);
  const surf = tileSurface(item);
  if (surf) return cur[surf] === item.key;
  if (isSingleSlot(item.category)) return cur[item.category] === item.key;
  const list = cur[item.category];
  return Array.isArray(list) && list.includes(item.key);
}
