// ============================================================================
// 大事な操作の前に、もう一度確かめること（2026-09-05）
//
//   出どころ docs/opus/lavoce-判断-メールを失うこと（9月4日・夜）.md §4
//            docs/reports/2026-09-05-FaceIDで再確認できるか.md §4
//
//   ★★決め ── ★見るだけなら、長く。★持ち出すときと、消すときだけ、確かめる。
//
//     長いままでよい   記録する／見る／装いを変える／予定を入れる
//     ★確かめる        書き出し／削除／メールの変更／復旧コードの出し直し
//
//   ★★確かめ方は、★パスワードをもう一度入れていただくことです。
//     ★iPhone では、★Face ID が出ます（autocomplete="current-password"）。
//     ★お客さまは、顔を見せるだけです。★打ちません。
//     ★★そして、★サーバが本当に確かめます（signInWithPassword）。
//
//   ★★画面の中だけで確かめないこと。
//     ★書き出しも削除も、★サーバへの呼び出しです。
//     ★画面を通さずに出されたら、★画面の確認は素通りします。
//     ★★だから、★route の側でも見ます（isReauthFresh）。
//
//   ★この決めは、★ここ1か所にあります。★画面の側で並べ直さないこと。
// ============================================================================

// ---------------------------------------------------------------------------
// ① ★確かめる操作（★4つだけ。★増やさないこと）
//
//   ★記録するたびに確かめさせると、★毎日パスワードを聞くことになります。
//   ★★確かめるのは、★取り返しがつかないことだけです。
// ---------------------------------------------------------------------------
export const REAUTH_ACTIONS = Object.freeze({
  EXPORT: "export",                     // ★書き出し（★丸ごと持ち出せます）
  DELETE_ACCOUNT: "delete",             // ★削除
  CHANGE_EMAIL: "change_email",         // ★メールの変更（★乗っ取りの入口です）
  REISSUE_RECOVERY: "reissue_recovery"  // ★復旧コードの出し直し（★古いのが死にます）
});

const LIST = Object.freeze(Object.values(REAUTH_ACTIONS));

export function needsReauth(action) {
  return LIST.includes(action);
}

// ---------------------------------------------------------------------------
// ② ★確かめてから、どれだけ続けて操作できるか
//
//   ★★1つの操作ごとに聞き直すと、★書き出しの途中で切れます。
//   ★長すぎると、★確かめた意味がなくなります。
//
//   ★★5分です（2026-09-05・Opus の指定）。
//     ★書き出してすぐ削除する、といったときに、★二度聞かないためです。
//     ★はじめ10分と書きましたが、★指定に合わせました。
//   ★直すときは、★ここだけを直せば、★画面もサーバも一緒に変わります。
// ---------------------------------------------------------------------------
export const REAUTH_VALID_MINUTES = 5;

export function reauthStillValid(confirmedAt, now) {
  if (!confirmedAt) return false;
  const t = new Date(confirmedAt).getTime();
  if (Number.isNaN(t)) return false;
  const n = new Date(now).getTime();
  if (Number.isNaN(n)) return false;
  // ★★先の時刻を渡されても、通さないこと。
  //   ★端末の時計は、★ずれます。★ずらされることもあります。
  if (t > n) return false;
  return n - t < REAUTH_VALID_MINUTES * 60 * 1000;
}

// ---------------------------------------------------------------------------
// ③ ★★確かめるのは、★サーバです。★画面ではありません
//
//   ★★2026-09-05、★ここで作り方を間違えかけました。書いておきます。
//
//     ★はじめ、★画面の側で signInWithPassword を呼ぶつもりでした。
//     ★★ですが、★すでに入っている状態でそれを呼ぶと、
//       ★★いまのセッションが★書き換わります。
//       ★これは、★app/api/account/delete/route.js:80 に、
//         ★すでに書いてありました。★先に読むべきでした。
//
//   ★正しい形（★削除の route が、すでにしていること）
//
//     ・画面は、★パスワードを受け取るだけ。★自分では確かめない
//     ・route が、★セッションを持たないクライアントで確かめる
//       　★persistSession: false ／ autoRefreshToken: false
//     ・★だから、★いまのセッションは、1ミリも動きません
//
//   ★★この形なら、★画面を信じずに済みます。
//     ★route は、★画面を通さずにも呼べますが、
//     ★パスワードが無ければ、★どのみち通りません。
// ---------------------------------------------------------------------------

/**
 * ★パスワードを、サーバの側で確かめます。
 *
 *   ★★route からだけ呼んでください。★画面から呼ばないこと。
 *   ★セッションを持たないクライアントを、★毎回その場で作ります。
 *   ★理由 ── ★使い回すと、★どこかで持ち回りのセッションが混ざります。
 *
 *   ★戻り値は true / false だけです。
 *   ★★理由を細かく返さないこと。
 *     ★「そのメールは在る」を、★漏らさないためです。
 */
export async function verifyPassword({ createPlainClient, url, anonKey, email, password }) {
  if (!password || !email) return false;
  const verifier = createPlainClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  const { error } = await verifier.auth.signInWithPassword({ email, password });
  return !error;
}

// ---------------------------------------------------------------------------
// ④ 文言
//
//   ★★「本人確認」と書かないこと。★役所の言葉です。
//   ★何のために聞いているかを、★先に書きます。
// ---------------------------------------------------------------------------
export const REAUTH_HEADING = "もう一度、パスワードをお願いします。";

export const REAUTH_REASON = Object.freeze({
  export: "記録を丸ごと取り出すところです。",
  delete: "アカウントを消すところです。",
  change_email: "メールアドレスを変えるところです。",
  reissue_recovery: "復旧の番号を出し直すところです。"
});

export function reauthReason(action) {
  return REAUTH_REASON[action] || "";
}

// ★どうして聞くのかを、★1行で書きます。★黙って聞かないこと。
export const REAUTH_NOTE = "端末を置き忘れたときのための、ひと手間です。";

// ★通らなかったとき。★「間違っています」と決めつけないこと。
export const REAUTH_FAILED = "このパスワードでは進めませんでした。もう一度お確かめください。";

// ★サーバが断ったときに返す言葉（★route が使います）。
export const REAUTH_REQUIRED_CODE = "REAUTH_REQUIRED";
export const REAUTH_REQUIRED_MESSAGE = "もう一度パスワードを入れてから、お進みください。";
