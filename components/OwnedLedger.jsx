"use client";

// ============================================================================
// もっているもの ── 台帳／ぜんぶ／まだ（★見本 J05・J06）
//
//   ★出どころ docs/design/pack-final/screens/J05-台帳.html
//            docs/design/pack-final/screens/J06-まだ見えていないもの.html
//            docs/design/pack-final/screens/J05-台帳.notes.md
//            docs/design/pack-final/screens/J06-まだ見えていないもの.notes.md
//
//   ★★出さないもの（★注記に 名指しで あります）。
//     ・「あと◯日」／「あと◯点」　★2026-09-10 に 消した ものです。
//     ・まだの ものの 中身　　　　 ★数だけを 出します。
//     ・出来・点数・順位　　　　　 ★この 家に そもそも ありません。
//
//   ★★数え方は 累計だけです。★続いた 日数を 使いません（★J05 の 注記）。
//     ★途切れても、★失われません。
//
//   ★★この一枚は、★何も 決めません。
//     台帳の 言葉の 直し方は lib/itemLedger.js、
//     何が「まだ」かも lib/itemLedger.js が 決めます。
// ============================================================================

import { useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, SPACE, FONT_STACK, cardStyle, rem } from "@/lib/uiKit";
import { ScreenHead, HeadRound, Seg, Card, H3, Li, Note } from "@/components/UiV2";
import { ledgerLine, sortLedger, acquisitionReason, LEDGER_NOTE, NO_DATE_TEXT, OWNED_EMPTY_TEXT, OWNED_ONLY_NOTE } from "@/lib/itemLedger";

// ★★2026-09-11、★「まだ」の 札を 消しました。
//   ★出どころ docs/opus/回答-とだなの数字はどこか（9月10日）.md §3-2
//     「★『まだ』を 見せるのは、★欲しがらせる 装置です。★催促の 一種です」
//     「★枠が あれば、★数えられます。★出さないのと 同じに なりません」
//   ＋ 坂本さんの お決め（★2026-09-11）
//   ★★品も 台帳も、★1件も 触っていません。★出すのを やめただけです。
const TABS = [
  { key: "ledger", label: "台帳" },
  { key: "all", label: "ぜんぶ" }
];

