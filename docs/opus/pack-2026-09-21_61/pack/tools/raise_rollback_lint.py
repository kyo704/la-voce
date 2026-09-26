#!/usr/bin/env python3
"""★書いてから raise していないか。
★★2026-09-26 に 本番で 見つけた もの:
  ★join_koen_by_code ── ★失敗を 記録してから raise exception
  ★★raise は ★★直前の 書き込みも 取り消します
  ★★本番で 確かめました: ★失敗 3回 → ★code_attempts ★0行
  ★★「10回で 断る」が ★一度も 効いて いませんでした

★★見分け方:
  ★同じ 分岐（begin〜end の 間）で ★insert/update の ★あとに raise がある
  ★★ただし ★「うまく いった ことの 記録」は ★問題 ありません
    ★score_log・export_log など ── ★取り消されて 困りません
  → ★★「数える 表」への 書き込みだけ 見ます

★使い方: python3 tools/raise_rollback_lint.py <sql フォルダ> [--selftest]"""
import os, re, sys, glob

# ★数える 表（★取り消されると 守りが 効かなく なります）
COUNTERS = r'(attempt|tries|fail|retry|count|_limit|throttle|invite_attempts|code_attempts)'

def strip(sql):
    sql = re.sub(r'/\*[\s\S]*?\*/', ' ', sql)
    return re.sub(r'(?m)--[^\n]*$', ' ', sql)

def scan(sql):
    """★数える 表に 書いた あと raise している ところ"""
    s = strip(sql)
    out = []
    for m in re.finditer(r'(insert\s+into|update)\s+(public\.)?(\w+)', s, re.I):
        tbl = m.group(3)
        if not re.search(COUNTERS, tbl, re.I): continue
        # ★★そのあと ★次の end まで に raise があるか
        tail = s[m.end(): m.end() + 600]
        cut = re.search(r'\bend\s+if\b', tail, re.I)
        seg = tail[:cut.end()] if cut else tail
        if re.search(r'raise\s+exception', seg, re.I):
            out.append(tbl)
    return out

def main():
    root = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'sql'
    bad = []
    for f in sorted(glob.glob(os.path.join(root, '*.sql'))):
        hit = scan(open(f, encoding='utf-8', errors='replace').read())
        for t in hit: bad.append((os.path.basename(f), t))
    print('RAISE_ROLLBACK', root)
    for f, t in bad:
        print('  DIFF ★書いてから raise |', f, '|', t, '── ★記録が 消えます')
    print('★数える 表だけ 見ます。★うまく いった ことの 記録は 対象外')
    print(f'RESULT: {"OK" if not bad else f"NG（{len(bad)}件）"}')
    return 0

def selftest():
    bad = scan("""insert into public.code_attempts(a) values (1);
                  raise exception 'NO'; end if;""")
    assert bad == ['code_attempts'], '★見つけられない'
    ok = scan("""insert into public.export_log(a) values (1);
                 raise exception 'NO'; end if;""")
    assert ok == [], '★記録の 表を 誤って 拾う'
    ok2 = scan("""insert into public.code_attempts(a) values (1);
                  return null; end if;""")
    assert ok2 == [], '★raise が 無いのに 拾う'
    assert scan("-- insert into public.code_attempts\n") == [], '★注記を 拾う'
    print('SELFTEST PASS'); return 0

if __name__ == '__main__':
    sys.exit(selftest() if '--selftest' in sys.argv else main())
