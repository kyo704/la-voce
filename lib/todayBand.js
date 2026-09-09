// ============================================================================
// 「きょう」の帯 ── 第2便（2026-09-08）
//
//   ★出どころ docs/opus/woolsong-裁定-全体レイアウトと教室機能・Sonnetへの引き継ぎ（9月8日）.md
//            §4-1（並び順）・§4-2（先生）・§4-3（生徒）
//
//   ★★並び順（★上から。★該当がなければ その行は出ない）
//     1　今日の レッスン／行事　　（★教室由来）
//     2　本番まで 3日以内　　　　（★自分の予定）
//     3　教室の行事 7日以内　　　（★教室由来）
//     4　羊のことば　　　　　　　（★いつも出る）
//
//   ★★「該当がなければ その行は出ない」を、★守ること。
//     ★「今日のレッスンはありません」と、★書かないこと。
//     ★★無いことを毎朝 知らせるのは、★催促と同じです。
//     ★羊のことばだけは、★いつも出ます。★空の帯を作らないためです。
//
//   ★★数を出しますが、★これは「人数」です（★§4-2「6人」）。
//     ★点数でも、順位でも、達成度でもありません。
//     ★★健康の記録には、★1つも数を足していません。
//
//   ★見張り components/tests/today-band.test.js
// ============================================================================

/** ★行の種類。★この順です。★入れ替えないこと。 */
export const ROWS = Object.freeze(["lessonToday", "performanceSoon", "orgEventSoon", "sheep"]);

/** ★本番は、★3日以内（★§4-1）。★教室の行事は、★7日以内。 */
// ★★3日 → 7日 に 広げました（★2026-09-10・坂本さんの お決め・案B）。
//   ★★見本① は「9月14日 実技試験（声楽科）」を 出しています。
//     ★見本の「きょう」から 4日 先です。★3日では 出ませんでした。
//   ★★§3-2 は「本番まで 3日以内」と 書いています。
//     ★見本と 仕様が、★ここだけ 食い違っていました。
//     ★坂本さんの お決めで、★見本に 合わせます。
//   ★行事（7日）と そろいます。★2つの 数を 覚えなくて 済みます。
//   ★★「静かにする期間」（−3〜+2）とは 別のものです。★混ぜないこと。
//     ★あちらは「呼びに行かない・くらべない」期間。
//     ★こちらは「帯に 出す」期間です。
export const PERFORMANCE_WITHIN_DAYS = 7;
export const ORG_EVENT_WITHIN_DAYS = 7;

export function daysBetween(fromISO, toISO) {
  if (!isDate(fromISO) || !isDate(toISO)) return null;
  const a = Date.UTC(+fromISO.slice(0, 4), +fromISO.slice(5, 7) - 1, +fromISO.slice(8, 10));
  const b = Date.UTC(+toISO.slice(0, 4), +toISO.slice(5, 7) - 1, +toISO.slice(8, 10));
  return Math.round((b - a) / 86400000);
}

function isDate(v) {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v);
}

/** ★時刻の部分（★"2026-09-08T10:00:00Z" → "10:00"）。 */
export function timeOf(iso, tz) {
  if (typeof iso !== "string" || iso.length < 16) return null;
  // ★★端末の時計で読みます。★イタリアにいらっしゃるときも、その場の時刻です。
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const opt = { hour: "2-digit", minute: "2-digit", hour12: false };
  if (tz) opt.timeZone = tz;
  return new Intl.DateTimeFormat("ja-JP", opt).format(d);
}

/** ★その日のレッスン（★時刻の早い順）。 */
export function lessonsOn(lessons, todayISO, tz) {
  return (lessons || [])
    .filter((l) => l && typeof l.scheduled_at === "string")
    .filter((l) => sameDay(l.scheduled_at, todayISO, tz))
    .sort((a, b) => String(a.scheduled_at).localeCompare(String(b.scheduled_at)));
}

function sameDay(iso, todayISO, tz) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const opt = { year: "numeric", month: "2-digit", day: "2-digit" };
  if (tz) opt.timeZone = tz;
  const p = new Intl.DateTimeFormat("en-CA", opt).format(d);
  return p === todayISO;
}

