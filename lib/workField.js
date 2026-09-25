// ============================================================================
// ★お仕事（field）── ★決めを 持つのは この ファイル だけ です
//
//   ★見本 `SC['お仕事を選ぶ']`（★docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//     ／ woolsong-2026-09-21_18.zip・design-v75）。
//   ★台帳 `profiles.field`（★supabase/opus/20260925_90_profile_field.sql）。
//
//   ★★★裁定202 ── ★`field`（★3つ）と `occupation`（★11種）は **別の 軸** です。
//     ★`field` …… ★音楽／声／舞台。★画面の ことばを 変えます。
//     ★`occupation` …… ★声の 使い方の 分類（★VocalTracker）。★1つも 触りません。
//     ★★取り違えると、★記録の 項目まで 変わります。
//
//   ★★★`portfolios.field` では 足りません（★Code の 指摘・Opus が 受けた）。
//     ★あれは ホームページの 表 です。★持って いない 方の 分が 置けません。
//
//   ★★★「さがす」の 出し分けは この ファイルに 置きません ──
//     ★`lib/matchingGate.js` が 持ちます。★ここでは ことばだけ。
//     ★★ただし **どちらを 見るか** は 1つ です ── `isMusic()`。
//
//   ★見張り components/tests/work-field.test.js
// ============================================================================

/** ★戻る 先（★見本 `bk('もっと')`）。 */
export const BACK_TO = "もっと";

/** ★題（★見本の `h2`）。★「お仕事を選ぶ」では ありません。 */
export const TITLE = "どんな お仕事ですか";

/**
 * ★題の 下の 2行（★見本の `.usu`）。
 *
 *   ★★2行目は **約束** です ──「書いたものは 消えません」。
 *     ★★選び直しても、★`entries` も `notes` も 1行も 触りません。
 *       ★触る コードを 書いたら、★この 行が 嘘に なります。
 */
export const LEAD_LINES = Object.freeze([
  "えらぶと、画面の ことばが 変わります。",
  "あとから いつでも 変えられます。書いたものは 消えません。"
]);

/**
 * ★3つ（★見本の 並び そのまま）。
 *
 *   ★`key` …… 台帳に 入る 字（★`profiles.field` の CHECK と 同じ 3つ）
 *   ★`name` …… 札の 字（★1文字も 変えないこと）
 *   ★`sub` …… 下に 添える 小さな 字
 */
export const FIELDS = Object.freeze([
  Object.freeze({ key: "music", name: "音楽（歌・楽器）", sub: "曲目・レパートリー・演奏会" }),
  Object.freeze({ key: "voice", name: "声の お仕事", sub: "声優・ナレーター・アナウンサー" }),
  Object.freeze({ key: "stage", name: "舞台", sub: "演目・公演" })
]);

/** ★台帳の 列の 名（★2か所で 書かない ため）。 */
export const COL = "field";

/**
 * ★台帳から 読む ときの 列（★`select('*')` を 書かない ため）。
 *
 *   ★★★これを `PROFILE_BASE_COLUMNS`（`components/VocalTracker.jsx`）に 足すのは、
 *     ★`sql/90` が **本番に** 当たった 後 です。
 *     ★★先に 足すと、★列の 無い 台帳で 42703 に なり、★羊も 装備も 読めなく なります。
 *   ★★試しの 台帳には 当たって います（★2026-09-25）。
 */
export const COLS = "id, field";

/**
 * ★既定は music（★裁定119）。
 *
 *   ★★★`null` を music に 倒します ── ★いまの 方は 全員 music の まま です。
 *     ★★「選んだ」と「まだ 選んで いない」を 分ける 必要は ありません。
 *       ★どちらも 見え方は 同じ だからです（★裁定119）。
 */
export const DEFAULT_FIELD = "music";

/** ★3つの どれか に 倒します。 */
export function normalize(field) {
  const k = String(field || "");
  return FIELDS.some((f) => f.key === k) ? k : DEFAULT_FIELD;
}

/** ★札の 字（★無い ものを 聞かれたら 音楽の 字）。 */
export function labelOf(field) {
  const k = normalize(field);
  const f = FIELDS.find((x) => x.key === k);
  return f ? f.name : "";
}

/** ★いま 選んで いるか（★見本の `FIELD===x[0]`）。 */
export function isChosen(field, key) {
  return normalize(field) === String(key || "");
}

/**
 * ★音楽か（★「さがす」を 出すか の もと）。
 *
 *   ★★★これが **約束** の 根 です ──
 *     ★「声の お仕事・舞台を えらぶと『さがす』は 出ません」。
 *   ★★`lib/matchingGate.js` の `mayUseMatching` が これを 見ます。
 *     ★★見る ところを 2つに しません。
 */
export function isMusic(field) {
  return normalize(field) === "music";
}

/** ★選び直した ときの 一言（★見本の `toast`）。 */
export const TOAST = "ことばを 変えました";

/**
 * ★下の 断り（★見本の `.note`）。
 *
 *   ★★5行 とも **約束** です。★消さないこと。
 *     ★3行目・4行目・5行目は 「さがす」の 出し分けが 動いて いて 初めて 本当 です。
 *       ★★`matchingGate` から `isMusic` を 外したら、★この 3行を 先に 外します。
 */
export const NOTE_LINES = Object.freeze([
  "書いた 記録は、ひとつも 変わりません。",
  "ことばの 見え方だけが 変わります。",
  "声の お仕事・舞台を えらぶと、「さがす」は 出ません。",
  "伴奏の 相手を さがす ことが ないからです。",
  "あとで 音楽に 戻せば、また 出ます。"
]);

/** ★太字に する 行（★見本の `<b>`）。 */
export const NOTE_STRONG = Object.freeze([0, 2]);

/**
 * ★台帳に 入れる 形（★`update` に 渡す もの）。
 *
 *   ★★★`upsert` を 使いません ── ★`profiles` は `update` だけ 通ります
 *     （★決まりの 組が INSERT を 許して いません）。
 *   ★★`field` 1つ だけ 送ります。★ほかの 列を 巻き込みません。
 */
export function patchOf(field) {
  return { field: normalize(field) };
}
