// ============================================================================
// ★★★出演者を 招く ── ★決めを 持つのは この ファイル だけ です
//
//   ★出どころ  裁定141 ／ 裁定148（600人の 段）／ design-v36 の 直し ⑤
//     ／ 裁定178・裁定184 ／ sql/67（名前だけで 先に 置く）
//     ／ 見本 `P_koenInvite`（`SC['出演者を招く']`）
//        woolsong-2026-09-21_8.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 b5c54333）
//
//   ★★★段と 金額は **台帳** が 持ちます（`koen_tier_price`）。
//     ★ここに 数字を 写しません。★値段を 2か所に 置かない ため です。
//     ★★見本の `TIERS` と 台帳は いま 同じ です（15/40/120/300/600 ・ 0/2万/5万/10万/15万）。
//       ★★★同じ だからと 写すと、★片方を 直した ときに 気づけません。
//
//   ★★★招かれた 方の 体の 記録は、★制作にも 舞台監督にも 見えません（★裁定141）。
//     ★この ファイルは 体の ことを 1つも 扱いません。★受け取る 形も ありません。
// ============================================================================

export const COLS_CODE = "koen_id, code, expires_at, created_at";

/** ★合言葉を 読みやすく 切ります（★4字 ＋ 4字）。 */
export function codeParts(code) {
  const s = String(code || "").trim();
  if (s.length < 8) return s ? [s] : [];
  return [s.slice(0, 4), s.slice(4)];
}

/**
 * ★いま 何人 か。
 *
 *   ★★★キャストと スタッフを 合わせた 数 です（★見本の 註）。
 *     ★出て いる 方 だけ 数えます（`left_at` の ある 方は 数えません）。
 *   ★★名前だけで 先に 置いた 方も **1人** です（★sql/67 ／ `check_koen_tier` と 同じ）。
 *     ★★そう しないと、★画面の 数と ご請求が 食い違います。
 */
export function countMembers(members) {
  return (Array.isArray(members) ? members : []).filter((m) => m && !m.left_at).length;
}

/** ★上限に 達したか。 */
export function isFull(people, cap) {
  const n = Number(people) || 0;
  const c = Number(cap) || 0;
  return c > 0 && n >= c;
}

/**
 * ★いくつ 目の 段まで 上げれば よいか。
 *
 *   ★★台帳の `koen_tier_price` が 返した 一覧（★段・金額）から 選びます。
 *   ★★★ここで 金額を 作りません。★渡された ものを 選ぶ だけ です。
 */
export function nextTier(tiers, people) {
  const 段 = (Array.isArray(tiers) ? tiers : []).slice()
    .sort((a, b) => (a.tier || 0) - (b.tier || 0));
  const n = Math.max(1, Number(people) || 0);
  return 段.find((t) => (t.tier || 0) >= n) || null;
}

/** ★差額（★いまの 段と、★次の 段）。★どちらかが 無ければ null。 */
export function tierDiff(tiers, nowCap, wantPeople) {
  const 今 = (Array.isArray(tiers) ? tiers : []).find((t) => t.tier === Number(nowCap));
  const 次 = nextTier(tiers, wantPeople);
  if (!今 || !次) return null;
  const d = (Number(次.yen) || 0) - (Number(今.yen) || 0);
  return d > 0 ? { from: 今, to: 次, yen: d } : null;
}

/** ★15人まで（★いちばん 小さい 段）は 無料 か。 */
export function isFreeTier(tiers, cap) {
  const t = (Array.isArray(tiers) ? tiers : []).find((x) => x.tier === Number(cap));
  return Boolean(t) && Number(t.yen) === 0;
}

/** ★円の 書き方（★3桁ごとに 区切り、★「円」を 付けます）。 */
export function yen(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "";
  return v.toLocaleString("ja-JP") + "円";
}

/** ★見本の 言葉（★1字 も 足しません）。 */
export const INVITE_CODE_HEAD = "合言葉で 招く";
export const INVITE_CODE_BEFORE = "押したときに 作ります。開いただけでは 作りません。";
export const INVITE_CODE_MAKE = "合言葉を 作る";
export const INVITE_CODE_HOW = "稽古場で 読み上げるか、LINE に 貼ってください。";
export const INVITE_CODE_CLOSE = "人に なったら、この 合言葉は 自動で 閉じます";
export const INVITE_ROSTER_HEAD = "名簿から 招く";
export const INVITE_MONEY_HEAD = "人数と 料金";
export const INVITE_NOW = "いま";
export const INVITE_CAP = "いまの 上限";
export const INVITE_FREE = "15人までは 無料です。";
export const INVITE_ROOM = "上限まで 招けます。";
export const INVITE_NEED_UP = "あと 招くには、";
export const INVITE_NEED_UP2 = "人まで の 段に 上げる 必要が あります。";
export const INVITE_DIFF = "いまの 段との 差額 ";
export const INVITE_SEE_PRICE = "料金を 見る";
export const INVITE_NEXT = "次へ　香盤表を 作る";
export const INVITE_DONE = "さんを 招きました";

