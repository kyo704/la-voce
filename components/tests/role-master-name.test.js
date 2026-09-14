#!/usr/bin/env node

// ============================================================================
// ★役の 台帳の 列の 名前（★2026-09-14・裁定 その49 CHANGE_2）
//
//   ★★`voice_quality` という 名前が、★**2つの 表**に ありました。
//     ★`entries.voice_quality`　　 … 声の 出来（★5段に 丸めた 数）
//     ★`role_master.voice_quality` … ★役に 求める 声の 性格（★自由な 字）
//   ★★同じ 名前で 別の ものです。★数と 字です。
//
//   ★★新しい 名前　`required_voice_character`。
//
//   ★★付け替え（rename）を しません。
//     ★★一瞬で 終わりますが、★その 一瞬、★古い 名前で 書く 画面が 動いて います。
//     ★★「足す → 写す → あとで 落とす」に します。
//
//   ★★だから、★いまの 画面は こう なって いなければ なりません ──
//     ★読む … 新しい 列。★空なら 古い 列
//     ★書く … **両方**
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let ok = 0;
let ng = 0;
const t = (c, l) => { if (c) { console.log("  ✓ " + l); ok++; } else { console.log("  ✗ " + l); ng++; } };

const vt = readCode("components", "VocalTracker.jsx");

// ★★2026-09-14、★坂本さんが 台帳で **付け替え**ました。
//   ★★私は はじめ「足す → 写す → あとで 落とす」の 形で 書いて いました。
//   ★★実際に 台帳に 尋ねた ところ、★古い 列は **もう ありません** でした。
//     ★`role_master.voice_quality` → 42703（そんな 列は ない）
//   ★★だから、★古い 列を 読んでも 書いても いけません。
console.log("① 読むとき");
t(/voiceQuality: row\.required_voice_character \|\| null/.test(vt),
  "★新しい 列だけを 読む");
// ★★`entries` の ほうにも `row.voice_quality` が あります（★:1638 :1648 :1829）。
//   ★★あちらは 声の 出来（★5段）です。★触っては いけません。
//   ★★2026-09-14、★丸ごと 探して しまい、★あちらに つまずきました。
//   ★★だから、★役の 台帳を 作って いる ところ **だけ**を 見ます。
{
  const i = vt.indexOf('from("role_master")');
  const seg = vt.slice(Math.max(0, i - 2500), i + 2500);
  t(!/row\.voice_quality/.test(seg), "★役の 台帳では 古い 列を 読んで いない");
}

console.log("\n② 書くとき");
const writes = (vt.match(/required_voice_character: /g) || []).length;
t(writes === 2, "★新しい 列に 2か所 書いて いる（" + writes + "）");
t(!/voice_quality: (?:voiceQuality|role\.voiceQuality)/.test(vt),
  "★古い 列に 書いて いない");

console.log("\n③ 台帳の 紙");
const sql = path.join(__dirname, "..", "..", "supabase",
  "migration_role_master_required_voice_character.sql");
t(fs.existsSync(sql), "★紙が ある");
if (fs.existsSync(sql)) {
  const s = fs.readFileSync(sql, "utf8");
  // ★★紙は 残します。★どう 直したかの 記録です。
  //   ★★ただし 坂本さんは **付け替え**で 済ませました。
  //     ★この 紙を いま 流すと、★古い 列が 生き返ります。
  //     ★★だから、★流さない ことを 紙の 頭に 書いて あります。
  t(/★★この 紙は 流さないで ください/.test(s), "★流さない、と 書いて ある");
  t(/comment on column/.test(s), "★何の 列かを 台帳に 書いて いる");
  // ★★診断を BEGIN/ROLLBACK で 包んで いない こと。
  //   ★★SQL Editor は 巻き戻しません（★過去に 権限が 残りました）。
  t(!/\bbegin\b[\s\S]*\brollback\b/i.test(s), "★巻き戻しの 中に 書いて いない");
}

console.log("\n④ entries の ほうは 触って いない");
t(/voice_quality: numOrNull\(voiceLegacy/.test(vt),
  "★entries.voice_quality の 書き込みは そのまま");

console.log("\n★★この 見張りが 見て いない こと");
console.log("　★字の 並びだけ を 見ます。★台帳に 列が あるかは 見て いません。");
console.log("　★古い 列を いつ 落とすかは、★別の 紙と 別の お決めです。");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
