// ============================================================================
// 羊の着せかえ ── ★決めごと（2026-09-05 夜・Stage 1）
//
//   出どころ docs/assets/羊-着せかえ一式-読んでください（決定版11・217点）.md
//            docs/lavoce-作業指示-羊StageAとアイテム.md（B-4・B-5）
//            docs/opus/lavoce-判断-季節の装いと、隠し方（9月4日・夜）.md
//
//   ★★絵は、★217点あります（public/sheep/items/）。
//     ★どれを、いつ、どうやって出すか ── ★その決めが、ここです。
//     ★画面で組み立て直さないこと。
//
//   ★★守ること（作業指示 D・禁止事項）
//     ✕ ポイントを、★体調に連動させない
//     ✕ 連続が途切れたときに、★しおれる・減る・催促する、を作らない
//     ✕ professions を、★買える／買えないに使わない（★並び順だけ）
//     ✕ season を、★入手の期限に使わない
//     ✕ 羊のデザインを、★変えない
// ============================================================================

// ---------------------------------------------------------------------------
// ① ★★まだ、坂本さんにしか出しません（2026-09-05 夜）
//
//   ★★門と同じ形です（lib/freeTier.js ①-2）。
//     ★環境変数に入っている方にだけ、★この機能を出します。
//     ★空なら、★誰にも出しません（★いまは、まだ出す段ではありません）。
//
//   ★Vercel → Settings → Environment Variables
//       NEXT_PUBLIC_WARDROBE_USER_IDS = <ご自身のユーザーID>
//
//   ★★公開するときは、★ここを WARDROBE_PUBLIC = true にします。
// ---------------------------------------------------------------------------
export const WARDROBE_PUBLIC = false;

export function wardrobeUserIds(env) {
  const raw = (env || {}).NEXT_PUBLIC_WARDROBE_USER_IDS;
  if (typeof raw !== "string") return [];
  return raw.split(",").map((x) => x.trim()).filter(Boolean);
}

/**
 * ★この方に、着せかえを出してよいか。
 *
 *   ★★空のときは、★誰にも出しません。
 *     ★門（freeTier）とは、★逆に倒します。
 *     ★あちらは「止めない側」が安全。★こちらは「出さない側」が安全です。
 */
export function mayUseWardrobe(userId, env) {
  if (WARDROBE_PUBLIC) return true;
  const ids = wardrobeUserIds(env);
  if (ids.length === 0) return false;
  return ids.includes(String(userId || ""));
}

// ---------------------------------------------------------------------------
// ② ★重ね順（★読んでください.md §1）
//
//   ★★この順番を、★変えないこと。
//     ★頭より前に服を描くと、★首が消えます。
//     ★帽子より前に持ち物を描くと、★顔に かぶさります。
// ---------------------------------------------------------------------------
//   ★★2026-09-07、★4つ足しました（bottom / top / outer / eyes）。
//     ★ふだん着62点を取り込むためです。★上と下を別に着られるようにします。
//     ★★garment（全身もの）に全部入れると、★1枚しか着られません。
//       ★上と下を同時に着られず、★「全身が組める」が成り立ちません。
//
//   ★★順番の理由は「着ていく順」です（坂本さんの決め・2026-09-07）。
//     ★体に近いほうから、★外へ向かって重ねます。
//       body → bottom → top → outer → garment
//     ★そのあとに、★体から離れるもの。
//       neck → head → shoes → eyes → hat → prop
//
//   ★★靴の位置について（★2026-09-07・実際に描いて確かめました）。
//     ★はじめ、★靴を3番目（bottom のすぐあと）に置きました。
//     ★★ところが、★全身もの（garment）は 1024×1024 の1枚絵で、
//       ★足もとまで描かれています。★靴が、★その下に隠れました。
//     ★★9月6日にも、★同じ形の不具合を直しています。
//       ★あのときは、★体の絵（490〜951が不透明）が
//       ★靴（844〜976）を塗りつぶしていました。
//     ★★靴は、★頭よりも あとです。
//       ★体と頭の絵は、★どちらも 1024×1024 の1枚絵で、
//       ★足もとの高さ（844〜976）まで、★不透明なところがあります。
//       ★2026-09-06 の直しは、★まさにこれでした。
//     ★だから、★靴は★服・体・頭より★あとに描きます。
//       ★履くのは服のあと、という順とも、★合っています。
//     ★★見張り components/tests/sheep-shoe-layering.test.js が、
//       ★実際に描いて、★靴が前にあることを確かめています。
//   ★眼鏡（eyes）は、★顔より前、★帽子より後ろです。
//   ★持ち物（prop）が、★いちばん上です。★手に持つものだからです。
//
//   ★★garment と outer は、★同時に着られます（★枠が別だからです）。
//     ★だから、★この2つの前後は、★実際に絵に出ます。
//     ★いまは garment があとに来るので、★全身ものが羽織りを覆います。
export const LAYER_ORDER = Object.freeze([
  "body", "bottom", "top", "outer", "garment", "neck", "head", "shoes", "eyes", "hat", "prop"
]);

