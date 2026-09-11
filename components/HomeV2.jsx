"use client";

import { C } from "@/lib/tokens";
import SheepDressed from "@/components/SheepDressed";
import { TODAY_NOTE, morningWordsFor, MORNING_WORDS_FOOT } from "@/lib/todayCard";
import TodayBand from "@/components/TodayBand";
import {
  TYPE, SPACE, FONT_STACK, SHEEP_WIDTH_RATIO, SHEEP_WIDTH_RATIO_TEACHING,
  sheepCssSize, rem
} from "@/lib/uiKit";
import {
  ScreenHead, HeadRound, H3, Seg, Note, Card, Two, Btn, Usu
} from "@/components/UiV2";
import { VIEW_AS_MODES, viewAsWord } from "@/lib/viewAs";

// ============================================================================
// 「きょう」の画面 ── ★A01（★design.zip ／ 2026-09-10）
//
//   ★出どころ docs/design/pack/screens/A01-きょう生徒.html
//     ★★HTML が 正です（★README）。★画像から 読み取っていません。
//
//   ★★見本の 並び
//     hd（題＋歯車）／ 羊 ／ ひとこと ／ きょうの予定 ／ 近い本番 ／
//     2枚（こえの調子・ねむり）／ きょうを記録する ／ みつけたこと
//
//   ★★見本の 決まり
//     ★グラフを 1つも 置きません。
//     ★点数を 出しません（★69/100 も 4.0/5 も 出しません）。
//     ★出すのは「きょうの ことば」と「あなたの ふだん」だけです。
//     ★★該当が なければ、★その行を 出しません。★空の枠を 置きません。
//
//   ★★大きさ・間・書体は lib/uiKit.js が 持ちます。★ここで 決めません。
//   ★★数と 言葉は lib/todayCard.js が 持ちます。★ここで 決めません。
//
//   ★★名簿に 載っている方にだけ 出します（★lib/layoutV2.js）。
//     ★一般の 38人には、★これまでの ホームが 出ます。★1つも 変えません。
//
//   ★見張り components/tests/home-v2.test.js
// ============================================================================

