// ============================================================================
// ★Service Worker が、★古い 画面を 配らないこと（★2026-09-10）
//
//   ★★この 見張りが 生まれた いきさつ。
//     ★羊の 大きさを 4度 直し、★4度とも 実機で 変わりませんでした。
//     ★★/api/version は 毎回 新しい 版を 返していました。
//     ★★手元の 束にも、★毎回 正しく 入っていました。
//     ★★配信されている コード自身に 聞いても、★新しい 式を 返しました。
//   ★★それでも 画面が 古かった 理由が、★これです。
//
//     ① /dashboard の HTML には、★束（.js）の 名前が 書いてある
//     ② その 名前は 中身から 作られ、★組み立てるたび 変わる
//     ③ 束は immutable（1年）で 配られる。★名前が 変わるので 安全
//     ④ ★Service Worker が、★成功した HTML を 覚えていた
//     ⑤ ★通信が 1度でも つまずくと、★覚えた 古い HTML を 返す
//     ⑥ ★その HTML は 古い 束を 指す。★古い 束は まだ CDN に ある
//     ★→ ★古い 画面が、★何事も なかったように 立ち上がる
//
//   ★★/api/version は 移動では ないので 横取りされません。
//     ★だから「版は 新しいのに、画面は 古い」に なりました。
//
//   ★★確かめること
//     ① 画面の 移動（HTML）を 覚えていないこと。
//     ② それでも、★オフラインで 真っ白に しないこと（/offline.html）。
//     ③ 版を 上げたら、★古い 控えが 消えること。
// ============================================================================

const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) { console.log("  ok  " + label); }
  else { console.log("  NG  " + label); failed++; }
}

const sw = readCode("public", "sw.js");
const raw = readRaw("public", "sw.js");

console.log("① 画面の 移動を 覚えない");
// ★★覚える ところは 1つだけです。★そこに 条件が 付いていること。
const putAt = sw.indexOf("cache.put(");
ok(putAt > 0, "★覚える ところが ある");
const guard = sw.slice(Math.max(0, putAt - 400), putAt);
ok(/mode\s*!==\s*"navigate"/.test(guard), "★移動のときは 覚えない");
ok((sw.match(/cache\.put\(/g) || []).length === 1, "★覚える ところは 1つだけ");

console.log("② それでも、★真っ白に しない");
ok(/OFFLINE_URL/.test(sw), "★オフラインの 画面が ある");
ok(/cache\.add\(new Request\(OFFLINE_URL/.test(sw), "★install で 焼き込んでいる");
// ★★焼き込みは、★覚え直しに 頼りません。★だから 移動を 覚えなくても 残ります。
const failAt = sw.indexOf('event.request.mode === "navigate"', putAt);
ok(failAt > 0, "★取れなかった ときに、★移動を 見分けている");
ok(/caches\.match\(OFFLINE_URL\)/.test(sw.slice(failAt, failAt + 300)),
  "★そのときに オフラインの 画面を 返している");

console.log("③ 版を 上げたら、★古い 控えが 消える");
const name = (raw.match(/const CACHE_NAME = "([^"]+)"/) || [])[1];
ok(!!name, "★版の 名前が ある（" + name + "）");
ok(/keys\s*\.filter\(\(key\) => key !== CACHE_NAME\)[\s\S]{0,80}caches\.delete/.test(sw),
  "★activate で、★ちがう 名前の 控えを 消している");
// ★★2026-09-10 に v5 → v6 へ 上げました。★下げないこと。
const n = Number((name || "").replace(/^.*v/, ""));
ok(Number.isFinite(n) && n >= 6, "★版は 6 以上（★古い HTML を 捨てるため）");

console.log("④ 横取りする 相手を 増やしていない");
// ★★問い合わせも 絵も 横取りしません（★2026-09-09 の 決め）。
ok(/u\.origin !== self\.location\.origin\) return false/.test(sw), "★よその 家のものは 触らない");
ok(/pathname\.startsWith\("\/_next\/"\)/.test(sw), "★外枠だけ 受ける");
ok(!/supabase|\/sheep\//.test(sw), "★問い合わせも 絵も 受けない");

console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
process.exit(failed === 0 ? 0 : 1);
