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
 *   @returns [{ name, count, lastDate, kinds }] ★回数の多い順
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
        const cur = byKey.get(key) || { name: raw, count: 0, lastDate: "", kinds: {} };
        cur.count += 1;
        // ★★あとの日付のときだけ、綴りを更新します。
        //   ★いちばん新しい書き方が、いまのご本人の書き方です。
        if (date > cur.lastDate) { cur.lastDate = date; cur.name = raw; }
        const kind = (act && act.kind) || "";
        if (kind) cur.kinds[kind] = (cur.kinds[kind] || 0) + 1;
        byKey.set(key, cur);
      }
    }
  }
  return [...byKey.values()].sort(
    (a, b) => (b.count - a.count) || (a.lastDate < b.lastDate ? 1 : -1)
  );
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
