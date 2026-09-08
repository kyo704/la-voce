// ============================================================================
// 羊の顔 ── まばたき（face-v1・2026-09-08 夜）
//
//   ★出どころ woolsong-納品-羊の顔9種（9月8日）
//
//   ★★守ること（★禁じられていること 8つ）
//     1 かなしい・こまった・がっかりした顔を 作らない・出さない
//     2 記録がないことを 顔で表さない
//     3 顔 × 帽子 × 首元 を あらかじめ合成した画像を 作らない
//     4 位置合わせの数値を コードに持たない
//     5 体の動きのために 顔を増やさない
//     6 prefers-reduced-motion を 無視しない
//     7 ★顔で 体調や分析結果を 表さない
//     8 装いを 既定でオンにしない
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
  const src = fs.readFileSync(path.join(ROOT, "lib", "sheepFace.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ ★絵");
  ok("★9枚ある", Object.keys(m.FACES).length === 9);
  for (const f of Object.values(m.FACES)) {
    const p = path.join(ROOT, "public", "sheep", "face", f);
    if (!fs.existsSync(p)) { failed++; console.log("  ✗ ★" + f + " が 無い"); }
  }
  ok("★9枚とも 置いてある", true);
  ok("★顔を外した頭が ある",
    fs.existsSync(path.join(ROOT, "public", "sheep", "sheep_head_noface.png")));
  ok("★知らない名前でも 落ちない（★通常を返す）",
    m.faceSrc("なにこれ") === m.faceSrc("normal"));

  console.log("■ ★禁じられていること");
  // ★★1 かなしい・こまった・がっかり を 作らない
  const bad = ["sad", "sorry", "trouble", "disappoint", "cry", "lonely"];
  ok("★★かなしい顔を 持っていない",
    !Object.keys(m.FACES).some((k) => bad.includes(k))
    && !Object.values(m.FACES).some((f) => bad.some((b) => f.includes(b))));
  // ★★4 位置合わせの数値を 持たない
  const sd = readCode("components", "SheepDressed.jsx");
  const faceBlock = sd.slice(sd.indexOf('key: "face"') - 400, sd.indexOf('key: "face"') + 200);
  ok("★★位置合わせの数値を 持っていない",
    !/(top|left|marginTop|translate)\s*:\s*-?\d/.test(faceBlock));
  // ★★6 動きを 減らす設定を 無視しない
  ok("★★動きを 減らす設定を 見ている",
    /prefers-reduced-motion: reduce/.test(sd));
  // ★★見えていないときは 止める
  ok("★伏せているときは 動かさない", /document\.hidden/.test(sd));
  ok("★離れたら 片づける", /clearTimeout\(openTimer\); clearTimeout\(shutTimer\);/.test(sd));

  console.log("■ ★まばたきの 間");
  ok("★3〜7秒に1回", m.BLINK.minMs === 3000 && m.BLINK.maxMs === 7000);
  ok("★120ms だけ", m.BLINK.holdMs === 120);
  ok("★間は 3000〜7000 に 収まる",
    m.nextBlinkMs(() => 0) === 3000 && m.nextBlinkMs(() => 1) === 7000);

  console.log("■ ★顔の 間（★2026-09-09・坂本さんの ご承認）");
  ok("★にっこり・大喜び・照れ は 4.0秒", m.REPLY_FACE_MS === 4000);
  ok("★眠い顔は 22:00〜翌05:00",
    m.isSleepyHour(22) && m.isSleepyHour(2) && m.isSleepyHour(4)
    && !m.isSleepyHour(21) && !m.isSleepyHour(5) && !m.isSleepyHour(12));
  ok("★何もしないで 60秒で 眠る", m.IDLE_SLEEP_MS === 60000);
  // ★★強いほうから 見ること。★2つの決めを 混ぜないためです。
  ok("★あいづちが いちばん強い",
    m.faceNow({ reply: "smile", isLying: true, idle: true, hour: 23 }) === "smile");
  ok("★眠っていれば 眠り顔",
    m.faceNow({ isLying: true, hour: 23 }) === "sleep");
  ok("★60秒 放置でも 眠り顔",
    m.faceNow({ idle: true, hour: 12 }) === "sleep");
  ok("★夜は 眠い顔", m.faceNow({ hour: 23 }) === "sleepy");
  ok("★ふだんは 通常", m.faceNow({ hour: 12 }) === "normal");
  ok("★何も 渡さなくても 落ちない", m.faceNow({}) === "normal");

  console.log("■ ★顔が、実際に 変わること");
  {
    const ch2 = readCode("components", "CharacterHome.jsx");
    // ★★2026-09-09 まで、★顔は 1度も 変わっていませんでした。
    //   ★呼ぶ側が face を 渡していませんでした。
    ok("★★羊に 顔を 渡している", /face=\{faceNow\(\{/.test(ch2));
    // ★★FACE_FOR は、★作ったきりで 呼ばれていませんでした。
    ok("★★FACE_FOR を、実際に 使っている", /FACE_FOR\[say\.type\]/.test(ch2));
    ok("★4.0秒で 戻す", /setReplyFace\(null\), REPLY_FACE_MS/.test(ch2));
    ok("★触れば 数え直す", /IDLE_SLEEP_MS/.test(ch2) && /pointerdown/.test(ch2));
  }

  console.log("■ ★重ね順と、出す場所");
  ok("★顔は z=46（★頭45 と 首元50 の あいだ）", m.FACE_Z === 46);
  ok("★頭は「顔なし」を 使っている", /src: HEAD_NOFACE/.test(sd));
  // ★★にっこりの 最中に 目を つむらせないこと。
  ok("★通常のときだけ まばたきする",
    /blinking && face === "normal"/.test(sd));
  const ch = readCode("components", "CharacterHome.jsx");
  ok("★部屋の羊だけ まばたきする",
    (ch.match(/motion=\{motion\} blink/g) || []).length === 1);
  ok("★眠っているときは まばたきしない",
    !/motion="sleep"[^>]*blink/.test(ch));
  // ★★7 顔で 体調や分析結果を 表さない
  //   ★顔の名前を 決めるところに、★記録の中身が 入っていないこと。
  ok("★★顔を、体調や分析から 決めていない",
    !/face=\{[^}]*(score|condition|throat|voice|analysis|健康|体調)/.test(ch)
    && !/face=\{[^}]*(score|condition|throat|voice|analysis)/.test(readCode("components", "VocalTracker.jsx")));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