// ★持ち物の置き場所（★左・まん中・右）。
//   ★1つだけなら R が既定。★大きいものは C（傘・蓄音機・新聞）。
export const PROP_SIDES = Object.freeze(["L", "C", "R"]);
export const PROP_SIDE_DEFAULT = "R";

// ---------------------------------------------------------------------------
// ②-2 ★動き（★案B・2026-09-06）
//
//   ★★かたまりごと動かします。★1枚ずつ動かすと、★服と体がずれます。
//   ★腕と脚は、★別々には動きません。★服の下では、どのみち見えません。
//
//   ★★数字は、★ここだけを直せば変わります。★画面には書きません。
//     ★bobY   … 上下（％）。★大きいほど、よく はずみます
//     ★tilt   … 傾き（度）。★大きいほど、よく揺れます
//     ★sec    … 1回にかかる時間（秒）。★小さいほど、速いです
//     ★travelX… 左右に歩く幅（％）。★0 にすると、その場で はずみます
//
//   ★2026-09-06、★「その場で はずんでいるだけに見える」とご指摘。
//     ★上下 3→5、★傾き 1.2→2 にし、★左右の移動を足しました。
// ---------------------------------------------------------------------------
export const MOTIONS = Object.freeze({
  // ★止まっているとき。★息だけしています。
  still:     { bobY: 1.2, tilt: 0,   sec: 3.4, travelX: 0 },
  // ★★歩くとき（★案B1・2026-09-06）。
  //   ★★坂本さんのご指示：★弾ませないこと。★脚を動かすこと。
  //     ★だから bobY は 0 です。★上下に跳ねません。
  //   ★★脚の振れは、★下の LEGS が持ちます。★ここではありません。
  //   ★sway は、★体のわずかな左右のゆれです。
  //     ★0 にすれば、まったくゆれません。★見てから決めていただけます。
  walk:      { bobY: 0,   tilt: 0,   sec: 0.62, travelX: 34,
               gait: true, legs: true, lean: 0, sway: 1.2,
               squash: 1, stretch: 1 },
  // ★眠るとき。★ゆっくり傾いて、★息をするように縮みます。
  sleep:     { bobY: 1.8, tilt: 4,   sec: 4.2, travelX: 0 },
  // ★喜ぶとき。★小さく跳ねます。★★大きく跳ねさせないこと（うるさくなります）。
  celebrate: { bobY: 9,   tilt: 0,   sec: 0.45, travelX: 0 },
  // ★畑にいるとき。★前に かがんで、★戻ります。
  farm:      { bobY: 3,   tilt: 6,   sec: 1.6, travelX: 0 }
});

/**
 * ★★脚のかたち（★案B1・2026-09-06）。
 *
 *   ★★絵は1枚も描いていません。★コードで描いています。
 *     ★体の絵に輪郭線が無く、★足まわりが1色だったので、これができます。
 *
 *   ★★色は、★体の絵から拾いました。
 *     ★rgb(237,228,206) ＝ #EDE4CE。★2060点のうち、ほとんどがこの色でした。
 *     ★いまの SVG の羊のひづめとも、★同じ色です。
 *
 *   ★★位置も、★体の絵を測って決めました。
 *     ★体のいちばん下は y=951。
 *     ★下のふたこぶの中心は、★左 x=421・右 x=601。
 *     ★靴の絵の中心は、★左 x=418・右 x=604。★3ちがいです。
 *
 *   ★★1024 のものさしです。★絵と同じ座標で考えます。
 *
 *   ★★見てから直せるように、★ぜんぶ数字にしてあります。
 *     ★「脚が短い」なら bottomY、★「太い」なら width、
 *     ★「振れすぎ」なら swing を変えてください。★ここだけです。
 */
/**
 * ★★166点の版（v4）の、★足まわりの座標。
 *
 *   ★★まだ描くのには使っていません。★数字を失わないために置いています。
 *     ★新しい靴12点は、★この座標に合わせて描かれています。
 *     ★捨てると、★12点ぜんぶ描き直しになります。
 *
 *   ★★いまの体の絵は、★y=951 で終わります。
 *     ★下端 1002 は、★新しい足の絵が来てからの数字です。
 *     ★だから、★いま描くのには使いません。★下の LEGS を使います。
 */
