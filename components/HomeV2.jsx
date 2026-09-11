"use client";

import { C } from "@/lib/tokens";
import SheepDressed from "@/components/SheepDressed";
import { conditionWord, sleepParts, usualOf, TODAY_NOTE } from "@/lib/todayCard";
import TodayBand from "@/components/TodayBand";
import {
  TYPE, SPACE, FONT_STACK, SHEEP_WIDTH_RATIO, SHEEP_WIDTH_RATIO_TEACHING,
  sheepCssSize
} from "@/lib/uiKit";
import { ScreenHead, HeadRound, H3, Seg, Note, Card, Two, Btn } from "@/components/UiV2";
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
  band, onRecord, onOpenMore, children,
  viewAs = "auto", onViewAs, canChooseViewAs = false, hasTeachingToday = false
}) {
  const today = (entries || {})[todayISO] || null;
  // ★★「こえの調子」は 声の 出来です（★voiceQuality ／ 2026-09-11 に 直しました）。
  //   ★★前は throatCondition（★のどの 身体感覚）を 読んでいました。
  //     ★★9月9日の 古い見本は 3択が 1つだけで、★「出た／ふつう／出づらい」を
  //       ★のどの 列に 書いていました。★言葉と 列が ずれていました。
  //   ★★正しい 見本（S_kiroku）は 3択が 2つです ──
  //     ★のどの 調子（よい／ふつう／わるい）→ throat_condition
  //     ★声の 出来（出た／ふつう／出づらい）→ voice_quality
  //   ★★conditionWord が 返すのは「出た／ふつう／出づらい」なので、
  //     ★読むのは voiceQuality です。★38人が 声の出来の 目盛りで 書いてきた 列です。
  const cond = today ? conditionWord(today.voiceQuality) : null;
  const condUsual = conditionWord(usualOf(entries, todayISO, (e) => e && e.voiceQuality));
  // ★★ねむりは、★数と 単位で 大きさが ちがいます（★見本 .big / .big s）。
  //   ★だから 1本の 文字列では 出せません。★分けて 受け取ります。
  const sleep = today ? sleepParts(today.sleepHours) : null;
  const sleepUsual = sleepParts(usualOf(entries, todayISO, (e) => e && e.sleepHours));

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

      {/* ★★こえの調子 と ねむり（★見本 .two）。★2つ 並べます。
          ★★点数を 出しません。★言葉と、★あなたの ふだん だけです。
          ★★足りなければ、★黙って 空けます。「データ不足」と 書きません。 */}
      {/* ★★教える日も 出します（★案B・2026-09-10・坂本さんの お決め）。
          ★★見本② には 描かれていませんが、★出さないと、
            ★教える日だけ ご自分の 記録が 見えなく なります。 */}
      {(cond || sleep) && (
        <Two style={{ marginBottom: SPACE.cardGap }}>
          <Card style={{ flex: 1, minWidth: 0 }}>
            <p style={TYPE.mini}>こえの調子</p>
            <p style={{ ...TYPE.big, margin: 0 }}>{cond || "—"}</p>
            {condUsual ? (
              <p style={{ ...TYPE.usual, marginTop: 2 }}>あなたのふだん　{condUsual}</p>
            ) : null}
          </Card>
          <Card style={{ flex: 1, minWidth: 0 }}>
            <p style={TYPE.mini}>ねむり</p>
            <p style={{ ...TYPE.big, margin: 0 }}>
              {sleep ? sleep.map((p, i) => (
                <span key={i}>
                  {p.n}
                  {/* ★★単位は 小さく（★見本 .big s ── 12px・400・左に 3px）。
                      ★★「6時間20分」を ぜんぶ 同じ 大きさで 出すと、
                        ★数が 読み取りにくく なります。 */}
                  <span style={{ ...TYPE.bigUnit, marginLeft: 3 }}>{p.u}</span>
                </span>
              )) : "—"}
            </p>
            {sleepUsual ? (
              <p style={{ ...TYPE.usual, marginTop: 2 }}>
                あなたのふだん　{sleepUsual.map((p) => p.n + p.u).join("")}
              </p>
            ) : null}
          </Card>
        </Two>
      )}

      {/* ★★記録へ（★見本 .btn）。★いちばん大きい 押しどころです。 */}
      <Btn onClick={onRecord}>きょうを 記録する</Btn>

      {/* ★★みつけたこと（★見本 .h3 ＋ .card）。
          ★★見出しは いつも 出します。★中身が 無くても 出します。
            ★見本① に、★見出しだけの 姿でも 成り立つように 描かれています。
            ★★「まだ 何も ありません」とは 書きません。★責めに なります。
          ★中身は 呼ぶ側が 入れます（★分析の 側が 持っています）。 */}
      {/* ★★教える日も 出します（★案B・2026-09-10・坂本さんの お決め）。 */}
      <H3>みつけたこと</H3>
      {children}

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
