# -*- coding: utf-8 -*-
import io,sys,re
D='/tmp/claude-0/-home-claude/be5e229a-ca1c-5847-a798-590d6c97fd75/scratchpad/woolsong_full/見本/'
KJ=D+'00-動く見本-PC・iPad（個人）.html'
UN=D+'00-動く見本-PC・iPad（運営）.html'

s=io.open(KJ,encoding='utf-8').read()
n0=len(s)

# ══ ① 相手のファイルを 見つける道具（★取り替えが 効かなかったのを 直す）══
HELP = u"""
/* ══════════════════ 個人 ⇄ 運営 の 行き来 ══════════════════
   ★ここが 効いていませんでした。
   file:// で 開くと location.href は 日本語が %EF%BC%88… の形に なります。
   そのため '（個人）' の 取り替えが 1度も 当たらず、
   押しても 案内（toast）だけが 出て、運営に 移れませんでした。
   ★日本語のまま／符号化ずみ の どちらでも 当たるように します。
   ★あわせて window.open ではなく <a href> に します（file:// で 止められないため）。 */
function swapURL(a,b){
 var h=location.href,i;
 var forms=[[a,b],[encodeURI(a),encodeURI(b)],[encodeURIComponent(a),encodeURIComponent(b)]];
 for(i=0;i<forms.length;i++){if(h.indexOf(forms[i][0])>=0)return h.replace(forms[i][0],forms[i][1])}
 return ''}
function opsURL(){return swapURL('（個人）','（運営）')}
function opsLink(lab,cls){
 var u=opsURL(),c=cls||'btn';
 if(!u)return '<span class="'+c+'" onclick="toast(\\'この 見本を 名前を 変えずに 保存すると 開けます ── 00-動く見本-PC・iPad（運営）.html\\')">'+lab+'</span>';
 return '<a class="'+c+'" href="'+u+'" target="_blank" rel="noopener" style="text-decoration:none">'+lab+'</a>'}
function opsOpen(){var u=opsURL();
 if(!u){toast('運営の 見本は 別ファイルです ── 00-動く見本-PC・iPad（運営）.html');return}
 var w=window.open(u,'_blank');
 if(!w)toast('別ファイルを 開きます ── 00-動く見本-PC・iPad（運営）.html')}

/* ══════════════════ 運営に 切り替える（画面）══════════════════
   ★「個人から 運営に 飛ぶ 画面が ない」ため 足しました。
   ★役職の ある ところだけ 押せます。ない ところは 見せて、押せなくします（隠しません）。 */
var KIRI=[{id:'u',post:'伴奏科 助手',can:1},{id:'m',post:'',can:0}];
function SC_kiri(){
 var me=KIRI.filter(function(x){return x.can})[0];
 return bk('もっと')+'<h2>運営に 切り替える</h2>'
 +'<div class="col2" style="align-items:flex-start">'
 +'<div style="flex:1;min-width:330px">'
 +'<div class="card" style="background:var(--band);border-color:var(--line3)">'
 +'<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">'
 +'<div><div class="usu">いま</div><div style="font-size:16px;font-weight:700">個人の 画面</div>'
 +'<div class="usu">高木 みなみ　声楽3年</div></div>'
 +'<div style="font-size:22px;color:var(--ink3)">→</div>'
 +'<div><div class="usu">移る先</div><div style="font-size:16px;font-weight:700">'+org('u').n+'　の運営</div>'
 +'<div class="usu">役職　'+(me?me.post:'なし')+'</div></div>'
 +'</div></div>'
 +'<div class="h3">通っている ところ</div>'
 +'<div class="card p0">'+KIRI.map(function(x){var o=org(x.id);
   return '<div class="li"><span><b>'+o.n+'</b><br><span class="usu">'+o.k+'　／　'
   +(x.can?'役職　'+x.post:'役職が ありません')+'</span></span>'
   +'<s>'+(x.can?opsLink('運営に 移る ›','btn sm'):'<span class="btn g sm" style="opacity:.5;cursor:default" title="役職の ある方にだけ 出ます">移れません</span>')+'</s></div>'}).join('')+'</div>'
 +'<div class="note">運営に 移れるのは <b>役職の ある ところ</b>だけです。<br>'
 +'役職が ない ところは <b>隠しません</b>。見せて、押せなくします。<br>'
 +'移っても、<b>あなたが 通う 生徒としての 立場は 変わりません</b>。'
 +'自分の レッスンの 出席を 自分で つけることは できません。</div>'
 +'</div>'
 +'<div style="flex:0 0 340px">'
 +'<div class="warn"><b>運営に 移っても、こうです</b><br>'
 +'・運営の 画面には <b>健康に関するものが 1つも ありません</b>（画面そのものが ありません）<br>'
 +'・あなたの 声・からだの 記録は、<b>運営に 移っても 見えません</b><br>'
 +'・ノート・レパートリー・たぶんノートも <b>見えません</b><br>'
 +'・運営に 移ったことは、<b>誰にも 知らされません</b><br>'
 +'・運営で できるのは 名簿・日程・出欠・行事・連絡・ご請求・公演です</div>'
 +'<div class="card" style="margin-top:12px"><div class="usu" style="line-height:1.95">'
 +'<b>戻るとき</b><br>運営の 画面 左上の <b>「‹ 個人に 戻る」</b>を 押します。<br>'
 +'どちらの 画面に いるかは、上の 帯の 色で 分かります（個人は 白、運営は 濃い 色）。</div>'
 +'<div style="margin-top:12px">'+opsLink('運営の 画面を 開く ›')+'</div>'
 +'<div class="usu" style="margin-top:10px">この 見本では 運営は <b>別ファイル</b>です。'
 +'本番では 同じアプリの 中で 切り替わります。</div></div>'
 +'</div></div>'}
function org(id){for(var i=0;i<ORGS.length;i++)if(ORGS[i].id===id)return ORGS[i];return {n:'',k:''}}
"""

