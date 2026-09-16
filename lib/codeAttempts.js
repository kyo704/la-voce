// ============================================================================
// ★合言葉を 打つ 回数の 制限（★総当たりを 止める）
//
//   ★★出どころ　Opus の 裁定（★2026-09-16・坂本さん 転送）──
//     「1つの 合言葉に対して 10回で 止める
//       1つの IP に対して 1時間に 20回
//       止まったあと 24時間 開かない
//       合言葉そのものを 記録しない。ハッシュで
//       24時間で 自動的に 消す」
//
//   ★★なぜ 要るか ──
//     ★8文字・31種＝**8,530億通り**。★多い ように 見えます。
//     ★★けれど、★回数の 制限が 無ければ 機械が 順に 打てます。
//     ★★当たると、★その 教室に 知らない 人が 入ります。
//       ★入った 人には お名前・学年・出欠・門下の 連絡が 見えます。
//
//   ★★この 一枚は **決めだけ** を 持ちます。★台帳も 通信も 触りません。
//     ★★だから 見張りが、★そのまま 呼んで 試せます。
// ============================================================================

import { createHash } from "crypto";

/** ★1つの 合言葉に、★何回まで。 */
export const MAX_PER_CODE = 10;
/** ★1つの ところ（IP）から、★1時間に 何回まで。 */
export const MAX_PER_IP_HOUR = 20;
/** ★止まったあと、★何時間 開かないか。 */
export const LOCK_HOURS = 24;

/**
 * ★塩（pepper）。★サーバだけ が 持ちます。
 *
 *   ★★塩が 無ければ、★ハッシュは 総当たりで 戻せます。
 *     ★★8文字・31種 なら、★手元の 機械でも すぐ です。
 *     ★★「ハッシュに した から 安心」では ありません。
 *   ★★`CODE_ATTEMPT_PEPPER` を 置いて ください。
 *     ★★置かれて いない あいだは、★サーバの 鍵を 借ります。
 *       ★★借り物 です。★良い 形では ありません。
 *       ★★止めて しまうと、★10月に 誰も 入れなく なります。
 *       ★★だから 動かしつつ、★console に 残して 気づける ように します。
 */
function pepper() {
  const own = process.env.CODE_ATTEMPT_PEPPER;
  if (own) return own;
  const borrowed = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (borrowed && typeof console !== "undefined") {
    console.warn("★CODE_ATTEMPT_PEPPER が ありません。サーバの鍵を借りています。"
      + "★置いてください（合言葉のハッシュが総当たりで戻せます）。");
  }
  return borrowed;
}

/**
 * ★合言葉を、★戻せない 形に します。
 *
 *   ★★大文字に そろえます ── ★打ち方で 別の ものに しない ため。
 *   ★★`app/api/…/accept` も `toUpperCase()` して います。★同じ 形 です。
 */
export function hashCode(code) {
  const norm = String(code || "").trim().toUpperCase();
  if (!norm) return null;
  return createHash("sha256").update(pepper() + " code " + norm).digest("hex");
}

/** ★打った ところを、★戻せない 形に します。★IP そのものは 残しません。 */
export function hashIp(ip) {
  const norm = String(ip || "").trim();
  if (!norm) return null;
  return createHash("sha256").update(pepper() + " ip " + norm).digest("hex");
}

/**
 * ★止めるか どうかを 決めます。
 *
 *   @param now          ★いまの 時刻（Date）
 *   @param codeAttempts ★その 合言葉の 試し（`[{at}]`）
 *   @param ipAttempts   ★その ところの 試し（同じ）
 *   @returns { blocked, reason, until }
 *
 *   ★★`reason` は **記録の ため** です。★画面には 出しません。
 *     ★★裁定 ──「間違いを 教えない」。★理由を 出すと 手がかりに なります。
 */
export function decideBlock(now, codeAttempts, ipAttempts) {
  const t = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const lockMs = LOCK_HOURS * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;
  const ms = (a) => new Date(a && a.at ? a.at : a).getTime();

  // ★★1つの 合言葉 ── ★24時間の あいだに 10回 で 止めます。
  //   ★★「止まったあと 24時間 開かない」── ★だから 窓も 24時間 です。
  const inLock = (codeAttempts || []).filter((a) => t - ms(a) < lockMs);
  if (inLock.length >= MAX_PER_CODE) {
    const oldest = Math.min(...inLock.map(ms));
    return { blocked: true, reason: "code", until: new Date(oldest + lockMs) };
  }

  // ★★1つの ところ ── ★1時間に 20回。
  const inHour = (ipAttempts || []).filter((a) => t - ms(a) < hourMs);
  if (inHour.length >= MAX_PER_IP_HOUR) {
    const oldest = Math.min(...inHour.map(ms));
    return { blocked: true, reason: "ip", until: new Date(oldest + lockMs) };
  }

  return { blocked: false, reason: null, until: null };
}

/**
 * ★画面に 出す 字（★1つ だけ）。
 *
 *   ★★裁定 ── ★理由を 分けません。
 *     ★NG「その合言葉は ありません」「期限が 切れて います」「もう 使われて います」
 *     ★OK「入れませんでした」
 *   ★★分けると、★総当たりに「当たりが 近い」と 教える ことに なります。
 *   ★★止められた ときも **同じ 字** です。★止まったことも 手がかり だから です。
 */
export const SAME_ANSWER = "入れませんでした。合言葉を もう一度 お確かめください。"
  + "何度か 続くと、しばらく お試しいただけなく なります。";

/** ★どの 場合でも 同じ 返事に します。★呼ぶ 側が 迷わない ように。 */
export function sameAnswer() {
  return { ok: false, error: SAME_ANSWER };
}
