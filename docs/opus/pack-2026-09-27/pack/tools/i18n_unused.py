#!/usr/bin/env python3
"""★どこからも 使われない key を 数える。
★★消し忘れた key は ★訳の 手間に なります（★9言語 × 無駄）
★★ただし ★すぐには 消しません（★決めごと §3 ⑦）
  ★半年 見てから。★★訳が 生きています
★使い方: python3 tools/i18n_unused.py <dict.json> <file…> [--selftest]
★2026-09-26 作成"""
import json, os, re, sys

def used(srcs):
    """★t('…') で 呼ばれている key を 集める"""
    s = '\n'.join(srcs)
    got = set()
    for m in re.finditer(r"""\bt\(\s*['"]([^'"]+)['"]""", s):
        got.add(m.group(1))
    return got

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args:
        print('I18N_UNUSED ★辞書が まだ ありません（★段1 の あとで）')
        print('RESULT: OK（まだ）'); return 0
    dic = json.load(open(args[0], encoding='utf-8'))
    files = args[1:]
    if not files:
        here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        files = [os.path.join(here, f) for f in os.listdir(here)
                 if f.startswith('00-動く見本') and f.endswith('.html')]
    srcs = [open(f, encoding='utf-8', errors='replace').read() for f in files]
    u = used(srcs)
    keys = set(dic.get('ja', {}).keys())
    unused = sorted(keys - u)
    missing = sorted(u - keys)          # ★呼んでいるのに 辞書に 無い（★こちらが 重い）
    print('I18N_UNUSED  ★辞書', len(keys), '／ 呼ばれている', len(u))
    for k in missing[:8]: print('  ★★DIFF 呼んでいるのに 辞書に 無い |', k)
    for k in unused[:5]:  print('  DIFF 使われない |', k)
    if len(unused) > 5: print('  … ほか', len(unused) - 5)
    print('★使われない key は ★すぐ 消しません（★訳が 生きています・半年 見る）')
    print(f'RESULT: {"OK" if not missing else f"辞書に 無い {len(missing)}件"}')
    return 0

def selftest():
    assert used(["t('a.b')"]) == {'a.b'}, '★拾えない'
    assert used(['t("x.y", {n:1})']) == {'x.y'}, '★引数つきを 拾えない'
    assert used(["// t('z')"]) == {'z'}, '★注記も 拾う（★いまは 許容）'
    print('SELFTEST PASS'); return 0

if __name__ == '__main__':
    sys.exit(selftest() if '--selftest' in sys.argv else main())
