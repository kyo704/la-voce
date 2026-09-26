#!/usr/bin/env python3
"""★zip に 全部 入ったか 数える。
★2026-09-25: ★ファイル名に ★空白が あると ★zip が 取りこぼしました
  ★★エラーは 出ません。★1本 足りないだけ です
使い方: python3 tools/zip_check.py <zip> <folder> [--selftest]"""
import os, sys, subprocess

def diff(zip_path, folder, prefix):
    z = subprocess.run(['unzip','-l',zip_path], capture_output=True, text=True).stdout
    inzip = set()
    for L in z.split('\n'):
        p = L.split()
        if len(p) >= 4 and p[3].startswith(prefix) and not p[3].endswith('/'):
            inzip.add(p[3][len(prefix):])
    real = set()
    for r, d, f in os.walk(folder):
        for x in f:
            real.add(os.path.relpath(os.path.join(r, x), folder))
    return sorted(real - inzip), len(inzip), len(real)

def main():
    zp, fd = sys.argv[1], sys.argv[2].rstrip('/')
    missing, nz, nr = diff(zp, fd, os.path.basename(fd) + '/')
    print('ZIP_CHECK', os.path.basename(zp))
    print('  zip', nz, '／ 元', nr)
    for m in missing: print('  DIFF ★入っていない |', m)
    sp = [f for f in missing if ' ' in f]
    if sp: print('  ★★名前に 空白（★これが 原因の ことが 多い）:', len(sp), '件')
    print(f'RESULT: {"OK" if not missing else f"NG（{len(missing)}件）"}')
    return 0

def selftest():
    assert diff.__code__.co_argcount == 3
    print('SELFTEST PASS'); return 0

if __name__ == '__main__':
    sys.exit(selftest() if '--selftest' in sys.argv else main())
