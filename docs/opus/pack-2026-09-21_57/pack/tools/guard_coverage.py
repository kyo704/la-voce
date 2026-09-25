#!/usr/bin/env python3
"""★今日（2026-09-23）出た9件の誤りを、★いまの道具が 何件 捕まえるかを 測る

なぜ: ★「道具がある」と「効いている」は 別。★実際の誤りで 測る。
使い方: python3 tools/guard_coverage.py [schema_snapshot.txt]
"""
import sys, os, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
FIX  = os.path.join(HERE, 'fixtures')
CASES = [
 ('E1', '無い列に書く（org_billing_log.note）',        'schema'),
 ('E2', '別名の列が無い（k.name_at）',                  'schema'),
 ('E3', '値が CHECK に無い（status=enrolled）',         'schema'),
 ('E4', '★繋ぐ先の表を間違えた（org_periods）',         None),
 ('E5', '★時差の向きが逆（9時間ずれ・0件を返す）',      None),
 ('E6', '消せなくする引き金に 逃げ道が無い',            'guard'),
 ('E7', 'ビューが RLS を素通りする',                    'guard'),
 ('E8', 'org_id を limit 1 で選ぶ',                     'guard'),
 ('E9', 'definer に search_path が無い／anon に渡す',   'guard+closed'),
]

def load(name, path):
    sp = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m

def main(snap=None):
    guard  = load('g',  os.path.join(HERE, 'sql_guard_lint.py'))
    closed = load('c',  os.path.join(HERE, 'fail_closed_lint.py'))
    schema = load('s',  os.path.join(HERE, 'sql_schema_check.py'))
    cols = checks = None
    if snap and os.path.exists(snap): cols, checks = schema.load_schema(snap)
    caught = 0
    print('GUARD_COVERAGE ── 2026-09-23 に出た9件で 測る')
    for code, name, expect in CASES:
        p = os.path.join(FIX, [f for f in os.listdir(FIX) if f.startswith(code)][0])
        sql = open(p, encoding='utf-8').read()
        hits = []
        if guard.lint(sql, code): hits.append('guard')
        if closed.lint(sql):      hits.append('closed')
        if cols is not None and schema.check_file(p, cols, checks): hits.append('schema')
        ok = bool(hits)
        if ok: caught += 1
        print('  %s %-38s %s' % ('◯' if ok else '✕', name, '／'.join(hits) if hits else '★どの道具も 捕まえられない'))
    print('RESULT: %d / %d 件（★残りは 動かさないと 分かりません）' % (caught, len(CASES)))
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else None))
