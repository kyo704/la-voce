// ============================================================================
// ★公演の 一覧（★2026-09-25・D群）
//
//   ★見本 `SC['公演の一覧']`（★design-v63）。
//
//   ★★★公演は いくつも 同時に 動きます。★1つ 前提に しません。
//   ★★掛け持ちは お互いに 見えません ── ★決まりが 守って います。
//   ★★終わった 公演も 残します。★消しません。
//   ★★字と 並べ替えは `lib/koenList.js` が 持ちます。★ここでは 決めません。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back, Box } from "@/components/UiV2";
import useWindowWidth from "@/components/useWindowWidth";
import {
  TITLE, BACK_TO, subLine, NOW_MARK, BTN_JOIN, EMPTY_LINE, EMPTY_HOW,
  DONE_MARK, sortRows, NOTE_LINES,
  TABLE_COLUMNS, showTable, BTN_NEW, peopleWord, untilWord, opsNoteLines
} from "@/lib/koenList";

export default function KoenList({
  rows, nowId, canManage, onOpen, onJoin, onNew, onBack
}) {
  const 並 = sortRows(rows);
  // ★★幅を 見ます。★分からない うちは 札（狭い ほう）に 倒します。
  const 幅 = useWindowWidth();
  const 表 = showTable(幅);
  const いま = (並.find((r) => r.id === nowId) || {}).title || "";

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={TITLE} />
      <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "0 0 10px" }}>
        {subLine(並.length)}
      </p>

      {並.length === 0 ? (
        <div>
          <p style={{ fontSize: "0.875rem", color: C.ink }}>{EMPTY_LINE}</p>
          <p style={{ fontSize: "0.8125rem", color: C.inkSoft, marginTop: 4 }}>{EMPTY_HOW}</p>
        </div>
      ) : 表 ? (
        /* ★★★広い とき ── ★表（★運営の 見本 `P_koenList`）。
             ★★別の 画面では ありません。★同じ 一覧の 広い ときの 形 です。
             ★★横に 切れる ときは この 中だけ 流します。★体ごと 流しません。 */
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 660 }}>
            <thead>
              <tr>
                {TABLE_COLUMNS.map((c) => (
                  <th key={c.key} style={{
                    textAlign: c.num ? "right" : "left", padding: "9px 10px",
                    fontSize: "0.75rem", color: C.inkSoft, fontWeight: 600,
                    borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap"
                  }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {並.map((r) => (
                <tr key={r.id} onClick={() => onOpen && onOpen(r.id)}
                  style={{
                    cursor: "pointer",
                    background: r.id === nowId ? C.paper : "transparent"
                  }}>
                  <td style={{ padding: "10px", borderBottom: `1px solid ${C.line}` }}>
                    <span style={{ fontSize: "0.875rem", color: C.ink, fontWeight: 600 }}>
                      {r.title}
                    </span>
                    {r.done ? (
                      <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>　{DONE_MARK}</span>
                    ) : null}
                    {r.org ? (
                      <span style={{
                        display: "block", fontSize: "0.75rem", color: C.inkSoft, marginTop: 2
                      }}>{r.org}</span>
                    ) : null}
                  </td>
                  <td style={{ padding: "10px", borderBottom: `1px solid ${C.line}`,
                    fontSize: "0.8125rem", color: C.ink }}>
                    {r.openOn || "—"}
                    {r.next ? (
                      <span style={{
                        display: "block", fontSize: "0.75rem", color: C.inkSoft, marginTop: 2
                      }}>つぎ {r.next}</span>
                    ) : null}
                  </td>
                  <td style={{ padding: "10px", borderBottom: `1px solid ${C.line}`,
                    fontSize: "0.8125rem", color: C.ink, textAlign: "right",
                    whiteSpace: "nowrap" }}>
                    {peopleWord(r.people, r.cap)}
                  </td>
                  <td style={{ padding: "10px", borderBottom: `1px solid ${C.line}`,
                    fontSize: "0.8125rem", color: C.inkSoft, whiteSpace: "nowrap" }}>
                    {untilWord(r.until)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Box>
          {並.map((r, i) => (
            <button key={r.id} type="button" onClick={() => onOpen && onOpen(r.id)}
              style={{
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                gap: 12, width: "100%", minHeight: 44, padding: "12px 14px",
                border: "none", background: "none", textAlign: "left",
                borderTop: i === 0 ? "none" : `1px solid ${C.line}`, cursor: "pointer"
              }}>
              <span style={{ flex: 1 }}>
                <span style={{ fontSize: "0.875rem", color: C.ink, fontWeight: 600 }}>
                  {r.title}
                </span>
                {/* ★★いま 見て いる 公演に 印。★ほかを 薄く しません。 */}
                {r.id === nowId ? (
                  <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>　{NOW_MARK}</span>
                ) : null}
                {/* ★★終わった 公演も 出します。★見るだけ と 書きます。 */}
                {r.done ? (
                  <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>　{DONE_MARK}</span>
                ) : null}
                {/* ★★主催が 無い ことが あります。★「主催なし」と 書きません。 */}
                {r.org || r.part ? (
                  <span style={{
                    display: "block", fontSize: "0.75rem", color: C.inkSoft, marginTop: 2
                  }}>{[r.org, r.part].filter(Boolean).join("　")}</span>
                ) : null}
                {r.openOn || r.next ? (
                  <span style={{
                    display: "block", fontSize: "0.75rem", color: C.inkSoft, marginTop: 2
                  }}>
                    {r.openOn ? "本番 " + r.openOn : ""}
                    {r.openOn && r.next ? "　／　つぎ " : ""}
                    {!r.openOn && r.next ? "つぎ " : ""}
                    {r.next}
                  </span>
                ) : null}
              </span>
              <span style={{ fontSize: "0.75rem", color: C.inkSoft, whiteSpace: "nowrap" }}>›</span>
            </button>
          ))}
        </Box>
      )}

      {/* ★★作る 方には「公演を 作る」。★出る 方には「公演に 入る」。
          ★★★持って いない 方には 出しません（★押せない 札を 置きません）。 */}
      {canManage ? (
        <button type="button" onClick={onNew}
          style={{
            display: "block", width: "100%", minHeight: 44, marginTop: 11,
            borderRadius: 10, border: "none", background: C.curtain,
            color: C.onCurtain, fontSize: "0.9375rem", cursor: "pointer"
          }}>{BTN_NEW}</button>
      ) : null}
      <button type="button" onClick={onJoin}
        style={{
          display: "block", width: "100%", minHeight: 44, marginTop: canManage ? 8 : 11,
          borderRadius: 10, border: `1px solid ${C.line}`, background: C.card,
          color: C.ink, fontSize: "0.9375rem", cursor: "pointer"
        }}>{BTN_JOIN}</button>

      {/* ★★断りは 立場で 変わります。★作る 方には「いま 開いて いるのは」から。
          ★★★どちらの 3行目も 同じ 約束 です ──「終わった 公演も 残ります」。 */}
      <div style={{ marginTop: 14 }}>
        {(canManage ? opsNoteLines(いま) : NOTE_LINES).map((l, i) => (
          <p key={i} style={{
            fontSize: "0.75rem", color: i === 0 ? C.ink : C.inkSoft, lineHeight: 1.9
          }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
