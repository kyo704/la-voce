#!/usr/bin/env python3
"""★配る zip を 作る。
★★2026-09-26 に 分かった こと:
  ★zip コマンドは ★UTF-8 の 印（0x800）を 付けません
  ★★中では 読めますが、★★Windows・Mac で 開くと ★日本語名が 壊れます
  ★★zip_check.py は ★同じ 読み方 なので ★差 0 と 出ます ── ★気づけません
★使い方: python3 tools/make_zip.py <out.zip> <folder> [--selftest]
"""
import os, sys, zipfile

def build(out, src, prefix=None):
    prefix = prefix or os.path.basename(src.rstrip('/'))
    n = 0
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for r, d, f in os.walk(src):
            for x in sorted(f):
                p = os.path.join(r, x)
                arc = prefix + '/' + os.path.relpath(p, src)
                zi = zipfile.ZipInfo.from_file(p, arc)
                zi.flag_bits |= 0x800          # ★★UTF-8 の 印
                zi.compress_type = zipfile.ZIP_DEFLATED
                with open(p, 'rb') as fh: z.writestr(zi, fh.read())
                n += 1
    return n

def main():
    out, src = sys.argv[1], sys.argv[2].rstrip('/')
    n = build(out, src)
    z = zipfile.ZipFile(out)
    # ★★ASCII だけの 名前には ★印が 要りません（★Python が 付けません）
    #   ★2026-09-26: ★私は はじめ ★全部に 要ると 書いて、★自分の zip を 不合格に しました
    def need(nm):
        try: nm.encode('ascii'); return False
        except UnicodeEncodeError: return True
    utf8 = all((i.flag_bits & 0x800) for i in z.infolist() if need(i.filename))
    real = set()
    for r, d, f in os.walk(src):
        for x in f: real.add(os.path.relpath(os.path.join(r, x), src))
    inzip = {n2.split('/', 1)[1] for n2 in z.namelist() if '/' in n2}
    miss = sorted(real - inzip)
    print('MAKE_ZIP', os.path.basename(out))
    print('  ', n, '本 ／ UTF-8 の 印', '○' if utf8 else '★★無い')
    for m in miss[:5]: print('  DIFF ★入っていない |', m)
    print(f'RESULT: {"OK" if utf8 and not miss else "NG"}')
    return 0

def selftest():
    import tempfile
    d = tempfile.mkdtemp(); os.makedirs(os.path.join(d, 'x'))
    open(os.path.join(d, 'x', '日本語 の 名前.md'), 'w').write('a')
    out = os.path.join(d, 't.zip')
    assert build(out, os.path.join(d, 'x'), 'x') == 1, '★1本 書けない'
    z = zipfile.ZipFile(out)
    assert z.infolist()[0].flag_bits & 0x800, '★UTF-8 の 印が 無い（★日本語名）'
    # ★ASCII 名には 付かない ── ★それで 正しい
    open(os.path.join(d,'x','ascii.md'),'w').write('a')
    build(out, os.path.join(d,'x'), 'x')
    z2=zipfile.ZipFile(out)
    a=[i for i in z2.infolist() if i.filename.endswith('ascii.md')][0]
    assert not (a.flag_bits & 0x800), '★ASCII に 印が 付いた'
    assert '日本語 の 名前.md' in z.namelist()[0], '★名前が 壊れた'
    print('SELFTEST PASS'); return 0

if __name__ == '__main__':
    sys.exit(selftest() if '--selftest' in sys.argv else main())