export default function OwnedLedger({
  ledger = [],          // ★item_acquisitions の 行
  ownedKeys = [],       // ★手もとに ある 鍵
  nameOf,               // ★鍵 → 品の 名前
  // ★★鍵 → その言語の 言葉（★2026-09-15）。
  //   ★★この一枚は 言葉を 持ちません。★呼ぶ側の t() を 借ります。
  //     ★★渡されなければ、★理由の 行を 出しません。★鍵の 文字を 出しません。
  t,
  onClose
}) {
  const [tab, setTab] = useState("ledger");
  const label = (key) => {
    const n = nameOf ? nameOf(key) : null;
    return n || key;
  };

  // ★台帳に 載るのは、★日が 残っている ものだけです。
  //   ★★載らない ものが あることを、★下の 一行で お伝えします。
  //     ★黙って 消すと、★「買ったのに 無い」に なります。
  const rows = useMemo(() => sortLedger(ledger), [ledger]);
  const missing = Math.max(0, (ownedKeys || []).length - rows.length);

  const owned = useMemo(
    () => [...(ownedKeys || [])].sort((a, b) => label(a).localeCompare(label(b), "ja")),
    [ownedKeys, nameOf]   // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60, overflowY: "auto",
      // ★★2026-09-11、★C.bg と 書いていました。★そんな 色は ありません。
      //   ★★background: undefined に なり、★下の 画面が 透けていました
      //     （★実機で ご報告を いただきました）。
      //   ★lib/tokens.js に あるのは ink／inkSoft／paper／card／… です。
      background: C.paper, fontFamily: FONT_STACK,
      padding: `0 ${rem(SPACE.cardPadX)} calc(${rem(24)} + env(safe-area-inset-bottom))`
    }}>
      <ScreenHead title="もっているもの"
        right={<HeadRound mark="‹" label="もどる" onClick={onClose} />} />

      <Seg items={TABS} activeKey={tab} onSelect={setTab} />

      {tab === "ledger" && (
        <>
          {rows.length === 0 ? (
            <Card>
              <Li last>{NO_DATE_TEXT}</Li>
            </Card>
          ) : (
            <Card style={{ padding: `${rem(4)} ${rem(12)}` }}>
              {/* ★★見本 `SC['台帳']` の 1行 ──
                    名前の 下に、★何で 手に入ったかが 小さく 入ります。
                      「はおり ／ 記録が 50日に なった日 …… 2026年9月2日」
                    ★★入口の 札も こう 書いて います ──
                      「台帳（★いつ・**何で** 手に入ったか）」。
                    ★★2026-09-15 まで、★「何で」が 出て いませんでした。
                  ★★言葉を 決めるのは lib/itemLedger.js です。★ここでは ありません。
                    ★★引けない ときは 空文字 が 返ります。★その行は 出しません。 */}
              {rows.map((r, i) => {
                const why = t ? acquisitionReason(r, t) : "";
                return (
                  <Li key={r.item_key || i} last={i === rows.length - 1}
                    right={ledgerLine(r)} style={{ alignItems: "flex-start" }}>
                    <span>
                      {label(r.item_key)}
                      {why ? (
                        <>
                          <br />
                          <span style={{ ...TYPE.usual }}>{why}</span>
                        </>
                      ) : null}
                    </span>
                  </Li>
                );
              })}
            </Card>
          )}

          {/* ★★見本 `SC['台帳']` の `.note`・2行（★2026-09-15）。
                ★★2行目の 後半「連続日数を 出しません。」が 抜けて いました。
                  ★★禁止事項（★進捗バーの 一種）の 約束 です。
                  ★★`lib/character.js:173` に コメントでは ありましたが、
                    ★コメントは 画面では ありません。
                ★★字は lib/itemLedger.js が 持ちます。★ここに 書き写しません。 */}
          <Note style={{ marginTop: rem(10) }}>
            {LEDGER_NOTE.map((line, i) => (
              <span key={i}>{i > 0 ? <br /> : null}{line}</span>
            ))}
          </Note>

          {missing > 0 && (
            // ★★2026-09-11 より 前に 手に入れた ものには、日が ありません。
            //   ★きょうの 日で 埋めていません（★migration §5）。
            //   ★★「日が 無い」と「きょう もらった」は、別の ことです。
            <Note style={{ marginTop: rem(2) }}>
              これより 前に 手に入れた {missing}点は、{NO_DATE_TEXT}。
            </Note>
          )}

          <div style={{
            ...cardStyle,
            background: C.paper, borderColor: C.line,
            marginTop: rem(12), ...TYPE.body, lineHeight: 1.75
          }}>
            記録を 消しても、<b>手に入れたものは なくなりません。</b><br />
            <span style={{ ...TYPE.mini, color: C.inkSoft }}>
              数え直して 減ることは ありません。<br />
              いちど あなたのものに なったものは、あなたのものです。
            </span>
          </div>
        </>
      )}

      {tab === "all" && (
        <>
          <Card style={{ padding: `${rem(4)} ${rem(12)}` }}>
            {owned.length === 0
              ? (
                // ★★「あと◯日」と 書きません。★「いつか」です（★§3-3）。
                <Li last>
                  {OWNED_EMPTY_TEXT.split("\n").map((line, i) => (
                    <span key={i}>{i > 0 ? <br /> : null}{line}</span>
                  ))}
                </Li>
              )
              : owned.map((k, i) => (
                <Li key={k} last={i === owned.length - 1}>{label(k)}</Li>
              ))}
          </Card>
          {/* ★★隠しているように 見えます。★それで いいです（★§3-3）。
              ★見せて 欲しがらせるより、★見せないほうが この製品に 合っています。 */}
          <Note style={{ marginTop: rem(10) }}>{OWNED_ONLY_NOTE}</Note>
        </>
      )}

    </div>
  );
}
