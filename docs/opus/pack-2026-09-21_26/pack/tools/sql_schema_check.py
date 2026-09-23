#!/usr/bin/env python3
"""SQL の中の ★表と列と値が、本番にあるかを 突き合わせる（2026-09-23 Opus）

なぜ要るか:
  2026-09-23 の1日で、Opus が書いた SQL に ★同じ型の誤りが 5件出た:
    ・無い列に書こうとした（org_billing_log.note／koen_kids.name_at／lessons.lesson_date）
    ・無い列で並べた（enrollments.grade）
    ・★値が違った（enrollments.status='enrolled' ← 本当は 'active'）
  ★どれも「当てるまで分からない」形で、★静かに0件を返すものもあった。

使い方（★Code が走らせる。Opus は DB に繋げない）:
  1) スキーマの写しを作る:
       psql "$DB" -At -F'|' -f tools/sql_schema_dump.sql > tools/schema_snapshot.txt
  2) 突き合わせる:
       python3 tools/sql_schema_check.py sql tools/schema_snapshot.txt
  自己試験: python3 tools/sql_schema_check.py --selftest

見るもの:
  A 表が 本番にあるか（from／join／insert into／update／alter table）
  B insert の列が すべてあるか
  C update の set の列が あるか
  D ★CHECK に列挙された値と、SQL の中の比較の値（col = 'xxx'）が 合っているか
  E ★別名で書いた列（k.name_at／en.grade）が その表にあるか
    ← 2026-09-23 の5件のうち 2件が この形。★B〜D では 捕まえられなかった
出さないもの:
  ★新しく作る表・列は 対象外（同じファイルの中で create しているもの）
"""
import re, sys, os

COMPLETE = False   # ★写しが「全部の表」かどうか（#complete の行で決まる）

def load_schema(path):
    """表|列|列… ／ CHECK は 表|列|@値,値,値 の形"""
    global COMPLETE
    cols, checks = {}, {}
    for line in open(path, encoding='utf-8'):
        if line.strip() == '#complete': COMPLETE = True; continue
        p = line.rstrip('\n').split('|')
        if len(p) < 2: continue
        t = p[0].strip()
        if p[1].startswith('@'):
            checks.setdefault(t, {})[p[1][1:]] = set(x for x in p[2].split(',') if x)
        else:
            cols[t] = set(x.strip() for x in p[1:] if x.strip())
    return cols, checks

def checks_here(sql):
    """★同じファイルで CHECK を付け直しているなら、その値も 許す
       （2026-09-23: sql/19 が 'graduated' を足してから使うのを 誤って NG にしていた）"""
    add = {}
    for c, vals in re.findall(r'add\s+constraint\s+\w+\s+check\s*\(\s*(\w+)\s+in\s*\(([^)]*)\)', sql, re.I):
        add.setdefault(c, set()).update(x.strip().strip("'") for x in vals.split(','))
    for c, vals in re.findall(r'check\s*\(\s*(\w+)\s*=\s*any\s*\(\s*array\[([^\]]*)\]', sql, re.I):
        add.setdefault(c, set()).update(x.strip().strip("'") for x in vals.split(','))
    return add

def created_here(sql):
    """同じファイルで 作る表・足す列は 見ない"""
    made = set(re.findall(r'create\s+(?:or\s+replace\s+)?(?:table|view)\s+(?:if\s+not\s+exists\s+)?public\.(\w+)', sql, re.I))
    added = {}
    for t, c in re.findall(r'alter\s+table\s+public\.(\w+)\s+add\s+column\s+(?:if\s+not\s+exists\s+)?(\w+)', sql, re.I):
        added.setdefault(t, set()).add(c)
    return made, added

