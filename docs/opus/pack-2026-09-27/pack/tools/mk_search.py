# -*- coding: utf-8 -*-
"""★作品を 探す 画面（単体HTML）を 作ります。
★★データを 埋め込むので ★file:// でも 動きます（★fetch を 使いません）"""
import json, glob, os, sys, re

W = sys.argv[1] if len(sys.argv) > 1 else 'works'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'Woolsong_作品を探す.html'

works = []
for f in sorted(glob.glob(os.path.join(W, '*.json'))):
    if os.path.basename(f).startswith('_'): continue
    d = json.load(open(f, encoding='utf-8'))
    for w in (d if isinstance(d, list) else [d]):
        works.append(w)
_k = json.load(open(os.path.join(W, '_kinds.json'), encoding='utf-8'))
kinds = _k.get('kinds', _k)          # ★中身は 'kinds' の 下に あります
assert 'noh' in kinds, '★_kinds.json の 形が 変わりました'

def lab(r):
    return r['label'] if isinstance(r, dict) else r
def isgrp(r):
    return bool(isinstance(r, dict) and r.get('is_group'))

# ★配る データを 小さく します（★鍵を 短く）
D = []
for w in works:
    D.append({
        't': w['title'], 'o': w.get('title_original'), 'c': w.get('composer'),
        'k': w['kind'], 'y': w.get('year_written'), 'd': w.get('duration_min'),
        'l': w.get('language'), 'e': w.get('edition'), 'n': w.get('note'),
        'a': w.get('aliases') or [], 'q': w.get('composer_sort'),
        'R': [[lab(r), 1 if isgrp(r) else 0] for r in w.get('roles', [])],
        'S': [[s.get('group_label'), s['label'], s.get('roles', [])]
              for s in w.get('scenes', [])],
        'I': [[i['part'], i.get('count', 0), i.get('section'), i.get('note')]
              for i in w.get('instruments', [])],
    })
DATA = json.dumps(D, ensure_ascii=False, separators=(',', ':'))
KINDS = json.dumps(kinds, ensure_ascii=False, separators=(',', ':'))

