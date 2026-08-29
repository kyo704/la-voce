// ============================================================================
// 曲目の「同じ曲かどうか」— ★この判断の唯一の正
//
//   出典 lavoce-レパートリー負荷パッチ.md §2.2
//        「表示は必ず titleRaw、照合にだけ titleNormalized を使う」
//   ★この規則は書かれていましたが、半分しか守られていませんでした。
//     記録を引くときだけ生の名前をそのまま鍵にしていたため、
//     「Son qual nave」と「Son qual nave(Aのみ)」、末尾に空白のある名前、
//     全角と半角の違いが、それぞれ別の曲になっていました。
//     その結果、歌唱言語のチップが点かない・「登録済み」が出ない・
//     最高音の欄が何度も出る・保存するたびに行が増える、が起きました。
//
//   ★「同じ曲か」と「似ているか」は、別の問いです。
//
//     同じ曲か（repertoireKey）… 本人は同じものを打ったつもり。
//       全角半角・大文字小文字・前後の空白だけを吸収します。
//
//     似ているか（normalizeTitle）… 「もしかして、これですか？」と尋ねる用。
//       かっこ書き・「」・中黒まで落とします。★こちらを同一性に使わないこと。
//       「椿姫（第1幕）」と「椿姫（第2幕）」が同じ曲になってしまい、
//       第2幕を開いたのに第1幕の最高音が出ます。分けて記録した人の
//       区別を、こちらの都合で消すことになります。
//       似ている曲をまとめるのは「レパートリーの整理」で、本人が決めます。
// ============================================================================

/**
 * 同一性の鍵。★記録を引くとき・書くときは、必ずこれを使ってください。
 *   生の名前をそのまま鍵にしないこと。
 */
export function repertoireKey(raw) {
  if (!raw) return "";
  return String(raw)
    .normalize("NFKC")      // 全角の英数字・記号を半角に揃える
    .toLowerCase()          // 大文字小文字の違いを吸収する
    .replace(/[\s　]+/g, " ")
    .trim();
}

/**
 * 表に入っている名前のうち、同じ曲を指すものを返す。
 * ★見つからなければ null。打った名前をそのまま返さないこと
 *   （呼ぶ側が「見つかった」と取り違えます）。
 */
export function findRepertoireName(map, name) {
  const key = repertoireKey(name);
  if (!key || !map) return null;
  if (Object.prototype.hasOwnProperty.call(map, name)) return name;  // そのままある場合が大半
  const hit = Object.keys(map).find((n) => repertoireKey(n) === key);
  return hit || null;
}

/** その曲の記録。無ければ null。 */
export function lookupRepertoire(map, name) {
  const hit = findRepertoireName(map, name);
  return hit ? map[hit] : null;
}

/**
 * 書き込むときの名前。
 * ★同じ曲がすでにあるなら、その名前に書きます。打った通りに書くと、
 *   表記が少し違うだけの行がもう1つできます（実際に増えていました）。
 */
export function resolveRepertoireName(map, name) {
  return findRepertoireName(map, name) || name;
}

/** 同じ曲か。 */
export function isSameRepertoire(a, b) {
  const ka = repertoireKey(a);
  return !!ka && ka === repertoireKey(b);
}
