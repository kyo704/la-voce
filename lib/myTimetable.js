// ============================================================================
// 時間割（★個人の もの）── ★決めごと 1か所
//
//   ★出どころ Opus の 裁定（★2026-09-11・その15）⑦
//     「時間割：個人のものとして、作ってください。「重なり◯件」は、後回しで
//       構いません。」
//   ★見本 00-動く見本（さわれる・全画面）.html
//     ★3184行　var DAYS=['月','火','水','木','金','土']
//     ★3295行　SC['時間割']
//     ★3330行　SC['授業を入れる']
//     ★3913行　SC['自分のコマ']
//
//   ★★1つの マスは、★3つの どれかです。
//     ★㋐ 授業が ある　★㋑ 来られない　★㋒ あき
//   ★★「あき」を 別に 持ちません。★行が 無い ことが「あき」です。
//     ★★2つ 持つと、★片方だけ 直ります。★この 帳面で いちばん 多い 不具合の 形です。
//
//   ★★教室（D＋E＋F＋G＋H）には 1つも 触れません。
//     ★学校の コマも、★ほかの 方の 予定も、★ここには 出て きません。
//
//   ★見張り components/tests/my-timetable.test.js
// ============================================================================

/** ★曜日（★見本 3184行）。★日曜は ありません。★1文字も 変えないこと。 */
export const DAYS = Object.freeze(["月", "火", "水", "木", "金", "土"]);

/**
 * ★はじめの コマ。
 *
 *   ★★台帳に 1行も 入れません（★lib の 決まり「まず null、読むときに 決める」）。
 *     ★★入れて しまうと、★「自分で 決めた」のか「はじめから そうだった」のかが
 *       ★分からなく なります。
 *   ★★見本の 学校の コマ（MST.koma）と 同じ 刻みに して あります。
 */
export const DEFAULT_PERIODS = Object.freeze([
  { ord: 1, name: "1限", start_min: 9 * 60, end_min: 10 * 60 + 30 },
  { ord: 2, name: "2限", start_min: 10 * 60 + 40, end_min: 12 * 60 + 10 },
  { ord: 3, name: "3限", start_min: 13 * 60, end_min: 14 * 60 + 30 },
  { ord: 4, name: "4限", start_min: 14 * 60 + 40, end_min: 16 * 60 + 10 },
  { ord: 5, name: "5限", start_min: 16 * 60 + 20, end_min: 17 * 60 + 50 },
  { ord: 6, name: "6限", start_min: 18 * 60, end_min: 19 * 60 + 30 }
]);

/** ★画面の 言葉（★見本の まま）。★1文字も 変えないこと。 */
export const TT_COPY = Object.freeze({
  title: "時間割を 入れる",
  help1: "授業を 入れてください。入れなかった ところが「空きコマ」に なります。",
  help2: "先生に 見えるのは 空いている 時間だけです。授業の 名前・先生・教室・備考は 送られません。",
  fName: "授業の 名前",
  fTeacher: "担当の 先生",
  fRoom: "教室",
  fMemo: "備考",
  phName: "れい：ソルフェージュ",
  phTeacher: "れい：山本 先生",
  phRoom: "れい：第2教室",
  phMemo: "れい：隔週／前期だけ",
  ngHead: "授業が 無い とき",
  ngTitle: "この時間は 来られません",
  ngSub: "バイト・通学・体の 都合など。理由は 聞きません",
  del: "授業を 消す（あきに する）",
  ok: "これでいい",
  notes: Object.freeze([
    "「来られません」に すると、先生の 画面から この枠が 消えます。理由は 送りません。",
    "ここに 書いたものは、先生にも 学校にも 送られません。",
    "空にすると、その コマは「あき」に なります。",
    "あなたの 画面で 時間割として 見るための ものです。"
  ]),
  periodsTitle: "自分の コマ",
  periodsAdd: "＋ コマを 足す",
  periodsNone: "学校の まま",
  periodsMine: "自分で 決めています"
});

/** ★分 → 「9:00」。 */
export function hhmm(min) {
  if (typeof min !== "number" || !Number.isFinite(min)) return "";
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0");
}

