const {readCode,readRaw}=require('../components/tests/_source.js');
const ui=readCode('components','VocalTracker.jsx');
const uiRaw=readRaw('components','VocalTracker.jsx');
const learn=readRaw('lib','learnContent.js');
const health=readRaw('lib','healthInfoContent.js');
const share=readRaw('lib','shareScope.js');

// entryToRow の本文＝entries に列があるもの
const e2r=uiRaw.slice(uiRaw.indexOf('function entryToRow'), uiRaw.indexOf('function entryToRow')+9000);
// 分析（useMemo）の本文をまとめる
const analysisZone=ui.slice(ui.indexOf('const acwrSeries'), ui.indexOf('// ---- 受診用サマリー'));

// 保存先は3通りある。専用の列だけを見ると、detail の中やマスタにあるものを
// 「無い」と誤判定する。★どこに入っているかまで出す。
const masters=uiRaw.match(/repertoire_tessitura[\s\S]{0,1200}|role_master[\s\S]{0,900}|project_master[\s\S]{0,900}/g)?.join('\n')||'';
function storage(keys){
  for(const k of keys){
    const snake=k.replace(/[A-Z]/g,c=>'_'+c.toLowerCase());
    if(new RegExp(`^\\s*${snake}:`,'m').test(e2r)) return '専用の列';
    if(new RegExp(`\\b${k}\\b`).test(masters)||new RegExp(`\\b${snake}\\b`).test(masters)) return 'マスタ';
    if(new RegExp(`detail[^\\n]{0,60}\\b${k}\\b|\\b${k}\\b[^\\n]{0,40}detail`).test(uiRaw)) return 'detailの中';
    if(new RegExp(`\\b${k}\\b`).test(uiRaw)) return 'detailの中';
  }
  return '—';
}
function rendersInUI(keys){
  // ★onChange だけを見ると取りこぼします。
  //   マスタ登録の欄は onClick={() => handleSaveXxx(name, { ...rec, field: v })}
  //   という形で、項目名が onChange の隣に出てきません。
  //   実際に歌唱言語・原稿の種類などを「入力欄なし」と誤判定しました。
  //   ★保存を呼ぶ式の中に項目名が出るかどうかも見ます。
  return keys.some(k=>{
    const direct=new RegExp(`(onDetailChange|setFormData|onChange)[^\\n]{0,160}\\b${k}\\b|\\b${k}\\b[^\\n]{0,80}(onChange|checked=|value=)`);
    const viaSave=new RegExp(`(onClick|onBlur)=\\{[^}]{0,200}\\b${k}\\b`);
    const inSaveArgs=new RegExp(`handleSave\\w+\\([^)]{0,200}\\b${k}\\b`);
    return direct.test(ui)||viaSave.test(ui)||inSaveArgs.test(ui);
  });
}
function usedInAnalysis(keys){
  return keys.some(k=>new RegExp(`\\b${k}\\b`).test(analysisZone));
}
function inLearn(words){ return words.some(w=>learn.includes(w)||health.includes(w)); }

const F=[
 ['声楽','演目・役',['repertoire','repertoireName'],['レパートリー','演目']],
 ['声楽','テッシトゥーラ/最高音',['tessituraNote','topNote'],['テッシトゥーラ']],
 ['声楽','★パッサッジョの通過感',['passaggioFeel'],['パッサッジョ']],
 ['声楽','パッサッジョの通過数',['passaggioCrossings'],['パッサッジョ']],
 ['声楽','会場の響き',['reverberance','hallAcoustics'],['響き']],
 ['声楽','衣装の締め付け',['costumeTightness','tightCostume'],['衣装']],
 ['声楽','歌唱言語',['singingLanguage'],['言語']],
 ['声楽','伴奏',['accompaniment'],['伴奏']],
 ['声楽','音域(使用)',['vocalRangeLowUsed','vocalRangeHighUsed'],['音域']],
 ['声楽','ダイナミクス',['dynamicsRange'],['ダイナミクス']],
 ['アナ','番組・案件',['projectName','project_master'],['案件']],
 ['アナ','生放送か',['isLive'],['生放送']],
 ['アナ','話声位(SFF)',['sffValue','speakingFundamental'],['話声位','SFF']],
 ['アナ','周囲騒音',['noisyEnvironment','ambientNoiseDb'],['騒音','ロンバード']],
 ['アナ','読み間違い・噛み',['misreadLevel','stumbles'],['噛み']],
 ['アナ','原稿の種類',['scriptType'],['原稿']],
 ['アナ','最長の連続発話ブロック',['longestSpeechBlockMinutes'],['連続発話']],
 ['アナ','オンエア時間',['onAirMinutes'],['オンエア']],
 ['声優','収録種別',['recordingKind','sessionType'],['収録']],
 ['声優','喉に負担のある演技',['harshActing','extremeVocalization','hasExtremeVocalization'],['叫び','がなり']],
 ['声優','叫びのテイク数',['shoutTakeCount'],['叫び']],
 ['声優','声質の種類',['voiceQualityKind','characterVoiceType'],['声質']],
 ['声優','収録/拘束時間',['sessionMinutes','boundMinutes'],['拘束']],
 ['声優','歌の仕事',['isSingingJob'],['歌の仕事']],
 ['ポップス','セットリスト',['setlist','setlistCount'],['セットリスト']],
 ['ポップス','曲の最高音/ベルト',['beltNote','hasBelting'],['ベルト']],
 ['ポップス','シャウト・グロウル',['shoutLevel','growl'],['シャウト','グロウル']],
 ['ポップス','モニター環境',['monitorType'],['モニター','イヤモニ']],
 ['ポップス','ツアー何日目',['tourDay','consecutivePerformanceDay'],['ツアー']],
 ['ポップス','移動手段',['travelMode'],['移動']],
 ['ポップス','打ち上げ',['afterParty','afterPartyDrink'],['打ち上げ']],
 ['ポップス','MC・しゃべりの時間',['mcMinutes'],['MC']],
 ['ポップス','弾き語りか',['selfAccompanied'],['弾き語り']],
 ['ポップス','ステージ音量',['venueVolume','monitorVolume'],['音量']],
];
const yn=b=>b?'✓':'—';
console.log('| 職業 | 項目 | DBに列がある | 入力画面に出る | 分析で使われる | 学ぶ記事から参照される |');
console.log('|---|---|---|---|---|---|');
F.forEach(([p,name,keys,words])=>{
  console.log(`| ${p} | ${name} | ${storage(keys)} | ${yn(rendersInUI(keys))} | ${yn(usedInAnalysis(keys))} | ${yn(inLearn(words))} |`);
});