def check_file(path, cols, checks, made_elsewhere=None):
    sql = open(path, encoding='utf-8').read()
    # ★時系列で正しい（あとの版で消える列を まだ使う等）ときは
    #   ファイルの先頭に  -- schema-ok: 理由  と1行 書く
    if re.search(r'^\s*--\s*schema-ok:', sql, re.M):
        return []
    sql_nc = re.sub(r'--[^\n]*', '', sql)           # 注を外す
    made, added = created_here(sql_nc)
    more = checks_here(sql_nc)
    out = []
    def known(t): return t in cols or t in made or (made_elsewhere and t in made_elsewhere)
    def has(t, c):
        if t in made: return True
        if made_elsewhere and t in made_elsewhere and t not in cols: return True   # ★別のファイルで作る表
        if c in added.get(t, set()): return True
        return c in cols.get(t, set())

    # A 表
    # ★関数の呼び出し（from public.f(...)）は 表ではない
    #   2026-09-23: scoring_queue（関数）を「表が無い」と 誤って出した
    for m in re.finditer(r'(?:from|join|insert\s+into|update|alter\s+table)\s+public\.(\w+)\s*(\()?', sql_nc, re.I):
        t, paren = m.group(1), m.group(2)
        if paren: continue                      # ★関数
        # ★写しが 全部の表でないときは「無い」と言えない（2026-09-23: 58表の写しで 78件 誤って出した）
        if not COMPLETE: continue
        if not known(t): out.append(('A表が無い', t, ''))
    # B insert の列
    for t, cl in re.findall(r'insert\s+into\s+public\.(\w+)\s*\(([^)]*)\)', sql_nc, re.I):
        if not known(t): continue
        for c in [x.strip() for x in cl.split(',') if x.strip()]:
            if not has(t, c): out.append(('B insert の列が無い', t, c))
    # C update の set
    for m in re.finditer(r'update\s+public\.(\w+)\s+set\s+([^;]+?)(?:where|returning|;)', sql_nc, re.I | re.S):
        t = m.group(1)
        if not known(t): continue
        for c in re.findall(r'(\w+)\s*=', m.group(2)):
            if c.lower() in ('now','true','false','null'): continue
            if not has(t, c): out.append(('C update の列が無い', t, c))
    # E 別名で書いた列（★文ごとに見る。2026-09-23: ファイル全体で見ていたため
    #   同じ別名が 別の表に使われていると 誤って NG にしていた）
    for stmt in re.split(r';\s*\n', sql_nc):
        ctes = set(re.findall(r'(\w+)\s+as\s*\(', stmt, re.I))      # ★CTE の名前は 表ではない
        alias = {}
        for t, al in re.findall(r'(?:from|join)\s+public\.(\w+)(?!\s*\()\s+(?:as\s+)?(\w+)', stmt, re.I):
            if al.lower() in ('on','where','set','using','group','order','left','right','inner','join','and','or','limit','returning','cross','union','full'): continue
            if al in ctes: continue
            if al in alias and alias[al] != t: alias[al] = None      # ★同じ文で ぶつかったら 見ない
            else: alias.setdefault(al, t)
        for al, t in alias.items():
            if not t or not known(t): continue
            for c in set(re.findall(r'\b' + re.escape(al) + r'\.(\w+)', stmt)):
                if c == '*': continue
                if not has(t, c): out.append(('E 別名の列が無い', t + '（' + al + '）', c))

    # D CHECK の値（★その表が出てくる文の中だけ見る。
    #   2026-09-23: 列の名前（status）だけで見ていたため、別の表の status まで 誤って NG にしていた）
    for stmt in re.split(r';\s*\n', sql_nc):
        for t, tc in checks.items():
            if not re.search(r'public\.' + re.escape(t) + r'\b', stmt, re.I): continue
            # ★その文に ほかの表も出てくるなら、★別名で修飾されたものだけ見る
            others = set(re.findall(r'public\.(\w+)', stmt, re.I)) - {t}
            al_of_t = set(a for tt, a in re.findall(r'(?:from|join|update|into)\s+public\.(\w+)\s+(?:as\s+)?(\w+)', stmt, re.I) if tt == t)
            for c, vals0 in tc.items():
                vals = vals0 | more.get(c, set())
                pat = (r'(?:' + '|'.join(re.escape(a) + r'\.' for a in al_of_t) + r')' + re.escape(c)) if (others and al_of_t) else (r'\b' + re.escape(c))
                if others and not al_of_t: continue       # ★見分けられないので 見ない
                for m in re.finditer(pat + r"\s*=\s*'([^']+)'", stmt):
                    v = m.group(1)
                    if v not in vals:
                        out.append(('D 値が CHECK に無い', t + '.' + c, v + ' ← ' + '／'.join(sorted(vals))))

    return out

