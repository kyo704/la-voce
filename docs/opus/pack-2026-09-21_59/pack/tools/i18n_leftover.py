#!/usr/bin/env python3
"""★t() を 通っていない 日本語を 見つける。
★★「ぜんぶ 置き換えた」は ★人には 数えられません。★機械で 数えます
★使い方: python3 tools/i18n_leftover.py <file.html> [--selftest]
★2026-09-26 作成（★9言語の 工事の 前に）
  ★★道具を 先に 作るのが 要点 です
  ★これが 無いまま 始めると「★終わった つもり」に なります"""
import os, re, sys

JA = r'[ぁ-んァ-ヶ一-龥]'

def scan(src):
    """★注記を 外し、★t() の 外に ある 日本語を 返す"""
    # ★/* … */ と // の 行を 外す（★注記の 日本語は 置き換え 不要）
    s = re.sub(r'/\*[\s\S]*?\*/', ' ', src)
    # ★行の 途中の // も 外します（★★url の // は 残す）
    s = re.sub(r'(?m)(^|[^:])//[^\n]*$', r'\1 ', s)
    # ★t('…') の 中身を 外す（★もう 通っている）
    s = re.sub(r"\bt\(\s*'[^']*'[^)]*\)", ' ', s)
    s = re.sub(r'\bt\(\s*"[^"]*"[^)]*\)', ' ', s)
    out = []
    for m in re.finditer(r'[^\n]*' + JA + r'[^\n]*', s):
        line = m.group(0).strip()
        if len(line) > 200: line = line[:200]
        out.append(line)
    return out

def main():
    files = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not files:
        here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        files = [os.path.join(here, f) for f in os.listdir(here)
                 if f.startswith('00-動く見本') and f.endswith('.html')]
    total = 0
    for f in files:
        rows = scan(open(f, encoding='utf-8', errors='replace').read())
        print('I18N_LEFTOVER', os.path.basename(f)[:30], '★のこり', len(rows))
        for r in rows[:5]: print('  DIFF ★t() の 外 |', r[:90])
        if len(rows) > 5: print('  … ほか', len(rows) - 5, '行')
        total += len(rows)
    print('★注記（/* */・//）は 数えません。★t() を 通った ものも 数えません')
    print(f'RESULT: {"OK" if total == 0 else f"のこり {total}行"}')
    return 0

def selftest():
    assert scan("var a='あ'") , '★日本語を 見つけられない'
    assert not scan("/* あいう */"), '★注記を 数えている'
    assert not scan("t('k') // あ"), '★t() か //を 数えている'
    assert scan("h='うた'+t('k')"), '★混ざった 行を 見逃す'
    print('SELFTEST PASS'); return 0

if __name__ == '__main__':
    sys.exit(selftest() if '--selftest' in sys.argv else main())
