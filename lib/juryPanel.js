// ============================================================================
// ★★★審査員を 足す ── ★決めを 持つのは この ファイル だけ です
//
//   ★出どころ  裁定165（審査員の 表）
//     ／ 見本 `P_addJudge`（`SC['審査員を足す']`）
//        woolsong-2026-09-21_1.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//        ★2026-09-23 に 展開・docs/design/pack-final/ に 反映
//
//   ★★★組めるのは **採点の 札（saiten）** を お持ちの 方だけ です。
//     ★止めて いるのは 台帳の 決め（`evaluation_judges_insert`）です。
//     ★★この ファイルは、★出す か 出さない かを 決める だけ です。
//     ★★★2か所で 止めます。★画面が 抜けても 台帳が 止めます。
//
//   ★★★外しても、★その方が すでに 入れた 点は 消えません（★見本の 註）。
//     ★`evaluation_scores` に `on delete` の 連鎖を 作らない、が その 支え です。
//
//   ★★★design-v36 の 直し ── ★行事の 題名が `undefined` に なって いました。
//     ★`eventTitle()` が 空の ときの 字を 持ちます。★画面で `||` を 書きません。
// ============================================================================

export const COLS_JUDGE = "org_id, event_id, judge_id, added_by, added_at";

/**
 * ★行事の 題名。
 *
 *   ★★★2026-09-23、★見本で `undefined` と 出て いました。
 *     ★名前の 無い 行事を そのまま 出して いた ためです。
 *   ★★空の ときは「行事」と 書きます。★`undefined` と 書きません。
 */
export function eventTitle(event) {
  const n = String((event && (event.name || event.title)) || "").trim();
  return n || "行事";
}

/** ★行事の 小見出し（★題名　／　場所）。★場所が 無ければ 題名 だけ。 */
export function eventLine(event) {
  const 題 = eventTitle(event);
  const 場 = String((event && (event.place_name || event.venue)) || "").trim();
  return 場 ? 題 + "　" + 場 : 題;
}

/** ★いま 組まれて いる 方（★名前が 引けなければ 番号は 出しません）。 */
export function judgesOf(judges, names) {
  const 名 = names && typeof names === "object" ? names : {};
  return (Array.isArray(judges) ? judges : []).map((j) => ({
    id: j.judge_id,
    name: 名[j.judge_id] || "（お名前が まだ です）"
  }));
}

/**
 * ★足せる 方。
 *
 *   ★★★採点の 札を 持つ 方 だけ です。
 *     ★持って いない 方を 灰色で 並べません ── ★押せない ものは 不具合に 見えます。
 *     ★★はじめから 出しません（★裁定176 §3 と 同じ 考え）。
 *   ★★もう 組まれて いる 方は「組まれています」と 出し、★押せなく します。
 */
export function candidates(members, judges) {
  const 済 = new Set((Array.isArray(judges) ? judges : []).map((j) => j.judge_id));
  return (Array.isArray(members) ? members : [])
    .filter((m) => m && m.can_saiten)
    .map((m) => ({
      id: m.user_id,
      name: m.display_name || "（お名前が まだ です）",
      title: m.display_title || m.role || "",
      already: 済.has(m.user_id)
    }));
}

/** ★まだ ひとりも 組まれて いないか。 */
export function isEmpty(judges) {
  return (Array.isArray(judges) ? judges : []).length === 0;
}

/** ★見本の 言葉（★1字 も 足しません）。 */
export const JURY_NOW_HEAD = "いま 組まれている方";
export const JURY_NONE = "まだ ひとりも 組まれていません";
export const JURY_ADD_HEAD = "足せる方（この学校の 先生）";
export const JURY_ADD = "足す";
export const JURY_ALREADY = "組まれています";
export const JURY_REMOVE = "外す";
export const JURY_ADDED = "を 組みました";
export const JURY_REMOVED = "を 外しました";

/**
 * ★下の 但し書き（★見本の .note。★1字 も 足しません）。
 *
 *   ★★★3行 とも 約束 です。★とくに 3行目 ──
 *     「外しても、その方が すでに 入れた 点は 消えません。」
 *     ★★これは 台帳の 形が 支えて います。★字だけの 約束では ありません。
 */
export const JURY_NOTE = Object.freeze([
  "組めるのは 採点の 札（saiten）を お持ちの方だけです。",
  "組んだ方だけが、その回の 点と 講評を 入れられます。組まれていない 先生は、点も 講評も 入れられません（台帳で 止めます）。",
  "外しても、その方が すでに 入れた 点は 消えません。"
]);
