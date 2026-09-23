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
  ⑦ 上演時間の目安が 変な値でないか（1〜400分）／別名が題名と同じでないか
  ⑧ 日本の古典（能・狂言・歌舞伎・文楽）に 流派（school）が入っているか
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
    acap0 = '無伴奏' in (d.get('note') or '')
    if not ins and d.get('kind') not in ('drama','dance') and not acap0:
        bad.append((f,'④編成が無い','',''))   # ★演劇・舞踊と ★無伴奏の曲は 編成が無くてよい
    elif ins:
        # ★弦を使わない編成（木管五重奏・金管アンサンブルなど）があるので、弦の有無は見ない
        # ★オルガンだけ・通奏低音だけの宗教曲があるので、弦が無いこと自体は誤りにしない。
        #   ただし 管弦楽つきの作品で弦が抜けていると気づけないので、★鍵盤も通奏低音も無いときだけ指摘する
        secs={i.get('section') for i in ins}
        # ★弦なし・鍵盤なしの編成は実在する（ブルックナーのミサ ホ短調＝管楽器のみ、無伴奏の宗教曲）
        #   写し忘れと見分けるため、★編成が3パート未満のときだけ指摘する
        # ★無伴奏（ア・カペラ）の合唱曲があるので、注に「無伴奏」とあるものは見ない
        acap = '無伴奏' in (d.get('note') or '') or any('無伴奏' in (i.get('note') or '')+i['part'] for i in ins)
        if (d.get('kind') in ('opera','chorus') and not acap
                and len(ins) < 3 and not (secs & {'keyboard','continuo'})):
            bad.append((f,'④編成が少なすぎる（写し忘れ？）',str(len(ins)),''))
        for i in ins:
            if i.get('section') not in SEC: bad.append((f,'④種類の誤り',i.get('part',''),str(i.get('section'))))
    for k in ('title','composer','kind','source','source_id'):
        if not d.get(k): bad.append((f,'⑤項目が無い',k,''))
    if d.get('kind') not in KIND: bad.append((f,'⑤種類の誤り',str(d.get('kind')),''))
    dm=d.get('duration_min')
    if dm is not None and not (1 <= dm <= 400): bad.append((f,'⑦時間の目安が変',str(dm),''))
    for a in (d.get('aliases') or []):
        if a==d.get('title'): bad.append((f,'⑦別名が題名と同じ',a,''))
    comp=d.get('composer','')
    if any(x in comp for x in ('能（','狂言','歌舞伎','文楽')) and not d.get('school'):
        bad.append((f,'⑧流派が無い（日本の古典）',comp,''))
    sid=d.get('source_id')
    if sid in ids: bad.append((f,'⑥source_id の重複',sid,ids[sid]))
    ids[sid]=f
    tot+=len(d.get('scenes',[]))
print('WORKS_CHECK 作品 %d ／ 場面 %d'%(len(ids),tot))
for b in bad: print('  ',' | '.join(b))
print('RESULT:', 'OK' if not bad else 'NG（%d件）'%len(bad))
sys.exit(0 if not bad else 1)
