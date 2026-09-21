#!/usr/bin/env python3
"""台帳の目録の検査と比べ（作成・実行 Opus。Supabase に読み取りだけで直接つなぐ）。
手順:
  1 tools/ledger_inventory.sql を本番・試しで流し、出力の JSON を
    tools/ledger_snapshots/<日付>_prod.json ／ <日付>_test.json に保存
  2 python3 tools/ledger_inventory.py audit <snapshot>            ← 1枚の中の危ない形
    python3 tools/ledger_inventory.py drift <前の prod> <今の prod> ← 前回から変わったのに、移行が増えていない＝記録漏れ
    python3 tools/ledger_inventory.py twin  <prod> <test>          ← 本番と試しのずれ（証明の土台）
    python3 tools/ledger_inventory.py --selftest
いつ: 大きな権限変更・裁定の実装のたびに、Code の報告を待たずに（Opus が独立に）
★読むのは目録（関数の要約・ポリシー・権限・外部キー・移行の名前）だけ。利用者の中身は読まない
監査の決まり（audit）:
  A1 *_log に anon／authenticated の UPDATE・DELETE・TRUNCATE（消せないの約束）
  A2 *_log に利用者が直接 insert できるポリシー（関数・引き金を通らずに書ける）
  A3 *_log の人への外部キーが ON DELETE CASCADE（退会で記録が消える）※本人だけの記録（email_change_log）は除く
  A4 security definer で anon が実行できる関数（許可リスト以外）
  A5 本番の移行の名前に seed／test／demo／screenshot／furniture（本番に試しのデータ）
  A6 TRUNCATE を持つ表（REST からは出せないが、権限でも閉じる）"""
import json, sys, os, re
HERE=os.path.dirname(os.path.abspath(__file__))
OWN_ONLY_LOGS={'email_change_log'}                 # 本人の操作の記録。退会で消えてよい
ANON_OK={'accept_guardian_consent(p_token text)'}   # 保護者はログインしない（合言葉で）
def load(p): return json.load(open(p,encoding='utf-8'))
def audit(S,env='prod'):
    out=[]
    for t,g in (S.get('grants') or {}).items():
        if t.endswith('_log'):
            for x in ('UPDATE','DELETE','TRUNCATE'):
                if ':'+x in g: out.append(('A1',t,f'{x} を持っている（{g}）'))
        if ':TRUNCATE' in g and not t.endswith('_log'): out.append(('A6',t,'TRUNCATE を持っている'))
    for k,v in (S.get('log_policies') or {}).items():
        if v.startswith('INSERT'): out.append(('A2',k,'利用者が直接 insert できる（関数・引き金を通すべき）'))
    for k,v in (S.get('log_fks') or {}).items():
        tbl=k.split('_fkey')[0]
        if 'auth.users' in v and 'ON DELETE CASCADE' in v and not any(tbl.startswith(o) for o in OWN_ONLY_LOGS):
            out.append(('A3',k,'退会で記録が消える（ON DELETE CASCADE）'))
    for k,v in (S.get('functions') or {}).items():
        if v.get('sd') and v.get('anon') and k not in ANON_OK: out.append(('A4',k,'security definer を anon が実行できる'))
    if env=='prod':
        for m in S.get('migrations') or []:
            if re.search(r'seed|test|demo|screenshot|furniture|shot',m,re.I): out.append(('A5',m,'本番の移行に試しのデータの名前'))
    return out
def drift(A,B):
    """前回（A）から今回（B）で目録が変わったのに、移行が1本も増えていなければ「記録漏れ」"""
    ch=[]
    for sec in ('functions','log_policies','grants','log_fks','triggers'):
        a,b=A.get(sec) or {},B.get(sec) or {}
        for k in sorted(set(a)|set(b)):
            if a.get(k)!=b.get(k): ch.append((sec,k,'追加' if k not in a else '削除' if k not in b else '変更'))
    newm=[m for m in (B.get('migrations') or []) if m not in (A.get('migrations') or [])]
    return ch,newm
def twin(P,T):
    d=[]
    for sec in ('functions',):
        p,t=P.get(sec) or {},T.get(sec) or {}
        for k in sorted(set(p)|set(t)):
            if k not in t: d.append((sec,k,'本番にだけある'))
            elif k not in p: d.append((sec,k,'試しにだけある'))
            else:
                if p[k].get('h')!=t[k].get('h'): d.append((sec,k,'中身が違う'))
                if p[k].get('anon')!=t[k].get('anon'): d.append((sec,k,f"anon の実行 本番={p[k].get('anon')} 試し={t[k].get('anon')}"))
    return d
def main(a):
    if a[0]=='audit':
        S=load(a[1]); env='test' if 'test' in os.path.basename(a[1]) else 'prod'; rows=audit(S,env)
        print(f'LEDGER_AUDIT {os.path.basename(a[1])}: {len(rows)}件')
        for r in rows: print('  ',' | '.join(r))
        return 0 if not rows else 1
    if a[0]=='drift':
        ch,newm=drift(load(a[1]),load(a[2]))
        print(f'LEDGER_DRIFT 変わった {len(ch)}件・増えた移行 {len(newm)}本')
        for c in ch: print('  ',' | '.join(c))
        for m in newm: print('   移行 +',m)
        if ch and not newm: print('  ★記録漏れ: 台帳が変わったのに、移行が1本も増えていない（直接 SQL で当てた疑い）'); return 1
        return 0
    if a[0]=='twin':
        d=twin(load(a[1]),load(a[2])); print(f'LEDGER_TWIN 本番と試しのずれ {len(d)}件')
        for r in d: print('  ',' | '.join(r))
        return 0 if not d else 1
    print(__doc__); return 2
def selftest():
    ok=True
    S={'grants':{'x_log':'a:SELECT,a:TRUNCATE','drafts':'a:TRUNCATE'},'log_policies':{'x_log.ins':'INSERT|{authenticated}'},
       'log_fks':{'x_log_user_id_fkey':'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE',
                  'email_change_log_user_id_fkey':'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE'},
       'functions':{'f()':{'h':'1','sd':True,'anon':True},'accept_guardian_consent(p_token text)':{'h':'2','sd':True,'anon':True}},
       'migrations':['20260101_seed_demo','20260102_real']}
    got={r[0] for r in audit(S)}
    for c in ('A1','A2','A3','A4','A5','A6'):
        if c not in got: print('SELFTEST FAIL: 見つけられない',c); ok=False
    if any('email_change_log' in r[1] for r in audit(S)): print('SELFTEST FAIL: 本人だけの記録まで拾った'); ok=False
    if any('accept_guardian_consent' in r[1] for r in audit(S)): print('SELFTEST FAIL: 許可リストの関数を拾った'); ok=False
    A={'functions':{'f()':{'h':'1'}},'migrations':['m1']}; B={'functions':{'f()':{'h':'2'}},'migrations':['m1']}
    ch,newm=drift(A,B)
    if not ch or newm: print('SELFTEST FAIL: 記録漏れの型'); ok=False
    if twin({'functions':{'f()':{'h':'1','anon':False}}},{'functions':{'f()':{'h':'2','anon':True}}}).__len__()!=2: print('SELFTEST FAIL: 本番と試しのずれ'); ok=False
    print('SELFTEST','PASS' if ok else 'FAIL'); return 0 if ok else 2
if __name__=='__main__':
    a=sys.argv[1:]
    if '--selftest' in a: sys.exit(selftest())
    if not a: print(__doc__); sys.exit(2)
    sys.exit(main(a))
