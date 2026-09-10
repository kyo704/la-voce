// ============================================================================
// レパートリー（★歌った曲の控え）── 第1段
//
//   出どころ Opus「記録と分析を、楽しいものにする」§3
//
//   ★★これは「控え」であって、「分析」ではありません。
//     ★ゲートは要りません。★3ゲートも、件数の条件も、掛けません。
//     ★★体について、★何も言わないからです。
//       ★「12回歌った」は、★ご本人が書いたことを数え直しただけです。
//     ★出どころ 分析画面の表示規約 §5 の「①待機」は、
//       ★判定をする画面のためのものです。★ここは判定をしません。
//
//   ★★言ってはいけないこと
//     ・「よく歌っていますね」（★褒めるのも、評価です）
//     ・「そろそろ◯◯を歌いましょう」（★助言）
//     ・「◯日ぶりです」を、★責める形にすること
//     ★数えて、並べるだけにします。
//
//   ★同じ曲かどうかの判断は lib/repertoireTitle.js が持ちます。
//     ★ここでは持ちません。★2か所になります。
// ============================================================================

import { repertoireKey } from "@/lib/repertoireTitle";

/**
 * ★記録から、曲ごとの回数と、最後に歌った日を数えます。
 *
 *   @param entries  { "YYYY-MM-DD": entry }
 *   @returns [{ name, count, days, firstDate, lastDate, kinds }] ★回数の多い順
 *
 *   ★★count と days は、★ちがう ものです（★2026-09-11・見本 J04）。
 *     count … 書かれた 回数。★1日に 2度 歌えば 2。
 *     days  … 書いた 日の 数。★1日に 2度 歌っても 1。
 *     ★見本の「記録した日　38日」は days です。★count では ありません。
 *   ★★count の 意味は 変えていません。★書き出しと ノートが 使っています。
 *
 *   ★★name は、★いちばん最後に書かれた綴りを使います。
 *     ★照合には正規化した鍵を使い、★表示には生の名前を使う、という
 *     ★もとからの規則（レパートリー負荷パッチ §2.2）に合わせます。
 */
export function repertoireLog(entries) {
  if (!entries) return [];
  const byKey = new Map();
  for (const [date, entry] of Object.entries(entries)) {
    if (!entry || !Array.isArray(entry.activities)) continue;
    for (const act of entry.activities) {
      const items = (act && act.items) || [];
      for (const it of items) {
        const raw = ((it && it.repertoireName) || "").trim();
        if (!raw) continue;
        const key = repertoireKey(raw);
        if (!key) continue;
        const cur = byKey.get(key)
          || { name: raw, count: 0, days: 0, dates: new Set(), firstDate: "", lastDate: "", kinds: {} };
        cur.count += 1;
        cur.dates.add(date);
        // ★★はじめて 記録した日。★いちばん 古い 日です。
        //   ★★歌った日 では ありません。★書いた日 です。
        //     ★あとから さかのぼって 書いた日も、★その日として 数えます。
        if (!cur.firstDate || date < cur.firstDate) cur.firstDate = date;
        // ★★あとの日付のときだけ、綴りを更新します。
        //   ★いちばん新しい書き方が、いまのご本人の書き方です。
        if (date > cur.lastDate) { cur.lastDate = date; cur.name = raw; }
        const kind = (act && act.kind) || "";
        if (kind) cur.kinds[kind] = (cur.kinds[kind] || 0) + 1;
        byKey.set(key, cur);
      }
    }
  }
  return [...byKey.values()]
    .map((v) => {
      // ★★Set を 外に 出しません。★数えた あとの 数だけを 渡します。
      const { dates, ...rest } = v;
      return { ...rest, days: dates.size };
    })
    .sort((a, b) => (b.count - a.count) || (a.lastDate < b.lastDate ? 1 : -1));
}

