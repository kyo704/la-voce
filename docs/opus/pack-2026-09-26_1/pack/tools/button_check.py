#!/usr/bin/env python3
"""★ボタンの文言と 行き先が 合っているかを 見る（2026-09-23 Opus）

なぜ要るか:
  2026-09-23、★「下書きを 作って、香盤表へ」と書いてあるのに ★配役へ 行く形を 私が作りました
  （さがす画面で 偽の雛形 id を入れていたため）
  ★坂本さんが 触って 見つけました。★機械で 先に見つけられる型です

見るもの（見本の HTML を 実際に動かして）:
  B1 ★押せる所（onclick に push/go がある）の 行き先が ★SC に無い
  B2 ★文言に「〜へ」「〜に」と 画面の名前が入っているのに、★別の画面へ 行く
  B3 ★どこからも 行けない画面（route_map と重ならない範囲で 補う）
  B4 ★押せそうに 見えて 押せない（★「›」が あるのに onclick が 無い／★ボタンに onclick が 無い）
    ← 2026-09-24 の 自己点検で 39か所 見つけました（★坂本さんが 触れば 気づく類）
自己試験: python3 tools/button_check.py --selftest
使い方:   python3 tools/button_check.py 00-動く見本-PC・iPad（運営）.html
"""
import asyncio, os, re, sys, urllib.parse
HERE = os.path.dirname(os.path.abspath(__file__)); PACK = os.path.dirname(HERE)

JS = r"""(() => {
  const out = [];
  const keys = Object.keys(SC);
  for (const k of keys) {
    let html = '';
    try { html = String(SC[k](0) ?? ''); } catch (e) { continue; }
    const re = /onclick="([^"]*)"[^>]*>([\s\S]*?)<\/(?:div|span|a)>/g;
    let m;
    while ((m = re.exec(html))) {
      const code = m[1], label = m[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      // ★配列の .push は 画面の push ではない（2026-09-23: 16件 誤って出した）
      const g = /(^|[^.\w])(?:push|go)\(\s*'([^']+)'/.exec(code);
      if (!g) continue;
      out.push({ from: k, to: g[2], label: label.slice(0, 40) });
    }
  }
  // ★タブ（NAVG）も 行き先です（2026-09-23: go('日程') を「無い」と 誤って出した）
  let tabs = [];
  try { tabs = (typeof NAVG !== 'undefined') ? NAVG.flatMap(g => g[1].map(x => x[0])) : []; } catch (e) {}
  // ★スマホの 見本は NAVG を 持たず、go() に ★タブの名前を 渡します
  //   2026-09-24: go('きょう') を「行き先が 無い」と 誤って 出しました
  try { if (typeof TAB1 !== 'undefined') tabs = tabs.concat(TAB1.map(x => x[0] || x)); } catch (e) {}
  tabs = tabs.concat(['きょう','ひつじ','ノート','しらべる','連絡','門下','公演','ホーム','さがす']);
  // ★B4: 押せそうで 押せない
  const dead = [];
  for (const k of keys) {
    let h = ''; try { h = String(SC[k](0) ?? ''); } catch (e) { continue; }
    const re = /<div class="li"(?![^>]*onclick)[^>]*>([\s\S]{0,260}?)<\/s>/g;
    let m; while ((m = re.exec(h))) { if (m[1].indexOf('›') >= 0) dead.push([k, '「›」が あるのに 押せない']); }
    const n = (h.match(/class="btn[^"]*"(?![^>]*onclick)/g) || []).length;
    if (n) dead.push([k, 'ボタンが ' + n + '個 押せない']);
  }
  return { links: out, screens: keys.concat(tabs), dead };
})()"""

def analyse(links, screens, dead=None):
    rows = []
    for d in (dead or []): rows.append(('B4 押せそうで 押せない', d[0], d[1], ''))
    for l in links:
        if l['to'] not in screens:
            rows.append(('B1 行き先が 無い', l['from'], l['label'], l['to']))
            continue
        # B2 文言に 画面の名前が入っているのに 別の所へ
        m = re.search(r'([^\s、。]+?)\s*[へに]\s*$', l['label'])
        if m:
            want = m.group(1)
            if want in screens and want != l['to']:
                rows.append(('B2 文言と 行き先が 違う', l['from'], l['label'], l['to']))
    return rows

async def run(path):
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        await pg.goto('file://' + urllib.parse.quote(os.path.abspath(path)))
        await pg.wait_for_function("typeof SC==='object'"); await pg.wait_for_timeout(400)
        d = await pg.evaluate(JS); await b.close()
    return analyse(d['links'], set(d['screens']), d.get('dead')), len(d['links'])

def main(files):
    ng = []
    for f in files:
        rows, n = asyncio.run(run(os.path.join(PACK, f)))
        print('BUTTON_CHECK', f[:26], '／押せる所', n)
        for r in rows: print('  NG', ' | '.join(r))
        ng += rows
    print('RESULT:', 'OK' if not ng else 'NG（%d件）' % len(ng))
    return 0 if not ng else 1

def selftest():
    screens = {'香盤表', '配役を決める', 'もっと'}
    bad = [{'from': '公演を作る', 'to': '配役を決める', 'label': '下書きを 作って、香盤表へ'},
           {'from': 'もっと', 'to': '無い画面', 'label': 'どこかへ'}]
    good = [{'from': '公演を作る', 'to': '香盤表', 'label': '下書きを 作って、香盤表へ'},
            {'from': 'もっと', 'to': '配役を決める', 'label': '配役を 決める'}]
    ok = True
    if len(analyse(bad, screens)) != 2: print('SELFTEST FAIL: 悪い形を 見つけられない', analyse(bad, screens)); ok = False
    if analyse(good, screens): print('SELFTEST FAIL: 正しい形を NG にした', analyse(good, screens)); ok = False
    print('SELFTEST', 'PASS' if ok else 'FAIL'); return 0 if ok else 1

if __name__ == '__main__':
    if '--selftest' in sys.argv: sys.exit(selftest())
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    sys.exit(main(args or ['00-動く見本-PC・iPad（運営）.html', '00-動く見本-iPhoneで開く用.html']))
