#!/usr/bin/env python3
"""★守りの書き方の見張り（2026-09-23 Opus）

なぜ要るか（今日の実害）:
  ★見るのは delete／update でも動く引き金だけ（足すときだけの引き金は 詰まらない）
  G1 ★「書けなくする・消せなくする」引き金が、★退会・親の削除・保存期間の掃除まで 止めていた
     （org_contacts で学校を閉じられない／koen で退会が止まる・公演が消せない／講評の掃除が止まる
       ／lessons の身元の固定で退会が止まる＝★1日に4件）
  G2 ★ビューが 既定で「作った人の権限」で動き、RLS を素通りする（＋authenticated に読む権限が付く）
     → ★ログインした誰もが 全学校の予定を読めるところだった
  G3 ★「1件だけ選ぶ（limit 1）」が、★掛け持ちの人で どちらが出るか決まらない
  G4 ★security definer の関数に set search_path が無い
自己試験: python3 tools/sql_guard_lint.py --selftest
使い方:   python3 tools/sql_guard_lint.py sql
"""
import re, sys, os

ESCAPES = ('closing_org', 'closing_koen', 'app.retention', 'is not null', 'pg_trigger_depth')

def lint(sql, name=''):
    s = re.sub(r'--[^\n]*', '', sql)
    out = []

    # G1 「止める」引き金に、逃げ道の印があるか
    for m in re.finditer(r'create\s+or\s+replace\s+function\s+public\.(\w+)\s*\(\s*\)\s*returns\s+trigger([\s\S]*?)\$\$;', s, re.I):
        fn, body = m.group(1), m.group(2)
        raises = re.search(r'raise\s+exception', body, re.I)
        if not raises: continue
        # ★足すときだけ動く引き金は 詰まらない（退会・親の削除・掃除は 消す／変えるとき）
        #   2026-09-23: check_koen_tier（insert だけ）を 誤って NG にしていた
        ev = re.search(r'create\s+trigger\s+\w+\s+(before|after)\s+([\w\s]+?)\s+on\s+public\.\w+[\s\S]{0,200}?' + re.escape(fn), s, re.I)
        if ev and not re.search(r'delete|update', ev.group(2), re.I):
            continue
        if not any(e in body for e in ESCAPES):
            out.append((name, 'G1', fn, '止める引き金に ★逃げ道の印が無い（退会・親の削除・掃除で詰まる）'))

    # G2 ビュー
    for m in re.finditer(r'create\s+(?:or\s+replace\s+)?view\s+public\.(\w+)', s, re.I):
        v = m.group(1)
        if not re.search(r'alter\s+view\s+public\.' + v + r'\s+set\s*\(\s*security_invoker', s, re.I):
            out.append((name, 'G2', v, '★security_invoker=true が無い（RLS を素通りする）'))
        if not re.search(r'revoke\s+all\s+on\s+public\.' + v, s, re.I):
            out.append((name, 'G2', v, '★revoke が無い（authenticated に読む権限が既定で付く）'))

    # G3 limit 1 で 学校や人を選ぶ
    for m in re.finditer(r'select\s+[\w\.]*org_id[\s\S]{0,200}?limit\s+1', s, re.I):
        out.append((name, 'G3', '', '★org_id を limit 1 で選んでいる（掛け持ちの人で 決まらない）'))

    # G4 definer に search_path
    for m in re.finditer(r'create\s+or\s+replace\s+function\s+public\.(\w+)([\s\S]{0,400}?)\$\$', s, re.I):
        fn, head = m.group(1), m.group(2)
        if re.search(r'security\s+definer', head, re.I) and not re.search(r'set\s+search_path', head, re.I):
            out.append((name, 'G4', fn, '★security definer なのに set search_path が無い'))
    return out

def main(d):
    files = sorted(f for f in os.listdir(d) if f.endswith('.sql'))
    rows = []
    for f in files:
        rows += lint(open(os.path.join(d, f), encoding='utf-8').read(), f)
    print('SQL_GUARD_LINT', len(files), 'ファイル')
    for r in rows: print('  NG', r[0], '|', r[1], '|', r[2], '|', r[3])
    print('RESULT:', 'OK' if not rows else 'NG（%d件）' % len(rows))
    return 0 if not rows else 1

def selftest():
    ok = True
    bad_trg = ("create or replace function public.f() returns trigger language plpgsql as $$ "
               "begin if old.x is not null then raise exception 'NO'; end if; return old; end $$;")
    # ★is not null が本文にあるので ESCAPES に当たってしまう形 → 別の書き方で試す
    bad_trg = ("create or replace function public.f() returns trigger language plpgsql as $$ "
               "begin if old.confirmed_at > now() then raise exception 'NO'; end if; return old; end $$;")
    good_trg = ("create or replace function public.g() returns trigger language plpgsql as $$ "
                "begin if coalesce(current_setting('app.retention',true),'')='on' then return old; end if; "
                "if old.confirmed_at > now() then raise exception 'NO'; end if; return old; end $$;")
    bad_view = "create or replace view public.v as select 1;"
    good_view = ("create or replace view public.v as select 1;\n"
                 "alter view public.v set (security_invoker = true);\nrevoke all on public.v from anon, authenticated;")
    bad_limit = "select m.org_id into v_org from public.memberships m where m.user_id = auth.uid() limit 1;"
    bad_def = "create or replace function public.h(p uuid) returns int language sql security definer as $$ select 1 $$;"
    ins_only = (bad_trg.replace('public.f()','public.ins()') +
                "\ncreate trigger t_ins before insert on public.x for each row execute function public.ins();")
    for name, sqltext, code, want in (('G1bad', bad_trg,'G1',1), ('G1good', good_trg,'G1',0),
                                      ('G1insonly', ins_only,'G1',0),
                                      ('G2bad', bad_view,'G2',2), ('G2good', good_view,'G2',0),
                                      ('G3bad', bad_limit,'G3',1), ('G4bad', bad_def,'G4',1)):
        got = [r for r in lint(sqltext, name) if r[1] == code]
        if len(got) != want:
            print('SELFTEST FAIL:', name, '期待', want, '実際', len(got), got); ok = False
    print('SELFTEST', 'PASS' if ok else 'FAIL'); return 0 if ok else 1

if __name__ == '__main__':
    if '--selftest' in sys.argv: sys.exit(selftest())
    if len(sys.argv) < 2: print(__doc__); sys.exit(2)
    sys.exit(main(sys.argv[1]))
