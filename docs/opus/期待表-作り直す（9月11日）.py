import json,re
src=open('/home/claude/proto/動く見本-PC.html',encoding='utf-8').read()
blk=src[src.index('var POSTS=['):]
blk=blk[:blk.index('];')+2]
rows=re.findall(r"\{n:'([^']+)',base:'([^']+)',p:\{([^}]*)\}\}",blk)
POSTS=[]
for n,base,p in rows:
    d={}
    for kv in p.split(','):
        if not kv.strip():continue
        k,v=kv.split(':');d[k.strip()]=int(v)
    POSTS.append((n,base,d))
def can(d,k): return d.get(k,0)==1
WHAT=['名簿','役職と 所属','レッスンの 日程','レッスンの 出席','行事']
def expCan(d,w):
    if w=='名簿': return can(d,'meibo')
    if w=='役職と 所属': return can(d,'post') or can(d,'master')
    if w=='レッスンの 日程': return can(d,'sched_all') or can(d,'sched_mine')
    if w=='レッスンの 出席': return can(d,'shukketsu') and (can(d,'sched_all') or can(d,'meibo'))
    if w=='行事': return can(d,'gyoji')
    return False
out={"版":"2026-09-11","出どころ":"作業指示-権限の事故を直し、記録を残す（9月11日）§2-1・§3",
     "規則":{"名簿":"meibo","役職と 所属":"post OR master","レッスンの 日程":"sched_all OR sched_mine",
             "レッスンの 出席":"shukketsu AND (sched_all OR meibo)","行事":"gyoji",
             "読み込み":"meibo AND master","既定":"知らない表は false"},
     "期待":{}}
hdr=['名簿','役職と 所属','レッスンの 日程','レッスンの 出席','行事','読み込み']
print('| 役職 | 名簿 | 役職と所属 | 日程 | 出席 | 行事 | 読み込み |')
print('|---|---|---|---|---|---|---|')
for n,base,d in POSTS:
    r={w:bool(expCan(d,w)) for w in WHAT}
    r['読み込み']=bool(can(d,'meibo') and can(d,'master'))
    out['期待'][n]={'base':base,'書き出し':{w:r[w] for w in WHAT},'読み込み':r['読み込み']}
    print('| '+n+' | '+' | '.join('◯' if r[h] else '✕' for h in hdr)+' |')
json.dump(out,open('/home/claude/design/期待表-権限の総当たり（9月11日）.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
n_t=sum(1 for _ in POSTS)*5
print('\n書き出し',n_t,'通り ＋ 読み込み',len(POSTS),'通り ＝',n_t+len(POSTS))
