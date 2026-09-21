"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, Card, Note, Btn, Li, H3, Pill } from "@/components/UiV2";
import {
  HEAD, KINDS, FEE_UNITS, HEADS, OPTIONAL,
  ALL_DAYS_LABEL, ALL_DAYS_SUB, ANY_DAY_LABEL, SCHEDULE_NOTE,
  SODAN_LABEL, SODAN_SUB, PIECE_HINT, SUBMIT,
  NOTES, NOTES_BOLD, NOT_YET, EXPIRE_HEAD, EXPIRES, EXPIRE_NOTE,
  emptyForm, canSubmit, whyNot, toRow
} from "@/lib/postingForm";
import { tx } from "@/lib/t";

// ============================================================================
// ★募集を 出す（★見本 `SC['募集を出す']`・裁定 その94 §4g）
//
//   ★★★字も 決めも lib/postingForm.js が 持ちます。★ここでは 決めません。
//   ★★★時間・会場・合わせの 場所の 入れ口を **作りません**（★§4g never_show）。
//     ★★台帳にも 列が ありません。★入れ口だけ 作ると、★行き場が ありません。
//   ★★★学校は 呼ぶ側が 入れます。★画面で 選ばせません。
//     ★★選べると、★在籍して いない 学校を 選ぶ 道が できます。
//     ★★台帳の 門も 止めますが、★入口を そもそも 作りません。
//
//   ★見張り components/tests/posting-form.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

/** ★丸い 印（★1つだけ 選ぶ）。★見本の とおり。 */
function 丸({ on }) {
  return (
    <span aria-hidden="true" style={{
      display: "inline-block", width: 17, height: 17, borderRadius: "50%",
      border: `1.6px solid ${on ? C.curtain : C.line}`,
      background: on ? C.curtain : "transparent",
      boxShadow: on ? `inset 0 0 0 3px ${C.card}` : undefined
    }} />
  );
}

