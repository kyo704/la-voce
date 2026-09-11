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

/**
 * ★「9月14日」の 形（★見本 A01 の .obi .t）。
 *
 *   ★★本番の 帯と 行事の 帯の 両方が 使います。
 *     ★★前は 行事の 側だけが、★描くところで 直に 組み立てていました。
 *       ★同じ 組み立てが 2か所に なる 前に、★ここへ 出します。
 *   ★★時計を 見ません。★文字列を そのまま 切ります。
 */
export function monthDayLabel(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  if (!m) return "";
  return Number(m[2]) + "月" + Number(m[3]) + "日";
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


// ============================================================================
// きょうの よてい（★見本 S_kyou・594〜606行）
//
//   ★出どころ Opus の 裁定（★2026-09-11・その15）⑥⑦
//     「⑥きょうのよてい：枠（個人の予定）は作ってください。教室の札は、
//       後回しで構いません。」
//     「⑦時間割：個人のものとして、作ってください。「重なり◯件」は、
//       後回しで構いません。」
//
//   ★★見本の 形
//     .h3「きょうの よてい」
//     （★教室が 2つ以上なら 札）★← ★後回し
//     .box　★その日の レッスン、★無ければ 1行
//     .two　★「時間割を 入れる」／「重なり ◯件」★← ★右は 後回し
//     .usu　★時間割の 断り
//
//   ★★1件も 無い ときも、★枠を 出します（★見本）。
//     ★★「無い」ことを 毎朝 知らせるのは 催促に なる、という 決まりが
//       ★別に あります（★lib/todayBand.js の 帯）。
//     ★★けれど ここは ちがいます。★見本は、★枠を 出して
//       ★「この教室の よていは ありません」と 1行 置いて います。
//       ★★枠が 消えると、★「時間割を 入れる」への 入口も 消えます。
//   ★★字は 見本の ままです。★1文字も 変えないこと。
// ============================================================================

/** ★見本の 字（★594〜606行）。★1文字も 変えないこと。 */
export const PLAN_COPY = Object.freeze({
  head: "きょうの よてい",
  none: "この教室の よていは ありません",
  timetable: "時間割を 入れる",
  note: "時間割の あいている ところが、先生に 伝わります（中身は 伝わりません）。"
});

/**
 * ★きょうの よていの 1行（★見本 lesTitle）。
 *
 *   ★見本 lesTitle(L) = L.t + '　' + L.n + (L.tea ? '　' + L.tea + ' 先生' : '')
 *     ★t 時刻／n 名前／tea 先生
 *
 *   ★★先生の 名前は、★入って いれば 出します。★作りません。
 */
export function planRowLabel(lesson, tz) {
  if (!lesson) return "";
  const t = timeOf(lesson.scheduled_at, tz);
  const name = lesson.title || lesson.label || "レッスン";
  const tea = lesson.teacher_name || "";
  return t + "　" + name + (tea ? "　" + tea + " 先生" : "");
}

/**
 * ★きょうの よてい（★個人ぶん）。
 *
 *   ★★教室の 札（★どの 教室の ぶんか）は 出しません。★後回しです。
 *     ★だから、★ご自分の レッスン ぜんぶを その日ぶん 出します。
 *
 *   @returns [{ id, label }]
 */
export function planToday(lessons, todayISO, tz) {
  return lessonsOn(lessons, todayISO, tz).map((l) => ({
    id: l.id,
    label: planRowLabel(l, tz)
  }));
}
