// ============================================================================
// 食事の印 8つ（2026-09-07）
//
//   ★出どころ docs/opus/woolsong-仕様-分析機能の全体（9月7日・夜・Fableの査読を経て）.md §5-1
//
//   ★★2つの文書が、ぶつかっていました。
//     ・「食べたものを自由記述で書かせない」（食事と就寝の設計 §4-4）
//     ・「自由記述＋写真」（今日の仕様 §3-2）
//   ★★Opus の裁定：★今日の仕様を正とする。★ただし §4-4 の理由も正しいので、
//     ★両立させる。★自由記述から、★8つの印を辞書で立てる。
//
//   ★★AI は使いません。★言葉の表を引くだけです。
//     ★外へ何も送りません。★端末の中で終わります。
//
//   ★★立てた印は、★本人がいつでも直せます。
//     ★機械が読み違えることがあるからです。
//     ★★直したものを、★あとから機械が上書きしないこと。
//       ★それが、この形のいちばん大事なところです。
//
//   ★見張り components/tests/meal-marks.test.js
// ============================================================================

/**
 * ★8つの印。
 *
 *   ★出どころは §5-1 の「脂／甘／辛／柑橘／チョコ／コーヒー／炭酸／酒」。
 *   ★★数も、順番も、勝手に変えないこと。
 *   ★★増やすときは、★なぜ要るのかを、ここに書くこと。
 */
export const MEAL_MARKS = Object.freeze([
  { key: "fat",     label: "脂" },
  { key: "sweet",   label: "甘" },
  { key: "spicy",   label: "辛" },
  { key: "citrus",  label: "柑橘" },
  { key: "choco",   label: "チョコ" },
  { key: "coffee",  label: "コーヒー" },
  { key: "soda",    label: "炭酸" },
  { key: "alcohol", label: "酒" }
]);

export const MEAL_MARK_KEYS = Object.freeze(MEAL_MARKS.map((m) => m.key));

export function markLabel(key) {
  const m = MEAL_MARKS.find((x) => x.key === key);
  return m ? m.label : key;
}

/**
 * ★言葉の表。
 *
 *   ★★ひらがな・カタカナ・漢字を、★別々に並べます。
 *     ★書く方によって、★どれで書かれるか分かりません。
 *   ★★英語も入れます。★メニュー名がそのまま書かれることがあります。
 *
 *   ★★短すぎる言葉を入れないこと。
 *     ★「油」は「醤油」に当たります。★だから「油」は入れず、
 *       ★「揚げ」「フライ」「天ぷら」のような、★料理の言葉で拾います。
 *     ★同じ理由で「酒」も入れません。★「甘酒」「酒粕」に当たります。
 */
const DICTIONARY = Object.freeze({
  fat: [
    "揚げ", "あげもの", "フライ", "天ぷら", "てんぷら", "から揚げ", "唐揚げ", "からあげ",
    "とんかつ", "トンカツ", "豚カツ", "カツ", "コロッケ", "フリット",
    "ラーメン", "らーめん", "バター", "生クリーム", "クリーム", "チーズ", "マヨネーズ",
    "焼肉", "焼き肉", "ステーキ", "ハンバーグ", "ピザ", "ぴざ", "ポテト", "唐揚",
    "脂", "あぶら", "こってり", "fried", "butter", "cheese", "pizza"
  ],
  sweet: [
    "ケーキ", "けーき", "アイス", "あいす", "プリン", "ドーナツ", "パフェ", "クッキー",
    "まんじゅう", "饅頭", "大福", "ぜんざい", "あんこ", "餡", "はちみつ", "蜂蜜",
    "砂糖", "デザート", "スイーツ", "菓子", "おかし", "甘い", "あまい",
    "cake", "ice cream", "dessert", "sweet"
  ],
  spicy: [
    "辛い", "からい", "激辛", "唐辛子", "とうがらし", "カレー", "かれー", "キムチ",
    "麻婆", "マーボー", "タバスコ", "わさび", "からし", "山椒", "コチュジャン",
    "ペペロンチーノ", "spicy", "curry", "kimchi", "chili"
  ],
  citrus: [
    "みかん", "ミカン", "蜜柑", "オレンジ", "おれんじ", "レモン", "れもん", "ライム",
    "グレープフルーツ", "ゆず", "柚子", "すだち", "かぼす", "柑橘", "シトラス",
    "ポン酢", "ぽん酢", "orange", "lemon", "lime", "grapefruit", "citrus"
  ],
  choco: [
    "チョコ", "ちょこ", "ショコラ", "ガナッシュ", "ココア", "ここあ", "カカオ",
    "ブラウニー", "chocolate", "cocoa"
  ],
  coffee: [
    "コーヒー", "こーひー", "珈琲", "カフェオレ", "カフェラテ", "ラテ", "エスプレッソ",
    "カプチーノ", "アメリカーノ", "モカ", "coffee", "espresso", "latte", "cappuccino"
  ],
  soda: [
    "炭酸", "たんさん", "コーラ", "こーら", "サイダー", "スパークリング", "ソーダ",
    "ジンジャーエール", "ハイボール", "ビール", "びーる", "発泡", "シャンパン",
    "cola", "soda", "sparkling", "beer"
  ],
  alcohol: [
    "お酒", "おさけ", "日本酒", "焼酎", "ウイスキー", "ウィスキー", "ワイン", "わいん",
    "ビール", "びーる", "ハイボール", "梅酒", "シャンパン", "カクテル", "チューハイ",
    "サワー", "ジン", "ウォッカ", "テキーラ", "酎ハイ", "晩酌",
    "wine", "beer", "whisky", "whiskey", "sake", "cocktail"
  ]
});

