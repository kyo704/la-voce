#!/usr/bin/env python3
"""★★90日で 消す と 約束した ものが ★掃除に 入って いるか。
★★2026-09-26 に 見つけた もの:
  ★purge_page_inquiries ── ★★関数は ある のに ★run_retention が 呼んで いません
  ★★見本:「★90日で 消えます」── ★★守られません
  ★★私が 作った sweep_referrals・sweep_invite_attempts も ★同じ

★★★「関数が ある」と「★呼ばれて いる」は ★別 です

★★2026-09-26 夜に 足した 3つ（★本番で 掃除が 全部 止まった あと）
  ★B ★★1つの case 式に 関数を 並べると ★1つ 欠けて ★全部 止まる
  ★C ★呼んで いるのに ★どこにも 作って いない 関数
  ★D ★★作る ファイルが ★呼ぶ ファイルより 後ろ（★当てる 順番の 穴）

★使い方: python3 tools/retention_lint.py <sql フォルダ> [--selftest]"""
import glob, os, re, sys

BODY = r'\$\$([\s\S]*?)\$\$'


def strip_comments(sql):
    """★-- の 行は ★見ません。
    ★2026-09-26: ★109 の 解説（★悪い 形を 書いた もの）を ★誤検出 しました"""
    return re.sub(r'--[^\n]*', '', sql)


def bodies(all_sql, fname_re):
    """★その 関数の ★全部の 中身（★何度 書き直されても 全部）"""
    out = []
    for m in re.finditer(r'function\s+public\.' + fname_re + r'[\s\S]*?' + BODY,
                         all_sql, re.I):
        out.append(m.group(1))
    return out


def find(sqls):
    """★掃除の 関数 と ★run_retention が 呼ぶ もの を 返す"""
    all_sql = '\n'.join(sqls)
    purge = set(re.findall(
        r'create\s+(?:or\s+replace\s+)?function\s+public\.((?:purge|sweep)_\w+)',
        all_sql, re.I))
    # ★★run_retention は ★何度も 書き直されます
    #   ★★最初の 1つでは なく ★★全部の 中身を 見ます
    #   ★2026-09-26: ★★最初だけ 見て ★4件 誤検出 しました
    called = set()
    for b in bodies(all_sql, 'run_retention'):
        called |= set(re.findall(r'public\.((?:purge|sweep)_\w+)\s*\(', b))
        # ★execute format('select public.%I()', v_fn) の 形は
        #   ★名前が 文字の 表に 並びます。★そこも 拾います
        called |= set(re.findall(r"'((?:purge|sweep)_\w+)'", b))
    return sorted(purge), sorted(purge - called)


def newest_caller(files, texts):
    """★★run_retention を 書き直す ファイルの うち ★いちばん 後ろ の 1つ。
    ★★前の 版は ★もう 上書き されて いるので ★見ません
    （★2026-09-26: ★42・53・61 の 古い 版まで 挙げて 騒ぎました）"""
    cs = [(f, t) for f, t in zip(files, texts)
          if re.search(r'function\s+public\.run_retention', strip_comments(t), re.I)]
    return max(cs, key=lambda ft: seq(ft[0])) if cs else (None, None)


def check_case_bundle(sqls):
    """★B ★★1つの case 式に 関数呼び出しを 2本以上 並べて いないか。

    ★★case は 1つの 式。★式は ★通る 枝だけでなく ★全部の 枝を
      ★まとめて 組み立てます。★だから 1本 欠けると ★★どの 枝も 通りません。
    ★確かめ（★本番・読み取りだけ）:
      select case 'a' when 'a' then 1
                      when 'b' then public.no_such_function_xyz() end;
      → ★ERROR 42883。★通る 枝は 'a' なのに ★式ごと 落ちます
    """
    bad = []
    for sql in sqls:
        for m in re.finditer(r'\bcase\b([\s\S]*?)\bend\b', strip_comments(sql), re.I):
            seg = m.group(1)
            calls = re.findall(r'\bthen\s+public\.(\w+)\s*\(', seg, re.I)
            if len(calls) >= 2:
                bad.append(calls)
    return bad


def defining_file(files, texts, fn):
    """★その 関数を 作って いる ファイル（★最初に 作った もの）"""
    for f, t in zip(files, texts):
        if re.search(r'create\s+(?:or\s+replace\s+)?function\s+public\.'
                     + re.escape(fn) + r'\s*\(', strip_comments(t), re.I):
            return f
    return None


def seq(path):
    """★ファイル名の 通し番号（★20260926_107_… → 107）"""
    m = re.search(r'_(\d+)_', os.path.basename(path))
    return int(m.group(1)) if m else -1


