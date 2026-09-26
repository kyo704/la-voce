#!/usr/bin/env python3
"""★数・日付・お金が ★直に 書かれて いないか。
★★ことばを 訳しても ★ここが 残ります:
  ★「4,800円」── ★ユーロでは ありません
  ★「10月18日」── ★英語は October 18
  ★「216人」── ★英語は 1 person／2 people
★使い方: python3 tools/i18n_hardnum.py [file…] [--selftest]
★2026-09-26 作成"""
import os, re, sys

# ★探すもの（★数の すぐ あとの 単位・日付の 形）
PATS = [
    ('お金', r'[0-9０-９,，]+\s*円'),
    ('日付', r'[0-9０-９]+\s*月\s*[0-9０-９]+\s*日'),
    ('人数', r'[0-9０-９,，]+\s*人'),
    ('件数', r'[0-9０-９,，]+\s*件'),
    ('日数', r'[0-9０-９]+\s*日(?!\s*[（(])'),
    ('回数', r'[0-9０-９]+\s*回'),
    ('枚数', r'[0-9０-９]+\s*枚'),
]

def scan(src):
    """★注記を 外して 数える"""
    s = re.sub(r'/\*[\s\S]*?\*/', ' ', src)
    s = re.sub(r'(?m)(^|[^:])//[^\n]*$', r'\1 ', s)
    out = {}
    for name, p in PATS:
        hits = re.findall(p, s)
        if hits: out[name] = hits
    return out

def main():
    files = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not files:
        here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        files = [os.path.join(here, f) for f in os.listdir(here)
                 if f.startswith('00-動く見本') and f.endswith('.html')]
    total = 0
    for f in files:
        got = scan(open(f, encoding='utf-8', errors='replace').read())
        n = sum(len(v) for v in got.values())
        print('I18N_HARDNUM', os.path.basename(f)[:28], '★直書き', n)
        for k, v in sorted(got.items(), key=lambda x: -len(x[1])):
            print('  DIFF %-4s %d件 | 例: %s' % (k, len(v), '／'.join(v[:3])))
        total += n
    print('★訳しても ここは 残ります。★t() の 引数に するか Intl に 渡して ください')
    print(f'RESULT: {"OK" if total == 0 else f"直書き {total}件"}')
    return 0

def selftest():
    assert scan('4,800円')['お金'], '★お金を 見つけられない'
    assert scan('10月18日')['日付'], '★日付を 見つけられない'
    assert not scan('/* 216人 */'), '★注記を 数えている'
    assert '人数' in scan('216人'), '★人数を 見つけられない'
    print('SELFTEST PASS'); return 0

if __name__ == '__main__':
    sys.exit(selftest() if '--selftest' in sys.argv else main())