/**
 * ★同じ言葉が、2つの印に入っていることがあります。
 *   ★「ビール」は、★炭酸でもあり、★酒でもあります。★どちらも立てます。
 *   ★これは わざとです。★片方に決めません。
 */

/**
 * ★自由記述から、印を立てます。
 *
 *   ★★見つかった順ではなく、★MEAL_MARKS の順に返します。
 *     ★毎回おなじ並びにするためです。
 *
 * @param {string} text
 * @returns {string[]}  印の鍵
 */
export function marksFromText(text) {
  const t = String(text || "").toLowerCase();
  if (!t.trim()) return [];
  const found = [];
  for (const { key } of MEAL_MARKS) {
    const words = DICTIONARY[key] || [];
    if (words.some((w) => t.includes(String(w).toLowerCase()))) found.push(key);
  }
  return found;
}

/**
 * ★古い6つのタグを、★印に読み替えます（★読むときだけ）。
 *
 *   ★★dinner_tags には、★すでにお客さまの記録が入っています。
 *     ★書き替えません。★消しません。★読むときに、重ねるだけです。
 *   ★★「トマト系」と「あっさり」に、★当たる印がありません。
 *     ★無理に当てないこと。★別のものです。
 */
export const LEGACY_TAG_TO_MARK = Object.freeze({
  "揚げ物": "fat",
  "炭酸": "soda",
  "カフェイン": "coffee",
  "アルコール": "alcohol"
  // ★「トマト系」「あっさり」は、★当たる印がありません。★そのままにします。
});

export function marksFromLegacyTags(tags) {
  const out = [];
  for (const tag of tags || []) {
    const k = LEGACY_TAG_TO_MARK[tag];
    if (k && !out.includes(k)) out.push(k);
  }
  return MEAL_MARK_KEYS.filter((k) => out.includes(k));
}

/**
 * ★その日の印を、★1つに束ねます（★読むときだけ）。
 *
 *   ★本人が直した印があれば、★それだけを使います。
 *     ★★機械の読みで、★上書きしないこと。
 *   ★直していなければ、★自由記述から立てた印と、★古いタグを重ねます。
 *
 * @param {object} entry  { mealMarks, mealNotes, dinnerTags }
 * @returns {string[]}
 */
export function resolveMealMarks(entry) {
  const e = entry || {};
  if (Array.isArray(e.mealMarks)) {
    // ★空の配列も、★答えです。★「印は無い」と本人が決めた、という意味です。
    return MEAL_MARK_KEYS.filter((k) => e.mealMarks.includes(k));
  }
  const auto = marksFromText(e.mealNotes);
  const legacy = marksFromLegacyTags(e.dinnerTags);
  return MEAL_MARK_KEYS.filter((k) => auto.includes(k) || legacy.includes(k));
}


/**
 * ★その日の 印を、★1つの 言葉に します（★見本⑤「印　麺・酒」）。
 *
 *   ★★並びは MEAL_MARKS の 順です。★書いた順では ありません。
 *     ★書いた順に すると、★同じ2つでも 日によって 見え方が 変わります。
 *   ★1つも 無ければ null。★「なし」と 書きません。
 */
export function marksWord(entry) {
  const keys = resolveMealMarks(entry);
  if (!keys || keys.length === 0) return null;
  return MEAL_MARKS.filter((m) => keys.includes(m.key)).map((m) => m.label).join("・");
}