HTML = r'''<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Woolsong 作品を探す</title>
<style>
:root{--paper:#FBF6EA;--bg:#EFE7D6;--card:#fff;--ink:#261913;--line:#E4DAC4;
 --enji:#840C24;--enji-d:#8E1230;--band:#F6F1E4;--pick:#F6E4E8;
 --ok:#3C6A56;--warn:#825A14;--err:#AD3846;--yama:#8C6115;--midori:#447862;--muted:#7A6A57;
 --hd:#840C24;--hd-ink:#FBF6EA}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){
 --paper:#1C1712;--bg:#121009;--card:#241D17;--ink:#EFE6D8;--line:#3A2F25;
 --enji:#C9607A;--enji-d:#C9607A;--band:#2C241D;--pick:#3A1E22;
 --ok:#69A082;--warn:#D9AC55;--err:#EA8894;--muted:#A2917C;
 --hd:#4A0E1E;--hd-ink:#F3DDE2}}
:root[data-theme=dark]{--paper:#1C1712;--bg:#121009;--card:#241D17;--ink:#EFE6D8;
 --line:#3A2F25;--enji:#C9607A;--enji-d:#C9607A;--band:#2C241D;--pick:#3A1E22;
 --ok:#69A082;--warn:#D9AC55;--err:#EA8894;--muted:#A2917C;--hd:#4A0E1E;--hd-ink:#F3DDE2}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
 font-family:"Hiragino Mincho ProN","Yu Mincho",serif;line-height:1.75}
header{background:var(--hd);color:var(--hd-ink);padding:14px 16px}
header h1{margin:0;font-size:1.05rem;font-weight:600;letter-spacing:.04em}
header p{margin:4px 0 0;font-size:.78rem;opacity:.9}
.wrap{max-width:1000px;margin:0 auto;padding:16px}
.bar{background:var(--card);border:1px solid var(--line);border-radius:10px;
 padding:14px;margin-bottom:14px}
.who{display:flex;gap:8px;margin-bottom:12px}
.who button{flex:1;padding:10px;border:1px solid var(--line);background:var(--paper);
 color:var(--ink);border-radius:8px;font:inherit;font-size:.9rem;cursor:pointer}
.who button[aria-pressed=true]{background:var(--hd);color:var(--hd-ink);border-color:var(--hd)}
input[type=search]{width:100%;padding:11px 12px;font:inherit;font-size:1rem;
 border:1px solid var(--line);border-radius:8px;background:var(--paper);color:var(--ink)}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.chips button{padding:5px 11px;border:1px solid var(--line);background:var(--paper);
 color:var(--ink);border-radius:999px;font:inherit;font-size:.8rem;cursor:pointer}
.chips button[aria-pressed=true]{background:var(--pick);border-color:var(--enji);color:var(--enji-d)}
.count{font-size:.8rem;color:var(--muted);margin:10px 0 6px}
.list{display:grid;gap:8px}
.item{background:var(--card);border:1px solid var(--line);border-radius:10px;
 padding:11px 13px;cursor:pointer;text-align:left;font:inherit;color:var(--ink);width:100%}
.item:hover{border-color:var(--enji)}
.item b{font-size:1rem;font-weight:600}
.item .meta{font-size:.78rem;color:var(--muted);margin-top:3px}
.tag{display:inline-block;font-size:.7rem;padding:1px 7px;border-radius:999px;
 background:var(--band);border:1px solid var(--line);margin-right:5px;color:var(--ink)}
dialog{border:none;border-radius:12px;padding:0;max-width:900px;width:94vw;
 background:var(--card);color:var(--ink)}
dialog::backdrop{background:rgba(0,0,0,.45)}
.dh{background:var(--hd);color:var(--hd-ink);padding:13px 16px;display:flex;
 justify-content:space-between;align-items:flex-start;gap:12px}
.dh h2{margin:0;font-size:1.05rem;font-weight:600}
.dh .sub{font-size:.78rem;opacity:.85;margin-top:3px}
.dhr{display:flex;flex-direction:column;gap:7px;align-items:flex-end;flex:none}
.swap{display:flex;gap:0;border:1px solid currentColor;border-radius:7px;overflow:hidden}
.swap button{background:transparent;border:none;color:inherit;padding:5px 11px;
 font:inherit;font-size:.8rem;cursor:pointer;white-space:nowrap}
.swap button[aria-pressed=true]{background:var(--hd-ink);color:var(--hd)}
.dh button{background:transparent;border:1px solid currentColor;color:inherit;
 border-radius:7px;padding:5px 11px;font:inherit;font-size:.85rem;cursor:pointer;flex:none}
.db{padding:16px;max-height:72vh;overflow:auto}
h3{font-size:.92rem;margin:18px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--line)}
h3:first-child{margin-top:0}
table{border-collapse:collapse;font-size:.8rem;width:100%}
th,td{border:1px solid var(--line);padding:5px 7px;text-align:left;vertical-align:top}
th{background:var(--band);font-weight:600;position:sticky;top:0}
.ban{overflow:auto;max-height:52vh;border:1px solid var(--line);border-radius:8px}
.ban table{border:none;min-width:max-content}
.ban th:first-child,.ban td:first-child{position:sticky;left:0;background:var(--band);
 min-width:180px;max-width:280px}
.ban td.on{text-align:center;color:var(--enji-d);font-weight:700}
.ban td.off{text-align:center;color:var(--line)}
.grp{background:var(--pick);font-weight:600;font-size:.78rem}
.kv{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:.85rem}
.kv dt{color:var(--muted)}
.kv dd{margin:0}
.yakusoku{background:var(--band);border-left:3px solid var(--ok);border-radius:0 8px 8px 0;
 padding:10px 13px;font-size:.82rem;margin:14px 0}
.yakusoku b{color:var(--ok)}
.note{font-size:.82rem;background:var(--paper);border:1px solid var(--line);
 border-radius:8px;padding:10px 12px}
.pick-role{display:flex;flex-wrap:wrap;gap:6px}
.pick-role button{padding:6px 12px;border:1px solid var(--line);background:var(--paper);
 color:var(--ink);border-radius:8px;font:inherit;font-size:.85rem;cursor:pointer}
.pick-role button[aria-pressed=true]{background:var(--pick);border-color:var(--enji);color:var(--enji-d)}
.act{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.act button{padding:10px 16px;border-radius:8px;font:inherit;font-size:.9rem;cursor:pointer;
 border:1px solid var(--hd);background:var(--hd);color:var(--hd-ink)}
.act button.sub{background:var(--paper);color:var(--ink);border-color:var(--line)}
.empty{text-align:center;color:var(--muted);padding:30px;font-size:.88rem}
.hint{font-size:.78rem;color:var(--muted);margin-top:6px}
footer{text-align:center;font-size:.75rem;color:var(--muted);padding:24px 16px}
.star{color:var(--enji-d)}
@media(max-width:600px){
 .who{flex-direction:column}.db{padding:13px}
 /* ★★出番の 表は スマホでは 1件ずつ 縦に 並べます（★3列は 狭すぎます） */
 .mine,.mine tbody,.mine tr,.mine td{display:block;width:100%}
 .mine tr:first-child{display:none}
 .mine tr{border:1px solid var(--line);border-radius:8px;margin-bottom:7px;
  padding:8px 10px;background:var(--paper)}
 .mine td{border:none;padding:1px 0}
 .mine td:nth-child(1){font-size:.72rem;color:var(--muted)}
 .mine td:nth-child(2){font-weight:600;font-size:.88rem}
 .mine td:nth-child(3):not(:empty)::before{content:"一緒に　";color:var(--muted);font-size:.72rem}
 .mine td:nth-child(3){font-size:.78rem}
 .ban th:first-child,.ban td:first-child{min-width:120px;max-width:160px;font-size:.72rem}
 .dh{flex-direction:column;align-items:stretch}
 .dhr{flex-direction:row;justify-content:space-between;align-items:center}
}
</style></head><body>
<header>
 <h1>Woolsong ── 作品から 香盤表を 立てる</h1>
 <p>__TOTAL__作・__SCENES__場面。★公演の ための 道具です。
    ★歌詞・楽譜・対訳・あらすじは 入っていません</p>
</header>
<div class="wrap">
 <div class="bar">
  <input type="search" id="q" placeholder="題名・作曲家・役の名前で 探す（例：ノルマ／プッチーニ／ミミ）">
  <div class="chips" id="kindchips"></div>
  <div class="hint" id="whohint"></div>
 </div>
 <div class="count" id="count"></div>
 <div class="list" id="list"></div>
</div>
<footer>Woolsong ／ 作品データ 2026-09-26</footer>

<dialog id="dlg"><div class="dh">
 <div><h2 id="d-title"></h2><div class="sub" id="d-sub"></div></div>
 <button id="d-close">閉じる</button>
</div><div class="db" id="d-body"></div></dialog>

<script>
const W=__DATA__, K=__KINDS__;
const KL={}; for(const k in K) KL[k]=K[k].label||k;
let kind='', q='';   // ★★立場の 切り替えは やめました（公演の ためだけ）

// ── 探す ための 文字列を 先に 作ります（★毎回 作ると 遅い）
W.forEach(w=>{ w._s=[w.t,w.o||'',w.c||'',w.q||'',(w.a||[]).join(' '),
  w.R.map(r=>r[0]).join(' ')].join(' ').toLowerCase(); });

const kc=document.getElementById('kindchips');
const counts={}; W.forEach(w=>counts[w.k]=(counts[w.k]||0)+1);
const order=Object.keys(counts).sort((a,b)=>counts[b]-counts[a]);
kc.innerHTML='<button data-k="" aria-pressed="true">すべて '+W.length+'</button>'+
 order.map(k=>'<button data-k="'+k+'" aria-pressed="false">'+(KL[k]||k)+' '+counts[k]+'</button>').join('');
kc.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b)return;
 kind=b.dataset.k; [...kc.children].forEach(x=>x.setAttribute('aria-pressed',x===b));
 draw(); });

document.getElementById('q').addEventListener('input',e=>{q=e.target.value.trim().toLowerCase();draw();});
const hint=document.getElementById('whohint');
hint.innerHTML='<span class="star">★</span>作品を 選ぶと 香盤表（'
 +'場面 × 役）が そのまま 立ちます。表は 書き出せます。'
 +'<br><span class="star">★</span>出演者の <b>体調の 記録は 制作に 見えません</b>。'
 +'ここに 出るのは 作品の ことだけです。';

const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function draw(){
 let r=W;
 if(kind) r=r.filter(w=>w.k===kind);
 if(q){ const ts=q.split(/\s+/); r=r.filter(w=>ts.every(t=>w._s.includes(t))); }
 document.getElementById('count').textContent=r.length+'作';
 const L=document.getElementById('list');
 if(!r.length){ L.innerHTML='<div class="empty">見つかりませんでした。<br>★別の 言い方（原題・別名・役の 名前）でも 探せます。</div>'; return; }
 const show=r.slice(0,300);
 L.innerHTML=show.map(w=>{ const i=W.indexOf(w);
  return '<button class="item" data-i="'+i+'"><b>'+esc(w.t)+'</b>'+
   (w.o?' <span class="meta">'+esc(w.o)+'</span>':'')+
   '<div class="meta"><span class="tag">'+esc(KL[w.k]||w.k)+'</span>'+
   esc(w.c||'')+(w.y?'　'+w.y:'')+(w.d?'　'+w.d+'分':'')+
   '　場面 '+w.S.length+'　役 '+w.R.length+(w.e?'　<span class="star">★版あり</span>':'')+
   '</div></button>'; }).join('')+
  (r.length>show.length?'<div class="empty">★はじめの 300作を 出しました。絞り込んで ください。</div>':'');
 L.querySelectorAll('.item').forEach(b=>b.onclick=()=>open(W[+b.dataset.i]));
}

let cur=null, myRole=null;
const dlg=document.getElementById('dlg');
document.getElementById('d-close').onclick=()=>dlg.close();
function open(w){ cur=w; if(myRole && !w.R.some(r=>r[0]===myRole)) myRole=null;
 document.getElementById('d-title').textContent=w.t;
 document.getElementById('d-sub').textContent=
  [KL[w.k]||w.k,w.c,w.y,w.d?w.d+'分':''].filter(Boolean).join('　／　');
 const ki=K[w.k]||{};
 let h='';
 // ── 基本
 h+='<h3>この 作品の こと</h3><dl class="kv">';
 if(w.o) h+='<dt>原題</dt><dd>'+esc(w.o)+'</dd>';
 if(w.a&&w.a.length) h+='<dt>別の 名前</dt><dd>'+esc(w.a.join('／'))+'</dd>';
 if(w.l&&w.l!=='—') h+='<dt>ことば</dt><dd>'+esc(w.l)+'</dd>';
 h+='<dt>行（'+esc(ki.row||'場面')+'）</dt><dd>'+w.S.length+'</dd>';
 h+='<dt>列（'+esc(ki.col||'役')+'）</dt><dd>'+w.R.length+'</dd>';
 if(ki.rehearsals) h+='<dt>稽古の 言い方</dt><dd><span class="star">★</span>'+esc(ki.rehearsals.join('／'))+'</dd>';
 h+='</dl>';
 if(w.e) h+='<div class="note" style="margin-top:10px"><b>版</b>　'+esc(w.e)+'</div>';
 if(w.n) h+='<div class="note" style="margin-top:8px">'+esc(w.n)+'</div>';

 // ★★役を 選ぶと ★その役の 出番だけ 見られます（★配役を 決めるとき に 使います）
 h+='<h3>'+esc(ki.col||'役')+'を 選ぶと、その'+esc(ki.col||'役')+'の 出番だけ 見られます</h3>'
  +'<div class="pick-role">'+
   w.R.map(r=>'<button data-r="'+esc(r[0])+'"'+(myRole===r[0]?' aria-pressed="true"':'')+'>'+
    esc(r[0])+(r[1]?'（団体）':'')+'</button>').join('')+'</div>';
 if(myRole){
   const mine=w.S.filter(s=>s[2].includes(myRole));
   h+='<h3>'+esc(myRole)+' が 出る '+esc(ki.row||'場面')+'（'+mine.length+' / '+w.S.length+'）</h3>';
   h+=mine.length?'<table class="mine"><tr><th>'+esc(ki.group||'まとまり')+'</th><th>'+esc(ki.row||'場面')+'</th><th>一緒に 出る 人</th></tr>'+
     mine.map(s=>'<tr><td>'+esc(s[0]||'')+'</td><td>'+esc(s[1])+'</td><td>'+
       esc(s[2].filter(x=>x!==myRole).join('／')||'—')+'</td></tr>').join('')+'</table>'
    :'<div class="note">この '+esc(ki.col||'役')+' が 出る '+esc(ki.row||'場面')+' は 入っていません。</div>';
   h+='<div class="act"><button class="sub" id="csv1">この '+esc(ki.col||'役')+'の 出番を 書き出す</button></div>';
 }
 // ── 香盤表（★両方の 立場で 出します）
 h+='<h3>香盤表 ── '+esc(ki.row||'場面')+'（行）× '+esc(ki.col||'役')+'（列）</h3>';
 if(!w.S.length){ h+='<div class="note">場面が 入っていません。</div>'; }
 else{
  let g='';
  h+='<div class="ban"><table><tr><th>'+esc(ki.row||'場面')+'</th>'+
   w.R.map(r=>'<th>'+esc(r[0])+'</th>').join('')+'</tr>';
  w.S.forEach(s=>{
   if(s[0]&&s[0]!==g){ g=s[0];
    h+='<tr><td class="grp" colspan="'+(w.R.length+1)+'">'+esc(g)+'</td></tr>'; }
   h+='<tr><td>'+esc(s[1])+'</td>'+
    w.R.map(r=>s[2].includes(r[0])
      ?'<td class="on">'+(myRole===r[0]?'◎':'○')+'</td>':'<td class="off">・</td>').join('')+'</tr>';
  });
  h+='</table></div>';
  {
   h+='<div class="act"><button id="csv2">香盤表を 書き出す（CSV）</button>'+
    '<button class="sub" id="csv3">役ごとの 出番の 数を 書き出す</button></div>';
   const cnt=w.R.map(r=>[r[0],w.S.filter(s=>s[2].includes(r[0])).length])
     .sort((a,b)=>b[1]-a[1]);
   h+='<h3>出番の 多い 役</h3><table><tr><th>'+esc(ki.col||'役')+'</th><th>出番</th><th>割合</th></tr>'+
    cnt.map(([n,c])=>'<tr><td>'+esc(n)+'</td><td>'+c+' / '+w.S.length+'</td><td>'+
      Math.round(c/w.S.length*100)+'%</td></tr>').join('')+'</table>';
   h+='<div class="yakusoku"><b>約束</b><br>'+
    '<span class="star">★</span>出演者の <b>体調の 記録は 制作に 見えません</b>。'+
    'この 画面に 出るのは <b>作品の ことだけ</b>です。<br>'+
    '<span class="star">★</span>Woolsong は 出演者を <b>点数に しません</b>。<br>'+
    '<span class="star">★</span>写せるのは <b>場面と 役の 形だけ</b>。人・配役は 写りません。</div>';
  }
 }
 // ── 編成
 if(w.I&&w.I.length){
  h+='<h3>編成</h3><table><tr><th>楽器・パート</th><th>人数</th><th>覚え書き</th></tr>'+
   w.I.map(i=>'<tr><td>'+esc(i[0])+'</td><td>'+(i[1]?i[1]:'<span class="star">公演ごと</span>')+
    '</td><td>'+esc(i[3]||'')+'</td></tr>').join('')+'</table>';
 }
 document.getElementById('d-body').innerHTML=h;

 document.querySelectorAll('.pick-role button').forEach(b=>b.onclick=()=>{
  myRole = (myRole===b.dataset.r) ? null : b.dataset.r; open(cur); });
 const go=document.getElementById('go');
 if(go) go.onclick=()=>alert('★この 見本では ここまでです。\n\n本物では '+cur.t+'（'+myRole+
   '）の 稽古として 記録が はじまります。\n\n'+
   ((K[cur.k]||{}).rehearsals?'★稽古の 呼び方：'+(K[cur.k]||{}).rehearsals.join('／'):''));
 const dl=(name,rows)=>{ const csv='\ufeff'+rows.map(r=>r.map(c=>
   '"'+String(c==null?'':c).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  // ★先頭の \ufeff は BOM ── ★これが 無いと Excel で 日本語が 化けます
  const a=document.createElement("a");
  const u=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  a.href=u;
  a.download=name.replace(/[\\/:*?"<>|]/g,"_");   // ★名前に 使えない 字を 外す
  // ★a を 画面に 入れてから 押します（★入れずに 押せない ブラウザが あります）
  a.style.display="none"; document.body.appendChild(a); a.click();
  setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(u); },1000); };
 const c1=document.getElementById('csv1');
 if(c1) c1.onclick=()=>dl(cur.t+'_'+myRole+'_出番.csv',
   [['作品',cur.t],['役',myRole],[],[(K[cur.k]||{}).group||'まとまり',(K[cur.k]||{}).row||'場面','一緒に 出る 人']]
   .concat(cur.S.filter(s=>s[2].includes(myRole)).map(s=>[s[0]||'',s[1],s[2].filter(x=>x!==myRole).join('／')])));
 const c2=document.getElementById('csv2');
 if(c2) c2.onclick=()=>dl(cur.t+'_香盤表.csv',
   [[(K[cur.k]||{}).row||'場面'].concat(cur.R.map(r=>r[0]))]
   .concat(cur.S.map(s=>[(s[0]?s[0]+' ':'')+s[1]].concat(cur.R.map(r=>s[2].includes(r[0])?'○':'')))));
 const c3=document.getElementById('csv3');
 if(c3) c3.onclick=()=>dl(cur.t+'_出番の数.csv',
   [[(K[cur.k]||{}).col||'役','出番','全'+(K[cur.k]||{}).row||'場面']]
   .concat(cur.R.map(r=>[r[0],cur.S.filter(s=>s[2].includes(r[0])).length,cur.S.length])));
 if(!dlg.open) dlg.showModal();
}
draw();
</script></body></html>'''

HTML = (HTML.replace('__DATA__', DATA).replace('__KINDS__', KINDS)
            .replace('__TOTAL__', f'{len(D):,}')
            .replace('__SCENES__', f'{sum(len(w["S"]) for w in D):,}'))
open(OUT, 'w', encoding='utf-8').write(HTML)
print('OK', OUT, '%.2f MB' % (len(HTML.encode()) / 1e6))
