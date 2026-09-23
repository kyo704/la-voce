#!/usr/bin/env python3
"""権限変更の DECISION_NEEDED を、出す前に確かめる（作成 Opus／実行 Code）。型は tools/権限変更の型.md
  python3 tools/decision_needed_check.py 報告.md   ／  --selftest
確かめること:
  - 見出しが全部ある（無いなら「該当なし」と理由）
  - SQL全文と戻すSQL が ```sql の塊で書かれている（ファイル名だけではない）
  - 試験に「0行」の期待と「1行以上」の期待が両方ある（較正）
  - なりすましの語（set role／set_config／request.jwt.claims／ROLLBACK での試験）が試験の節に無い
  - USING(true) が SQL に無い
終了コード: 0＝出してよい ／ 1＝足りない ／ 2＝道具の不具合"""
import re, sys
HEADS=['何を変えるか','SQL全文','戻すSQL','変える前のポリシー','変えた後のポリシー','USINGとWITH CHECK','試験','なりすまし','fail closed','本番の影響','承認']
def sections(t):
    parts=re.split(r'^##\s+',t,flags=re.M); d={}
    for p in parts[1:]:
        h,_,body=p.partition('\n'); d[h.strip()]=body
    return d
def check(t):
    d=sections(t); bad=[]
    if 'DECISION_NEEDED' not in d: bad.append('見出し「DECISION_NEEDED」が無い')
    for h in HEADS:
        if h not in d: bad.append(f'見出し「{h}」が無い')
        elif h!='承認' and not d[h].strip(): bad.append(f'「{h}」が空（該当なしなら理由を書く）')
    for h in ['SQL全文','戻すSQL']:
        if h in d and not re.search(r'```sql\s+\S[\s\S]*?```',d[h]) and '該当なし' not in d[h]: bad.append(f'「{h}」に ```sql の塊が無い（ファイル名だけでは足りない）')
    if 'SQL全文' in d and re.search(r'using\s*\(\s*true\s*\)',d['SQL全文'],re.I): bad.append('SQL に USING(true) がある')
    if '試験' in d:
        ts=d['試験']
        if not re.search(r'(期待|expect)[^\n]*\b0\s*行|0\s*行[^\n]*(期待|expect)|→\s*0\s*行',ts,re.I): bad.append('試験に「0行」の期待（読めないはずの人）が無い')
        if not re.search(r'(期待|expect)[^\n]*([1-9]\d*|1以上)\s*行|([1-9]\d*|1以上)\s*行[^\n]*(期待|expect)|→\s*([1-9]\d*|1以上)\s*行',ts,re.I): bad.append('試験に「1行以上」の期待（読めるはずの人）が無い')
        if re.search(r'set\s+(local\s+)?role|set_config|request\.jwt\.claims|rollback',ts,re.I): bad.append('試験になりすまし（set role／set_config／jwt.claims／ROLLBACK）がある ── 決まり3で禁止')
    if 'なりすまし' in d and not re.search(r'使っていない|使わない|なし',d['なりすまし']): bad.append('「なりすまし」の節に「使っていない」が無い')
    return bad
def main(p):
    t=open(p,encoding='utf-8').read(); bad=check(t)
    print('DECISION_NEEDED_CHECK',p)
    for b in bad: print('  NG',b)
    print('RESULT:', 'PASS（坂本さんに出してよい）' if not bad else f'NG（{len(bad)}件）'); return 0 if not bad else 1
GOOD='''## DECISION_NEEDED
## 何を変えるか
裁定159 S2
## SQL全文
```sql
create policy p on t for select to authenticated using (has_can(org_id,'x')) ;
```
## 戻すSQL
```sql
drop policy p on t;
```
## 変える前のポリシー
（無し）
## 変えた後のポリシー
p: using has_can
## USINGとWITH CHECK
select のみ。using あり
## 試験
試しの先生A: 自分の門下 → 期待 3行 → 結果 3行
試しの事務B: 他人の門下 → 期待 0行 → 結果 0行
## なりすまし
使っていない（実在の試しの利用者）
## fail closed
記録の insert を失敗させると返らない → 0行
## 本番の影響
権限を持つ人 0名
## 承認
'''
def selftest():
    ok=True
    if check(GOOD): print('SELFTEST FAIL: 正しい報告で NG',check(GOOD)); ok=False
    bad1=GOOD.replace('試しの事務B: 他人の門下 → 期待 0行 → 結果 0行\n','')
    if not any('0行' in b for b in check(bad1)): print('SELFTEST FAIL: 較正（0行）の抜けを見つけられない'); ok=False
    bad2=GOOD.replace('試しの先生A','set local role authenticated; 試しの先生A')
    if not any('なりすまし' in b for b in check(bad2)): print('SELFTEST FAIL: なりすましを見つけられない'); ok=False
    bad3=re.sub(r'## 戻すSQL\n```sql\n.*?```\n','## 戻すSQL\nrevert.sql を見る\n',GOOD,flags=re.S)
    if not any('戻すSQL' in b for b in check(bad3)): print('SELFTEST FAIL: SQL の中身の抜けを見つけられない'); ok=False
    bad4=GOOD.replace("using (has_can(org_id,'x'))","using (true)")
    if not any('USING(true)' in b for b in check(bad4)): print('SELFTEST FAIL: USING(true) を見つけられない'); ok=False
    print('SELFTEST','PASS' if ok else 'FAIL'); return 0 if ok else 2
if __name__=='__main__':
    a=sys.argv[1:]
    if '--selftest' in a: sys.exit(selftest())
    if not a: print(__doc__); sys.exit(2)
    sys.exit(main(a[0]))
