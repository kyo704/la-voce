// ============================================================================
// ★募集を 出す ── ★決めごと 1か所
//   ★出どころ 見本 `SC['募集を出す']`／★裁定 その94 §4g「WHAT_A_POSTING_SHOWS」
//
//   ★★★見本の 入れ口は 10 です。★いま 通せるのは **6つ** です。
//     ★★台帳に 列が ある のは、★§4g が 2026-09-19 に 確かめた ぶん だけ です。
//     ★★通せない 4つ（だれを／何人／楽器・パート／希望の 時期／回数／版）は、
//       ★★下の `NOT_YET` に、★外す 条件（when）と ともに 置いて あります。
//     ★★★入れ口だけ 作りません。★入れても どこにも 残りません。
//
//   ★★★時間・会場・合わせの 場所は **持ちません**（★§4g `never_show`）。
//     ★★日にち＋時間＋場所が 揃うと、★「いつ どこに いるか」が 判ります。
//     ★★台帳にも 列が ありません。★ここでも 作りません。
//
//   ★見張り components/tests/posting-form.test.js
// ============================================================================
import { tx } from "@/lib/t";

export const HEAD = tx("募集を 出す");

/** ★内容（★§4g `kind`。★台帳の 縛りと 同じ 4つ）。 */
export const KINDS = Object.freeze([
  tx("実技試験"), tx("コンクール"), tx("演奏会"), tx("録音")
]);

/** ★お礼の 単位（★§4g `fee.unit`。★自由記述に しません）。 */
export const FEE_UNITS = Object.freeze([
  tx("1回の本番"), tx("1回の練習"), tx("時給"), tx("まとめて")
]);

/** ★節の 題。 */
export const HEADS = Object.freeze({
  days: tx("日にち"),
  kind: tx("何のために"),
  piece: tx("曲目"),
  allDays: tx("この日は"),
  fee: tx("お礼"),
  title: tx("募集の 名前")
});
export const OPTIONAL = tx("任意");

/** ★「この日は」の 2つ（★§4b `posting_side`）。 */
export const ALL_DAYS_LABEL = tx("すべて 来られる方");
export const ALL_DAYS_SUB = tx("合わない日が ある方には、はじめから 出しません");
export const ANY_DAY_LABEL = tx("1日でも 来られる方");
export const SCHEDULE_NOTE = tx("時間割を 書いていない方には、どちらでも 出します。");

/** ★「相談に 応じます」（★§4g `sodan`）。 */
export const SODAN_LABEL = tx("相談に 応じます");
export const SODAN_SUB = tx("応募の ときに、お礼の ことを たずねられます");

/**
 * ★期限（★裁定 その130・2026-09-21）。
 *
 *   ★★★強いません。★「決めない」を 選べます。★催促しません。
 *   ★★★期限が 来ても 消しません。★一覧から 外れる だけ です。
 *     ★★ご本人の 画面には 残ります。★もう一度 出せます。
 *   ★★お知らせも 送りません（★裁定 その87）。
 */
export const EXPIRE_HEAD = tx("いつまで 出しますか");
export const EXPIRES = Object.freeze([
  { key: "1m", label: tx("1か月"), months: 1 },
  { key: "3m", label: tx("3か月"), months: 3 },
  { key: "none", label: tx("決めない"), months: null }
]);
export const EXPIRE_NOTE = tx("期限が 来たら、一覧から 外れます。消えません。もう一度 出せます。");
export const ENDED_LABEL = tx("終わりました。もう一度 出せます。");

/**
 * ★期限の 日時（★選んだ もの から 作ります）。
 *
 *   ★★「決めない」は `null` です。★ずっと 出ます。
 *   ★★★月を 足します。★日づけの まま 足すと、★月末で ずれます。
 *     ★★`new Date(y, m + n, d)` は、★2月31日 を 3月3日 に します。
 *     ★★月の 終わりに 寄せます ── ★1月31日 ＋ 1か月 ＝ 2月28日。
 */
export function expiresAt(key, now) {
  const 決 = EXPIRES.find((x) => x.key === key);
  if (!決 || 決.months === null) return null;
  const d = now instanceof Date ? new Date(now.getTime()) : new Date();
  const 日 = d.getDate();
  const 先 = new Date(d.getTime());
  先.setDate(1);
  先.setMonth(先.getMonth() + 決.months);
  const 月末 = new Date(先.getFullYear(), 先.getMonth() + 1, 0).getDate();
  先.setDate(Math.min(日, 月末));
  return 先.toISOString();
}

