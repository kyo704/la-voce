#!/usr/bin/env python3
"""★訳す 前の ★語の ゆれを 見つける。
★★同じ ことばが ★2通りに 書かれていると:
  ★key が 2つに 分かれます
  ★★9言語 × 2 の 無駄に なります
  ★★訳した あとに 気づくと ★9倍の 手間
★使い方: python3 tools/i18n_wording.py [file…] [--selftest]
★2026-09-26 作成（★訳す 前に やる ことが 要点）"""
import os, re, sys
from collections import Counter

def norm(s):
    """★空白を 外して 比べます（★分かち書きの ゆれ）"""
    return s.replace(' ', '').replace('\u3000', '')

def find(words):
    """★同じ ことばの 2通り書きを 返す"""
    c = Counter(words)
    g = {}
    for k in c: g.setdefault(norm(k), []).append(k)
    out = []
    for v in g.values():
        if len(v) > 1:
            out.append((sorted(v, key=lambda x: -c[x]), {x: c[x] for x in v}))
    return sorted(out, key=lambda x: -sum(x[1].values()))

def pick(src):
    """★画面に 出る 短い 文だけ（★14字まで）"""
    s = re.sub(r'/\*[\s\S]*?\*/', ' ', src)
    out = []
    for m in re.finditer(r'>([^<>{}]{1,14})<', s):
        t = m.group(1).strip()
        if t and re.search(r'[ぁ-んァ-ヶ一-龥]', t): out.append(t)
    for m in re.finditer(r"'([^'\\]{1,14})'", s):
        t = m.group(1).strip()
        if t and re.search(r'[ぁ-んァ-ヶ一-龥]', t): out.append(t)
    return out

def main():
    files = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not files:
        here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        files = [os.path.join(here, f) for f in os.listdir(here)
                 if f.startswith('00-動く見本') and f.endswith('.html')]
    words = []
    for f in files: words += pick(open(f, encoding='utf-8', errors='replace').read())
    rows = find(words)
    print('I18N_WORDING  ★ことば', len(set(words)), '／ ★ゆれ', len(rows), '組')
    for v, c in rows[:15]:
        print('  DIFF ★ゆれ |', ' ／ '.join('%s(%d)' % (x, c[x]) for x in v))
    if len(rows) > 15: print('  … ほか', len(rows) - 15, '組')
    print('★★訳す 前に 揃えて ください。★あとだと ★9言語ぶんの 手間に なります')
    print(f'RESULT: {"OK" if not rows else f"ゆれ {len(rows)}組"}')
    return 0

def selftest():
    r = find(['声の記録', '声の 記録', '本番'])
    assert len(r) == 1, '★ゆれを 見つけられない'
    assert set(r[0][0]) == {'声の記録', '声の 記録'}, '★組が 違う'
    assert not find(['本番', '稽古']), '★違う ことばを 組に した'
    assert norm('出　演') == '出演', '★全角の 空白を 外せない'
    print('SELFTEST PASS'); return 0

if __name__ == '__main__':
    sys.exit(selftest() if '--selftest' in sys.argv else main())
