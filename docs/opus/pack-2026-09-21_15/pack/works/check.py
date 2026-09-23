#!/usr/bin/env python3
"""作品データ（香盤表の元）の機械の確認。作成 Opus。
  python3 works/check.py            → すべての .json を見る
見るもの:
  ① 場面に書いた役名が、役の一覧にあるか
  ② 役の一覧にあるのに、1度も出番が無い役がいないか
  ③ 日本語が1文字も無い題名（原語だけの題名）が混ざっていないか
  ④ 編成（instruments）があるか（オペラ・合唱つきの大曲は弦も要る）
  ⑤ 必ず要る項目（題・作曲家・種類・出どころ・source_id）が揃っているか
  ⑥ 同じ source_id が2つ無いか
"""
import json,glob,re,sys,os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
def has_jp(t): return bool(re.search(r'[ぁ-んァ-ン一-龥]', t))
KIND={'opera','chorus','drama','orchestra','gala','chamber','band','dance','other'}
SEC={'woodwind','brass','percussion','keyboard','harp','strings','banda','continuo','other'}
bad=[]; ids={}; tot=0
for f in sorted(glob.glob('*.json')):
    d=json.load(open(f,encoding='utf-8'))
    roles={r['label'] for r in d.get('roles',[])}
    for x in d.get('scenes',[]):
        for r in x.get('roles',[]):
            if r not in roles: bad.append((f,'①一覧に無い役',x['label'],r))
    for r in roles:
        if not any(r in x.get('roles',[]) for x in d.get('scenes',[])): bad.append((f,'②出番の無い役',r,''))
    for x in d.get('scenes',[]):
        if not has_jp(x['label']): bad.append((f,'③日本語の無い題名',x['label'],''))
    ins=d.get('instruments',[])
    if not ins: bad.append((f,'④編成が無い','',''))
    else:
        # ★弦を使わない編成（木管五重奏・金管アンサンブルなど）があるので、弦の有無は見ない
        if d.get('kind') in ('opera','chorus') and 'strings' not in {i.get('section') for i in ins}:
            bad.append((f,'④弦が無い（オペラ・合唱つきの大曲では要る）','',''))
        for i in ins:
            if i.get('section') not in SEC: bad.append((f,'④種類の誤り',i.get('part',''),str(i.get('section'))))
    for k in ('title','composer','kind','source','source_id'):
        if not d.get(k): bad.append((f,'⑤項目が無い',k,''))
    if d.get('kind') not in KIND: bad.append((f,'⑤種類の誤り',str(d.get('kind')),''))
    sid=d.get('source_id')
    if sid in ids: bad.append((f,'⑥source_id の重複',sid,ids[sid]))
    ids[sid]=f
    tot+=len(d.get('scenes',[]))
print('WORKS_CHECK 作品 %d ／ 場面 %d'%(len(ids),tot))
for b in bad: print('  ',' | '.join(b))
print('RESULT:', 'OK' if not bad else 'NG（%d件）'%len(bad))
sys.exit(0 if not bad else 1)