/**
 * ★下の 但し書き（★見本の .note。★1字 も 足しません）。
 *
 *   ★★★4行 とも 約束 です。★とくに 3行目 ──
 *     「招かれた 方の 体調の 記録は、制作にも 舞台監督にも 見えません。」
 *     ★★この 1行が 消える ときは、★見える ように なった とき だけ です。
 */
export const INVITE_NOTE = Object.freeze([
  "15〜17歳の 方は、入るときに 保護者の 方の ひとことを いただきます。",
  "15歳未満の 方は、保護者の 方が 自分の アカウントで「子どもを 出す」から 入ります（呼び名だけ）。",
  "招かれた 方の 体調の 記録は、制作にも 舞台監督にも 見えません。",
  "招く 前から 使っていた 記録は、そのまま ご本人の ものです。"
]);

// ============================================================================
// ★★★公演の 料金 ── ★見本 `P_koenPay`（2026-09-24）
//
//   ★出どころ  裁定143（公演を 作る・値段）／ 裁定148（600人の 段）
//     ／ woolsong-2026-09-21_4.zip ／ 00-動く見本-PC・iPad（運営）.html
//
//   ★★★段と 金額は **台帳** が 持ちます（`koen_tier_price`）。
//     ★ここに 写しません。★値段を 2か所に 置きません。
//   ★★★上の 段へは **差額 だけ** です（★見本の 註）。
//   ★★★自動更新は ありません。★1回 払い です。
// ============================================================================

/** ★上げる 先（★いまの 人数より 1つ 上の 段）。 */
export function targetTier(tiers, people, cap) {
  return nextTier(tiers, Math.max((Number(people) || 0) + 1, (Number(cap) || 0) + 1));
}

/** ★払う 額（★差額 だけ）。★上げる 要が なければ 0。 */
export function payAmount(tiers, people, cap) {
  const 今 = (Array.isArray(tiers) ? tiers : []).find((t) => t.tier === Number(cap));
  const 先 = targetTier(tiers, people, cap);
  if (!先) return 0;
  const d = (Number(先.yen) || 0) - (Number((今 || {}).yen) || 0);
  return d > 0 ? d : 0;
}

/** ★見本の 言葉（★1字 も 足しません）。 */
export const PAY_HEAD = "公演の 料金";
export const PAY_SUB = "公演ごとの 1回払い";
export const PAY_TIER_HEAD = "段";
export const PAY_TIER_NOW = "いま";
export const PAY_TIER_UNIT = "人まで";
export const PAY_TIER_NOTE = "キャストと スタッフを 合わせた 人数です。";
export const PAY_HEAD2 = "お支払い";
export const PAY_TO = "上げる 先";
export const PAY_AMOUNT = "お支払い";
export const PAY_UNTIL = "使える 期限";
export const PAY_UNTIL_DEFAULT = "本番の 最後の 日＋30日";
export const PAY_UNTIL_WHEN = "（払った ときに 決まります）";
export const PAY_EXT = "延期";
export const PAY_EXT_VALUE = "1回だけ、90日まで 延ばせます";
export const PAY_AUTO = "自動更新";
export const PAY_AUTO_VALUE = "ありません";
export const PAY_BUTTON = "を 支払う";

/**
 * ★下の 但し書き（★見本の .note。★1字 も 足しません）。
 *
 *   ★★★2行目は お金の 約束 です（★月割りで お返しする）。
 *   ★★★4行目も 約束 です ── ★600人を 超える 公演は 扱って いません。
 *     ★「ご相談」も 置きません。★置くと、★受けられる ように 読めます。
 */
export const PAY_NOTE = Object.freeze([
  "上の 段へは、差額だけです。",
  "途中で 公演を やめた ときは、残りの 月数ぶんを 月割りで お返しします（稽古が 始まる 前なら 全額）。",
  "学校の 契約（教室プラン）の 中の 公演は 0円です。",
  "600人を 超える 公演は、いまは 扱っていません（「ご相談」も 置いていません）。",
  "終わった あとも、出演者の 記録は ご本人に 残ります。運営側の 香盤表・出欠は PDF で 書き出せます。"
]);
