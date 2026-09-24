// ============================================================================
// ★カレンダーに つなぐ（★裁定195・2026-09-24）── ★決めごと 1か所
//
//   ★出どころ 見本 `SC['カレンダーにつなぐ']`／`calAddOne()`（design-v47）
//            裁定195「★作ります。★切り替えで 切っておく。★出発前に 1度 試してから」
//
//   ★★★仕組みは **もう できて います** ──
//     `app/api/calendar/[token]/route.js` ／ `lib/ics.js`
//     `my_calendar_items(p_token)` ／ `calendar_tokens` ／ `rotate_calendar_token()`
//   ★★足りなかったのは、★**住所を お見せする 1枚** だけ でした。
//     ★★2026-09-24、★私は「購読の 道が 1本も ない」と 申し上げました。★誤り でした。
//       ★字で 探して、★`app/api/calendar/` を 見て いません でした。
//
//   ★★★切り替え（`cal_sub`）が 閉じて いる あいだは、★**1件ずつ** を 出します。
//     ★★両方は 出しません（★見本の 註 …「迷わせません」）。
//     ★★開けるのは 坂本さんの お手 です。
//
//   ★★★住所は **読む だけ** です。★開く たびに 作り直しません。
//     ★★`calendar_tokens` の 決まりは `select` 1つ（`user_id = auth.uid()`）。
//     ★★作り直すのは `rotate_calendar_token()` ── ★押した ときだけ です。
//       ★★開く たびに 呼ぶと、★前の 住所が 毎回 死にます。
//
//   ★見張り components/tests/calendar-connect.test.js
// ============================================================================

import { featureOn } from "@/lib/featureOn";

/** ★切り替えの 鍵。★字は ここ 1か所 です。 */
export const CAL_SUB_KEY = "cal_sub";

/** ★購読の 姿を 出して よいか。★閉じて いれば「1件ずつ」を 出します。 */
export function mayShowSubscribe(features) {
  return featureOn(features, CAL_SUB_KEY);
}

/** ★引く 列（★`select('*')` を 書きません）。 */
export const COLS_TOKEN = "token, rotated_at";

// ---------------------------------------------------------------------------
// ★つなぐ（★切り替えが 開いて いる とき）
// ---------------------------------------------------------------------------
export const SUB_HEAD = "カレンダーに つなぐ";
export const SUB_LEAD = "1度 つなぐと、稽古が 変わっても 入れ直しが いりません。";
export const SUB_ADDR_LABEL = "あなた だけの 住所";
export const SUB_COPY = "写す";
export const SUB_ROTATE = "作り直す";
export const SUB_COPIED = "写しました";
export const SUB_ROTATED = "作り直しました。前の 住所は もう 使えません。";
export const SUB_MAKING = "作って います";
export const SUB_NONE = "まだ 住所が ありません。";
export const SUB_NONE_HOW = "「作る」を 押すと、あなた だけの 住所が できます。";
export const SUB_MAKE = "作る";

/**
 * ★住所の 形。
 *
 *   ★★`webcal://` は「カレンダーで 開く」の 合図 です。
 *     ★★押すと iPhone・Google が そのまま 受け取ります。
 *   ★★字を 組み立てるのは ここ だけ です。★画面で つなぎません。
 */
export function addressOf(token, origin) {
  if (!token) return "";
  const 本 = String(origin || "").replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return "webcal://" + (本 || "woolsong.app") + "/api/calendar/" + token;
}

/** ★入る もの（★見本の 4つ）。★体調は 1つも ありません。 */
export const SUB_INCLUDED = Object.freeze([
  "呼ばれている 稽古（集合の 時刻・場所）",
  "本番（入りの 時刻）",
  "レッスン（学校で 決まったもの）",
  "子どもの 呼び出し（集合と 解散）"
]);

/**
 * ★下の 註（★見本の `.note`）。
 *
 *   ★★5行 とも 確かめました ──
 *     ★「体調は 1文字も 入りません」…… `my_calendar_items` が 返すのは 6列 だけ
 *       （uid ／ starts_at ／ ends_at ／ title ／ place ／ canceled）。
 *       ★`lib/calendarExport.js` の `CALENDAR_ALLOWED` も 3つ だけ です。
 *     ★「住所を 人に 教えると 見えます」…… ★合言葉 そのものが 鍵 です。
 *       ★道は お入りに なって いるかを 問いません（★`route.js` の 覚え書き）。
 *     ★「作り直すと すぐ 使えなく なります」…… `rotate_calendar_token()` は
 *       ★`on conflict (user_id) do update` ── ★1人 1つ です。★前の 住所は 消えます。
 *     ★「取りに 来る 間隔は お使いの アプリが 決めます」…… ★こちらからは 送りません。
 *     ★「すぐ 見たい ときは『変わったもの』」…… ★アプリの 中が いちばん 早い。
 */
export const SUB_NOTES = Object.freeze([
  "体調の ことは 入りません。1文字も 入りません。",
  "住所を 人に 教えると、その人にも 予定が 見えます。",
  "教えて しまったら「作り直す」を 押して ください。前の 住所は すぐ 使えなく なります。",
  "カレンダーの ほうの 取りに来る 間隔は、お使いの アプリが 決めます（数分〜1日）。",
  "すぐ 見たい ときは、この アプリの「変わったもの」が いちばん 早いです。"
]);

// ---------------------------------------------------------------------------
// ★1件ずつ（★切り替えが 閉じて いる とき・★いまは こちら）
// ---------------------------------------------------------------------------
export const ONE_HEAD = "カレンダーに 入れる";
export const ONE_LEAD = "お使いの カレンダーに、1件ずつ 入れられます。";
export const ONE_PUT = "入れる";
export const ONE_EMPTY = "いまは、入れられる 予定が ありません。";

/**
 * ★1件ずつ の ときの 註（★見本の `.note`）。
 *
 *   ★★★「日が 変わったら もう一度 入れて ください」── ★これが 肝 です。
 *     ★★カレンダーの ほうは ひとりでに 変わりません。
 *     ★★書かないと、★古い 予定の まま 出かけて しまいます。
 */
export const ONE_NOTES = Object.freeze([
  "入れた あとに 日が 変わった ときは、もう一度 入れて ください。",
  "（カレンダーの ほうは、ひとりでに 変わりません）",
  "変わった ことは、この アプリの「変わったもの」に 出ます。",
  "体調の ことは、カレンダーに 入りません。"
]);
