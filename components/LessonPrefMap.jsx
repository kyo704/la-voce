"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { DAYS } from "@/lib/myTimetable";
import {
  slotKey, prefWeight, densityPercent, isDarkCell, cellWord,
  MAP_NOTE, MAP_NOTE_LINES, MAP_EMPTY_HEAD, MAP_EMPTY_HOW,
  MAP_NO_ROUND_HEAD, MAP_NO_ROUND_SUB
} from "@/lib/lessonRound";
import { Back } from "@/components/UiV2";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★希望の 地図（★先生・事務）── ★見本 `P_wariMap`
//
//   ★出どころ woolsong-2026-09-21_7.zip ／ 00-動く見本-PC・iPad（運営）.html
//     ★md5 29e1d658。★2026-09-23 に 展開し、★docs/design/pack-final/ に 入れました。
//
//   ★★★決めは `lib/lessonRound.js` が 持ちます。★ここでは 1つも 決めません。
//     ★重み（◎×2＋△）／ 濃さ（％）／ 白字に するか ／ マスの 字 ── ★ぜんぶ 借ります。
//
//   ★★★名前は、★**押した ときだけ** 出します（★実行ルートの 決め）。
//     「★学生の 名前は 地図に 出さない（★押したときだけ）」
//     ★★地図は「いつ 空いて いるか」を 見る もの です。
//       ★誰が いつ 空いて いるかを、★一覧で 見せる もの では ありません。
//     ★★★だから `counts`（数）と `namesOf`（押した ときだけ 呼ぶ）を 分けて 受け取ります。
//       ★名前の 一覧を props で 受け取りません。★受け取れば、★出して しまえます。
//
//   ★★体の 記録は 1つも 出しません。★受け取っても いません。
//
//   ★見張り components/tests/lesson-pref-map.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };

export default function LessonPrefMap({
  round, periods = [], counts = {}, namesOf, placed = {}, busy = {}, onBack
}) {
  const [選, set選] = useState(null);
  // ==========================================================================
  // ★★★回が 無い ときに、★白い 画面に しません（★2026-09-24・Opus の ご指摘）。
  //   ★★前は `return null` でした。★何も 出ません。
  //     ★★★「読み込み中」と「無い」と「壊れた」が、★同じ 顔に なります。
  //   ★★見本も そう して います ── `SC['コマの中身']` は
  //     「外れて います。戻って 置き直して ください。」と 出します。
  //   ★★責めません。★次に 何を すれば よいかだけ を 書きます。
  // ==========================================================================
  if (!round) {
    return (
      <div style={{ fontFamily: FONT_STACK }}>
        {onBack ? <Back onClick={onBack}>{tx("もどる")}</Back> : null}
        <p style={{ ...TYPE.li, color: C.ink, margin: `${rem(10)} 0 ${rem(4)}` }}>
          {tx(MAP_NO_ROUND_HEAD)}
        </p>
        <p style={小}>{tx(MAP_NO_ROUND_SUB)}</p>
      </div>
    );
  }

  // ★★★いちばん 濃い ところを 先に 数えます（★見本と 同じ）。
  let 最大 = 1;
  periods.forEach((p) => DAYS.forEach((d, di) => {
    const c = counts[slotKey(di, p.id)] || {};
    最大 = Math.max(最大, prefWeight(c.maru, c.sankaku));
  }));

  const 名 = 選 && namesOf ? namesOf(選) : null;

  return (
    <div>
      {onBack ? (
        <button type="button" onClick={onBack}
          style={{
            minHeight: 44, padding: `0 ${rem(11)}`, borderRadius: 999, marginBottom: rem(6),
            border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
            fontFamily: FONT_STACK, ...TYPE.usual
          }}>‹ {tx("レッスン割")}</button>
      ) : null}
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(4)}` }}>
        {tx("希望の 地図")}
      </h2>
      <div style={{ ...小, marginBottom: rem(10) }}>
        {round.name}　／　{tx(MAP_NOTE)}
      </div>

      <div style={{ display: "flex", gap: rem(12), alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: 3, minWidth: 0, overflowX: "auto" }}>
          <table style={{
            width: "100%", borderCollapse: "separate", borderSpacing: rem(3),
            tableLayout: "fixed", ...TYPE.li
          }}>
            <thead>
              <tr>
                <th style={{ width: "18%", fontWeight: 500, color: C.inkSoft }}>{tx("コマ")}</th>
                {DAYS.map((d) => (
                  <th key={d} style={{ fontWeight: 500, color: C.inkSoft }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.id}>
                  <td style={{ color: C.inkSoft, lineHeight: 1.3, ...TYPE.usual }}>{p.name}</td>
                  {DAYS.map((d, di) => {
                    const k = slotKey(di, p.id);
                    const 置 = placed[k];
                    const 塞 = busy[k];
                    if (置) {
                      return (
                        <td key={d}>
                          <div style={{
                            minHeight: 46, borderRadius: 9, background: C.band2,
                            color: C.ink, display: "flex", alignItems: "center",
                            justifyContent: "center", ...TYPE.usual
                          }}>{tx("置きました")}</div>
                        </td>
                      );
                    }
                    if (塞) {
                      return (
                        <td key={d}>
                          <div style={{
                            minHeight: 46, borderRadius: 9, background: C.line2,
                            color: C.inkSoft, display: "flex", alignItems: "center",
                            justifyContent: "center", ...TYPE.usual
                          }}>{tx("入りません")}</div>
                        </td>
                      );
                    }
                    const c = counts[k] || {};
                    const 重 = prefWeight(c.maru, c.sankaku);
                    const 濃 = densityPercent(重, 最大);
                    const 暗 = isDarkCell(濃);
                    return (
                      <td key={d}>
                        <button type="button" onClick={() => set選(k)}
                          style={{
                            width: "100%", minHeight: 46, borderRadius: 9, border: "none",
                            fontFamily: FONT_STACK, cursor: "pointer",
                            background: `color-mix(in srgb, ${C.curtain} ${濃}%, ${C.card})`,
                            color: 暗 ? C.onCurtain : C.ink,
                            outline: 選 === k ? `2px solid ${C.ink}` : "none",
                            outlineOffset: -2, ...TYPE.li
                          }}>
                          {cellWord(c.maru, c.sankaku)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: 1.3, minWidth: 250 }}>
          {/* ★★★押すまで 名前は 出ません。★`namesOf` も 呼びません。 */}
          {!選 ? (
            <div style={{
              background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
              padding: `${rem(22)} ${rem(10)}`, textAlign: "center"
            }}>
              <div style={{ ...TYPE.li, color: C.ink }}>{tx(MAP_EMPTY_HEAD)}</div>
              <div style={{ ...小, marginTop: rem(4) }}>{tx(MAP_EMPTY_HOW)}</div>
            </div>
          ) : (
            <div style={{
              background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
              padding: rem(12)
            }}>
              {(名 || []).map((x) => (
                <div key={x.id || x.name} style={{
                  ...TYPE.li, padding: `${rem(6)} 0`, borderBottom: `1px solid ${C.line2}`
                }}>
                  {x.name}　<span style={小}>{x.mark}</span>
                </div>
              ))}
              {(名 || []).length === 0 ? (
                <div style={小}>{tx("この コマに 来られる方は、まだ いません。")}</div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* ★★★見本の 但し書き。★1字 も 足しません。
          ★3行目が かなめ です ── ★◎の 多い方から 順に 並べません。
          ★★並べ替えると、★上に 出た 方が 先に 置かれます。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {MAP_NOTE_LINES.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
