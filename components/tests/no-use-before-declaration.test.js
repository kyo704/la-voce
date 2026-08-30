#!/usr/bin/env node
/**
 * 宣言より前に使っていないか（2026-08-30・本番が落ちた不具合）
 *
 * ★何が起きたか
 *   本番で全画面が落ちました。
 *     ReferenceError: Cannot access 's_' before initialization
 *   （s_ は圧縮後の名前。中身は profile でした）
 *
 *   const showAgeQuestion = ageColumnsReady && shouldAskAgeQuestion(profile);
 *   という行が、★profile の宣言より 117行 前に置かれていました。
 *
 * ★なぜ2日も気づかなかったか
 *   `ageColumnsReady &&` が短絡していたためです。列がまだ無いあいだは
 *   profile を評価しないので、何も起きませんでした。
 *   ★移行SQLを実行して ageColumnsReady が true になった瞬間に、
 *     初めて評価され、全員が落ちました。
 *
 *   ★短絡の陰に隠れた「宣言前アクセス」は、いちばん遅れて出ます。
 *     ビルドも lint も通ります。試験も通ります。DBを直した日に落ちます。
 *
 * ★この試験が守ること
 *   コンポーネントの本体で、useState / useMemo で作った値を、
 *   自分の宣言より前の行で使っていないこと。
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const src = readCode("components", "VocalTracker.jsx");
const lines = src.split("\n");

// 対象：export default function VocalTracker(...) { … } の本体
const start = lines.findIndex((l) => l.startsWith("export default function VocalTracker"));
assertTrue(start > 0, "コンポーネントの開始が見つかる");

// 本体で作られる const（useState の分割代入と、ふつうの const）
const declaredAt = new Map();
for (let i = start; i < lines.length; i++) {
  let m = lines[i].match(/^\s{2}const \[(\w+), set\w+\] = useState/);
  if (m) { if (!declaredAt.has(m[1])) declaredAt.set(m[1], i); continue; }
  m = lines[i].match(/^\s{2}const (\w+) = (useMemo|useRef|useCallback)?/);
  if (m && !declaredAt.has(m[1])) declaredAt.set(m[1], i);
}
assertTrue(declaredAt.size > 30, `本体の const を読み出せた（${declaredAt.size}件）`);

console.log("\n=== ★宣言より前で使っている値がないか ===");
const bad = [];
for (const [name, decl] of declaredAt) {
  if (name.length < 4) continue;               // i, e など短い名前は別スコープの取り違えが多い
  for (let i = start; i < decl; i++) {
    const l = lines[i];
    if (!l.trim() || l.trim().startsWith("*")) continue;
    // 字下げ2のトップレベル行だけを見る（入れ子の関数の中は、呼ばれる時点では宣言済み）
    if (!/^\s{2}\S/.test(l)) continue;
    const re = new RegExp(`(?<![\\w.$])${name}(?![\\w:])`);
    if (re.test(l)) { bad.push(`${i + 1}行目が ${decl + 1}行目の \`${name}\` を使っている： ${l.trim().slice(0, 70)}`); break; }
  }
}
assertTrue(bad.length === 0,
  `★宣言より前に使っている値が無い${bad.length ? "\n      " + bad.join("\n      ") : ""}`);

console.log("\n=== 落ちた行が、正しい位置にあること ===");
const ageAt = lines.findIndex((l) => l.includes("const showAgeQuestion = ageColumnsReady && shouldAskAgeQuestion(profile);"));
const profAt = lines.findIndex((l) => l.includes("const [profile, setProfile] = useState("));
assertTrue(ageAt > 0 && profAt > 0, "両方の行がある");
assertTrue(ageAt > profAt, `★showAgeQuestion（${ageAt + 1}行目）が profile（${profAt + 1}行目）より後ろにある`);

console.log("\n=== ★同じ罠への注意書きが、そばに残っていること ===");
// ★注意書きの有無は、コメントを外していない本文で見ること。
//   readCode はコメントを落とすので、必ず落ちます。★今日3回目の取り違えです。
const raw = readRaw("components", "VocalTracker.jsx");
assertTrue(/この行を profile の宣言より前に置かないこと/.test(raw), "★理由がコードのそばに書いてある");
assertTrue(/短絡/.test(raw), "★短絡で隠れることが書いてある");

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