export default function PostingForm({ onSubmit, onClose, busy, error = "" }) {
  const [f, setF] = useState(emptyForm());
  const [日, set日] = useState("");
  const 直 = (patch) => setF((x) => ({ ...x, ...patch }));

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <ScreenHead title={HEAD} right={onClose ? (
        <button type="button" onClick={onClose} style={{
          background: "transparent", border: "none", color: C.inkSoft,
          ...TYPE.mini, minHeight: 44, padding: `0 ${rem(4)}`, fontFamily: FONT_STACK
        }}>{tx("‹ もどる")}</button>
      ) : null} />

      {/* ★★日にち。★時間は 入れません（★§4g）。 */}
      <H3>{HEADS.days}</H3>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="date" value={日} onChange={(e) => set日(e.target.value)}
          style={{
            flex: 1, minHeight: 48, borderRadius: 12, padding: `0 ${rem(13)}`,
            border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
            fontSize: "1rem", fontFamily: FONT_STACK
          }} />
        <Btn small disabled={!日 || f.days.includes(日)}
          onClick={() => { 直({ days: [...f.days, 日].sort() }); set日(""); }}>
          {tx("足す")}
        </Btn>
      </div>
      {f.days.length > 0 ? (
        <Card style={{ marginTop: rem(8) }}>
          {f.days.map((d, i) => (
            <Li key={d} last={i === f.days.length - 1}
              right={(
                <button type="button"
                  onClick={() => 直({ days: f.days.filter((x) => x !== d) })}
                  style={{
                    background: "transparent", border: "none", color: C.curtain,
                    ...TYPE.mini, minHeight: 44, padding: `0 ${rem(4)}`, fontFamily: FONT_STACK
                  }}>{tx("はずす")}</button>
              )}>
              <span>{d}</span>
            </Li>
          ))}
        </Card>
      ) : null}

      <H3>{HEADS.kind}</H3>
      <Card>
        {KINDS.map((k, i) => (
          <Li key={k} last={i === KINDS.length - 1} onClick={() => 直({ kind: k })}
            right={<丸 on={f.kind === k} />}>
            <span>{k}</span>
          </Li>
        ))}
      </Card>

      <H3>{HEADS.piece}　<span style={小}>{OPTIONAL}</span></H3>
      <input value={f.piece} onChange={(e) => 直({ piece: e.target.value })}
        placeholder={PIECE_HINT}
        style={{
          width: "100%", minHeight: 48, borderRadius: 12, padding: `0 ${rem(13)}`,
          border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
          fontSize: "1rem", fontFamily: FONT_STACK
        }} />

      <H3>{HEADS.allDays}</H3>
      <Card>
        <Li onClick={() => 直({ needAllDays: true })} right={<丸 on={f.needAllDays} />}>
          <span>
            {ALL_DAYS_LABEL}
            <span style={{ display: "block", ...TYPE.mini, color: C.inkSoft }}>{ALL_DAYS_SUB}</span>
          </span>
        </Li>
        <Li last onClick={() => 直({ needAllDays: false })} right={<丸 on={!f.needAllDays} />}>
          <span>{ANY_DAY_LABEL}</span>
        </Li>
      </Card>
      <p style={{ ...小, margin: `${rem(4)} 0 0` }}>{SCHEDULE_NOTE}</p>

      <H3>{HEADS.fee}　<span style={小}>{OPTIONAL}</span></H3>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: rem(9) }}>
        <input value={f.feeAmount} inputMode="numeric"
          onChange={(e) => 直({ feeAmount: e.target.value.replace(/[^0-9]/g, "") })}
          style={{
            flex: "0 0 130px", minHeight: 48, borderRadius: 12, padding: `0 ${rem(13)}`,
            border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
            fontSize: "1rem", textAlign: "right", fontFamily: FONT_STACK
          }} />
        <span style={{ ...TYPE.li, color: C.ink }}>{tx("円")}</span>
      </div>
      <Card>
        {FEE_UNITS.map((u, i) => (
          <Li key={u} last={i === FEE_UNITS.length - 1} onClick={() => 直({ feeUnit: u })}
            right={<丸 on={f.feeUnit === u} />}>
            <span>{u}</span>
          </Li>
        ))}
      </Card>
      <Card style={{ marginTop: rem(9) }}>
        <Li last onClick={() => 直({ sodan: !f.sodan })}
          right={(
            <span aria-hidden="true" style={{
              display: "inline-block", width: 17, height: 17, borderRadius: 4,
              border: `1.6px solid ${f.sodan ? C.curtain : C.line}`,
              background: f.sodan ? C.curtain : "transparent",
              boxShadow: f.sodan ? `inset 0 0 0 3px ${C.card}` : undefined
            }} />
          )}>
          <span>
            {SODAN_LABEL}
            <span style={{ display: "block", ...TYPE.mini, color: C.inkSoft }}>{SODAN_SUB}</span>
          </span>
        </Li>
      </Card>

      {/* ★★★期限（★裁定 その130）。★「決めない」を 選べます。★強いません。 */}
      <H3>{EXPIRE_HEAD}</H3>
      <Card>
        {EXPIRES.map((x, i) => (
          <Li key={x.key} last={i === EXPIRES.length - 1} onClick={() => 直({ expire: x.key })}
            right={<丸 on={f.expire === x.key} />}>
            <span>{x.label}</span>
          </Li>
        ))}
      </Card>
      <p style={{ ...小, margin: `${rem(4)} 0 0` }}>{EXPIRE_NOTE}</p>

      <H3>{HEADS.title}　<span style={小}>{OPTIONAL}</span></H3>
      <input value={f.title} onChange={(e) => 直({ title: e.target.value })}
        style={{
          width: "100%", minHeight: 48, borderRadius: 12, padding: `0 ${rem(13)}`,
          border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
          fontSize: "1rem", fontFamily: FONT_STACK
        }} />

      {/* ★★出せない ときは、★わけを 言います。★黙って 押せなく しません。 */}
      {!canSubmit(f) ? (
        <p style={{ ...小, margin: `${rem(10)} 0 0` }}>{whyNot(f)}</p>
      ) : null}
      {error ? <p style={{ ...小, color: C.curtain, margin: `${rem(6)} 0 0` }}>{error}</p> : null}

      <Btn disabled={busy || !canSubmit(f)}
        onClick={() => onSubmit && onSubmit(toRow(f, new Date()))}
        style={{ marginTop: rem(12) }}>{SUBMIT}</Btn>

      <Note>
        {NOTES.map((t) => (
          <span key={t} style={{ display: "block" }}>
            {t === NOTES_BOLD ? <b style={{ color: C.ink }}>{t}</b> : t}
          </span>
        ))}
      </Note>

      {/* ★★★まだ 通せない 入れ口。★札を 置かず、★字で お伝えします。
           ★★入れ口を 作ると、★入れた ものが どこにも 残りません。 */}
      <div style={{ marginTop: rem(10) }}>
        {NOT_YET.map((x) => (
          <p key={x.key} style={{ ...小, margin: 0 }}>
            {x.label}　……　{tx("まだ できません")}
          </p>
        ))}
      </div>
    </div>
  );
}
