"use client";

import { C } from "@/lib/tokens";
import { TYPE, SPACE, FONT_STACK, cardStyle } from "@/lib/uiKit";
import { ScreenHead, H3, Card, Pill, Warn, Note } from "@/components/UiV2";
import {
  DAILY_ASK_MAX, normalizeAsk, askItem, addAsk, removeAsk, restOf, canAdd
} from "@/lib/dailyAsk";

// ============================================================================
// ★「毎日、聞いてほしいこと」を えらぶ 画面（★見本 A10 ／ 2026-09-11）
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html:1281
//
//   ★★見本の 言葉（★1文字も 変えないこと）
//     「記録の 画面に 出す ものを 選べます。★5つまで。」
//     「★中核の 5つを 外しても かまいません
//       （★分析に 使うのは 5つですが、強制しません）」
//     「★足りない項目を 責めません。★『あと◯項目』を 出しません」
//
//   ★★「あと◯項目」を 出しません。★数えません。
//     ★★5つに なったら、★足せる 札を 押せなく するだけです。
//     ★お決め「ごほうびへの 残りを 出さない」と 同じ 形です。
//
//   ★★決めは lib/dailyAsk.js が 持ちます。★ここで 決めません。
//
//   ★見張り components/tests/daily-ask.test.js
// ============================================================================

export default function DailyAskPicker({ value, onChange }) {
  const list = normalizeAsk(value);
  const rest = restOf(list);
  const full = !canAdd(list);

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <ScreenHead title="毎日、聞いてほしいこと" />

      {/* ★★見本の 断り（.warn）。★1文字も 変えないこと。 */}
      <Warn>
        記録の 画面に 出す ものを 選べます。<b>5つまで</b>。
      </Warn>

      {/* ★★えらんだ もの。★並びも そのまま 出ます（★1・2・3…）。 */}
      <Card>
        {list.length === 0 ? (
          // ★★0でも かまいません。★責めません。
          <p style={{ ...TYPE.note, margin: 0 }}>
            いまは 1つも 選んでいません。下から 足せます。
          </p>
        ) : list.map((k, i) => {
          const it = askItem(k);
          return (
            <div key={k} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 0", ...TYPE.li,
              borderBottom: i === list.length - 1 ? "none" : `1px solid ${C.line2}`
            }}>
              <span style={{
                width: 15, flex: "none", fontSize: 11, color: C.inkSoft
              }}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0 }}>{it ? it.label : k}</span>
              <button type="button" onClick={() => onChange(removeAsk(list, k))}
                aria-label={(it ? it.label : k) + "を 外す"}
                style={{
                  minWidth: SPACE.tapMin, minHeight: SPACE.tapMin,
                  margin: "-11px 0", background: "transparent", border: "none",
                  color: C.inkSoft, fontSize: 15
                }}>×</button>
            </div>
          );
        })}
      </Card>

      <H3>足せるもの</H3>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: SPACE.cardGap }}>
        {rest.map((it) => (
          // ★★5つに なったら、★押せなく します。
          //   ★★「あと◯つ」とは 書きません。★数えません。
          <Pill key={it.key} disabled={full} onClick={() => onChange(addAsk(list, it.key))}>
            ＋ {it.label}
          </Pill>
        ))}
        {rest.length === 0 ? (
          <Note>ぜんぶ 選んでいます。</Note>
        ) : null}
      </div>

      {/* ★★見本の 註（.note）。★1文字も 変えないこと。 */}
      <Note>
        ★中核の 5つを 外しても かまいません（分析に 使うのは 5つですが、強制しません）。<br />
        ★足りない項目を 責めません。「あと◯項目」を 出しません。
      </Note>

      {/* ★★見本には ありませんが、★これは 書いておきます。
          ★★選ばなかった ものが「書けなく なる」と 読まれないためです。 */}
      <Note style={{ marginTop: 6 }}>
        ここで 選ばなかった ものも、記録の 画面の 折りたたみから いつでも 書けます。
        書けなく なる ものは、1つも ありません。
      </Note>
    </div>
  );
}