export default function HomeV2({
  entries, todayISO, wearing, clothColors, clothColors2,
  band, onRecord, onOpenMore, children, performances,
  viewAs = "auto", onViewAs, canChooseViewAs = false, hasTeachingToday = false
}) {
  // ★★本番の 朝の ことば（★見本 577〜582行）。★決めは lib/todayCard.js。
  const morning = morningWordsFor(performances, todayISO);
  // ★★こえの調子・ねむり の 計算は、★2026-09-11 に 外しました（★お決め ㋑）。
  //   ★★N-1 の 決まり ──「作った 関数は、必ず どこかから 呼ばれて いるか」。
  //     ★出す 場所を 消したので、★計算も 残しません。
  //   ★★conditionWord ／ sleepParts ／ usualOf は lib/todayCard.js に あります。
  //     ★「ふりかえる → かぞえる」が 使って います。★消して いません。

  // ★★羊の 大きさは、★端末の 幅で 決まります（★見本の 割合・lib/uiKit.js）。
  //   ★★SheepDressed は px しか 受け取りません。★だから、★実際に 測ります。
  //   ★★測る 前も、★入れものが 場所を 取っています（★下の aspectRatio）。
  //     ★取らないと、★測り終えた 瞬間に 下の 帯が がたつきます。
  // ★★きょう おしえる 日は、★見本② の 姿に なります（★案B・2026-09-10）。
  //   ★★案B で 進める、と お決めを いただきました。
  //     ★A02 に するのは、★羊の 大きさ（150／186）と、★帯の 並びだけです。
  //     ★★こえの調子・ねむり・みつけたこと は、★教える日も 出します。
  //   ★★見本② には、★その 3つが 描かれていません。
  //     ★けれど 坂本さんは、★教える日も ご自分の 声を 記録なさいます。
  //     ★★教える日だけ 自分の 記録が 見えなく なるのは、★取り上げに 近い。
  //   ★決めているのは、★呼ぶ側が 渡した teaching です。★ここで 数えません。
  const teaching = !!(band && band.teaching);
  const ratio = teaching ? SHEEP_WIDTH_RATIO_TEACHING : SHEEP_WIDTH_RATIO;

  // ★★羊の 大きさは、★測りません（★2026-09-10・2度目の 直し）。
  //   ★★1度目は useEffect で 測りました。★入れ物より 先に 走りました。
  //   ★★2度目は callback ref で 測りました。★それでも 大きく なりませんでした。
  //   ★★3度目に、★測る 必要そのものが 無いと 分かりました。
  //     ★SheepDressed の size は、★外側の div の width と height の
  //     ★★1か所でしか 使われていません（★SheepDressed.jsx:356）。
  //     ★中の 品は ぜんぶ ％で 置かれています。
  //   ★→ ★"100%" を 渡します。★入れ物の 幅が、そのまま 羊の 幅です。
  //     ★★測る 手が 無ければ、★測り損ねる 道も ありません。

  return (
    // ★★ゴシックで 固定します（★tokens.md §2「明朝は 使いません」）。
    //   ★★これを 書かないと、★親から .ff-display が 降りてきたときに
    //     ★数字の 0 が o に 見えます（★2026-09-09 の 実機「6時間o分」）。
    <div style={{ fontFamily: FONT_STACK }}>

      {/* ★★見出しと 歯車（★見本 .hd）。★歯車は「もっと」へ 行きます。
          ★★同意の撤回と 書き出しは、★法で 求められる 道です。★塞ぎません。 */}
      <ScreenHead title="きょう" right={
        <HeadRound mark="⚙" label="もっとを開く" onClick={onOpenMore} />
      } />

      {/* ★★本番の 朝だけ、★ご本人が 前に 書いた ことばを そのまま 返します。
          ★見本 S_kyou 577〜582行（★Opus の 裁定・2026-09-11・その15 ②）
          ★★アプリは 1文字も 足しません。★要約しません。★知らせも 出しません。
            ★書くように 誘いません。★書いて いない 方には、★枠ごと 出ません。
          ★★決めるのは lib/todayCard.js の morningWordsFor です。★ここで 決めません。
          ★★見本の 色　border-color:#CFC0A4 ／ background:#FDFAF3 */}
      {morning ? (
        <Card style={{ borderColor: "#CFC0A4", background: "#FDFAF3" }}>
          {morning.label ? <Usu style={{ marginTop: 0 }}>{morning.label}</Usu> : null}
          {/* ★★書かれた ままを 出します。★改行も そのままです。 */}
          <div style={{
            fontSize: rem(16), lineHeight: 1.95, margin: "7px 0 6px",
            color: C.ink, whiteSpace: "pre-wrap"
          }}>{morning.words}</div>
          <Usu style={{ marginTop: 0 }}>{MORNING_WORDS_FOOT}</Usu>
        </Card>
      ) : null}

      {/* ★★「どちらとして 見るか」（★2026-09-10・坂本さんの ご提案）。
          ★★門の中だけに 出ます。★一般の 方は、★これまでどおり じどう です。
          ★★これまでは、★その日に レッスンが あるかで 勝手に 決めていました。
            ★★どちらに 決まったかが、★どこにも 出ていませんでした。
            ★★作った 側も 使う 側も 分からず、★同じ 1行を 4度 直しました。
          ★★勝手に 決めるなら、★せめて どちらに 決めたかが 見えなければ なりません。
            ★見えないなら、★選べる ほうが よい。
          ★★これは 見え方の 選びです。★権限では ありません。 */}
      {canChooseViewAs && onViewAs ? (
        <>
          <Seg activeKey={viewAs} onSelect={onViewAs} items={VIEW_AS_MODES} />
          <Note style={{ margin: "-6px 0 10px" }}>
            {viewAsWord({ mode: viewAs, hasTeachingToday })}　の 画面です。
            この 選びは、この 端末だけに 残ります。
          </Note>
        </>
      ) : null}

      {/* ★★ひとこと・きょうの予定・近い本番（★見本 .speak と .obi）。
          ★★作り直しません。★門の外で もう 動いている TodayBand を、そのまま 呼びます。
            ★並び順（★§3-2 の 4行）も、★先生の 出欠も、★未送信の数も、
            ★★あちらが 持っています。★こちらに 写しを 作りません。
          ★★v2 は「★見本の 服を 着る」という 印だけです。
            ★出す行を 決めているのは、★どちらも lib/todayBand.js の buildBand です。
            ★★決めが 2つに 割れて いません。★見た目だけが 2つです。
          ★★該当がなければ、★その行を 出しません。
            ★「今日のレッスンはありません」と 書かないこと。
            ★★無いことを 毎朝 知らせるのは、★催促と 同じです。
          ★★A01（HTML・正）では、★ひとことが 予定より 上です。
            ★§3-2 は 下と 書いていますが、★README「HTMLが 正です」に 従います。 */}
      {band ? (
        <TodayBand {...band} todayISO={todayISO} v2
          sheepFirst={!teaching}
          sheepSlot={
            /* ★★羊。★見本では、★部屋を 出しません。★羊だけです。
               ★★大きさは 見本の 割合です（★2026-09-10・坂本さんの お決め）。
                 ★「以前の 判断（120px）を 優先せず、★見本の サイズ
                   （幅186px／画面360px＝51.7%）に、★合わせてください」
                 ★★数を ここに 書きません。★割合は lib/uiKit.js が 持ちます。
               ★★置き場所は 帯が 決めます。★A01 は いちばん上、
                 ★A02（先生）は 出欠の 帯の あとです。
                 ★★並べ方を ここに もう1つ 書くと、★片方だけ 直ります。 */
            /* ★★見本の 舞台（.stage）。★2026-09-11、★比較画像で 地が
                 ★ありませんでした。★羊が 紙の 上に 浮いて 見えて いました。
               ★★見本の CSS（77行）
                 background: linear-gradient(#F6EEDC,#EFE4CC)
                 border: 1px solid var(--line) ／ border-radius: 14 ／ height: 236
               ★★高さは 236 では なく、★羊の 大きさに 合わせます。
                 ★実装の 羊は 端末の 幅で 決まります（★見本は 132px の 固定）。
                 ★固定に すると、★大きい 端末で 上が 空きます。
               ★★影（.shadow）は 置きません。★見本は 動いて いますが、
                 ★この 帳面の 羊は motion="still" です。★動かない 影は 嘘に なります。 */
            <div style={{
              marginTop: 2, display: "flex", justifyContent: "center",
              background: "linear-gradient(#F6EEDC,#EFE4CC)",
              border: `1px solid ${C.line}`, borderRadius: 14,
              overflow: "hidden", marginBottom: 9
            }}>
              {/* ★★大きさは、★1つの CSS の 式で 決まります（lib/uiKit.js）。
                  ★★親の 高さを 尋ねません。★測りません。★％も 使いません。
                    ★どれも、★3度 試して 3度とも 効きませんでした。
                  ★★幅も 高さも 同じ 式なので、★必ず 正方形に なります。 */}
              <SheepDressed wearing={wearing || {}} colors={clothColors || {}} colors2={clothColors2 || {}}
                size={sheepCssSize(ratio)} motion="still" blink alt="羊" />
            </div>
          } />
      ) : null}

      {/* ★★㋑ 2枚の カード（こえの調子・ねむり）を 消しました。
          ★出どころ Opus の 裁定（★2026-09-11・その15）㋑
            「①消す（引っ越すではない）。理由は、行き先に、既に同じものがあり、
              かつ、朝に、昨日までの数字を見せることが、暗黙の判定に
              なってしまうためです。記録は消さず、消したことを、記録に
              残してください。」

          ★★2つの 理由を、★どちらも 書いて おきます。
            ★① 行き先に すでに 同じ ものが あります
              ★「ふりかえる → かぞえる」が「あなたの ふだん」を 持って います。
            ★② 朝に 昨日までの 数を 見せる ことが、★暗黙の 判定に なります
              ★★「ふだんより 低い」と、★画面が 言わなくても 読めて しまいます。
              ★★この 帳面は「きょうの調子の 判定を 出さない」と 決めて います
                （★見本 S_kyou の .note の 1行目）。

          ★★記録は 1つも 消して いません。★列も そのままです。
            ★消したのは「きょうの 画面に 出す」ことだけです。
          ★★消した ことは docs/reports/消したものの記録.md に 残しました。

          ★★出どころだった 見本（docs/design/pack/screens/A01-きょう生徒.html）は、
            ★2026-09-11 に 無効に なりました。★正は 4本の 動く見本 だけです。
            ★★いまの 見本 S_kyou に、★この 2枚は ありません。 */}

      {/* ★★記録へ（★見本 .btn）。★いちばん大きい 押しどころです。 */}
      <Btn onClick={onRecord}>きょうを 記録する</Btn>

      {/* ★★㋒ 見出し「みつけたこと」を 消しました。
          ★出どころ Opus の 裁定（★2026-09-11・その15）㋒
            「①消す。ただし、その計算が、他で使われていないか、grepで確認して
              から、消してください。」

          ★★確かめました（★2026-09-11）。
            ★topDiscoveries は、★ほかにも 2か所で 使われて います ──
              ★components/VocalTracker.jsx:18157（★分析タブの 1文）
              ★components/VocalTracker.jsx:18387（★その 続き）
            ★★どちらも activeTab === "analysis" && !layoutV2 の 中です。
              ★★門の外（38人）の 古い 分析画面です。
            ★★だから、★計算は 残します。★消すと 38人の 画面が 壊れます。
              ★消したのは「きょうの 画面に 出す」ことだけです。

          ★★出どころだった 見本（A01-きょう生徒.html）は 無効に なりました。
            ★いまの 見本 S_kyou に、★この 見出しは ありません。
          ★★中身も、★いま 1つも 出て いませんでした（★比較画像）。
            ★見出しだけが 立って いる 状態でした。 */}

      {/* ★★いちばん下の 3行（★見本 S_kyou の .note・613行）。
          ★★2026-09-11、★比較画像で 抜けて いました。
            ★★どれも「出しません」と 書いてある 行です。
              ★この 画面が 何を して いないかの 断りです。★飾りでは ありません。
          ★★見本は .note を 畳んで います（foldNotes）。★fold を 渡します。 */}
      <Note fold>
        {TODAY_NOTE.map((line, i) => (
          <span key={i}>{i > 0 ? <br /> : null}{line}</span>
        ))}
      </Note>
    </div>
  );
}
