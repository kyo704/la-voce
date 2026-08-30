// ============================================================================
// 移行がまだのとき、保存を全部落とさないための備え
//
//   ★2026-08-30 に2回起きました（type_fields / morning_edema）。
//     どちらも同じ形です。列を使うコードが先に本番へ出て、
//     SQL がまだ実行されていない、という時間帯がありました。
//
//   ★このリポジトリには移行の仕組みがありません。
//     坂本さんが Supabase の SQL エディタに貼って実行します。
//     つまり「コードは出たが SQL はまだ」という窓は★必ず開きます。
//     窓を無くすことはできないので、窓が開いていても
//     ★壊滅しないようにします。
//
//   PostgREST は、知らない列が1つでもあると★リクエスト全体を断ります。
//     {code: 'PGRST204', message: "Could not find the 'morning_edema' column
//      of 'entries' in the schema cache"}
//   entryToRow は列を必ず全部入れるので、むくみを触っていない人の保存も、
//   30秒記録も、★全員ぶん落ちました。
//
//   ★ここでやること：足りない列だけを外して、もう一度だけ試す。
//     新しい項目は保存されませんが、★その日の記録全体は残ります。
//     「1項目が保存されない」と「その日が丸ごと消える」は、別の重さです。
//
//   ★黙って握りつぶさないこと。外した列は必ず返し、呼ぶ側が警告を出します。
// ============================================================================

/** PostgREST が「その列を知らない」と言っているか。 */
export function isUnknownColumnError(error) {
  if (!error) return false;
  if (error.code === "PGRST204") return true;
  return /Could not find the '.*' column|schema cache/i.test(error.message || "");
}

/**
 * エラー文から、足りない列の名前を取り出す。
 * ★取り出せなければ null。当てずっぽうで列を消さないこと。
 */
export function missingColumnFrom(error) {
  if (!error) return null;
  const m = /Could not find the '([a-zA-Z0-9_]+)' column/.exec(error.message || "");
  return m ? m[1] : null;
}

/** その列を外した行を作る。★元の行は変えません。 */
export function rowWithout(row, column) {
  if (!row || !column) return row;
  const out = { ...row };
  delete out[column];
  return out;
}

/**
 * 足りない列を外しながら、保存をやり直す。
 *
 * @param {(row:object)=>Promise<{error:any}>} write  行を渡すと保存する関数
 * @param {object} row   entryToRow が作った行
 * @param {number} maxDrops  外してよい列の数の上限（既定3）
 * @returns {{error:any, dropped:string[]}}
 *
 * ★user_id と date は絶対に外しません。外すと別の行を壊します。
 * ★上限を設けます。際限なく外すと、最後には空の行を書き込みます。
 */
export const NEVER_DROP = ["user_id", "date"];

export async function writeWithMissingColumnFallback(write, row, maxDrops = 3) {
  const dropped = [];
  let current = row;
  // ★回数ではなく「外した数」で止めます。以前ここを attempt で数えていて、
  //   上限3のはずが4つ外せました（テストが見つけました）。
  for (;;) {
    const { error } = await write(current);
    if (!error) return { error: null, dropped };
    if (!isUnknownColumnError(error)) return { error, dropped };
    const col = missingColumnFrom(error);
    // ★名前が読み取れない／消してはいけない列なら、あきらめてエラーを返す。
    //   握りつぶすより、はっきり失敗するほうが安全です。
    if (!col || NEVER_DROP.includes(col) || !(col in current)) return { error, dropped };
    // ★上限。際限なく外すと、最後には空に近い行を書き込みます。
    if (dropped.length >= maxDrops) return { error, dropped };
    dropped.push(col);
    current = rowWithout(current, col);
  }
}
