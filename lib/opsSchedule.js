// ============================================================================
// 日程 ── 1つの日程を、3つの 見せ方で（2026-09-09・第3便）
//
//   ★出どころ docs/opus/woolsong-見本-運営モード8点（9月9日）.jpg ②⑥⑧
//            坂本さん経由・Opus の裁定（2026-09-09）
//     「★⑧1日×先生よこ　★⑨1週間×濃さの地図　★⑩よこ持ち
//      ★これら3つは、★別々の画面では なく、
//      　★1つの日程データに対する、★見せ方の 切り替えとして 実装してください。」
//
//   ★★だから、★取ってくる ものは 1つです。★見せ方だけが 変わります。
//     ★3つの 画面を 作ると、★予定の 数え方が 3通りに 分かれます。
//
//   ★★よこ持ちは、★選ばせません（★裁定）。
//     「★画面を 横向きにすると、★812pxを 超えた時点で 自動的に この並びに
//       切り替える。★ユーザーには 選ばせない」
//
//   ★★守りつづけるもの
//     ★重なりは 印だけ。★自動で 動かしません。
//     ★連続日数・％を 出しません。
//     ★先生・事務は 数えません（★名簿の 人数）。
//     ★この画面から、★生徒の健康の記録には たどりつけません。
//
//   ★見張り components/tests/ops-schedule.test.js
// ============================================================================

/** ★見せ方 3つ。 */
export const VIEWS = Object.freeze([
  { key: "day", label: "1日" },     // ★⑧ 1日 × 先生よこ
  { key: "week", label: "1週間" }   // ★⑨ 1週間 × 濃さの地図
]);

/**
 * ★よこ持ちに 切り替わる はば（★裁定）。
 *
 *   ★★812px を 超えた時点。★iPhone を 横に すると 越えます。
 *   ★★選ばせません。★設定を 作りません。
 */
export const WIDE_AT = 812;

/**
 * ★いま どの 並びで 出すか。
 *
 *   @returns "wide"（★よこ持ち・先生を 横に 全部）
 *            "narrow"（★たて持ち・先生を 1人ずつ 横に ずらす）
 *
 *   ★★はばが 分からないうちは narrow。★狭いほうへ 倒します。
 *     ★広いほうへ 倒すと、★狭い画面で はみ出します。
 */
export function layoutOf(width) {
  return typeof width === "number" && width > WIDE_AT ? "wide" : "narrow";
}

/** ★時間の 列（★見本②は 9:00〜20:00）。 */
export const HOUR_FROM = 9;
export const HOUR_TO = 20;

export function hours() {
  const out = [];
  for (let h = HOUR_FROM; h <= HOUR_TO; h++) out.push(h);
  return out;
}

/** ★「10:00」→ 10.0。★読めなければ null。 */
export function hourOf(hhmm) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || ""));
  if (!m) return null;
  const h = Number(m[1]), mi = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(mi)) return null;
  return h + mi / 60;
}

/** ★予定の 時刻（★scheduled_at は "YYYY-MM-DDTHH:MM" の形）。 */
export function timeOf(lesson) {
  const s = String((lesson && lesson.scheduled_at) || "");
  return s.length >= 16 ? s.slice(11, 16) : "";
}

/** ★予定の 日（YYYY-MM-DD）。 */
export function dateOf(lesson) {
  const s = String((lesson && lesson.scheduled_at) || "");
  return s.length >= 10 ? s.slice(0, 10) : "";
}

/**
 * ★1日 × 先生よこ（★⑧）の 中身。
 *
 *   ★先生ごとに 縦の列。★時間は 左の 列に 固定します（★position: sticky）。
 *   ★★先生の 並びは、★渡された 順の まま。★こちらで 並べ替えません。
 */
export function dayGrid(lessons, dateISO, teacherIds) {
  const ofDay = (lessons || []).filter((l) => dateOf(l) === dateISO);
  return (teacherIds || []).map((tid) => ({
    teacherId: tid,
    lessons: ofDay
      .filter((l) => String(l.teacher_id) === String(tid))
      .sort((a, b) => (timeOf(a) < timeOf(b) ? -1 : 1))
  }));
}

/**
 * ★重なり（★同じ先生・同じ時刻に 2つ以上）。
 *
 *   ★★印を つけるだけです。★自動で 動かしません（★§4-2）。
 *     ★「教えるだけ。★自動で 動かさない」
 *   ★★どちらが 正しいかを、★こちらで 決めません。
 */
export function overlapsOf(lessons, dateISO) {
  const ofDay = (lessons || []).filter((l) => dateOf(l) === dateISO);
  const byKey = new Map();
  ofDay.forEach((l) => {
    const k = `${l.teacher_id}@${timeOf(l)}`;
    byKey.set(k, (byKey.get(k) || []).concat([l]));
  });
  const out = [];
  byKey.forEach((list, k) => {
    if (list.length >= 2) out.push({ key: k, at: k.split("@")[1], lessons: list });
  });
  return out.sort((a, b) => (a.at < b.at ? -1 : 1));
}

/**
 * ★1週間 × 濃さの地図（★⑨）。
 *
 *   ★★7日 × 先生の マスに、★コマの数だけを 濃淡で 出します。
 *   ★★1色の 濃淡だけです。★赤・黄・青を 使いません（★裁定）。
 *     ★色を 分けると、★「赤い先生」が 出ます。★働き方の 通信簿に なります。
 *   ★★返すのは 数と 濃さだけ。★色は 画面が 1つ 決めます。
 *
 *   @param days ★7日ぶんの 日付（★古い順）
 */
export function weekHeat(lessons, days, teacherIds) {
  const count = (tid, d) => (lessons || []).filter(
    (l) => String(l.teacher_id) === String(tid) && dateOf(l) === d).length;
  const rows = (teacherIds || []).map((tid) => ({
    teacherId: tid,
    cells: (days || []).map((d) => ({ date: d, count: count(tid, d) }))
  }));
  const all = rows.flatMap((r) => r.cells.map((c) => c.count));
  const max = Math.max(...all, 0);
  return {
    max,
    rows: rows.map((r) => ({
      ...r,
      cells: r.cells.map((c) => ({
        ...c,
        // ★★0 は 0。★薄く 塗りません。★「少ない」と「無い」は 別です。
        density: max === 0 || c.count === 0 ? 0 : 0.2 + 0.8 * (c.count / max)
      }))
    }))
  };
}

/**
 * ★名簿の 人数（★見本③・⑤）。
 *
 *   ★★先生・事務は 数えません（★裁定・見本③の 但し書き）。
 *     「★先生3人・事務2人は 数えていません」
 *   ★★休会中の方も 数えません。★お支払いの 人数だからです。
 *   ★％も 連続日数も 出しません。★人数だけです。
 */
export const BILLABLE_STATUSES = Object.freeze(["enrolled"]);
export const NOT_COUNTED_ROLES = Object.freeze(["teacher", "staff", "owner", "admin"]);

export function billableCount(members) {
  return (members || []).filter((m) => {
    if (!m) return false;
    if (NOT_COUNTED_ROLES.includes(m.role)) return false;
    return BILLABLE_STATUSES.includes(m.status || "enrolled");
  }).length;
}