export const LEGS_V4 = Object.freeze({
  leftX:   421,   // ★足の中心x（左）
  rightX:  601,   // ★足の中心x（右）
  bottomY: 1002,  // ★足の下端。★新しい靴の底が、ここに来ます
  footW:   114,   // ★足の幅
  groundY: 1006   // ★接地線
});

/**
 * ★★いま描いている脚（★案B1）。
 *
 *   ★★数字は、★いまの体の絵に合わせています。
 *     ★体の下ぎわは、★下へ行くほど細くなります（測りました）。
 *       y=935 → x 364〜479（幅115）
 *       y=945 → x 381〜462（幅 81）
 *       y=950 → x 402〜443（幅 41）
 *     ★★だから、★足を大きくすると、★こぶの外へはみ出します。
 *
 *   ★★2026-09-06、実機で「足が体の下からはみ出して見える」。
 *     ★測りました。★2つ、まずいところがありました。
 *       ① 体の下端(951)と、★ひづめの上端(968)のあいだに★17のすきま。
 *          ★のりしろが無く、★足が浮いて見えていました。
 *       ② ひづめの幅114が、★こぶ(y=950で41)より★ずっと広い。
 *          ★左右に35〜38、★はみ出していました。
 *     ★★直し：★細くして、★体の下へ差しこみました。
 */
export const LEGS = Object.freeze({
  color:   "#EDE4CE",  // ★体の絵から拾った色

  // ★★体は、★1ミリも動かしません。
  //   ★脚のために服の見た目を動かさないこと（★9月6日の失敗）。
  lift:    0,

  leftX:   LEGS_V4.leftX,   // ★左右の中心は、★v4 と同じです
  rightX:  LEGS_V4.rightX,

  topY:    780,   // ★つけ根。★体に隠れます（y=780 で x294〜744）
  width:   44,    // ★脚の細いところ

  // ★★ひづめ。★体の下へ、★のりしろぶん差しこみます。
  //   ★上端 = bottomY - hoofRy*2 = 939 → ★体の下端(951)より 12 上。
  //   ★下に出るのは 951〜975 の 24 だけ。
  bottomY: 975,
  footW:   58,    // ★こぶ(y=945で81)に収まる幅
  hoofRy:  18,

  swing:   14,    // ★振れる角度
  sec:     0.62,  // ★いまの SVG の羊と同じ速さ

  // ★★いまの靴8点は、動かしません。底の高さが1点ずつ違います（954〜988）。
  shoeDy:  0
});

/** ★靴の絵は、★ここで左右に分かれています（測りました）。 */
export const SHOE_SPLIT_X = 511;

export function legsOf(key) {
  return motionOf(key).legs === true;
}

export const MOTION_KEYS = Object.freeze(Object.keys(MOTIONS));

export function motionOf(key) {
  return MOTIONS[key] || MOTIONS.still;
}

// ---------------------------------------------------------------------------
// ③ ★季節（★B-5）
//
//   ★★season を、★入手の期限に使わないこと（★禁止事項）。
//     ★過ぎた季節のものも、★持っている方は、★そのまま使えます。
//     ★店に並ぶかどうかだけが、★季節で変わります。
//
//   ★区切りは、★暦のとおりにします。★9月は、秋です。
// ---------------------------------------------------------------------------
export const SEASONS = Object.freeze(["spring", "summer", "autumn", "winter"]);

export const SEASON_LABELS = Object.freeze({
  spring: "春", summer: "夏", autumn: "秋", winter: "冬"
});