export const PIECE_HINT = tx("決まっていなければ、空のままで");
export const SUBMIT = tx("出す");

/**
 * ★下の 断り（★見本の `.note`）。
 *
 *   ★★★見本の 4行目「出してから 30日で、自動的に 終わります。」は 出しません。
 *     ★★終わらせる 仕掛けが、★どこにも ありません（★2026-09-21 に 確かめました）。
 *     ★★無い ものを、★在る ように 言いません。
 *     ★★下の `NOT_YET` に、★外す 条件と ともに 置いて あります。
 */
export const NOTES = Object.freeze([
  tx("時間と 場所は 出しません。"),
  tx("（日にち・時間・場所が そろうと、いつ どこに いるかが 分かるからです）"),
  tx("決まった 方にだけ、ご自分たちで お伝えください。"),
  tx("曲が 決まっていなくても 出せます。"),
  tx("楽譜そのものは お預かりしません。")
]);
export const NOTES_BOLD = tx("時間と 場所は 出しません。");

/**
 * ★まだ 通せない 入れ口。
 *
 *   ★★★`when` が 無い 先送りは、★二度と 見直されません（★2026-09-16 の 覚え）。
 */
export const NOT_YET = Object.freeze([
  { key: "who", label: tx("だれを さがしますか"),
    when: tx("募集に「だれを さがしますか」の 列を 置く、と 裁定で 決まった とき") },
  { key: "howMany", label: tx("何人 さがしますか"),
    when: tx("団体としての ご登録が できた とき（2人以上は それが 要ります）") },
  { key: "part", label: tx("楽器・パート"),
    when: tx("募集に 楽器・パートの 列を 置く、と 裁定で 決まった とき") },
  { key: "when", label: tx("希望の 時期"),
    when: tx("日にちで 足りるか、時期の 字も 要るかが 決まった とき") },
  { key: "times", label: tx("回数"),
    when: tx("募集に 回数の 列を 置く、と 裁定で 決まった とき") },
  { key: "edition", label: tx("版"),
    when: tx("楽譜の 版を 載せる、と 裁定で 決まった とき") }
]);

/** ★はじめの 姿。 */
export function emptyForm() {
  return {
    title: "", kind: KINDS[0], piece: "", days: [],
    needAllDays: true, feeAmount: "", feeUnit: FEE_UNITS[0], sodan: false,
    // ★★既定は「1か月」です。★選び直せます。★強いては いません。
    expire: "1m"
  };
}

/**
 * ★出せるか。
 *
 *   ★★日にちが 1つ 以上。★内容が 4つの どれか。★これだけ です。
 *   ★★曲目も お礼も、★空の ままで 出せます（★見本「曲が 決まっていなくても」）。
 */
export function canSubmit(f) {
  if (!f) return false;
  if (!Array.isArray(f.days) || f.days.length === 0) return false;
  if (!KINDS.includes(f.kind)) return false;
  if (f.feeAmount !== "" && !(Number(f.feeAmount) >= 0)) return false;
  return true;
}

/** ★出せない わけ（★押せない ままに しません。★わけを 言います）。 */
export function whyNot(f) {
  if (!f || !Array.isArray(f.days) || f.days.length === 0) return tx("日にちを 1つ 以上 選んでください。");
  if (!KINDS.includes(f.kind)) return tx("何のためかを 選んでください。");
  if (f.feeAmount !== "" && !(Number(f.feeAmount) >= 0)) return tx("お礼は 0円 以上の 数で お願いします。");
  return "";
}

/**
 * ★台帳に 渡す 形。
 *
 *   ★★`org_id` と `owner_user_id` は 呼ぶ側が 入れます。
 *     ★★★台帳の 門が、★在籍して いる 学校か を 見ます（★2026-09-21）。
 *       ★★画面だけで 守りません。★門が 本体 です。
 */
export function toRow(f, now) {
  return {
    title: String(f.title || "").trim() || null,
    kind: f.kind,
    piece: String(f.piece || "").trim() || null,
    days: f.days,
    need_all_days: !!f.needAllDays,
    fee_amount: f.feeAmount === "" ? null : Number(f.feeAmount),
    fee_unit: f.feeAmount === "" ? null : f.feeUnit,
    sodan: !!f.sodan,
    expires_at: expiresAt(f.expire, now)
  };
}
