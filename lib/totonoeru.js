// ============================================================================
// ★整える ── ★ページの 見た目（★2026-09-25・C群 束5）
//
//   ★見本 `SC['整える']`（★design-v51・iPhone で 開く用）。
//   ★★Opus の 対応表（2026-09-24 訂正）──「ポートフォリオの 見た目
//     （★記録の『整える』では ありません）」。
//
//   ★★★2つの 約束（★束5_約束の文・★消さないで と 書かれて います）──
//     ①「赤・黄・緑は ありません（信号の 色を 使いません）」
//     ②「型の 骨組みは 崩れません」
//
//   ★★★①は 飾りの 話では ありません。
//     ★赤・黄・緑は、★この 家では「★悪い・注意・よい」に 読まれます。
//     ★★`CLAUDE.md` の 変えない 原則 ──「信号色を 出さない」。
//     ★★ポートフォリオの 色でも 同じ です ── ★人の ページに 判定の 色を 置きません。
//     ★だから 8色 とも、★信号に 読めない 色 です。
//
//   ★★台帳（★2026-09-25・本番に 入りました・sql/82）──
//     ★`portfolios.theme`（jsonb・既定 `{}`）── ★色・書体・写真の かたち。
//       ★★jsonb の わけ（★Opus の 注）──「★型ごとに 持てる ものが 違う
//         （★列に すると 型を 足すたび 増えます）」。
//     ★`page_sections`（user_id, key, title, visible, sort_order, sort_by）── ★節の 順番。
//       ★★決まりは `page_sections_own` 1本（`user_id = auth.uid()`）。
//       ★★他人は この 表を 直に 読みません（★公開ページの 書き出しから）。
//
//   ★★★選びは ぜんぶ 台帳に 残ります ── ★見本の 約束 ──
//     「ここで えらんだものは、型を 変えても 残ります」。
//     ★★`theme` は `paper_type`／`web_type` と 別の 列 です。★型を 変えても 消えません。
// ============================================================================

/** ★題と 戻り先（★見本）。 */
export const TITLE = "整える";
export const BACK_TO = "ページをたしかめる";

/**
 * ★★★8色（★見本の 並びの まま・★1文字も 変えないこと）。
 *
 *   ★★赤・黄・緑が 1つも ありません。★信号に 読まれない ため です。
 *     ★臙脂は 赤では ありません ── ★暗く、★彩りが 低く、★止まれに 見えません。
 *   ★★足す ときは、★信号に 読めない ことを 先に 確かめます。
 */
export const COLORS = Object.freeze([
  { key: "enji", label: "臙脂", hex: "#7A1F2E" },
  { key: "ai", label: "藍", hex: "#3E5C8C" },
  { key: "sumi", label: "墨", hex: "#2B2320" },
  { key: "koke", label: "苔", hex: "#5C6B4A" },
  { key: "budou", label: "葡萄", hex: "#5B3A5E" },
  { key: "kohaku", label: "琥珀", hex: "#8C5A2B" },
  { key: "tetsu", label: "鉄", hex: "#4A5560" },
  { key: "bara", label: "薔薇", hex: "#A34F6A" }
]);

/** ★色の 下の 1行（★見本の `.usu`・1文字も 変えないこと）。 */
export const COLOR_NOTE = "8色から。赤・黄・緑は ありません（信号の 色を 使いません）。";

/** ★書体（★見本の 3つ）。 */
export const FONTS = Object.freeze([
  { key: "both", label: "明朝と ゴシック" },
  { key: "mincho", label: "明朝だけ" },
  { key: "gothic", label: "ゴシックだけ" }
]);

/** ★写真の かたち（★見本の 2つ）。 */
export const PHOTO_SHAPES = Object.freeze([
  { key: "round", label: "角丸" },
  { key: "square", label: "四角" }
]);

/** ★見出し（★見本の `.sh3`）。 */
export const HEAD_COLOR = "色";
export const HEAD_FONT = "文字";
export const HEAD_PHOTO = "写真の かたち";
export const HEAD_SECTION = "節の 順番";

/**
 * ★節（★見本の 6つ）。★鍵は `page_sections.key` の 字 です。
 *
 *   ★★台帳の 注 ── `profile／events／rep／press／video／contact／custom`。
 *   ★★見本の 並びの まま です。★並べ替えは その方が します。
 */
export const SECTIONS = Object.freeze([
  { key: "profile", label: "プロフィール" },
  { key: "events", label: "出演" },
  { key: "rep", label: "レパートリー" },
  { key: "video", label: "録画" },
  { key: "press", label: "お知らせ" },
  { key: "contact", label: "お問い合わせ" }
]);

/** ★引く 列 だけ。 */
export const COLS_SECTION = "id, key, title, visible, sort_order";

/** ★既定（★何も 選んで いない とき）。★1つ目 です。 */
export const DEFAULT_THEME = Object.freeze({
  accent: COLORS[0].key, font: FONTS[0].key, photoShape: PHOTO_SHAPES[0].key
});

/**
 * ★いまの 選び。★知らない 字は 既定に 戻します。
 *
 *   ★★勝手な 値を 画面に 通しません。★台帳が jsonb で 何でも 入る から です。
 */
export function themeOf(theme) {
  const t = (theme && typeof theme === "object") ? theme : {};
  const 取 = (list, v, def) => (list.some((x) => x.key === v) ? v : def);
  return {
    accent: 取(COLORS, t.accent, DEFAULT_THEME.accent),
    font: 取(FONTS, t.font, DEFAULT_THEME.font),
    photoShape: 取(PHOTO_SHAPES, t.photoShape, DEFAULT_THEME.photoShape)
  };
}

/** ★並べ替え。★`sort_order` の 昇り順。★台帳の 並びに 頼りません。 */
export function sortSections(rows) {
  const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
  return [...list].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

/** ★上げ下げ（★見本の `↑` `↓`）。★端では 動かしません。 */
export function move(rows, index, dir) {
  const list = [...(Array.isArray(rows) ? rows : [])];
  const to = index + dir;
  if (index < 0 || index >= list.length || to < 0 || to >= list.length) return list;
  const [x] = list.splice(index, 1);
  list.splice(to, 0, x);
  return list.map((r, i) => ({ ...r, sort_order: i }));
}

/** ★下の 3行（★見本の `.note`・1文字も 変えないこと）。 */
export const NOTE_LINES = Object.freeze([
  "節を 消すことも、順番を 変えることも できます。",
  "型の 骨組みは 崩れません。",
  "ここで えらんだものは、型を 変えても 残ります。"
]);