// ---------------------------------------------------------------------------
// 「たな」── 歌ってきたもの（★見本 J04）
//
//   ★出どころ docs/design/pack-final/screens/J04-たな.html / .notes.md
//     「★これは 飾りでは ありません。★ノートの レパートリーと つながっています。
//       ★出来や 点数は 出しません。★数えるのは 日数と 回数だけ。」
//
//   ★★並びは、★古い順です。
//     ★見本が 4月12日 → 6月3日 → 7月20日 の 順です。
//     ★「歌ってきたもの」は、★来た 道です。★多い順では ありません。
// ---------------------------------------------------------------------------

/** ★「2026年4月12日」の 形。★たなでは 年も 出します（★見本のとおり）。 */
export function longDate(iso) {
  if (!iso || iso.length < 10) return "";
  return `${Number(iso.slice(0, 4))}年${Number(iso.slice(5, 7))}月${Number(iso.slice(8, 10))}日`;
}

/**
 * ★たなに 並べる 1曲ぶん。
 *
 *   @param entries  { "YYYY-MM-DD": entry }
 *   @param extras   { 曲名: { composer, positionIn } }  ★repertoire_tessitura から
 *   @returns [{ name, sub, firstText, countText }]
 *
 *   ★★本番の 数は、★記録の 中の「本番」から 数えます。
 *     ★performances の 表にも repertoire_name の 欄が ありますが、
 *     ★★いまは 誰も 書いていません。★読むと いつも 0 に なります。
 *     ★書く 道が できたら、★こちらへ 移します。
 */
export function shelfRows(entries, extras) {
  const map = extras || {};
  return repertoireLog(entries)
    .slice()
    .sort((a, b) => (a.firstDate < b.firstDate ? -1 : a.firstDate > b.firstDate ? 1 : 0))
    .map((item) => {
      const ex = map[item.name] || {};
      // ★★作曲家と 役を、★全角の あきで つなぎます（★見本「プッチーニ　ミミ」）。
      //   ★★片方しか 無ければ、★その 片方だけ。★両方 無ければ 行ごと 出しません。
      const sub = [ex.composer, ex.positionIn].filter(
        (v) => typeof v === "string" && v.trim() !== "").join("　");
      const perf = (item.kinds && item.kinds["本番"]) || 0;
      return {
        name: item.name,
        sub,
        firstText: item.firstDate ? `はじめて 記録した日　${longDate(item.firstDate)}` : "",
        // ★★0回を「0回」と 書きません。★見本は「なし」です。
        //   ★0 は、★足りない ように 見えます。
        countText: `記録した日　${item.days}日　／　本番　${perf > 0 ? perf + "回" : "なし"}`
      };
    });
}

/** ★「9/4」の形。★年は出しません。★長くなるだけです。 */
export function shortDate(iso) {
  if (!iso || iso.length < 10) return "";
  return `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
}

/**
 * ★1行ぶんの言い方。
 *
 *   ★「Caro mio ben — 12回 — 最後 9/4」
 *   ★★これ以上、何も足さないこと。
 */
export function repertoireLine(item) {
  if (!item) return "";
  return `${item.name} — ${item.count}回 — 最後 ${shortDate(item.lastDate)}`;
}

/** ★書き出しの見出し。★表計算で開けるように、1行目に入れます。 */
export const EXPORT_HEADER = ["曲名", "回数", "最後に歌った日"];

/**
 * ★書き出し（CSV）。
 *
 *   ★★カンマと引用符と改行を、★必ず囲みます。
 *     ★曲名には「Là ci darem la mano, Zerlina」のような、
 *     ★カンマの入るものがあります。★囲まないと、列がずれます。
 *   ★★先頭に BOM を付けます。★付けないと Excel が文字化けします。
 */
export function toCsv(rows) {
  const esc = (v) => {
    const s = String(v == null ? "" : v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [EXPORT_HEADER.map(esc).join(",")];
  for (const r of rows || []) {
    lines.push([esc(r.name), esc(r.count), esc(r.lastDate)].join(","));
  }
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/** ★書き出しのファイル名。★日付は、呼ぶ側が渡します。 */
export function exportFileName(todayISO) {
  return `woolsong-レパートリー-${todayISO || ""}.csv`;
}
