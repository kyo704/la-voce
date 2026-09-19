"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { H3, Box, Li, Note, Usu, Warn, FieldLabel, Input } from "@/components/UiV2";
import {
  NAME_HEAD, NAME_SUB, NAME_FIELDS, NAME_NOTES, mayChangeBilling, VIEW_ONLY_LINE,
  ATESAKI_HEAD, ATESAKI_NOTES, ATESAKI_EMPTY, ATESAKI_EMPTY_HOW, atesakiCandidates,
  // ★★支払い方法（★お決め D13・2026-09-19）。★いま 選べるのは 請求書 だけ です。
  METHOD_HEAD, METHOD_CHOICES, readyMethods, notYetMethods,
  INVOICE_YEARLY_ONLY, METHOD_NOTES, METHOD_LABELS
} from "@/lib/orgBilling";

// ============================================================================
// ★請求書の 宛名・送り先 ／ ★ご請求の 宛先（★見本 `P_seikyuNa` ／ `P_atesaki`）
//
//   ★★★変えられるのは「お支払い」（`bill_pay`）を 持つ 方 だけ です。
//     ★★台帳の 門も そう 直しました（★2026-09-19）。
//     ★★きょうまで、★**見る できこと（`bill`）で 書けて** いました。
//
//   ★★★カード番号・口座番号を 置きません。★欄が ありません。
//     ★★入れる ところが 無ければ、★入りません。
//
//   ★★変えた ことは 記録に 残ります（★誰が・いつ・何を）。★消せません。
//
//   ★見張り components/tests/ops-billing-name.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsBillingName({
  row, perms, members = [], nameOf, log = [],
  onSave, onHandOver, onPickMethod, saving, error = ""
}) {
  const 変えられる = mayChangeBilling(perms);
  const [下書き, set下書き] = useState(null);
  const [確かめ, set確かめ] = useState(null);
  const p = { ...(row || {}), ...(下書き || {}) };
  const 候補 = atesakiCandidates(members, (row || {}).atesaki_user_id);

  // ★★どこを 直したか（★記録に 残す ため）。
  const 直した = NAME_FIELDS
    .filter((f) => 下書き && Object.prototype.hasOwnProperty.call(下書き, f.key))
    .map((f) => f.label);

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      {/* ★★★支払い方法（★見本 `P_pay`・お決め D13）。
          ★★いま 選べるのは「銀行振込（請求書）」だけ です。
            ★★カードと 口座振替は、★外の 画面が 前提 です。★その 道が ありません。
            ★★★押せる 札に しません。★「まだ」と 名ざしで お伝えします（★§8⑤）。
          ★★カード番号・口座番号の 欄は ありません。★台帳にも 列が ありません。 */}
      <H3>{METHOD_HEAD}</H3>
      <Box>
        {readyMethods().map((m, i, a) => {
          const いま = (row || {}).method === m.value;
          return (
            <Li key={m.key} last={i === a.length - 1}
              right={いま
                ? <span style={{ color: C.sage }}>いま これです</span>
                : (変えられる ? "これに する" : "")}
              onClick={変えられる && !いま ? () => onPickMethod && onPickMethod(m) : null}>
              {m.label}
              <div style={小}>{m.note}</div>
            </Li>
          );
        })}
      </Box>
      {(row || {}).method === "invoice" ? <Usu>{INVOICE_YEARLY_ONLY}</Usu> : null}
      <Box>
        {notYetMethods().map((m, i, a) => (
          <Li key={m.key} last={i === a.length - 1} right="まだ">
            {m.label}
            <div style={小}>{m.needs}</div>
          </Li>
        ))}
      </Box>
      <Note>{METHOD_NOTES.map((t) => (<div key={t}>{t}</div>))}</Note>

      <H3>{NAME_HEAD}</H3>
      <Usu>{NAME_SUB}</Usu>

      {!変えられる ? (
        <>
          <Warn>{VIEW_ONLY_LINE}</Warn>
          <Box>
            {NAME_FIELDS.map((f, i) => (
              <Li key={f.key} last={i === NAME_FIELDS.length - 1}
                right={p[f.key] || "（まだ です）"}>{f.label}</Li>
            ))}
          </Box>
        </>
      ) : (
        <>
          {NAME_FIELDS.map((f) => (
            <div key={f.key}>
              <FieldLabel>{f.label}</FieldLabel>
              <Input value={p[f.key] || ""} placeholder={f.hint}
                onChange={(e) => set下書き((prev) =>
                  ({ ...(prev || {}), [f.key]: e.target.value }))} />
            </div>
          ))}
          <div style={{ marginTop: rem(10) }}>
            <button type="button" disabled={saving || !下書き}
              onClick={async () => {
                const ok = await onSave(下書き, 直した);
                if (ok !== false) set下書き(null);
              }}
              style={{
                minHeight: 48, padding: `0 ${rem(18)}`, borderRadius: 999,
                border: `1px solid ${C.curtain}`,
                background: 下書き ? C.curtain : C.line, color: "#FFFDF8",
                ...TYPE.mini, fontFamily: FONT_STACK
              }}>これで いい</button>
          </div>
        </>
      )}
      <Note>{NAME_NOTES.map((t) => (<div key={t}>{t}</div>))}</Note>

      {/* ★★★ご請求の 宛先（名義）── ★1人 だけ。★引き継ぎは 一方通行 です。 */}
      <H3>{ATESAKI_HEAD}</H3>
      <Box>
        <Li last right={(row || {}).atesaki_name || "（まだ です）"}>いまの 宛先</Li>
      </Box>
      {変えられる ? (
        候補.length ? (
          <Box>
            {候補.map((m, i) => (
              <Li key={m.user_id} last={i === 候補.length - 1}
                right={確かめ === m.user_id ? "もう一度 押すと 変わります" : "この方に する"}
                onClick={async () => {
                  if (確かめ !== m.user_id) { set確かめ(m.user_id); return; }
                  const ok = await onHandOver(m);
                  if (ok !== false) set確かめ(null);
                }}>
                {nameOf ? nameOf(m.user_id) : ""}
                <div style={小}>{m.postName || ""}</div>
              </Li>
            ))}
          </Box>
        ) : (
          <div style={{ marginTop: rem(6) }}>
            <p style={{ ...TYPE.li, color: C.ink, margin: 0 }}>{ATESAKI_EMPTY}</p>
            <p style={小}>{ATESAKI_EMPTY_HOW}</p>
          </div>
        )
      ) : null}
      <Note>{ATESAKI_NOTES.map((t) => (<div key={t}>{t}</div>))}</Note>

      {/* ★★記録（★誰が・いつ・何を）。★消せません。 */}
      {log.length > 0 ? (
        <>
          <H3>記録</H3>
          <Box>
            {log.map((x, i) => (
              <Li key={x.id || i} last={i === log.length - 1}
                right={String(x.created_at || "").slice(0, 10)}>
                {x.what}
                <div style={小}>{nameOf ? nameOf(x.actor_id) : ""}</div>
              </Li>
            ))}
          </Box>
        </>
      ) : null}

      {error ? (
        <p style={{ ...小, color: C.curtain, margin: `${rem(8)} 0 0` }}>{error}</p>
      ) : null}
      {saving ? <p style={小}>書いて います…</p> : null}
    </div>
  );
}
