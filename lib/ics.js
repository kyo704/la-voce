// ============================================================================
// ★★★カレンダーの 形（ICS）── ★組み立てるのは この ファイル だけ です
//
//   ★出どころ RFC 5545。★実行ルート …「カレンダー（ICS）｜my_calendar_items（サーバだけ）
//             ・calendar_tokens｜★体調の 記録を 1文字も 入れない」
//
//   ★★★入れる もの は 5つ だけ です ──
//     いつ から ／ いつ まで ／ 題 ／ 場所 ／ 取り消されたか
//   ★★★入れない もの ── ★体の 記録。★声の 調子。★のどの 様子。★眠り。
//     ★★受け取りません。★`itemsToIcs` に 渡せる 形に して いません。
//
//   ★★カレンダーの 中身は、★**ほかの 人の 端末にも 並びます**
//     （★家族の 共有カレンダー・会社の 予定表）。
//     ★★だから「レッスン」「公演の 題」までに します。★人の 名前も 入れません。
//
//   ★見張り components/tests/ics.test.js
// ============================================================================

/** ★ICS で 使えない 字を 逃がします（★RFC 5545 §3.3.11）。 */
export function escapeText(s) {
  return String(s == null ? "" : s)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** ★時（UTC・秒まで）。★`2026-09-23T04:05:06Z` → `20260923T040506Z`。 */
export function icsTime(v) {
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * ★1行を 75 字で 折ります（★RFC 5545 §3.1）。
 *
 *   ★★折らないと、★受け取る 側が 途中で 切ります。
 *   ★★続きの 行は、★頭に 空白を 1つ 置きます。
 */
export function fold(line) {
  const s = String(line);
  if (s.length <= 75) return s;
  const out = [s.slice(0, 75)];
  let i = 75;
  while (i < s.length) { out.push(" " + s.slice(i, i + 74)); i += 74; }
  return out.join("\r\n");
}

/**
 * ★予定の 一覧を ICS に します。
 *
 *   ★★`items` は `my_calendar_items` の 返り そのもの です ──
 *     `{ uid, starts_at, ends_at, title, place, canceled }`
 *   ★★★そこに 無い 列は、★ここでも 読みません。
 *     ★「体調を 入れない」を、★**読む 列を 増やさない** ことで 守ります。
 *
 *   ★★時が 読めない 行は 落とします。★落とした ことは 返り値で 数えます。
 */
export function itemsToIcs(items, opts) {
  const now = icsTime(new Date((opts && opts.now) || Date.now()));
  const 行 = ["BEGIN:VCALENDAR", "VERSION:2.0",
    "PRODID:-//Woolsong//JP", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:" + escapeText((opts && opts.name) || "Woolsong")];
  let 落 = 0;
  (Array.isArray(items) ? items : []).forEach((x) => {
    const s = icsTime(x && x.starts_at);
    const e = icsTime(x && x.ends_at);
    if (!s || !e || !x.uid) { 落 += 1; return; }
    行.push("BEGIN:VEVENT");
    行.push("UID:" + escapeText(x.uid) + "@woolsong");
    行.push("DTSTAMP:" + now);
    行.push("DTSTART:" + s);
    行.push("DTEND:" + e);
    行.push("SUMMARY:" + escapeText(x.title || ""));
    if (x.place) 行.push("LOCATION:" + escapeText(x.place));
    // ★★取り消された 予定は 消さずに 残し、★取り消しと 書きます。
    //   ★★消すと、★相手の カレンダーから 黙って 無く なります。
    if (x.canceled) 行.push("STATUS:CANCELLED");
    行.push("END:VEVENT");
  });
  行.push("END:VCALENDAR");
  return { text: 行.map(fold).join("\r\n") + "\r\n", dropped: 落, count: 行.filter((l) => l === "BEGIN:VEVENT").length };
}
