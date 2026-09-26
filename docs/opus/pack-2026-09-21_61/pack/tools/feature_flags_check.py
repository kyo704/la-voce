#!/usr/bin/env python3
"""★機能の 切り替えの 鍵が ★見本と ★台帳（一覧ファイル）で 同じか。
★2026-09-24: 台帳11・見本9 で ★2件 足りませんでした（cal_sub・koen_children）
使い方: python3 tools/feature_flags_check.py [--selftest]
★台帳の 鍵は tools/feature_flags.json に 置きます（★本番から 写したもの）"""
import json, os, sys, asyncio, urllib.parse
HERE=os.path.dirname(os.path.abspath(__file__)); PACK=os.path.dirname(HERE)
LED=os.path.join(HERE,'feature_flags.json')
MOCK='00-動く見本-iPhoneで開く用.html'

async def mock_keys(path):
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page()
        await pg.goto('file://'+urllib.parse.quote(os.path.abspath(path)))
        await pg.wait_for_function("typeof SC==='object'"); await pg.wait_for_timeout(300)
        k=await pg.evaluate("(typeof FEAT!=='undefined')?Object.keys(FEAT):[]")
        await b.close(); return set(k)

def main():
    led=set(json.load(open(LED,encoding='utf-8'))['keys'])
    mk=asyncio.run(mock_keys(os.path.join(PACK,MOCK)))
    only_led=sorted(led-mk); only_mk=sorted(mk-led)
    print('FEATURE_FLAGS_CHECK　台帳',len(led),'／見本',len(mk))
    for k in only_led: print('  DIFF ★台帳に あって 見本に 無い |', k)
    for k in only_mk: print('  DIFF ★見本に あって 台帳に 無い |', k)
    if only_led or only_mk:
        print(f'RESULT: MISMATCH（{len(only_led)+len(only_mk)}件）'); return 1
    print('RESULT: MATCH（食い違い 0件）'); return 0

def selftest():
    led=set(json.load(open(LED,encoding='utf-8'))['keys'])
    assert len(led)>=5, '台帳の 鍵が 少なすぎます'
    fake=led-{sorted(led)[0]}
    assert sorted(led-fake)==[sorted(led)[0]], '★差を 見つけられません'
    print('SELFTEST PASS'); return 0

if __name__=='__main__':
    sys.exit(selftest() if '--selftest' in sys.argv else main())
