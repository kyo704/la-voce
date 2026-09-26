# -*- coding: utf-8 -*-
import io
D='/tmp/claude-0/-home-claude/be5e229a-ca1c-5847-a798-590d6c97fd75/scratchpad/woolsong_full/見本/'
FS=['00-動く見本（さわれる・全画面）.html','00-動く見本-iPhoneで開く用.html']

PAGE = u"""/* ══════════════════ 運営に 切り替える（★2026-09-26 に 足しました）══════════════════
   ★「個人の 画面から 運営の 画面へ 飛ぶ ページが ない」ため 足しました。
   ★これまで 運営モードに 入れるのは <b>下の「デモの切替」だけ</b>でした。
     ★それは 見本を 見る人の ための ものです ── ★アプリの 中には 入口が ありませんでした。
   ★役職の ある ところだけ 押せます。ない ところは 隠さず、見せて 押せなくします。 */
SC['運営に切り替える']=function(){
 var ok=S.dm.post!=='なし'&&!S.noClass;
 return bk('もっと')+'<div class="hd" style="padding-top:2px"><h2>運営に 切り替える</h2></div>'
 +'<div class="box" style="padding:13px">'
 +'<div class="usu">いま</div><div style="font-size:15.5px;font-weight:700">個人の 画面　高木 みなみ</div>'
 +'<div style="text-align:center;font-size:20px;color:var(--ink3);margin:6px 0">↓</div>'
 +'<div class="usu">移る先</div><div style="font-size:15.5px;font-weight:700">○○音楽大学　の運営</div>'
 +'<div class="usu">役職　'+(ok?S.dm.post:'なし')+'</div></div>'
 +'<div class="box" style="margin-top:11px">'
 +'<div class="li"'+(ok?' onclick="opsGo()"':'')+'><span>○○音楽大学<div class="usu">大学　／　'
 +(ok?'役職　'+S.dm.post:'役職が ありません')+'</div></span><s>'+(ok?'移る ›':'移れません')+'</s></div>'
 +'<div class="li" style="opacity:.5"><span>△△声楽教室<div class="usu">音楽教室　／　役職が ありません</div></span><s>移れません</s></div>'
 +'</div>'
 +(ok?'<div class="btn" style="margin-top:12px" onclick="opsGo()">運営の 画面に 移る ›</div>'
    :'<div class="btn g" style="margin-top:12px;opacity:.5" onclick="toast(\\'役職が ないと 出ません\\')">運営の 画面に 移る ›</div>')
 +'<div class="warn" style="margin-top:12px"><b>運営に 移っても、こうです</b><br>'
 +'・運営の 画面には <b>健康に関するものが 1つも ありません</b>（画面そのものが ありません）<br>'
 +'・あなたの 声・からだの 記録は <b>運営に 移っても 見えません</b><br>'
 +'・ノート・レパートリー・たぶんノートも <b>見えません</b><br>'
 +'・運営に 移ったことは <b>誰にも 知らされません</b><br>'
 +'・運営で できるのは 名簿・日程・出欠・行事・連絡・ご請求・公演です</div>'
 +'<div class="note"><b>戻るとき</b>　運営の 画面 いちばん上の <b>「‹ 個人に 戻る」</b>を 押します。<br>'
 +'どちらに いるかは、上の <b>濃い 帯</b>が 出ているかで 分かります。<br>'
 +'移っても、<b>あなたが 通う 生徒としての 立場は 変わりません</b>。'
 +'自分の レッスンの 出席を 自分で つけることは できません。<br>'
 +'役職が ない ところは <b>隠しません</b>。見せて、押せなくします。</div>'};
function opsGo(){if(S.dm.post==='なし'||S.noClass){toast('役職が ないと 出ません');return}
 S.mode='o';S.otab=tabsFor()[0];S.stack=[];draw()}
"""

OLD_MOTTO_HEAD = u""" +'<div class="box">'
 +mLi('しらべる機能','しらべる','くらべる・かぞえる・受診用の 1枚')"""
NEW_MOTTO_HEAD = u""" +'<div class="box">'
 +(S.noClass?'':mLi('運営に切り替える','★運営に 切り替える','役職の ある ところの 名簿・日程・出欠・公演へ'))
 +mLi('しらべる機能','しらべる','くらべる・かぞえる・受診用の 1枚')"""

ANCHOR = u"""/* ══ ★区切り（2026-09-25・Code の 説明から）"""

OLD_BACK = u"""+'<span class="back" style="padding:0" onclick="S.mode=\\'p\\';S.stack=[];draw()">‹ 戻る</span>'"""
NEW_BACK = u"""+'<span class="back" style="padding:0" onclick="S.mode=\\'p\\';S.stack=[];draw()">‹ 個人に 戻る</span>'"""

for f in FS:
    p=D+f
    s=io.open(p,encoding='utf-8').read();n0=len(s)
    assert OLD_MOTTO_HEAD in s, (f,'もっと の 箱 見つからず')
    s=s.replace(OLD_MOTTO_HEAD,NEW_MOTTO_HEAD,1)
    assert ANCHOR in s, (f,'置き場 見つからず')
    s=s.replace(ANCHOR, PAGE+u"\n"+ANCHOR, 1)
    assert OLD_BACK in s, (f,'戻る 見つからず')
    s=s.replace(OLD_BACK,NEW_BACK,1)
    io.open(p,'w',encoding='utf-8').write(s)
    print(f, n0, '->', len(s))
