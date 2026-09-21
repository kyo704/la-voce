"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, H3, Card, Li, Note, Warn, Ask } from "@/components/UiV2";
import {
  HEAD, BACK_LABEL, KINDS, WARN_LINES, countWord, split,
  headOf, FAIL_WORD, EMPTY_HEAD, NOT_READ,
  openLabel, DELETE_LABEL, DELETE_ASK, NOTES
} from "@/lib/opsMisou";

// ============================================================================
// ★未送信（★見本 `P_misou`）
//
//   ★★決めは lib/opsMisou.js が 持ちます。★ここでは 決めません。
//   ★★★自動で 出しません。★押した ときだけ 出ます。
//   ★★★消す ときは 一度 お尋ねします（★戻せない ため）。
//
//   ★見張り components/tests/ops-misou.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsMisou({
  rows, onOpen, onDelete, onClose, busy, error = ""
}) {
  const [消す, set消す] = useState(null);
  const 分け = split(rows);

  const ひと枚 = (r, 印) => (
    <Card key={r.id} style={{
      marginTop: rem(8),
      borderLeft: `3px solid ${印 === "failed" ? C.curtain : C.gold}`
    }}>
      <div style={{ ...TYPE.li, color: C.ink }}>{headOf(r)}</div>
      {印 === "failed" ? (
        <p style={{ ...小, margin: "3px 0 0" }}>{FAIL_WORD}</p>
      ) : null}
      {/* ★★★押すと、★書く 画面が 開く だけ です（★裁定 その142）。
           ★★ここから 直に 出しません。★出すか どうかは、★書く 画面で
             ★もう一度 人が 決めます（★上の 約束 と 同じ 考え）。
           ★★★だから 中身が 空でも 押せます。★つづきを 書く ため です。
             ★★「中身が ありません」で 止めて いたのは、★直に 出して
               いた ころ の 名残り でした。 */}
      <div style={{ display: "flex", gap: 8, marginTop: rem(8) }}>
        <button type="button" disabled={busy}
          onClick={() => onOpen && onOpen(r)}
          style={{
            minHeight: 44, padding: `0 ${rem(14)}`, borderRadius: 999,
            border: `1px solid ${C.curtain}`, background: C.curtain,
            color: C.onCurtain,
            fontSize: rem(12.5), fontFamily: FONT_STACK
          }}>{openLabel(r)}</button>
        <button type="button" disabled={busy}
          onClick={() => set消す(r)}
          style={{
            minHeight: 44, padding: `0 ${rem(14)}`, borderRadius: 999,
            border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
            fontSize: rem(12.5), fontFamily: FONT_STACK
          }}>{DELETE_LABEL}</button>
      </div>
    </Card>
  );

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <ScreenHead title={HEAD} right={
        onClose ? (
          <button type="button" onClick={onClose}
            style={{
              background: "transparent", border: "none", color: C.inkSoft,
              ...TYPE.mini, minHeight: 44, padding: "0 4px", fontFamily: FONT_STACK
            }}>‹ {BACK_LABEL}</button>
        ) : null} />

      {分け === null ? (
        <Card><p style={{ ...小, margin: 0 }}>{NOT_READ}</p></Card>
      ) : (
        <>
          <p style={{ ...小, margin: "-4px 0 10px" }}>
            {countWord(rows)}　／　まだ 出して いない お知らせです
          </p>
          <Warn>
            {WARN_LINES.map((t) => <span key={t} style={{ display: "block" }}>{t}</span>)}
          </Warn>

          {rows.length === 0 ? (
            <Card style={{ marginTop: rem(8) }}>
              <p style={{ ...小, margin: 0 }}>{EMPTY_HEAD}</p>
            </Card>
          ) : KINDS.map((k) => {
            const なか = 分け[k.key];
            if (!なか || なか.length === 0) return null;
            return (
              <div key={k.key}>
                <H3>{k.label}　{なか.length}件</H3>
                <p style={{ ...小, margin: "-4px 0 0" }}>{k.note}</p>
                {なか.map((r) => ひと枚(r, k.key))}
              </div>
            );
          })}
          {error ? (
            <p style={{ ...小, margin: "8px 0 0", color: C.ink }}>{error}</p>
          ) : null}
        </>
      )}

      <Note>{NOTES.map((t) => <span key={t} style={{ display: "block" }}>{t}</span>)}</Note>

      {/* ★★★消す ときは 一度 お尋ねします。★戻せません。 */}
      {消す ? (
        <Ask title={DELETE_ASK} note={headOf(消す)}
          okLabel={DELETE_LABEL}
          onOk={() => { if (onDelete) onDelete(消す); set消す(null); }}
          onCancel={() => set消す(null)} />
      ) : null}
    </div>
  );
}