/** ★「9:00」→ 分。★読めなければ null。 */
export function toMin(t) {
  const s = String(t || "").split(":");
  if (s.length !== 2) return null;
  const h = Number(s[0]);
  const m = Number(s[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 24 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

/**
 * ★その方の コマ。★1つも 無ければ、★はじめの コマを 返します。
 *
 *   ★★台帳に 入れません。★読むときに 決めます。
 *   ★★だから「自分で 決めた」かどうかが、★いつでも 分かります。
 */
export function periodsOf(rows) {
  const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
  if (list.length === 0) return DEFAULT_PERIODS.map((p) => ({ ...p, id: null }));
  return [...list].sort((a, b) => (a.ord || 0) - (b.ord || 0));
}

/** ★自分で 決めて いるか（★見本の .role の 字）。 */
export function isOwnPeriods(rows) {
  return Array.isArray(rows) && rows.filter(Boolean).length > 0;
}

/** ★1つの マスの 鍵。★"曜-コマ"（★見本 keyLab と 同じ 形）。 */
export function cellKey(weekday, periodId) {
  return String(weekday) + "-" + String(periodId == null ? "" : periodId);
}

/**
 * ★マスの 姿。★3つの どれか。
 *
 *   ★"class"       ★授業が ある
 *   ★"unavailable" ★来られない
 *   ★"free"        ★あき（★行が 無い）
 */
export function cellState(row) {
  if (!row) return "free";
  if (row.unavailable) return "unavailable";
  const has = ["title", "teacher", "room", "memo"]
    .some((k) => typeof row[k] === "string" && row[k].trim().length > 0);
  return has ? "class" : "free";
}

/**
 * ★曜日 × コマ の 表を 作ります。
 *
 *   @param rows    my_timetable の 行
 *   @param periods periodsOf の 戻り
 *   @returns [{ period, cells: [{ weekday, key, row, state }] }]
 */
export function buildGrid(rows, periods) {
  const by = {};
  (Array.isArray(rows) ? rows : []).forEach((r) => {
    if (!r) return;
    by[cellKey(r.weekday, r.period_id)] = r;
  });
  return periods.map((p) => ({
    period: p,
    cells: DAYS.map((_, wd) => {
      const key = cellKey(wd, p.id);
      const row = by[key] || null;
      return { weekday: wd, key, row, state: cellState(row) };
    })
  }));
}

/**
 * ★空いて いる コマの 数。
 *
 *   ★★「来られません」は 空きに 入れません（★見本 3296行）。
 *     ★★見本 ── if(!MYJ[K] && !NG[K] && !OTHER[K]) free++
 *   ★★先生に 伝わるのは、★この 数だけ です。
 *     ★授業の 名前・先生・教室・備考は 送りません（★見本 3301行）。
 */
export function freeCount(rows, periods) {
  let n = 0;
  buildGrid(rows, periods).forEach((r) => {
    r.cells.forEach((c) => { if (c.state === "free") n++; });
  });
  return n;
}

/** ★1つの マスの 題（★見本 keyLab）。 */
export function cellLabel(weekday, period) {
  const d = DAYS[weekday] || "";
  if (!period) return d + "曜";
  return d + "曜　" + hhmm(period.start_min) + "〜" + hhmm(period.end_min)
    + "（" + period.name + "）";
}

/**
 * ★コマとして 正しいか。
 *
 *   ★★終わりが 始まりより あと。★逆を 入れさせません。
 *   ★★台帳の 決まり（my_periods_order_ok）と 同じです。
 *     ★★2か所に ある ように 見えますが、★役目が ちがいます ──
 *       ★台帳は 最後の 守り。★ここは、★書く 前に 知らせる ため。
 */
export function periodError(p) {
  if (!p) return "コマが ありません";
  const name = String(p.name || "").trim();
  if (name.length < 1) return "名前を 書いてください";
  if (name.length > 12) return "名前が 長すぎます";
  if (typeof p.start_min !== "number" || typeof p.end_min !== "number") {
    return "時刻を 選んでください";
  }
  if (p.end_min <= p.start_min) return "終わりが、はじまりより 前に なっています";
  return null;
}
