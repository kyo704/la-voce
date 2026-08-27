// ============================================================================
// 「いつまでも待たない」を1か所で決める。
//
// ★なぜ要るか
// /dashboard を開くと、認証の確認が3回走る（middleware → layout → page）。
// どれも Supabase への通信で、以前は時間制限が無かった。Supabase が
// 応答しないと、この3つがそれぞれ永久に待ち、画面は真っ白のまま止まる。
// 「少し遅い」と「返ってこない」は、利用者にとって別物なので、
// 返ってこない場合は必ず打ち切って、原因の分かる画面を出す。
//
// ★失敗の伝え方
// 時間切れは TimeoutError として投げる。呼び出し側は「ログインしていない」と
// 「つながらない」を区別できる。ここを混ぜると、Supabase が不調なだけの人を
// ログイン画面へ弾き出してしまう（そしてログイン画面も同じ理由で開かない）。
// ============================================================================

export class TimeoutError extends Error {
  constructor(label, ms) {
    super(`${label}が${ms}ミリ秒以内に応答しませんでした`);
    this.name = "TimeoutError";
    this.isTimeout = true;
  }
}

// 認証の確認。3回連続で走るので、短めに。
export const AUTH_TIMEOUT_MS = 5000;
// ミドルウェアはすべてのリクエストを通るので、さらに短く。
// ここでの時間切れは「今回はセッションを更新しない」だけで、実害が小さい。
export const MIDDLEWARE_TIMEOUT_MS = 3000;
// データの取得。件数が多いこともあるので長めに取る。
export const QUERY_TIMEOUT_MS = 20000;

export function withTimeout(promise, ms, label) {
  // 時間切れのあとで promise 側が失敗した場合に、
  // 「誰も受け取らなかったエラー」にならないようにしておく。
  promise.catch(() => {});
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(label, ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

// 時間切れとネットワーク断を、まとめて「つながらない」として扱う。
// ★「ログインしていない」とは区別すること。
export function isConnectivityError(error) {
  if (!error) return false;
  if (error.isTimeout || error.name === "TimeoutError") return true;
  const message = (error.message || "").toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("econnrefused") ||
    message.includes("etimedout") ||
    message.includes("socket hang up")
  );
}
