// ============================================================================
// さがす（★§3-6・見本⑥）── 2026-09-08
//
//   ★出どころ docs/opus/woolsong-仕様-おうち画面の作り直し（9月8日）.md §3-6
//            docs/opus/おうち画面-作り直し案v2.png ⑥
//
//   ★★絞り込みは、★ふだんの画面から 外します。★ここにだけ 置きます。
//     ★虫めがねを押した時だけ 出る、★1枚です。
//
//   ★★4つ（★§3-6）
//     文字で さがす　「れい：ニット　あお　もこもこ」
//     ★いろ　　　　★24色
//     ★かんじ　　　あたたかい／すずしい／きちんと／ゆるい／和／よそゆき
//     ★みせかた　　持っているもの ／ まだのものも見る
//
//   ★★「かんじ」は6つです。★あちらの11種より 少なくしました。
//     ★11は うちの点数には 多すぎます（★§3-6）。
//   ★★印は、★荷物が持っています（kanji-2026-09-08・166点）。
//     ★こちらで 付け直しません。★推し量りません。
//
//   ★★数を、出しません。★「12点 見つかりました」と書かないこと。
//
//   ★見張り components/tests/drawer-search.test.js
// ============================================================================

/** ★かんじ（★6つ。★増やさないこと）。 */
export const KANJI = Object.freeze([
  "あたたかい", "すずしい", "きちんと", "ゆるい", "和", "よそゆき"
]);

/** ★みせかた（★2つ）。 */
export const SHOW_OWNED = "owned";
export const SHOW_ALL = "all";

export const COPY = Object.freeze({
  title: "さがす",
  textLabel: "文字で さがす",
  textHint: "れい：ニット　あお　もこもこ",
  colorLabel: "いろ",
  kanjiLabel: "かんじ",
  showLabel: "みせかた",
  showOwned: "持っているもの",
  showAll: "まだのものも見る",
  cancel: "やめる",
  search: "さがす",
  clear: "けす",
  // ★★見つからなかったとき。★黙らないこと。★何を外せば戻れるかを書きます。
  empty: "この しぼりこみでは、ありません。「けす」を押すと、戻ります。"
});

/** ★何も絞っていない状態。 */
export function emptyQuery() {
  return { text: "", color: null, kanji: [], show: SHOW_ALL };
}

export function isEmptyQuery(q) {
  const c = q || {};
  return !(c.text || "").trim() && !c.color
    && (!c.kanji || c.kanji.length === 0) && (c.show || SHOW_ALL) === SHOW_ALL;
}

/** ★かんじを、押すたびに 足す・引く。 */
export function toggleKanji(q, k) {
  const cur = (q && q.kanji) || [];
  return {
    ...(q || emptyQuery()),
    kanji: cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]
  };
}

/**
 * ★文字で さがす。
 *
 *   ★★名前と、かんじと、置き場所の名前を 見ます。
 *   ★★空白で区切ると、★すべてを満たすものだけが 出ます。
 *     ★「ニット あお」は「ニット」かつ「あお」です。
 *   ★★大文字・小文字を そろえます。★カタカナは そのままです。
 */
function textHit(item, text, colorNameOf) {
  const q = String(text || "").trim().toLowerCase();
  if (!q) return true;
  const hay = [
    item.name || "",
    ...(item.kanji || []),
    colorNameOf ? (colorNameOf(item.key) || "") : ""
  ].join(" ").toLowerCase();
  return q.split(/[\s　]+/).filter(Boolean).every((w) => hay.includes(w));
}

/**
 * ★絞りこみます。
 *
 *   ★★数を返しません。★並びだけです。
 *   ★★「持っていないもの」を、★隠すのは「持っているもの」を選んだ時だけです。
 *     ★ふだんは、★見えます（★試着・§9）。
 *
 *   @param ctx { owned, colorOf, colorNameOf }
 */
export function applySearch(items, q, ctx) {
  const c = ctx || {};
  const query = q || emptyQuery();
  const owned = c.owned instanceof Set ? c.owned : new Set(c.owned || []);
  return (items || []).filter((i) => {
    if (!i) return false;
    if ((query.show || SHOW_ALL) === SHOW_OWNED && !owned.has(i.key)) return false;
    if (query.color) {
      const k = c.colorOf ? c.colorOf(i.key) : null;
      if (k !== query.color) return false;
    }
    if (query.kanji && query.kanji.length > 0) {
      const tags = i.kanji || [];
      // ★★えらんだ かんじを、★すべて 持っているものだけ。
      if (!query.kanji.every((t) => tags.includes(t))) return false;
    }
    return textHit(i, query.text, c.colorNameOf);
  });
}