export function seasonOfMonth(month) {
  const m = Number(month);
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

/** ★いまの季節。★日付は、呼ぶ側が渡します（★試せるように）。 */
export function currentSeason(dateISO) {
  const d = new Date(String(dateISO || "") + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return "autumn";
  return seasonOfMonth(d.getUTCMonth() + 1);
}

// ★四季の服は、★key で見分けられます（coatSpring… coatSummer… ）。
const SEASON_KEY_HINT = Object.freeze({
  spring: "Spring", summer: "Summer", autumn: "Autumn", winter: "Winter"
});

export function seasonOfItem(item) {
  if (!item || item.group !== "season") return null;
  for (const s of SEASONS) {
    if (String(item.key || "").includes(SEASON_KEY_HINT[s])) return s;
  }
  return null;
}

// ---------------------------------------------------------------------------
// ④ ★店に並ぶか（★B-5）
//
//   ★四季の服は、★その季節のあいだだけ並びます。
//   ★★持っている方からは、★取り上げません（★owned は、いつでも使えます）。
// ---------------------------------------------------------------------------
export function inShopNow(item, todayISO) {
  const s = seasonOfItem(item);
  if (!s) return true;                 // ★季節のものでなければ、いつでも
  return s === currentSeason(todayISO);
}

// ---------------------------------------------------------------------------
// ★置き場所の名前と、★お店に並べる順（2026-09-08）
//
//   ★★「ふだんぎ」を開くと、★上も靴も帽子も、★ひとつづきに並んでいました。
//     ★62点が1列に混ざって、★何を探しているのか分からなくなります。
//   ★だから、★置き場所ごとに分けて、★見出しを付けます。
//
//   ★★並びは、★重ね順（LAYER_ORDER）ではありません。
//     ★あちらは「どう描くか」。★こちらは「どう探すか」です。
//     ★服から始めて、★体から離れていく順にします。
//     ★★2つを1つにしないこと（storage と display は、別の問いです）。
// ---------------------------------------------------------------------------
export const SLOT_LABELS = Object.freeze({
  garment: "全身",
  top: "上",
  bottom: "下",
  outer: "羽織り",
  shoes: "靴",
  neck: "首元",
  eyes: "目元",
  hat: "帽子",
  prop: "持ちもの"
});

export const SLOT_DISPLAY_ORDER = Object.freeze([
  "garment", "top", "bottom", "outer", "shoes", "neck", "eyes", "hat", "prop"
]);

export function slotLabel(slot) {
  return SLOT_LABELS[slot] || slot;
}

/**
 * ★置き場所ごとに分けます。
 *
 *   ★★中身のない置き場所は、★返しません。★空の見出しを出さないためです。
 *   ★並びは SLOT_DISPLAY_ORDER。★知らない置き場所は、いちばん後ろです。
 *
 * @param {Array} items  並べ替えずみの品物
 * @returns {Array<{slot:string, label:string, items:Array}>}
 */
/**
 * ★レールに並べる置き場所（★§3・2026-09-08）。
 *
 *   ★★仕様は「帽子／目元／首元／上／下／羽織り／靴／持ち物／背中」の9つ。
 *     ★「背中」は、★いまの品に1点もありません。★出しません。
 *     ★★無いものへの入口を、★作らないこと。
 *   ★★「全身もの」は、★レールの外です（★仕様 §3）。
 *     ★全身ものを選ぶと、★上と下が同時に置き換わります。
 *     ★同じ列に混ぜると、★その違いが伝わりません。
 *
 *   ★★スクロールさせないこと（★仕様 §3）。
 *     ★8つを、画面幅に入れます。
 */
export const RAIL_SLOTS = Object.freeze([
  "hat", "eyes", "neck", "top", "bottom", "outer", "shoes", "prop"
]);

/** ★レールの外に置く、全身もの。 */
export const RAIL_GARMENT = "garment";

/**
 * ★その置き場所に、品物が1つでもあるか。
 *   ★★空のレールを出さないためです。★押せない札を並べません。
 */
export function railSlotsWithItems(items) {
  const have = new Set((items || []).map((i) => i && i.slot));
  return RAIL_SLOTS.filter((k) => have.has(k));
}

export function groupBySlot(items) {
  const bag = new Map();
  for (const it of items || []) {
    const k = it && it.slot ? it.slot : "other";
    if (!bag.has(k)) bag.set(k, []);
    bag.get(k).push(it);
  }
  const known = SLOT_DISPLAY_ORDER.filter((k) => bag.has(k));
  const rest = [...bag.keys()].filter((k) => !SLOT_DISPLAY_ORDER.includes(k)).sort();
  return [...known, ...rest].map((k) => ({ slot: k, label: slotLabel(k), items: bag.get(k) }));
}

/**
 * ★1つ着たときの、★着ているものの新しい形。
 *
 *   ★★全身もの（着物・甲冑など）は、★上・下・羽織りと同時に着られません。
 *     ★一覧の occupies が「どの場所をふさぐか」を持っています。
 *     ★★2026-09-07、★坂本さんの決め。
 *
 *   ★逆も要ります。★上を着たら、★全身ものを脱ぎます。
 *     ★片側だけだと、★着物の上からズボンが出ます。
 *
 *   ★★この決めは、★ここ1か所です。★画面側で書かないこと。
 *
 * @param {object} wearing  いま着ているもの
 * @param {object} item     押された品
 * @returns {object}        新しい「着ているもの」
 */
export function applyWear(wearing, item, itemByKey) {
  const next = { ...(wearing || {}) };
  if (!item || !item.slot) return next;
  // ★同じものを押したら、★脱ぎます。
  if (next[item.slot] === item.key) {
    delete next[item.slot];
    return next;
  }
  next[item.slot] = item.key;
  // ★★この品がふさぐ場所を、★空けます。
  //   ★着物を着たら、★上・下・羽織りが脱げます。
  for (const slot of item.occupies || []) {
    if (slot !== item.slot) delete next[slot];
  }
  // ★★逆も要ります。
  //   ★上を着たとき、★いま着ている着物のほうを、★脱がせます。
  //   ★★2026-09-07、★片側だけにしていて、
  //     ★着物の上からシャツが出る形になっていました。
  //   ★itemByKey が渡されなければ、★この向きは見ません（★呼ぶ側の責任）。
  if (typeof itemByKey === "function") {
    for (const wornSlot of Object.keys(next)) {
      if (wornSlot === item.slot) continue;
      const worn = itemByKey(next[wornSlot]);
      if (worn && (worn.occupies || []).includes(item.slot)) delete next[wornSlot];
    }
  }
  return next;
}

/**
 * ★その場所を、★いま着ている全身ものがふさいでいるか。
 *
 *   ★ふさがれている場所の品は、★押せば着られます。
 *     ★そのとき、★全身もののほうが脱げます（★上の applyWear）。
 *   ★★押せなくしないこと。★選べるものは、必ず押せる形で出します。
 */
export function slotBlockedBy(wearing, slot, itemByKey) {
  for (const wornSlot of Object.keys(wearing || {})) {
    const worn = itemByKey && itemByKey(wearing[wornSlot]);
    if (worn && (worn.occupies || []).includes(slot) && worn.slot !== slot) return worn;
  }
  return null;
}

/** ★持っているものは、★季節に関わらず、★いつでも着られます。 */
export function mayWear(item, owned) {
  if (!item) return false;
  return (owned || []).includes(item.key);
}

// ---------------------------------------------------------------------------
// ⑤ ★達成で開くもの（★B-4）
//
//   ★★お金では買えません。★記録した先で、★開きます。
//     ★「記念のもの」は、★ずっと無料です（⑫の決め）。
//
//   ★★組み合わせに、★意味を持たせること。
//     ★「初めての本番」で麦わら帽子が開いても、★つながりがありません。
// ---------------------------------------------------------------------------
//   ★★2026-09-05、★私は鍵の名前を、★作ってしまいました
//     （propBouquet_R・wearTailcoat・accGlasses・hatLaurel）。
//     ★★どれも、★実物にありません。★確かめが止めました。
//     ★_L / _C / _R は、★鍵ではなく★ファイル名の側に付きます。
//   ★★実物から取り直しました。★思いつきで書かないこと。
export const UNLOCKS = Object.freeze({
  // ★初めての本番 → ★花束。★その日を、形にして残します。
  firstPerformance: ["propBouquet"],
  // ★本番10回 → ★燕尾服。★重ねた回数に、見合う一着です。
  performances10: ["tailcoat"],
  // ★初めてのピアニッシモ → ★指揮棒。★小さな音を、支える人の道具です。
  firstPianissimo: ["propBaton"],
  // ★10種類の記録 → ★メトロノーム。★きちんと測る人の道具です。
  tenFieldKinds: ["propMetronome"],
  // ★稽古の目標を達成 → ★椿の髪かざり。★舞台の日のためのものです。
  practiceGoalDone: ["hatCamellia"]
});

/** ★開いた鍵から、★開いた品物を出します。 */
export function unlockedItemKeys(unlockedFlags) {
  const out = [];
  for (const key of Object.keys(UNLOCKS)) {
    if (unlockedFlags && unlockedFlags[key]) out.push(...UNLOCKS[key]);
  }
  return out;
}

/** ★その品物は、達成で開くものか（★お金では買えません）。 */
export function isUnlockItem(itemKey) {
  return Object.values(UNLOCKS).some((list) => list.includes(itemKey));
}

// ---------------------------------------------------------------------------
// ⑥ ★並び順（★B-2）
//
//   ★★professions は、★並び順にだけ使います。★買えなくしないこと。
//   ★いまの季節のもの → ★達成で開いたもの → ★そのほか、の順にします。
// ---------------------------------------------------------------------------
export function sortForShop(items, { todayISO, unlockedFlags } = {}) {
  const opened = new Set(unlockedItemKeys(unlockedFlags));
  const rank = (it) => {
    if (seasonOfItem(it) === currentSeason(todayISO)) return 0;
    if (opened.has(it.key)) return 1;
    return 2;
  };
  return [...(items || [])].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    return String(a.key).localeCompare(String(b.key));
  });
}
