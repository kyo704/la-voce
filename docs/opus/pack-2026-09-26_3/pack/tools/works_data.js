/* ══ ★作品の 雛形を 2,050作に する（2026-09-26）══
   ★★新しい 画面は 作りません。★既に ある
       SC['作品をさがす'] ／ WORKS ／ tplFind ／ tplRoles ／ tplScenes
     の ★★データ源だけ 差し替えます（★描く ところは 1行も 変えません）。
   ★★これは 公演の ためだけの 道具です。★個人の 画面には 出しません。
   ★以前は 見せかけの 25件＋下書き 4件。★いまは 2,050作 すべてに 下書きが あります。
   ★データは gzip＋base64（★0.41MB。生だと 1.21MB）。★歌詞・楽譜・対訳は 入って いません。
   ★作品の 種類（15）→ 公演の 種類（11）の 振り分けは WKG の とおり。 */
var WKALL=null, WKN={}, WKCOMP={};
/* ★作品の kind → 公演の g（★既存の 使い方に 合わせました）
   ★能・狂言・歌舞伎・文楽・雅楽・組踊 は ★既存が drama に 入れて います */
var WKG={opera:'opera', musical:'opera',
         chorus:'chorus', song_cycle:'chorus',
         orchestra:'orchestra', band:'band', chamber:'chamber', dance:'dance',
         drama:'drama', noh:'drama', kyogen:'drama', kabuki:'drama',
         bunraku:'drama', gagaku:'drama', kumiodori:'drama'};
var WKLABEL=__KINDS__;

(function(){
 var el=document.getElementById('WKDATA');
 if(!el||typeof DecompressionStream==='undefined')return;   /* ★読めなければ 元の 25件の まま */
 try{
  var raw=atob(el.textContent.trim()), u=new Uint8Array(raw.length);
  for(var i=0;i<raw.length;i++)u[i]=raw.charCodeAt(i);
  new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text()
   .then(function(t){ wkBuild(JSON.parse(t)); if(typeof draw==='function')draw() })
   .catch(function(){});
 }catch(e){}
})();

function wkBuild(W){
 WKALL=[]; WKN={}; var cm={};
 W.forEach(function(w,i){
   var g=WKG[w.k]||'other';
   WKN[g]=(WKN[g]||0)+1;
   (cm[g]=cm[g]||{})[w.c||'—']=((cm[g]||{})[w.c||'—']||0)+1;
   /* ★合唱が 要る作品か ── ★団体の 役が あれば 1 */
   var ch=w.R.some(function(r){return r[1]})?1:0;
   WKALL.push({g:g, n:w.t, o:w.o||w.t, c:w.c||'', r:w.R.length, sc:w.S.length,
               min:w.d||0, ch:ch, u:0, tpl:'wk'+i, school:w.e||'',
               _k:w.k, _i:i, _a:(w.a||[]).join(' ')});
 });
 /* ★作曲家は ★多い順に 12人（★元も 多い順でした）*/
 Object.keys(cm).forEach(function(g){
   WKCOMP[g]=Object.keys(cm[g]).filter(function(c){return c!=='—'})
     .sort(function(a,b){return cm[g][b]-cm[g][a]}).slice(0,12)});
 WKW=W;
}
var WKW=null;

/* ★★tplFind を 広げます。★元の 手書きの 雛形も そのまま 引けます */
var _tplFind=tplFind;
tplFind=function(id){
 var t=_tplFind(id);
 if(t)return t;
 if(!WKW||String(id).slice(0,2)!=='wk')return null;
 var w=WKW[+String(id).slice(2)]; if(!w)return null;
 return {id:id, n:w.t, min:w.d||0, school:w.e||'',
         r:w.R.map(function(r){return r[1]?[r[0],'',1]:[r[0],'']}),
         sc:w.S.map(function(s){
             return [ s[0]>=0?w.G[s[0]]:'', s[1], '', s[2].slice(), null ]})};
};
