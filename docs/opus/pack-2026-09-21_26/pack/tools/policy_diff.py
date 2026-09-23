#!/usr/bin/env python3
"""RLS の変更の影響の洗い出し（作成 Opus／実行 Code）。★「模擬」ではなく「差分と、誰に効くか」の一覧。
本当に閉じすぎていないかの証明は、これまでどおり実在の試しの利用者での試験（tools/権限変更の型.md）。
入力:
  前後の pg_policies（select schemaname,tablename,policyname,cmd,roles,qual,with_check from pg_policies の JSON）
  役職の一覧（select name, perms from org_posts の JSON。perms は {"meibo":true,…}）  ← 任意
  画面と表の対応（tools/screen_tables.json: {"名簿":["memberships","profiles"],…}） ← 任意。Code が育てる
  python3 tools/policy_diff.py before.json after.json [--posts posts.json] [--screens tools/screen_tables.json]
出すもの:
  - 変わったポリシー（表・操作・名前）と、qual／with_check の has_can の札の増減・auth.uid() の枝の増減
  - その札を持つ役職（増えた札＝読める・書ける役職が増える／減った札＝減る）
  - その表を使う画面
  - 危ない形: USING(true)／insert・update で with_check が無い／{public} に対して auth.uid() の縛りが無い"""
import json, re, sys, os
HERE=os.path.dirname(os.path.abspath(__file__))
def key(p): return (p['tablename'],p['cmd'],p['policyname'])
def cans(s): return set(re.findall(r"has_can\([^,]+,\s*'(\w+)'\)",s or ''))
def uid(s): return 'auth.uid()' in (s or '')
def risky(p):
    r=[]; q=(p.get('qual') or '').strip().lower(); w=(p.get('with_check') or '').strip()
    if q in ('true','(true)'): r.append('USING(true)')
    if p['cmd'] in ('INSERT','UPDATE','ALL') and not w and p['cmd']!='UPDATE' or (p['cmd']=='UPDATE' and not w): r.append('with_check が無い')
    roles=p.get('roles') or []
    if ('public' in str(roles)) and not uid(p.get('qual')) and not uid(p.get('with_check')) and not cans(p.get('qual')): r.append('{public} に縛りが無い')
    return r
def diff(B,A,posts=None,screens=None):
    b={key(p):p for p in B}; a={key(p):p for p in A}; out=[]
    posts=posts or []; screens=screens or {}
    def who(cs): return sorted({x['name'] for x in posts for c in cs if (x.get('perms') or {}).get(c)})
    def scr(t): return sorted([s for s,ts in screens.items() if t in ts])
    for k in sorted(set(a)|set(b)):
        pb,pa=b.get(k),a.get(k)
        if pb and pa and (pb.get('qual'),pb.get('with_check'),str(pb.get('roles')))==(pa.get('qual'),pa.get('with_check'),str(pa.get('roles'))): continue
        kind='追加' if not pb else '削除' if not pa else '変更'
        cb=cans((pb or {}).get('qual'))|cans((pb or {}).get('with_check')); ca=cans((pa or {}).get('qual'))|cans((pa or {}).get('with_check'))
        row={'表':k[0],'操作':k[1],'ポリシー':k[2],'種類':kind,'札+':sorted(ca-cb),'札-':sorted(cb-ca),
             '本人の枝':('+' if pa and uid(pa.get('qual')) and not (pb and uid(pb.get('qual'))) else '-' if pb and uid(pb.get('qual')) and not (pa and uid(pa.get('qual'))) else '='),
             '増える役職':who(ca-cb),'減る役職':who(cb-ca),'画面':scr(k[0]),'危ない形':risky(pa) if pa else []}
        out.append(row)
    return out
def main(a):
    B=json.load(open(a[0],encoding='utf-8')); A=json.load(open(a[1],encoding='utf-8'))
    posts=json.load(open(a[a.index('--posts')+1],encoding='utf-8')) if '--posts' in a else None
    sp=a[a.index('--screens')+1] if '--screens' in a else os.path.join(HERE,'screen_tables.json')
    screens=json.load(open(sp,encoding='utf-8')) if os.path.exists(sp) else None
    rows=diff(B,A,posts,screens)
    print(f'POLICY_DIFF 変わったポリシー {len(rows)}件')
    for r in rows:
        print(f"  {r['種類']} {r['表']}.{r['操作']} {r['ポリシー']} 札+{r['札+']} 札-{r['札-']} 本人の枝{r['本人の枝']}")
        if r['減る役職']: print('     読めなく／書けなくなる役職:',', '.join(r['減る役職']))
        if r['増える役職']: print('     読める／書けるようになる役職:',', '.join(r['増える役職']))
        if r['画面']: print('     この表を使う画面:',', '.join(r['画面']))
        if r['危ない形']: print('     ★危ない形:',', '.join(r['危ない形']))
    print('  ★これは洗い出し。閉じすぎ・開けすぎの証明は、減る役職・増える役職ごとに実在の試しの利用者で試験（較正の両側）')
    return 1 if any(r['危ない形'] for r in rows) else 0
def selftest():
    ok=True
    B=[{'tablename':'org_messages','cmd':'SELECT','policyname':'p','roles':['authenticated'],'qual':"has_can(org_id,'renraku_all') OR has_can(org_id,'monka_read') OR (auth.uid() = author)",'with_check':None}]
    A=[{'tablename':'org_messages','cmd':'SELECT','policyname':'p','roles':['authenticated'],'qual':"has_can(org_id,'renraku_all') OR (auth.uid() = author)",'with_check':None},
       {'tablename':'x','cmd':'INSERT','policyname':'bad','roles':['public'],'qual':'true','with_check':None}]
    posts=[{'name':'事務長','perms':{'monka_read':True}},{'name':'学長','perms':{'renraku_all':True}}]
    rows=diff(B,A,posts,{'連絡':['org_messages']})
    r0=[r for r in rows if r['表']=='org_messages'][0]; r1=[r for r in rows if r['表']=='x'][0]
    if r0['札-']!=['monka_read'] or r0['減る役職']!=['事務長'] or r0['画面']!=['連絡'] or r0['本人の枝']!='=': print('SELFTEST FAIL: 差分',r0); ok=False
    if 'USING(true)' not in r1['危ない形'] or 'with_check が無い' not in r1['危ない形']: print('SELFTEST FAIL: 危ない形',r1['危ない形']); ok=False
    print('SELFTEST','PASS' if ok else 'FAIL'); return 0 if ok else 2
if __name__=='__main__':
    a=sys.argv[1:]
    if '--selftest' in a: sys.exit(selftest())
    if len(a)<2: print(__doc__); sys.exit(2)
    sys.exit(main(a))
