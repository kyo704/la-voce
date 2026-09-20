"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { Card, Note, Pill, Btn, Li, Warn, Ask, H3, FieldLabel, Wl } from "@/components/UiV2";
import {
  EXPORT_HEAD, EXPORT_WARN, PICK_HEAD, PICK_SUB, PICK_NONE, CANNOT_HEAD, CANNOT_SUB,
  DO_LABEL, DETAIL_OPEN, DETAIL_CLOSE, NEVER_HEAD, NEVER_TAIL, NEVER_EXPORT,
  EXPORT_NOTES, EXPORT_NOT_YET, exportAsk, EXPORT_ASK_NOTE,
  ENCODINGS, NEWLINES, DATE_FORMATS, HEADER_PRESETS,
  exportSets, cannotExport, fileNameOf
} from "@/lib/opsExport";

// ============================================================================
// ★書き出す（★見本 `stExport`・裁定 その97 C群・2026-09-20）
//
//   ★★★体・声・ノートは、★一覧に すら ありません（★`EXPORT_SETS`）。
//     ★★選んで 外す のでは ありません。★はじめから 無い のです。
//     ★★それでも 名ざしで お伝えします（★下の「書き出せないもの」）。
//
//   ★★★出す 前に 一度 お尋ねします。★外へ 出す 行い だからです。
//   ★★★できない 形は 出しません。★何が まだ かを 字で 出します。
//
//   ★★決めは lib/opsExport.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/ops-export.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsExport({
  perms, rowsOf, todayISO = "", busy, error = "", onExport
}) {
  const 出せる = exportSets(perms);
  const [選び, set選び] = useState(出せる.length ? [出せる[0].key] : []);
  const [細かく, set細かく] = useState(false);
  const [文字, set文字] = useState(ENCODINGS[0]);
  const [改行, set改行] = useState(NEWLINES[0]);
  const [日付, set日付] = useState(DATE_FORMATS[0]);
  const [見出し, set見出し] = useState("そのまま");
  const [確かめ, set確かめ] = useState(null);

  const 選ばれた = 出せる.filter((s) => 選び.includes(s.key));
  const 行数 = (s) => (rowsOf ? (rowsOf(s.key, { dateFmt: 日付 }) || []).length : 0);
  const 合計 = 選ばれた.reduce((a, s) => a + 行数(s), 0);
  const 出せない = cannotExport(perms);

  const 切り替え = (k) => set選び((prev) => (prev.includes(k)
    ? prev.filter((x) => x !== k) : [...prev, k]));

  return (
    <div style={{ fontFamily: FONT_STACK, marginTop: 16 }} data-v2-export="1">
      <H3>{EXPORT_HEAD}</H3>
      <Warn>
        {EXPORT_WARN.map((t) => <span key={t} style={{ display: "block" }}>{t}</span>)}
      </Warn>

      <FieldLabel>{PICK_HEAD}</FieldLabel>
      <p style={{ ...小, margin: "-2px 0 6px" }}>{PICK_SUB}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {出せる.map((s) => (
          <Pill key={s.key} on={選び.includes(s.key)} onClick={() => 切り替え(s.key)}>
            {選び.includes(s.key) ? "✓ " : ""}{s.label}　{行数(s)}行
          </Pill>
        ))}
      </div>

      {出せない.length ? (
        <p style={{ ...小, margin: "7px 0 0" }}>
          {CANNOT_HEAD}　{出せない.join("・")}　{CANNOT_SUB}
        </p>
      ) : null}

      {選ばれた.length ? (
        <Card style={{ marginTop: rem(9), background: C.paper }}>
          <p style={{ ...小, margin: 0 }}>
            出る ファイル　{選ばれた.length}つ　／　合わせて {合計}行
          </p>
          <div style={{ ...小, color: C.ink, fontFamily: "ui-monospace, monospace" }}>
            {選ばれた.map((s) => (
              <div key={s.key}>{fileNameOf(s, todayISO)}　（{行数(s)}行）</div>
            ))}
          </div>
        </Card>
      ) : (
        <p style={{ ...小, color: C.curtain, margin: "8px 0 0" }}>{PICK_NONE}</p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: `${rem(12)} 0 ${rem(4)}` }}>
        <Btn disabled={busy || 選ばれた.length === 0}
          onClick={() => set確かめ({ sets: 選ばれた })}>
          {選ばれた.length > 1 ? `まとめて ${DO_LABEL}（${選ばれた.length}つ）` : DO_LABEL}
        </Btn>
        <Btn ghost small onClick={() => set細かく((v) => !v)}>
          {細かく ? DETAIL_CLOSE : DETAIL_OPEN}
        </Btn>
      </div>
      <p style={{ ...小, margin: "0 0 6px" }}>
        いま　CSV　{文字}　{改行}　／　日付 {日付}　／　見出し {見出し}
      </p>

      {細かく ? (
        <Card>
          <FieldLabel>文字コード</FieldLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ENCODINGS.map((v) => (
              <Pill key={v} on={文字 === v} onClick={() => set文字(v)}>{v}</Pill>
            ))}
          </div>
          <FieldLabel>改行</FieldLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {NEWLINES.map((v) => (
              <Pill key={v} on={改行 === v} onClick={() => set改行(v)}>{v}</Pill>
            ))}
          </div>
          <FieldLabel>日付の 形</FieldLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {DATE_FORMATS.map((v) => (
              <Pill key={v} on={日付 === v} onClick={() => set日付(v)}>{v}</Pill>
            ))}
          </div>
          <FieldLabel>見出しの 対応表</FieldLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.keys(HEADER_PRESETS).map((v) => (
              <Pill key={v} on={見出し === v} onClick={() => set見出し(v)}>{v}</Pill>
            ))}
          </div>

          {/* ★★★できない 形を、★黙って 消しません。★名ざしで 出します。 */}
          <Wl style={{ marginTop: rem(10) }}>
            {EXPORT_NOT_YET.map((x) => (
              <span key={x.key} style={{ display: "block" }}>
                {x.line}　── まだ です。{x.why}。
              </span>
            ))}
          </Wl>
        </Card>
      ) : null}

      {error ? <p style={{ ...小, margin: "8px 0 0", color: C.ink }}>{error}</p> : null}

      <H3>{NEVER_HEAD}</H3>
      <Card style={{ padding: 0 }}>
        {NEVER_EXPORT.map((v, i) => (
          <Li key={v} last={i === NEVER_EXPORT.length - 1}
            style={{ color: C.inkSoft }}
            right={<span style={小}>{NEVER_TAIL}</span>}>{v}</Li>
        ))}
      </Card>

      <Note>
        {EXPORT_NOTES.map((n) => (
          <span key={n.text} style={{ display: "block" }}>{n.text}</span>
        ))}
      </Note>

      {確かめ ? (
        <Ask
          title={exportAsk(確かめ.sets.map((s) => s.label), 合計)}
          note={EXPORT_ASK_NOTE}
          okLabel={DO_LABEL}
          onOk={() => {
            if (onExport) {
              onExport(確かめ.sets, {
                encoding: 文字, newline: 改行, dateFmt: 日付, preset: 見出し
              });
            }
            set確かめ(null);
          }}
          onCancel={() => set確かめ(null)} />
      ) : null}
    </div>
  );
}
