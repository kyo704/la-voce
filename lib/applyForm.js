// ============================================================================
// ★応募する ── ★決めごと 1か所
//   ★出どころ 見本 `SC['応募する']`／★裁定 その94 §4「L2_TEMPLATE」・§4e・§4f
//
//   ★★★送れる ことばは 3つ だけ です。★自由には 書けません。
//     ★★台帳にも 自由文の 列が ありません（`applications.template_key`）。
//     ★★画面で 止めて いるのでは ありません。★列が 無い のです。
//
//   ★★★お見せする ものは、★応募する ご本人が 選びます（★§4e）。
//     ★★写真 だけ 既定で 切。★「見た目で 選ばれない」ため です。
//     ★★録画は 既定で 入。★もう 世に 出て いる リンク だから です。
//
//   ★見張り components/tests/apply-form.test.js
// ============================================================================
import { tx } from "@/lib/t";

export const HEAD = tx("応募する");

/** ★日どりの 題（★募集の「この日は」で 変わります）。 */
export const DAYS_HEAD_ALL = tx("この日、すべてに 来られる方");
export const DAYS_HEAD_ANY = tx("来られる 日");
export const ALL_NOTE = tx("この募集は、すべての 日に 来られる方を さがしています。");

/** ★お見せするもの（★§4e `applicant_controls`）。 */
export const SHOW_HEAD = tx("お見せするもの");
export const SHOW_ITEMS = Object.freeze([
  { key: "career", label: tx("経歴（学んだところ・師事・賞）"), column: "show_career" },
  { key: "recordings", label: tx("録画"), column: "show_recordings" },
  { key: "repertoire", label: tx("レパートリー"), column: "show_repertoire" },
  { key: "photo", label: tx("写真"), column: "show_photo" }
]);
export const SHOW_EMPTY = tx("まだ 書いていません");
export const SHOW_GO = tx("ここで 書けます");
export const SHOW_NOTES = Object.freeze([
  tx("出さないものは、相手に 見えません。"),
  tx("年齢・学年・門下は、どちらにしても 出ません。"),
  tx("録画は YouTube の リンクです。この中では 再生しません。")
]);
export const SHOW_NOTES_BOLD = tx("出さないものは、相手に 見えません。");

/** ★お礼（★読むだけ。★ここでは 決めません）。 */
export const FEE_HEAD = tx("お礼");
export const SODAN_YES = tx("相談に 応じる、とのことです");

/**
 * ★送る ことば（★見本 `TPL_B` ＋ `TPL_B_SODAN`）。
 *
 *   ★★★`orei_sodan` は「相談に 応じます」の 募集に だけ 出します（★§4g）。
 *     ★★無い 募集に 出すと、★値切りの 道具に なります。
 */
export const WORD_HEAD = tx("送る ことば");
export const WORDS = Object.freeze([
  { key: "ukeraremasu", label: tx("お受けできます") },
  { key: "kyokumoku_kikitai", label: tx("曲目を もう少し 教えてください") }
]);
export const WORD_SODAN = Object.freeze({
  key: "orei_sodan", label: tx("お礼について 相談させてください")
});

/** ★下の 断り（★見本の `.note`）。★減らしません。 */
export const NOTES = Object.freeze([
  tx("ことばは、この中から 選びます。自由に 書くことは できません。"),
  tx("（このほうが、おたがいに 安全だからです）"),
  tx("回数・場所・お礼は、話が まとまってから ご自分たちで お決めください。"),
  tx("そのときに、ご自分で 決めて 連絡先を 交換していただけます。"),
  tx("合わないと 思ったら、いつでも 切れます。理由は 要りません。")
]);
export const NOTES_BOLDS = Object.freeze([
  tx("ことばは、この中から 選びます。"),
  tx("話が まとまってから"),
  tx("合わないと 思ったら、いつでも 切れます。")
]);

export const SUBMIT = tx("応募する");

/**
 * ★まだ できない こと。★`when`（外す 条件）を 添えます。
 */
export const NOT_YET = Object.freeze([
  { key: "overlap", label: tx("ほかの 予定が あります の 印"),
    when: tx("時間割との 突き合わせを、端末の 中だけで 作る とき") },
  { key: "photo", label: tx("写真"),
    when: tx("写真を 預かる ところを 決める とき") }
]);

/** ★選べる ことば（★募集の `sodan` で 変わります）。 */
export function wordsFor(posting) {
  return posting && posting.sodan ? [...WORDS, WORD_SODAN] : [...WORDS];
}

/** ★はじめの 姿（★§4e の 既定）。 */
export function emptyForm(posting) {
  return {
    days: posting && posting.need_all_days ? [...(posting.days || [])] : [],
    word: WORDS[0].key,
    show: { career: true, recordings: true, repertoire: true, photo: false }
  };
}

/**
 * ★出せるか。
 *
 *   ★★来られる 日を 1つ 以上。★ことばを 1つ。
 *   ★★「すべての 日」の 募集では、★すべてに 印が 要ります。
 */
export function canSubmit(f, posting) {
  if (!f || !posting) return false;
  if (!wordsFor(posting).some((w) => w.key === f.word)) return false;
  const 日 = Array.isArray(f.days) ? f.days : [];
  if (日.length === 0) return false;
  if (posting.need_all_days) {
    const 要 = (posting.days || []);
    return 要.every((d) => 日.includes(d));
  }
  return true;
}

/** ★出せない わけ。★黙って 押せなく しません。 */
export function whyNot(f, posting) {
  if (!posting) return "";
  const 日 = (f && Array.isArray(f.days)) ? f.days : [];
  if (posting.need_all_days && !(posting.days || []).every((d) => 日.includes(d))) {
    return tx("この募集は、すべての 日に 来られる方を さがしています。");
  }
  if (日.length === 0) return tx("来られる 日を 1つ 以上 えらんでください。");
  if (!wordsFor(posting).some((w) => w.key === (f && f.word))) {
    return tx("送る ことばを えらんでください。");
  }
  return "";
}

/**
 * ★台帳に 渡す 形。
 *
 *   ★★`posting_id` と `org_id` と `applicant_user_id` は 呼ぶ側が 入れます。
 *     ★★台帳の 門が、★その 募集の 学校か・在籍して いるかを 見ます（★2026-09-21）。
 */
export function toRow(f) {
  return {
    available_days: f.days,
    template_key: f.word,
    show_career: !!f.show.career,
    show_recordings: !!f.show.recordings,
    show_repertoire: !!f.show.repertoire,
    show_photo: !!f.show.photo
  };
}