def main(d, snap):
    cols, checks = load_schema(snap)
    files = sorted(f for f in os.listdir(d) if f.endswith('.sql'))
    # ★ほかのファイルで作る表・ビューも「ある」として見る（当てる順番で 作られるため）
    #   2026-09-23: jury_slots（59で作る）を 61 で使ったら「表が無い」と誤って出した
    made_elsewhere = set()
    for f in files:
        t = open(os.path.join(d, f), encoding='utf-8').read()
        made_elsewhere |= set(re.findall(r'create\s+(?:or\s+replace\s+)?(?:table|view)\s+(?:if\s+not\s+exists\s+)?public\.(\w+)', t, re.I))
    rows = []
    for f in files:
        for r in check_file(os.path.join(d, f), cols, checks, made_elsewhere):
            rows.append((f,) + r)
    print('SQL_SCHEMA_CHECK', len(files), 'ファイル ／ 表', len(cols))
    for r in rows: print('  NG', r[0], '|', r[1], '|', r[2], ('| ' + r[3]) if r[3] else '')
    print('RESULT:', 'OK' if not rows else 'NG（%d件）' % len(rows))
    return 0 if not rows else 1

def selftest():
    import tempfile
    ok = True
    schema = "#complete\nt_a|id|name|org_id\nt_a|@status|active,paused\n"   # ★#complete があると A（表の有無）も見る
    good = "insert into public.t_a(id,name) values (1,'x');\nupdate public.t_a set name='y';\nselect * from public.t_a where status = 'active';"
    bad  = ("insert into public.t_a(id,note) values (1,'x');\n"          # 無い列
            "update public.t_a set missing_col='y';\n"                    # 無い列
            "select * from public.t_b;\n"                                 # 無い表
            "select * from public.t_a where status = 'enrolled';")        # 値が違う
    with tempfile.TemporaryDirectory() as td:
        sp = os.path.join(td, 'snap.txt'); open(sp, 'w').write(schema)
        cols, checks = load_schema(sp)
        fn_call = "select * from public.some_fn(1) q where q.x = 1;"   # ★関数は 表ではない
        alias_bad = "select k.name_at, en.grade from public.t_a k join public.t_a en on true;"
        for name, sqltext, want in (('good', good, 0), ('bad', bad, 4), ('alias', alias_bad, 2)):
            p = os.path.join(td, name + '.sql'); open(p, 'w', encoding='utf-8').write(sqltext)
            got = check_file(p, cols, checks)
            if len(got) != want:
                print('SELFTEST FAIL:', name, '期待', want, '実際', len(got), got); ok = False
        # ★同じファイルで作る表・列は 見ない
        p = os.path.join(td, 'made.sql')
        open(p, 'w', encoding='utf-8').write(
            "create table if not exists public.t_new(id uuid);\ninsert into public.t_new(id) values (gen_random_uuid());\n"
            "alter table public.t_a add column if not exists memo text;\nupdate public.t_a set memo='x';")
        if check_file(p, cols, checks):
            print('SELFTEST FAIL: 同じファイルで作ったものを NG にした', check_file(p, cols, checks)); ok = False
    print('SELFTEST', 'PASS' if ok else 'FAIL'); return 0 if ok else 1

if __name__ == '__main__':
    if '--selftest' in sys.argv: sys.exit(selftest())
    if len(sys.argv) < 3: print(__doc__); sys.exit(2)
    sys.exit(main(sys.argv[1], sys.argv[2]))
