#!/usr/bin/env python3
"""★★90日で 消す と 約束した ものが ★掃除に 入って いるか。
★★2026-09-26 に 見つけた もの:
  ★purge_page_inquiries ── ★★関数は ある のに ★run_retention が 呼んで いません
  ★★見本:「★90日で 消えます」── ★★守られません
  ★★私が 作った sweep_referrals・sweep_invite_attempts も ★同じ

★★★「関数が ある」と「★呼ばれて いる」は ★別 です
★使い方: python3 tools/retention_lint.py <sql フォルダ> [--selftest]"""
import glob, os, re, sys

def find(sqls):
    """★掃除の 関数 と ★run_retention が 呼ぶ もの を 返す"""
    all_sql = '\n'.join(sqls)
    # ★掃除の 関数（★delete + 日数）
    purge = set(re.findall(
        r'create\s+(?:or\s+replace\s+)?function\s+public\.((?:purge|sweep)_\w+)',
        all_sql, re.I))
    # ★run_retention の 中で 呼ばれて いる もの
    # ★★run_retention は ★何度も 書き直されます（★いま 8回）
    #   ★★最初の 1つでは なく ★★全部の 中身を 見ます
    #   ★2026-09-26: ★★最初だけ 見て ★4件 誤検出 しました
    called = set()
    for m in re.finditer(r'function\s+public\.run_retention[\s\S]*?\$\$([\s\S]*?)\$\$',
                         all_sql, re.I):
        called |= set(re.findall(r'public\.((?:purge|sweep)_\w+)\s*\(', m.group(1)))
    return sorted(purge), sorted(purge - called)

def main():
    root = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'sql'
    sqls = [open(f, encoding='utf-8', errors='replace').read()
            for f in sorted(glob.glob(os.path.join(root, '*.sql')))]
    purge, miss = find(sqls)
    print('RETENTION_LINT', root)
    print('  ★掃除の 関数', len(purge), '／ ★呼ばれて いない', len(miss))
    for m in miss:
        print('  DIFF ★呼ばれて いない |', m, '── ★★消えません')
    print('★★「関数が ある」と「呼ばれて いる」は ★別 です')
    print(f'RESULT: {"OK" if not miss else f"NG（{len(miss)}件）"}')
    return 0

def selftest():
    ok = ["""create function public.purge_a() returns int as $$ $$;
             create function public.run_retention() returns void as $$
               n := public.purge_a(); $$;"""]
    p, m = find(ok)
    assert p == ['purge_a'] and m == [], '★呼ばれて いるのに NG'
    ng = ["""create function public.purge_b() returns int as $$ $$;
             create function public.run_retention() returns void as $$ $$;"""]
    p2, m2 = find(ng)
    assert m2 == ['purge_b'], '★呼ばれて いないのを 見逃す'
    print('SELFTEST PASS'); return 0

if __name__ == '__main__':
    sys.exit(selftest() if '--selftest' in sys.argv else main())