/** ★3日以内の本番（★近い順）。★今日より前は、入れません。 */
export function performancesSoon(performances, todayISO) {
  return (performances || [])
    .map((p) => ({ p, d: daysBetween(todayISO, String(p.performed_on || p.date || "")) }))
    .filter((x) => x.d != null && x.d >= 0 && x.d <= PERFORMANCE_WITHIN_DAYS)
    .sort((a, b) => a.d - b.d)
    .map((x) => ({ ...x.p, inDays: x.d }));
}

/** ★7日以内の教室の行事（★近い順）。★取り下げたものは、入れません。 */
export function orgEventsSoon(events, todayISO) {
  return (events || [])
    .filter((e) => e && !e.withdrawn_at)
    .map((e) => ({ e, d: daysBetween(todayISO, String(e.event_date || "")) }))
    .filter((x) => x.d != null && x.d >= 0 && x.d <= ORG_EVENT_WITHIN_DAYS)
    .sort((a, b) => a.d - b.d)
    .map((x) => ({ ...x.e, inDays: x.d }));
}

/**
 * ★帯に出す行を、順に組み立てます。
 *
 *   ★★該当がなければ、★その行を返しません（★§4-1）。
 *     ★「ありません」と書く行を、★作らないこと。
 *   ★★羊のことばだけは、★いつも返します。
 *
 *   @param ctx { todayISO, tz, lessons, performances, orgEvents, sheepLine, teaching }
 */
export function buildBand(ctx) {
  const c = ctx || {};
  const out = [];
  const les = lessonsOn(c.lessons, c.todayISO, c.tz);
  if (les.length > 0) {
    out.push({
      key: "lessonToday",
      // ★★先生のときは、★帯そのものが 出欠の表になります（★§4-2）。
      //   ★「きょう」を開いた時点で、★もう並んでいます。★0タップです。
      teaching: !!c.teaching,
      count: les.length,
      lessons: les
    });
  }
  const perf = performancesSoon(c.performances, c.todayISO);
  if (perf.length > 0) out.push({ key: "performanceSoon", items: perf });
  const ev = orgEventsSoon(c.orgEvents, c.todayISO);
  if (ev.length > 0) out.push({ key: "orgEventSoon", items: ev });
  // ★★羊のことばは、★いつも出ます。★空の帯を作らないためです。
  //
  //   ★★どこに 置くか（★2026-09-10・A01 の HTML より）。
  //     ★§3-2 は「4番目（いちばん下）」と 書いています。
  //     ★★A01 の HTML は、★ひとことが 予定より 上です。
  //     ★★README「★HTMLが 正です」に 従い、★A01 では 上に 置きます。
  //   ★★既定は これまでどおり 下です。★38人の 画面を 変えません。
  const sheepRow = { key: "sheep", line: c.sheepLine || null };
  if (c.sheepFirst) out.unshift(sheepRow);
  else out.push(sheepRow);
  return out;
}

/**
 * ★出欠（★§4-2・3つだけ）。
 *
 *   ★★増やさないこと。★「遅刻」も「早退」も、作りません。
 *     ★細かくするほど、★1タップで終わらなくなります（★§7-2）。
 */
export const ATTENDANCE = Object.freeze([
  { key: "came", label: "来た" },
  { key: "absent", label: "休み" },
  { key: "canceled", label: "中止" }
]);

export const ATTENDANCE_KEYS = Object.freeze(ATTENDANCE.map((a) => a.key));

export function attendanceLabel(key) {
  const a = ATTENDANCE.find((x) => x.key === key);
  return a ? a.label : null;
}

/**
 * ★取り消せる時間（★§7-2）。
 *
 *   ★★「よろしいですか」を、★出しません。★押した瞬間に確定します。
 *   ★★代わりに、★3秒だけ「もどす」を出します。
 *     ★確認より速く、★間違いも直せます。
 */
export const UNDO_SECONDS = 3;

/** ★★言葉。★1か所で持ちます。 */
export const COPY = Object.freeze({
  teachingToday: "きょう おしえる",
  seeAll: "ぜんぶ見る",
  calendar: "カレンダー",
  attend: "出ます",
  undo: "もどす",
  unsent: "未送信",
  done: "済"
});

/** ★★書いてはいけない言葉。★「ありません」を、毎朝 知らせないこと。 */
export const FORBIDDEN_WORDS = Object.freeze([
  "ありません", "0件", "まだ記録がありません", "がんばりましょう", "達成"
]);
