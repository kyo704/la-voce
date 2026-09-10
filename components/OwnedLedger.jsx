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
import { ledgerLine, sortLedger, UNSEEN_HINTS, UNSEEN_TILES, NO_DATE_TEXT } from "@/lib/itemLedger";

const TABS = [
  { key: "ledger", label: "台帳" },
  { key: "all", label: "ぜんぶ" },
  { key: "unseen", label: "まだ" }
];

export default function OwnedLedger({
  ledger = [],          // ★item_acquisitions の 行
  ownedKeys = [],       // ★手もとに ある 鍵
  unseenKeys = [],      // ★まだ 見えていない 鍵（★中身は 出しません）
  nameOf,               // ★鍵 → 品の 名前
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
      background: C.bg, fontFamily: FONT_STACK,
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
              {rows.map((r, i) => (
                <Li key={r.item_key || i} last={i === rows.length - 1}
                  right={ledgerLine(r)}>
                  {label(r.item_key)}
                </Li>
              ))}
            </Card>
          )}

          <Note style={{ marginTop: rem(10) }}>
            いつ 手に入ったかと、そのときの 数が 残ります。
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
        <Card style={{ padding: `${rem(4)} ${rem(12)}` }}>
          {owned.length === 0
            ? <Li last>まだ、1つも ありません。</Li>
            : owned.map((k, i) => (
              <Li key={k} last={i === owned.length - 1}>{label(k)}</Li>
            ))}
        </Card>
      )}

      {tab === "unseen" && (
        <>
          {/* ★★中身を 見せません（★J06 の 注記）。★伏せた 札を 並べるだけです。 */}
          <div aria-hidden="true" style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: rem(7), marginBottom: rem(11)
          }}>
            {Array.from({ length: UNSEEN_TILES }, (_, i) => (
              <div key={i} style={{
                background: C.paper, border: `1px dashed ${C.line}`,
                borderRadius: 11, height: rem(78),
                display: "flex", alignItems: "center", justifyContent: "center",
                // ★★見本は #C0B09C（★.gr2 .c.no）ですが、★紙の上で 1.9 しか ありません。
                //   ★この家の 決め（★見やすさ・contrast の 見張り）は 4.5 です。
                //   ★★見本の ほうを 譲りました。★精査のときに、坂本さんへ お尋ねします。
                color: C.inkSoft, ...TYPE.title
              }}>？</div>
            ))}
          </div>

          <div style={{
            ...cardStyle, background: C.paper, borderColor: C.line,
            ...TYPE.body, lineHeight: 1.75
          }}>
            まだ 見えていないものが <b>{unseenKeys.length}つ</b> あります。
          </div>

          <H3>手に入る きっかけ</H3>
          <Card style={{ padding: `${rem(4)} ${rem(12)}` }}>
            {UNSEEN_HINTS.map((h, i) => (
              <Li key={h.label} last={i === UNSEEN_HINTS.length - 1} right={h.note}>
                {h.label}
              </Li>
            ))}
          </Card>

          {/* ★★「あと◯日」を 書きません。★きっかけの 種類だけです。
              ★調子の 良し悪しでは 手に入りません（★J06 の 注記）。 */}
          <Note style={{ marginTop: rem(10) }}>
            記録した、という行為だけで 手に入ります。
          </Note>
        </>
      )}
    </div>
  );
}