# 元の opsOpen を 消して、新しいものに 差し替える
old_ops = u"""function opsOpen(){
 var u=location.href.replace('（個人）','（運営）').replace('-PC個人','-PC');
 if(u===location.href){toast('運営の 見本は 別ファイルです ── 00-動く見本-PC・iPad（運営）.html');return}
 var w=window.open(u,'_blank');
 if(!w)toast('別ファイルを 開きます ── 00-動く見本-PC・iPad（運営）.html');}
"""
assert old_ops in s, 'opsOpen 見つからず'
s=s.replace(old_ops, HELP.lstrip('\n')+'\n',1)

# ② もっと の 右の カード ── ボタンを 画面送りに
old_btn = u"""<div style="margin-top:12px"><span class="btn" onclick="opsOpen()">運営モードへ ›</span></div>'"""
assert old_btn in s, 'もっと の ボタン 見つからず'
s=s.replace(old_btn, u"""<div style="margin-top:12px"><span class="btn" onclick="push('切り替える')">運営に 切り替える ›</span></div>'""",1)

# ③ もっと の 一覧の 先頭に 行を 足す（★探せるように）
old_G = u"""var G=[['設定','文字の 大きさ・明るさ・羊の 動き'],"""
assert old_G in s
s=s.replace(old_G, u"""var G=[['★運営に 切り替える','役職の ある ところの 名簿・日程・出欠・公演へ'],
  ['設定','文字の 大きさ・明るさ・羊の 動き'],""",1)

# G の onclick ── 「運営に 切り替える」だけ 画面送りに する
old_li = u"""   return '<div class="li" onclick="toast(\\''+esc(x[0])+'（見本では 開きません）\\')">'
   +'<span>'+x[0]+'<br><span class="usu">'+x[1]+'</span></span><s>›</s></div>'}).join('')+'</div>'"""
assert old_li in s, 'もっと の 行 見つからず'
s=s.replace(old_li, u"""   var k=x[0].replace('★','');
   var act=(k==='運営に 切り替える')?"push('切り替える')":("toast('"+esc(k)+"（見本では 開きません）')");
   return '<div class="li" onclick="'+act+'">'
   +'<span>'+k+(k==='運営に 切り替える'?' <span class="usu">（役職の ある方だけ）</span>':'')
   +'<br><span class="usu">'+x[1]+'</span></span><s>›</s></div>'}).join('')+'</div>'""",1)

# ④ SC に 登録
old_sc = u"""var SC={'よてい':SC_yotei,'時間割':SC_jikan,'本番の予定':SC_honban,'もっと':SC_motto,'しらべる':SC_sira};"""
assert old_sc in s
s=s.replace(old_sc, u"""var SC={'よてい':SC_yotei,'時間割':SC_jikan,'本番の予定':SC_honban,'もっと':SC_motto,'しらべる':SC_sira,
 '切り替える':SC_kiri};""",1)

io.open(KJ,'w',encoding='utf-8').write(s)
print('個人 OK', n0, '->', len(s))

# ══ 運営 側 ── 戻る を 本物に ══
t=io.open(UN,encoding='utf-8').read()
m0=len(t)
old_back = u"""+'<span class="back" onclick="toast(\\'個人アプリへ 戻ります（スマホ版の 見本を ご覧ください）\\')">‹ 戻る</span>'"""
assert old_back in t, '運営 の 戻る 見つからず'
t=t.replace(old_back, u"""+persLink()""",1)

HELP2 = u"""
/* ══════════════════ 個人に 戻る ══════════════════
   ★左上の「‹ 戻る」が 案内（toast）だけで、個人の 画面に 戻れませんでした。
   ★file:// では location.href の 日本語が 符号化されるため、
     日本語のまま／符号化ずみ の どちらでも 当たるように します。 */
function swapURL(a,b){
 var h=location.href,i;
 var forms=[[a,b],[encodeURI(a),encodeURI(b)],[encodeURIComponent(a),encodeURIComponent(b)]];
 for(i=0;i<forms.length;i++){if(h.indexOf(forms[i][0])>=0)return h.replace(forms[i][0],forms[i][1])}
 return ''}
function persLink(){
 var u=swapURL('（運営）','（個人）');
 if(!u)return '<span class="back" onclick="toast(\\'個人の 見本は 別ファイルです ── 00-動く見本-PC・iPad（個人）.html\\')">‹ 個人に 戻る</span>';
 return '<a class="back" href="'+u+'" style="color:inherit;text-decoration:none" '
 +'title="個人の 画面に 戻ります">‹ 個人に 戻る</a>'}
"""
# draw() の 前に 入れる
anchor = u"""/* ══ 文字の 大きさ（老眼対策） ══ */"""
assert anchor in t
t=t.replace(anchor, HELP2.strip()+u"\n"+anchor,1)
io.open(UN,'w',encoding='utf-8').write(t)
print('運営 OK', m0, '->', len(t))
