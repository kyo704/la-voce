#!/usr/bin/env python3
"""★見本の「約束の文」を 抜き出し、★台帳で 当たれる ものを 分ける。
★★2026-09-25 に ★1件 破れて いました（★集合時刻・sql/91）
  ★★見本に 3か所 書いてあるのに ★台帳が 守って いません でした
★★これは ★いちばん 悪い 形 です:
  ★書いていない 穴より、★★書いてあるのに 守られていない 穴の ほうが 悪い
  ★★利用者は ★読んで 信じます
★使い方: python3 tools/promise_ledger.py [見本.html] [--selftest]
★2026-09-26 作成"""
import asyncio, json, os, re, sys

PAT = r'[^。]{6,60}?(見えません|見られません|出ません|届きません|入りません|渡りません)'
# ★台帳で 当たれる ＝ ★表の 列に なる ことば
LEDGER = r'(体調|記録|集合時刻|入りの 時刻|時刻|門下|名簿|予定|出席|点|額|希望|在籍|コマ|時間割|参加費|出演者|教室|学生|ページ|問い合わせ)'

def split(rows):
    """★台帳で 当たれる もの／★画面の 決まり に 分ける"""
    yes = [r for r in rows if re.search(LEDGER, r[1])]
    no  = [r for r in rows if not re.search(LEDGER, r[1])]
    return yes, no

async def pick(path):
    from playwright.async_api import async_playwright
    import urllib.parse
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 390, 'height': 844})
        await pg.goto('file://' + urllib.parse.quote(os.path.abspath(path)))
        await pg.wait_for_function("typeof SC==='object'")
        await pg.wait_for_timeout(400)
        r = await pg.evaluate("""(pat)=>{const out=[];const re=new RegExp(pat,'g');
          for(const k of Object.keys(SC)){ let h='';
            try{h=String(SC[k](0)??'')}catch(e){continue}
            const t=h.replace(/<[^>]*>/g,' ').replace(/\\s+/g,' ');
            const m=t.match(re)||[];
            for(const s of m) out.push([k,s.trim()]); }
          return out;}""", PAT)
        await b.close()
    seen = set(); rows = []
    for k, s in r:
        if s in seen: continue
        seen.add(s); rows.append((k, s))
    return rows

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = args[0] if args else os.path.join(here, '00-動く見本-iPhoneで開く用.html')
    rows = asyncio.run(pick(path))
    yes, no = split(rows)
    print('PROMISE_LEDGER', os.path.basename(path)[:28])
    print('  ★約束の文', len(rows), '／ ★台帳で 当たれる', len(yes), '／ ★画面の 決まり', len(no))
    for k, s in yes[:40]: print('  ★当たる |', k, '|', s[-40:])
    print('★★台帳で 当たれる ものは ★なりきって 0行を 確かめて ください')
    print('★★「書いてあるのに 守られていない」が ★いちばん 悪い 形 です')
    print(f'RESULT: {len(yes)}件 を 当たって ください')
    return 0

def selftest():
    yes, no = split([('a', 'ほかの 方の 集合時刻は 見えません'),
                     ('b', 'カード番号は 入りません')])
    assert len(yes) == 1 and yes[0][0] == 'a', '★台帳の ものを 拾えない'
    assert len(no) == 1, '★画面の ものを 誤って 拾う'
    assert re.search(PAT, 'ほかの 方の 時刻は 出ません'), '★文を 拾えない'
    print('SELFTEST PASS'); return 0

if __name__ == '__main__':
    sys.exit(selftest() if '--selftest' in sys.argv else main())
