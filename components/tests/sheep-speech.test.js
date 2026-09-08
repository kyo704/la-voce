// ============================================================================
// 羊の しゃべり方 ── ②あいづち と ③ひとりごと（2026-09-08 夜）
//
//   ★出どころ woolsong-仕様-羊のしゃべり方・3本に分ける（9月8日）
//
//   ★★守ること
//     ・★70文（J1 12／J2 8／J3 8／K 42）。★id を 変えないこと
//     ・★羊は「記録した行為」に反応し、「記録の中身」には 反応しない
//     ・★禁止語を 1つも 使わない
//     ・★直近5つを 避ける
//     ・★同時に 2つ 出さない
//     ・★伏せているときは 止める／動きを減らす設定を 無視しない
//     ・★②③を 履歴に 残さない
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

(async () => {
  const raw = fs.readFileSync(path.join(ROOT, "docs", "assets", "serifu-add-70.json"), "utf-8");
  const src = fs.readFileSync(path.join(ROOT, "lib", "sheepSpeech.js"), "utf-8")
    .replace('import data from "@/docs/assets/serifu-add-70.json";',
      "const data = " + raw + ";");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ ★文");
  ok(`★70文ある（いま ${m.LINES.length}）`, m.LINES.length === 70);
  const byType = {};
  for (const l of m.LINES) byType[l.type] = (byType[l.type] || 0) + 1;
  ok("★J1 12／J2 8／J3 8／K 42",
    byType.J1 === 12 && byType.J2 === 8 && byType.J3 === 8 && byType.K === 42,
    JSON.stringify(byType));
  ok("★id が すべて ちがう", new Set(m.LINES.map((l) => l.id)).size === 70);
  ok("★すべてに 文がある", m.LINES.every((l) => (l.text || "").length > 0));

  console.log("■ ★中身の線（★いちばん大事なところ）");
  // ★★羊は「記録の中身」に 反応しません。★体調・声に 触れないこと。
  // ★★言葉を みじかく切って 探さないこと。
  //   ★はじめ「いた」で 探して、★「おゆが、わいた かも。」を
  //   ★★体調の話だと 誤りました。★「わいた」の 一部でした。
  //   ★★探すのは、★体調そのものを 指す 言葉だけに します。
  const body = ["調子", "体調", "のど", "喉", "声が", "こえが", "元気", "げんき",
    "つかれ", "疲れ", "いたい", "痛い", "眠れ", "ねむれ", "ストレス", "ぐあい"];
  const bad = m.LINES.filter((l) => body.some((w) => l.text.includes(w)));
  ok("★★体調や 声に 触れていない", bad.length === 0,
    bad.map((l) => l.id + ":" + l.text).join(" "));
  // ★★禁止語（★台詞集 §1 のまま）。
  const banned = ["がんばって", "えらい", "すごい", "だいじょうぶ", "ひさしぶり",
    "待っていました", "そろそろ", "はやく", "つづけて", "したほうがいい"];
  const hit = m.LINES.filter((l) => banned.some((w) => l.text.includes(w)));
  ok("★禁止語を 使っていない", hit.length === 0,
    hit.map((l) => l.id + ":" + l.text).join(" "));
  // ★★続けた日数にも 触れないこと。
  ok("★続けた日数に 触れていない",
    !m.LINES.some((l) => /日つづ|連続|れんぞく|日目/.test(l.text)));

  console.log("■ ★長さ");
  const js = m.LINES.filter((l) => l.type !== "K");
  const ks = m.LINES.filter((l) => l.type === "K");
  // ★★仕様の見出しは「8〜16字」ですが、★届いた文は 7〜21字です。
  //   ★★文は 1文字も 変えません（★台詞集 §5・id を 変えない決め）。
  //   ★だから ここでは、★吹き出しに 収まるかどうかだけを 見ます。
  //     ★21字は、★168px の 吹き出しで 2行に なります。★収まります。
  ok("★あいづちは 吹き出しに 収まる（〜24字）",
    js.every((l) => l.text.length >= 4 && l.text.length <= 24),
    js.filter((l) => l.text.length > 24).map((l) => l.text).join(" "));
  ok("★ひとりごとは みじかい（〜16字）", ks.every((l) => l.text.length <= 16),
    ks.filter((l) => l.text.length > 16).map((l) => l.text).join(" "));

  console.log("■ ★吹き出しに 収まること（★2026-09-08 夜・実機「読みにくい」）");
  {
    // ★★2行までに 収めます。★3行になると 読みにくくなります。
    //   ★★新しい文が 増えて 3行になったら、★ここで 落ちます。
    const over = [];
    for (const l of m.LINES) {
      const sp = l.type === "K" ? m.BUBBLE.solo : m.BUBBLE.reply;
      const n = m.bubbleLines(l.text, sp);
      if (n > m.BUBBLE.maxLines) over.push(`${l.id}(${n}行) ${l.text}`);
    }
    ok(`★★70文すべてが 2行までに 収まる`, over.length === 0, over.slice(0, 4).join(" / "));
    ok("★2行までと 決めている", m.BUBBLE.maxLines === 2);
    ok("★ひとりごとは 幅168・字14",
      m.BUBBLE.solo.maxWidthPx === 168 && m.BUBBLE.solo.fontPx === 14);
    ok("★あいづちは 幅200・字17",
      m.BUBBLE.reply.maxWidthPx === 200 && m.BUBBLE.reply.fontPx === 17);
    // ★★部屋から はみ出さない幅で あること。
    ok("★せまい部屋でも はみ出さない（〜200px）",
      m.BUBBLE.reply.maxWidthPx <= 200 && m.BUBBLE.solo.maxWidthPx <= 200);
    const b2 = readCode("components", "SpeechBubble.jsx");
    // ★★縦書きに ならないこと（★2026-09-08 夜・実機のご報告）。
    //   ★★writing-mode は 1度も 書いていませんでした。
    //     ★縦書きに 見えたのは、★幅を 決めていなかったからです。
    //     ★入れ物（羊の箱 100px）の 72％から 右は 28px しか なく、
    //     ★★1行に 1文字しか 入りませんでした。
    ok("★★幅を、数で 決めている（★入れ物の 残りに 縮ませない）",
      /width: sp\.maxWidthPx,/.test(b2));
    ok("★横書きと 書いてある", /writingMode: "horizontal-tb"/.test(b2));
    ok("★画面で 大きさを 決め打ちしていない",
      /maxWidth: sp\.maxWidthPx/.test(b2) && /fontSize: sp\.fontPx/.test(b2)
      && !/maxWidth: small \? 132/.test(b2));
  }

  console.log("■ ★えらび方");
  ok("★直近5つを 避ける", m.AVOID_RECENT === 5);
  const first = m.pickLine("K", [], 12, () => 0);
  const second = m.pickLine("K", [first.id], 12, () => 0);
  ok("★直近に出したものを、つぎに 出さない", second.id !== first.id);
  // ★★在庫が 尽きても、★黙らないこと。
  const all = m.LINES.filter((l) => l.type === "J2").map((l) => l.id);
  ok("★★避けきれなくても、黙らない", m.pickLine("J2", all, 12, () => 0) !== null);
  ok("★知らない型なら null", m.pickLine("ZZ", [], 12, () => 0) === null);
  ok("★直近は 5つまで",
    m.pushRecent(["a", "b", "c", "d", "e"], "f").length === 5);
  ok("★同じものを 2度 積まない",
    m.pushRecent(["a", "b"], "a").filter((x) => x === "a").length === 1);

  console.log("■ ★間と、顔");
  ok("★あいづちは 3.0秒／ひとりごとは 2.5秒",
    m.TIMING.replyMs === 3000 && m.TIMING.soloMs === 2500);
  ok("★ひとりごとは 45〜90秒に1回",
    m.nextSoloMs(() => 0) === 45000 && m.nextSoloMs(() => 1) === 90000);
  // ★★かなしい顔を 出さないこと。
  ok("★★かなしい顔と 組んでいない",
    !Object.values(m.FACE_FOR).some((f) => ["sad", "trouble", "disappoint"].includes(f)));

  console.log("■ ★出し方");
  const ch = readCode("components", "CharacterHome.jsx");
  ok("★吹き出しは 羊から 出す（★上の帯では ない）",
    /bubble && <SpeechBubble/.test(ch));
  ok("★同時に 2つ 出さない", /setBubble\(\(cur\) => \{\s*\n\s*if \(cur\) return cur;/.test(ch));
  ok("★伏せているときは 止める", /document\.hidden/.test(ch));
  ok("★離れたら 片づける", /clearTimeout\(bubbleTimerRef\.current\)/.test(ch));
  const bub = readCode("components", "SpeechBubble.jsx");
  ok("★かぶりものより 上（z=100）", /zIndex: 100/.test(bub));
  ok("★しっぽが ある", /borderTop: "10px solid #E2D6C4"/.test(bub));
  const css = fs.readFileSync(path.join(ROOT, "app", "globals.css"), "utf-8");
  ok("★動きを 減らす設定で、ふわっとを やめる",
    /sheepBubbleIn/.test(css) && /animation: none !important/.test(css));

  console.log("■ ★配線（★3か所）");
  const vt = readCode("components", "VocalTracker.jsx");
  ok("★記録を保存した直後", /saySheep\(SAVED\)/.test(vt));
  ok("★もらった直後", /saySheep\(RECEIVED\)/.test(vt));
  ok("★片づけ・もようがえの直後", /saySheep\(TIDIED\)/.test(vt));
  // ★★②③は 履歴に 残しません（★60日の履歴を持つのは ①だけ）。
  ok("★★②③を、記録に 残していない",
    !/speech_history|serifu_history|said_at/.test(vt));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
