/* ★★見本と 実装を ★同じ 撮り方で PNG に します。
   ★★この 撮り方が 1つでも 違うと ★くらべっこは 成り立ちません。
   ★使い方:
     node tools/shoot.js <url> <out.png> [--clock=2026-09-26T10:00:00+09:00]
                                         [--w=900] [--h=700] [--dsf=3] [--full]
*/
const { chromium } = require('playwright');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--'+k+'='));
  return a ? a.split('=').slice(1).join('=') : d; };
(async () => {
  const [url, out] = process.argv.slice(2);
  if (!url || !out) { console.error('url と out.png が 要ります'); process.exit(2); }
  const b = await chromium.launch();
  const c = await b.newContext({
    viewport: { width: +arg('w', 900), height: +arg('h', 700) },
    deviceScaleFactor: +arg('dsf', 3),
    colorScheme: arg('scheme', 'light'),
    locale: arg('locale', 'ja-JP'),
    timezoneId: arg('tz', 'Asia/Tokyo'),
    reducedMotion: 'reduce',          // ★★動きを 止める（★撮る たびに 変わらない ように）
  });
  // ★★時計を 止めます ── ★これが 無いと 秒が 進むだけで 差が 出ます
  const clock = arg('clock', '2026-09-26T10:00:00+09:00');
  if (c.clock) await c.clock.setFixedTime(new Date(clock));
  const p = await c.newPage();
  await p.goto(url, { waitUntil: 'load' });
  // ★★アニメーションと 点滅を 止めます
  await p.addStyleTag({ content:
    '*,*::before,*::after{animation:none!important;transition:none!important;' +
    'caret-color:transparent!important}' });
  await p.waitForTimeout(+arg('wait', 700));
  await p.screenshot({ path: out, fullPage: process.argv.includes('--full') });
  await b.close();
  console.log('SHOT', out, '／ 時計', clock, '／ dsf', arg('dsf', 3));
})();
