// ============================================================================
// ★行事を 出す ── ★決めごと 1か所（★2026-09-18）
//
//   ★出どころ 見本 `00-動く見本-PC・iPad（運営）.html` の `P_gyojiEdit`
//
//   ★★★見本の 入れ口は 7つ です。★いま 通せるのは **3つ** です。
//     ★★台帳の 列は ある のに、★`create_org_event` が 受け取りません。
//     ★★直の insert は 塞いで あります（★2026-09-04・#007）。
//       ★★`org_id` を 自由に できて、★どの 学校にも 予定を 作れて いました。
//     ★★★だから 抜け道を 作りません。★関数を 広げる 日まで、★3つ で 出します。
//
//   ★見張り components/tests/org-event-form.test.js
// ============================================================================

/** ★行事の 種類（★いまの 画面と 同じ 6つ）。 */
export const EVENT_KINDS = Object.freeze([
  "本番", "試験", "合わせ", "練習", "休講", "その他"
]);

/** ★いま 通せる 入れ口。★`create_org_event` が 受け取る ぶん だけ。 */
export const FIELDS = Object.freeze([
  { key: "date", label: "日", required: true },
  { key: "kind", label: "種類", required: true },
  { key: "title", label: "行事の 名前", required: false }
]);

/**
 * ★まだ 通せない 入れ口 ── ★わけと、★引き金。
 *
 *   ★★★列は ある のに 通せない もの が あります。
 *     ★★`start_time` / `end_time` / `target_group` は `org_events` に あります。
 *     ★★★`create_org_event` が 受け取らない だけ です。
 *   ★★【後まわし・引き金は この 束】── ★関数を 広げる 日に、★ここから 外します。
 */
export const NOT_YET = Object.freeze([
  {
    key: "time",
    label: "時間（はじまり 〜 終わり）",
    why: "台帳に 列は あります（start_time / end_time）。"
      + "create_org_event が 受け取りません。",
    needs: "create_org_event を 広げる（p_start_time / p_end_time）"
  },
  {
    key: "target",
    label: "対象（学年 ／ 学科・コース）",
    why: "台帳の 列は 1つ です（target_group）。見本は 2つ 選びます。",
    needs: "列を 2つに するか、1つに まとめる 決め。あわせて 関数も 広げる"
  },
  {
    key: "place",
    label: "場所",
    why: "台帳に 列が ありません。",
    needs: "org_events に 列を 足す（場所の 一覧も どこかに 要ります）"
  }
]);

/** ★出せる か。★日が 無ければ 出せません（★いまの 決めと 同じ）。 */
export function canSubmit(form) {
  return !!(form && typeof form.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(form.date));
}

/** ★はじめの 姿。 */
export function emptyForm() {
  return { date: "", kind: EVENT_KINDS[0], title: "" };
}

/** ★下に 出す 断り（★見本の `.note` から。★減らしません）。 */
export const FORM_NOTES = Object.freeze([
  "出欠は 集めません。出席の 提出も、その 一覧も ありません。",
  "取り下げても、静かに 1行 残ります。体調も 理由も 集めません。"
]);
