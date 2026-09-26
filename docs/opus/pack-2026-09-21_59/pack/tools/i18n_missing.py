#!/usr/bin/env python3
"""★9言語 × key の 抜けを 数える。
★★どの 言語が ★どれだけ 抜けているか が ★1枚で 分かります
★★key が 増えたら ★全言語で 増えます ── ★それを 見つける 道具
★使い方: python3 tools/i18n_missing.py <dict.json> [--selftest]
  ★dict.json の 形: {"ja":{"nav.today":"きょう"}, "it":{...}, …}
★2026-09-26 作成（★訳が 来る 前に 作ります）"""
import json, os, sys

LANGS = ['ja','it','en','de','fr','es','zh','ko','pt']

def check(dic):
    """★ja を 正として、★各 言語の 抜けを 返す"""
    base = set(dic.get('ja', {}).keys())
    out = {}
    for L in LANGS:
        have = set(dic.get(L, {}).keys())
        # ★空文字は ★無い ものと 数えます（★入れ忘れ）
        have = {k for k in have if str(dic[L].get(k, '')).strip()}
        out[L] = {'ある': len(have), '抜け': sorted(base - have)}
    return base, out

def main():
    path = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not path:
        print('I18N_MISSING ★辞書が まだ ありません（★段1 の あとで 使います）')
        print('RESULT: OK（まだ）'); return 0
    dic = json.load(open(path[0], encoding='utf-8'))
    base, out = check(dic)
    print('I18N_MISSING  ★key', len(base), '個')
    bad = 0
    for L in LANGS:
        m = out[L]['抜け']
        mark = '★' if m else '　'
        print('  %s%-3s ある %4d ／ 抜け %4d %s' % (mark, L, out[L]['ある'], len(m),
              ('例: ' + '／'.join(m[:3])) if m else ''))
        if L == 'ja': bad += len(m)      # ★ja の 抜けだけ NG（★ほかは 訳待ち）
    print('★ja の 抜けだけ NG に します。★ほかの 言語は ★訳待ち です')
    print(f'RESULT: {"OK" if bad == 0 else f"ja に 抜け {bad}件"}')
    return 0

def selftest():
    base, out = check({'ja':{'a':'あ','b':'い'}, 'it':{'a':'A'}})
    assert out['it']['抜け'] == ['b'], '★抜けを 数えられない'
    assert out['ja']['抜け'] == [], '★ja を 誤って 数える'
    _, o2 = check({'ja':{'a':'あ'}, 'en':{'a':'  '}})
    assert o2['en']['抜け'] == ['a'], '★空文字を ある と 数えている'
    print('SELFTEST PASS'); return 0

if __name__ == '__main__':
    sys.exit(selftest() if '--selftest' in sys.argv else main())
