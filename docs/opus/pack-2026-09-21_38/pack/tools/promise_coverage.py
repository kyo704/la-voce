#!/usr/bin/env python3
"""約束の台帳 × 試験のつき合わせ（作成 Opus／実行 Code）。
★文の意味で自動照合はしない（当て推量になる）。かわりに「約束の番号を試験に書く」決まりで照合する:
  試験のファイルの中に  @promise P-0123  と書く（1つの試験に複数可）
  python3 tools/promise_coverage.py 台帳.json 試験のフォルダ   → 覆われている／覆われていない
  python3 tools/promise_coverage.py 台帳.json --skeleton P-0123 → その約束の試験のひな形（種類で型を選ぶ）
  python3 tools/promise_coverage.py --from-snapshot design-v20 > 台帳の叩き台.json（番号を振る）
台帳.json の形: [{"id":"P-0001","text":"…","kind":"する|しない","screens":[…]}]（Sonnet の484件をこの形に）
ひな形の型（文の言葉から選ぶ。選べないときは「手で書く」）:
  記録に残る／残ります → 行が1つ増える（前後の件数）
  消せない／消せません → update・delete が拒否される
  見えない／見られません・出ません → その役の試しの利用者で0行／画面に文字が無い
  伝わる／届く        → 相手の画面・台帳に出る
  送らない／知らせない → 知らせの表・送信の記録が増えない
★試しは実在の試しの利用者で（なりすましは使わない。ask_ledger.py 決まり3）"""
import json, os, re, sys, hashlib
HERE=os.path.dirname(os.path.abspath(__file__))
TYPES=[(r'記録に\s*残|残ります|残る','LOG_ROW'),(r'消せ(ない|ません)','IMMUTABLE'),(r'見え(ない|ません)|見られ(ない|ません)|出(ない|ません)|たどりつけ','INVISIBLE'),
       (r'伝わ(る|ります)|届(く|きます)','DELIVERED'),(r'送(らない|りません)|知らせ(ない|ません)|催促','NOT_SENT')]
SK={'LOG_ROW':"""// @promise {id}  {text}
// 型: 記録に残る。試しの利用者 {{who}} で操作し、記録の表の行が1つ増えることを確かめる
const before = await countRows('{{log_table}}', {{filter}});
await asUser('{{who}}').do('{{action}}');
expect(await countRows('{{log_table}}', {{filter}})).toBe(before + 1);""",
'IMMUTABLE':"""-- @promise {id}  {text}
-- 型: 消せない。試しの利用者（その表を読める役）で update・delete を試み、拒否されることを確かめる（test の環境）
-- 期待: update → 0行 または 権限エラー／delete → 0行 または 権限エラー""",
'INVISIBLE':"""// @promise {id}  {text}
// 型: 見えない。見えてはいけない役の試しの利用者で、台帳（select）と画面の両方を確かめる
expect(await asUser('{{who_not}}').select('{{table}}', {{filter}})).toHaveLength(0);   // 台帳
await asUser('{{who_not}}').open('{{screen}}'); expect(await page.textContent('body')).not.toContain('{{secret}}');   // 画面
// 較正: 見えてよい役 {{who_ok}} では1行以上""",
'DELIVERED':"""// @promise {id}  {text}
// 型: 伝わる。送る側 {{from}} が操作し、受ける側 {{to}} の画面か台帳に出ることを確かめる""",
'NOT_SENT':"""// @promise {id}  {text}
// 型: 送らない。操作の前後で、知らせ・送信の記録（{{notice_table}}）が増えないことを確かめる"""}
def typ(t):
    for pat,k in TYPES:
        if re.search(pat,t): return k
    return None
def coverage(ledger,tests_dir):
    ids={p['id'] for p in ledger}; cov={}
    for root,_,fs in os.walk(tests_dir):
        for f in fs:
            try: t=open(os.path.join(root,f),encoding='utf-8',errors='ignore').read()
            except Exception: continue
            for pid in re.findall(r'@promise\s+(P-\d{4})',t): cov.setdefault(pid,[]).append(os.path.relpath(os.path.join(root,f),tests_dir))
    un=[p for p in ledger if p['id'] not in cov]; ghost=sorted(set(cov)-ids)
    return cov,un,ghost
def from_snapshot(ver):
    d=json.load(open(os.path.join(HERE,'promises',ver+'.json'),encoding='utf-8'))['rows']
    out=[{'id':'P-%04d'%(i+1),'text':r['text'],'kind':r['kind'],'screens':r['screens'],'file':r['file'],'type':typ(r['text'])} for i,r in enumerate(d)]
    print(json.dumps(out,ensure_ascii=False,indent=1))
def main(a):
    if a[0]=='--from-snapshot': from_snapshot(a[1]); return 0
    ledger=json.load(open(a[0],encoding='utf-8'))
    if '--skeleton' in a:
        pid=a[a.index('--skeleton')+1]; p=next((x for x in ledger if x['id']==pid),None)
        if not p: print('NO_SUCH_ID'); return 2
        k=p.get('type') or typ(p['text'])
        print(SK[k].format(id=pid,text=p['text']) if k else f'// @promise {pid}  {p["text"]}\n// 型を選べない。手で書く'); return 0
    cov,un,ghost=coverage(ledger,a[1])
    doing=[p for p in un if p.get('kind')=='する']
    print(f'PROMISE_COVERAGE 覆われている {len(ledger)-len(un)}／{len(ledger)}　覆われていない「する」{len(doing)}件')
    for p in doing[:60]: print(f'  未 {p["id"]} [{p.get("type") or typ(p["text"]) or "手"}] {p["text"][:70]}')
    for g in ghost: print(f'  ？ 台帳に無い番号を試験が指している: {g}')
    return 0 if not un else 1
def selftest():
    import tempfile; ok=True
    L=[{'id':'P-0001','text':'見ると 記録に 残ります','kind':'する'},{'id':'P-0002','text':'先生には 見えません','kind':'しない'}]
    d=tempfile.mkdtemp(); open(os.path.join(d,'a.spec.ts'),'w').write('// @promise P-0001\n// @promise P-0099\n')
    cov,un,ghost=coverage(L,d)
    if [p['id'] for p in un]!=['P-0002'] or ghost!=['P-0099']: print('SELFTEST FAIL: 照合',un,ghost); ok=False
    if typ('見ると 記録に 残ります')!='LOG_ROW' or typ('消せません')!='IMMUTABLE' or typ('先生には 見えません')!='INVISIBLE' or typ('天気が よい')!=None: print('SELFTEST FAIL: 型の選び方'); ok=False
    print('SELFTEST','PASS' if ok else 'FAIL'); return 0 if ok else 2
if __name__=='__main__':
    a=sys.argv[1:]
    if '--selftest' in a: sys.exit(selftest())
    if not a: print(__doc__); sys.exit(2)
    sys.exit(main(a))
