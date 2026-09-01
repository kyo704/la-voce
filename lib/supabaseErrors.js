// ============================================================================
// Supabase（PostgREST）のエラーの読み分け
//
//   ★1か所に置く理由
//     この判定は accountDeletion と orgClosure の両方から要ります。
//     accountDeletion が orgClosure を読み込んでいるので、
//     ★逆向きに読み込むと循環します。だから別のファイルにします。
//
//   ★2026-09-01 の教訓
//     この判定がゆるかったとき、「列が無い」を「表が無い」と読んで
//     ★握りつぶしていました。user_id を持たない4つの表への削除が、
//     何もせずに成功として通っていたのです。
//     実地の削除試験で、初めて5件の失敗として表面化しました。
//
//     ★ここをゆるめるときは、握りつぶされる側を必ず数えること。
//       「たぶん大丈夫」でゆるめると、失敗が静かになるだけで、
//       失敗しなくなるわけではありません。
// ============================================================================

/**
 * 「その表が、そもそも無い」エラーか。
 *
 * ★true を返すと、呼ぶ側はそれを無視します。だから狭く判定します。
 *   ★列が無いのは、無視してよい話ではありません。
 *     こちらの一覧が間違っている、という意味だからです。
 */
export function isMissingTable(error) {
  const m = (error && error.message) || "";
  if (!m) return false;
  if (/column .* does not exist/i.test(m)) return false;
  if (/could not find the '.*' column/i.test(m)) return false;
  return /relation .* does not exist|schema cache/i.test(m);
}
