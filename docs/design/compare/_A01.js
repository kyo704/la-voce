// ★A01「きょう ／ 生徒」── 見本と 実機（★node docs/design/compare/_A01.js）
const { build } = require("./_つくる");

build({
  id: "A01", title: "きょう", base: "A01-きょう生徒",
  photo: "A01-実機-2026-09-09.jpeg", photoAt: "2026年9月9日 19:59", device: "828×1792 ＝ 414×896",
  diffs: [
    { n: 1, where: "下のタブ", ng: true,
      mihon: "5つ 等分。絵の印なし。選ばれた所の 上に 2px の 線。文字 10px（選ばれたら 700）。高さ 56px。はみ出しません。",
      jikki: "横に 流れる 丸い札。絵の印つき。いちばん右の「ひつじ」が 切れています。",
      naosi: "門の中だけの 帯（components/TabBarV2.jsx）に 分けました。★38人の 帯は 触っていません。" },
    { n: 2, where: "大きな数字の 書体", ng: true,
      mihon: "ゴシック 26px 700。",
      jikki: "明朝（Cormorant）。★0 が o に 見えます ──「6時間o分」。",
      naosi: "ff-display を 外し、★HomeV2 で 書体を ゴシックに 押さえました。tokens.md §2「アプリは 全部ゴシック。明朝は 使いません」。" },
    { n: 3, where: "数字の 単位", ng: true,
      mihon: "6<s>時間</s>20<s>分</s> ── 数は 26px 700、単位は 12px 400。",
      jikki: "「6時間0分」が ぜんぶ 同じ 大きさ。",
      naosi: "lib/todayCard.js の sleepParts が、数と 単位に 分けて 返します。" },
    { n: 4, where: "画面の題「きょう」", ng: true,
      mihon: "ゴシック 17px 400、字間 .06em。",
      jikki: "明朝の 斜体、24px。",
      naosi: "ff-display italic を 外し、17px・字間 .06em に しました。" },
    { n: 5, where: "羊の 大きさ", ng: true,
      mihon: "幅 186px ／ 画面 360px ＝ <b>51.7%</b>。高さ 247px。",
      jikki: "幅 92px ／ 画面 414px ＝ <b>約 22%</b>。",
      naosi: "★お決めを いただきました（2026-09-10）──「以前の 判断（120px）を 優先せず、見本の サイズに 合わせてください」。★px では なく <b>割合</b>で 持たせています（lib/uiKit.js の SHEEP_WIDTH_RATIO）。390 の 端末で 約 202px、414 で 約 214px。" },
    { n: 6, where: "右上の 歯車", ng: true,
      mihon: "26px の 丸。1px の 枠。⚙ は 12px。",
      jikki: "40px の 丸。色つきの 絵文字。",
      naosi: "見た目は 26px、★押せる所は 44px（透明な 余白）。「どの段でも 44 以上」を 守っています。" },
    { n: 7, where: "「きょうを 記録する」", ng: true,
      mihon: "角 13。上下 15px。16px 700、字間 .06em。影 0 3px 10px。",
      jikki: "角 10。高さ 52。600。下だけ 3px の 線。",
      naosi: "見本に 合わせました（lib/uiKit.js の primaryButtonStyle）。" },
    { n: 8, where: "カードと すき間", ng: true,
      mihon: "角 14。内側 12/13。カードどうし 9px。2枚の あいだ 9px。",
      jikki: "内側 14。あいだ 12px。2枚の あいだ 10px。",
      naosi: "見本に 合わせました（lib/uiKit.js の cardStyle と SPACE）。" },
    { n: 9, where: "きょうの予定 ／ 近い本番の 帯", ng: false,
      mihon: "2本 出ています（15:00 レッスン ／ 9月14日 実技試験）。",
      jikki: "出ていません。",
      naosi: "★不具合では ありません。その日に 予定が 無いからです。見本の 決まり「該当が なければ、その行を 出しません。空の枠を 置きません」。" },
    { n: 10, where: "みつけたこと", ng: "ask",
      mihon: "「あなたが いちばんよく書くのは、木曜の夜です。」",
      jikki: "見出しだけ。中身は ありません。",
      naosi: "★見本の 文は<b>「書く 習慣」</b>についての 気づきです。いまの 中身は<b>「からだ」</b>の 気づきを 流しています。<b>別のもの</b>で、書く習慣の ほうは まだ ありません。" },
    { n: 11, where: "色（えんじ・紙・線）", ng: false,
      mihon: "--enji #840C24 ／ --paper #FBF6EA ／ --card #FFFFFF",
      jikki: "curtain #7A1F2B ／ paper #F6F1E7 ／ card #FFFDF8",
      naosi: "★直しません。「実際に 画面に 出ている 値を 正とし、仕様書の <em>役割</em>だけを 割り当てる」── 既に いただいた お決めです（lib/tokens.js）。色を 変えるなら、この作業の ついででは なく、独立した ご判断で。" }
  ],
  note: `<b>数え方について。</b>見本の 画面は 360px 幅、実機の 写真は 414px 幅です。
そのまま px で くらべると ずれるので、<b>画面の 幅に 対する 割合</b>で 数えています（5番）。<br>
<b>9番と 11番は、直すところでは ありません。</b>9番は その日に 予定が 無いだけ、11番は 既に いただいた お決めです。<br>
<b>10番だけ、ご判断を お願いします。</b>ほかの 8点は、見本の とおりに 直しました（★右の 写真は 直す 前の 姿です）。`
});
