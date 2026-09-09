"use client";

import { C } from "@/lib/tokens";
import SheepDressed from "@/components/SheepDressed";
import { conditionWord, sleepParts, usualOf } from "@/lib/todayCard";
import TodayBand from "@/components/TodayBand";
import {
  TYPE, SPACE, FONT_STACK, cardStyle, primaryButtonStyle
} from "@/lib/uiKit";

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
  band, onRecord, onOpenMore, children
}) {
  const today = (entries || {})[todayISO] || null;
  const cond = today ? conditionWord(today.throatCondition) : null;
  const condUsual = conditionWord(usualOf(entries, todayISO, (e) => e && e.throatCondition));
  // ★★ねむりは、★数と 単位で 大きさが ちがいます（★見本 .big / .big s）。
  //   ★だから 1本の 文字列では 出せません。★分けて 受け取ります。
  const sleep = today ? sleepParts(today.sleepHours) : null;
  const sleepUsual = sleepParts(usualOf(entries, todayISO, (e) => e && e.sleepHours));

  return (
    // ★★ゴシックで 固定します（★tokens.md §2「明朝は 使いません」）。
    //   ★★これを 書かないと、★親から .ff-display が 降りてきたときに
    //     ★数字の 0 が o に 見えます（★2026-09-09 の 実機「6時間o分」）。
    <div style={{ fontFamily: FONT_STACK }}>

      {/* ★★見出しと 歯車（★見本 .hd）。★歯車は「もっと」へ 行きます。
          ★★同意の撤回と 書き出しは、★法で 求められる 道です。★塞ぎません。 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 1px 6px"
      }}>
        <h2 style={TYPE.title}>きょう</h2>
        {/* ★★見本の 歯車は 26px の 丸です。★けれど 26px は 指に 小さすぎます。
            ★tokens.md §5「★押せるところは、どの段でも 44 以上」。
            ★★だから、★見えるのは 26px の まま、★押せるのは 44px に します。
              ★44 の 枠を 置き、★負の 余白で 行の 高さを 26 に 戻します。
              ★見た目は 見本と 同じ、★指は 44 ── ★どちらも 譲りません。 */}
        <button type="button" onClick={onOpenMore} aria-label="もっとを開く"
          style={{
            width: SPACE.tapMin, height: SPACE.tapMin,
            margin: `-9px -9px -9px 0`,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "transparent", border: "none", padding: 0
          }}>
          <span aria-hidden="true" style={{
            width: 26, height: 26, borderRadius: "50%",
            border: `1px solid ${C.line}`, background: C.card,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: C.inkSoft, fontSize: 12
          }}>⚙</span>
        </button>
      </div>

      {/* ★★羊。★見本では、★部屋を 出しません。★羊だけです。
          ★★大きさは 120 の ままに しています（★2026-09-10）。
            ★見本① は 幅の 51.7%（186／360）で、★いまの 実機は 約 22% です。
            ★★けれど 坂本さんから「180 では 大きすぎる」と 伺っています。
            ★★見本と お決めが 食い違う 1点なので、★勝手に 大きくしません。
              ★docs/design/compare/A01-きょう-見本と実機.html の ⑤に 数を 出し、
              ★お決めを いただいてから 変えます。 */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
        <SheepDressed wearing={wearing || {}} colors={clothColors || {}} colors2={clothColors2 || {}}
          size={120} motion="still" blink alt="羊" />
      </div>

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
      {band ? <TodayBand {...band} todayISO={todayISO} sheepFirst v2 /> : null}

      {/* ★★こえの調子 と ねむり（★見本 .two）。★2つ 並べます。
          ★★点数を 出しません。★言葉と、★あなたの ふだん だけです。
          ★★足りなければ、★黙って 空けます。「データ不足」と 書きません。 */}
      {(cond || sleep) && (
        <div style={{ display: "flex", gap: SPACE.cardGap, marginBottom: SPACE.cardGap }}>
          <div style={{ ...cardStyle, flex: 1, minWidth: 0 }}>
            <p style={TYPE.mini}>こえの調子</p>
            <p style={{ ...TYPE.big, margin: 0 }}>{cond || "—"}</p>
            {condUsual ? (
              <p style={{ ...TYPE.usual, marginTop: 2 }}>あなたのふだん　{condUsual}</p>
            ) : null}
          </div>
          <div style={{ ...cardStyle, flex: 1, minWidth: 0 }}>
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
          </div>
        </div>
      )}

      {/* ★★記録へ（★見本 .btn）。★いちばん大きい 押しどころです。 */}
      <button type="button" onClick={onRecord} style={primaryButtonStyle}>
        きょうを 記録する
      </button>

      {/* ★★みつけたこと（★見本 .h3 ＋ .card）。
          ★★見出しは いつも 出します。★中身が 無くても 出します。
            ★見本① に、★見出しだけの 姿でも 成り立つように 描かれています。
            ★★「まだ 何も ありません」とは 書きません。★責めに なります。
          ★中身は 呼ぶ側が 入れます（★分析の 側が 持っています）。 */}
      <p style={{ ...TYPE.h3, margin: `${SPACE.h3Top}px 0 ${SPACE.h3Bottom}px` }}>
        みつけたこと
      </p>
      {children}
    </div>
  );
}