def check_order(files, texts):
    """★C 作って いない ／ ★D 作る ファイルが 後ろ"""
    missing, late = [], []
    cf, ct = newest_caller(files, texts)
    if cf:
        called = set()
        for b in bodies(strip_comments(ct), 'run_retention'):
            called |= set(re.findall(r'public\.((?:purge|sweep)_\w+)\s*\(', b))
            called |= set(re.findall(r"'((?:purge|sweep)_\w+)'", b))
        for fn in sorted(called):
            df = defining_file(files, texts, fn)
            if df is None:
                missing.append((os.path.basename(cf), fn))
            elif seq(df) > seq(cf):
                late.append((os.path.basename(cf), fn, os.path.basename(df)))
    return missing, late


def main():
    root = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'sql'
    files = sorted(glob.glob(os.path.join(root, '*.sql')))
    texts = [open(f, encoding='utf-8', errors='replace').read() for f in files]
    purge, miss = find([strip_comments(t) for t in texts])
    nf, nt = newest_caller(files, texts)
    bundles = check_case_bundle([nt] if nt else [])
    missing, late = check_order(files, texts)

    print('RETENTION_LINT', root)
    print('  ★掃除の 関数', len(purge), '／ ★呼ばれて いない', len(miss))
    for m in miss:
        print('  DIFF ★呼ばれて いない |', m, '── ★★消えません')
    for calls in bundles:
        print('  DIFF ★★1つの case 式に 関数', len(calls), '本 |',
              '・'.join(calls[:4]), '…' if len(calls) > 4 else '')
        print('       → ★★1つ 欠けると ★全部 止まります。'
              '★execute format で 1つずつ 呼んで ください')
    if nf:
        print('  ★いま 効いて いる run_retention |', os.path.basename(nf))
    for cf, fn in missing:
        print('  WARN ★この 一式に 作りが 無い |', cf, '→', fn)
        print('       → ★もっと 前の 移行で 作った かも。★本番で 確かめて ください')
    for cf, fn, df in late:
        print('  DIFF ★★作るのが 後ろ |', cf, 'が', fn, 'を 呼ぶ / 作るのは', df)
        print('       → ★', cf, 'を 先に 当てると ★その晩から 掃除が 止まります')

    print('★★「関数が ある」と「呼ばれて いる」は ★別 です')
    print('★★「呼ぶ 側が ある」と「呼ばれる 側が ある」も ★別 です')
    # ★WARN（missing）は 数えません。★もっと 前の 移行の ことが あります
    n = len(miss) + len(bundles) + len(late)
    print(f'RESULT: {"OK" if n == 0 else f"NG（{n}件）"}')
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

    # ★B ★case に 2本
    bundled = ["""create function public.run_retention() returns void as $$
        n := case v when 'a' then public.purge_a()
                    when 'b' then public.sweep_b() end; $$;"""]
    assert len(check_case_bundle(bundled)) == 1, '★case の 束ねを 見逃す'
    # ★B ★execute の 形は 見つけない（★これが 直した 形）
    fixed = ["""create function public.run_retention() returns void as $$
        execute format('select public.%I()', v_fn) into n; $$;"""]
    assert check_case_bundle(fixed) == [], '★直した 形を 誤検出'

    # ★C・D ★書き分け（★execute 形の 名前の 表も 拾う）
    import tempfile
    d = tempfile.mkdtemp()
    a = os.path.join(d, '20260926_107_call.sql')
    b = os.path.join(d, '20260926_102_make.sql')
    open(a, 'w').write("""create or replace function public.run_retention()
        returns void as $$ v_jobs text[] := array['sweep_ref']; $$;""")
    open(b, 'w').write("create function public.sweep_ref() returns int as $$ $$;")
    fs = sorted([a, b]); ts = [open(f).read() for f in fs]
    mi, la = check_order(fs, ts)
    assert mi == [] and len(la) == 0, f'★102 は 107 より 前 なので OK: {mi} {la}'

    c = os.path.join(d, '20260926_120_make.sql')
    os.rename(b, c)
    fs = sorted([a, c]); ts = [open(f).read() for f in fs]
    mi, la = check_order(fs, ts)
    assert len(la) == 1 and la[0][1] == 'sweep_ref', f'★後ろを 見逃す: {la}'

    os.remove(c)
    fs = [a]; ts = [open(a).read()]
    mi, la = check_order(fs, ts)
    assert len(mi) == 1, f'★無いのを 見逃す: {mi}'

    print('SELFTEST PASS'); return 0


if __name__ == '__main__':
    sys.exit(selftest() if '--selftest' in sys.argv else main())
