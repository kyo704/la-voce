"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, Card, Note, Btn, Li, H3 } from "@/components/UiV2";
import {
  HEAD, ASKED_BY, FROM_REP, ADD_HERE, ADD_NOTE, ADD_HINT, ADD_OK,
  OR_HEAD, SUBMIT, EMPTY_REP, FALLBACKS, NOTES, NOTES_BOLD, NOT_YET,
  emptyForm, canSubmit, whyNot, toRow, cleanName
} from "@/lib/answerPiece";
import { tx } from "@/lib/t";

// ============================================================================
// ★曲目を 答える（★見本 `SC['曲目を答える']`・裁定 その94 §4c）
//
//   ★★★送るのは 曲の 名の 並び か、★決まった ことば 2つ だけ です。
//     ★★曲の 名は データ です。★書いた 文では ありません（★§4c `why_safe`）。
//     ★★自由に 書ける 欄を 置きません。
//   ★★★「ここで 曲を 足す」は、★レパートリーにも 入ります（★§4c `inline_add`）。
//     ★★画面を 出て 戻る 手間を なくす ため です。
//
//   ★見張り components/tests/answer-piece.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

/** ★四角い 印（★いくつでも 選べる）。 */
function 角({ on }) {
  return (
    <span aria-hidden="true" style={{
      display: "inline-block", width: 17, height: 17, borderRadius: 4,
      border: `1.6px solid ${on ? C.curtain : C.line}`,
      background: on ? C.curtain : "transparent",
      boxShadow: on ? `inset 0 0 0 3px ${C.card}` : undefined
    }} />
  );
}

/** ★丸い 印（★1つだけ 選ぶ）。 */
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

export default function AnswerPiece({
  askedBy, repertoire = [], onSubmit, onAddPiece, onClose, busy, error = ""
}) {
  const [f, setF] = useState(emptyForm());
  const [足す, set足す] = useState(false);
  const [名, set名] = useState("");
  const 直 = (patch) => setF((x) => ({ ...x, ...patch }));

  const 押す = (s) => 直({
    pieces: f.pieces.includes(s) ? f.pieces.filter((x) => x !== s) : [...f.pieces, s],
    // ★★曲を 選んだら、★下の えらびは 外します（★両方は できません）。
    fallback: null
  });

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <ScreenHead title={HEAD} right={onClose ? (
        <button type="button" onClick={onClose} style={{
          background: "transparent", border: "none", color: C.inkSoft,
          ...TYPE.mini, minHeight: 44, padding: `0 ${rem(4)}`, fontFamily: FONT_STACK
        }}>{tx("‹ もどる")}</button>
      ) : null} />

      <p style={{ ...小, margin: `0 0 ${rem(11)}` }}>
        {ASKED_BY.replace("{s}", askedBy || "")}
      </p>

      <H3>{FROM_REP}</H3>
      <Card>
        {repertoire.length === 0 ? (
          <p style={{ ...小, margin: 0 }}>{EMPTY_REP}</p>
        ) : repertoire.map((s) => (
          <Li key={s} onClick={() => 押す(s)} right={<角 on={f.pieces.includes(s)} />}>
            <span>{s}</span>
          </Li>
        ))}
        {/* ★★ここで 足せます（★§4c `inline_add`）。★レパートリーにも 入ります。 */}
        {onAddPiece ? (
          <Li last onClick={() => set足す(true)} right={<span style={小}>›</span>}>
            <span style={{ color: C.curtain }}>{ADD_HERE}</span>
          </Li>
        ) : null}
      </Card>
      {onAddPiece ? <p style={{ ...小, margin: `${rem(4)} 0 0` }}>{ADD_NOTE}</p> : null}

      {足す ? (
        <Card style={{ marginTop: rem(9) }}>
          <input value={名} onChange={(e) => set名(e.target.value)} placeholder={ADD_HINT}
            style={{
              width: "100%", minHeight: 48, borderRadius: 12, padding: `0 ${rem(13)}`,
              border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
              fontSize: "1rem", fontFamily: FONT_STACK
            }} />
          <div style={{ display: "flex", gap: 8, marginTop: rem(9) }}>
            <Btn small disabled={busy || !cleanName(名)}
              onClick={async () => {
                const s = cleanName(名);
                if (!s) return;
                const ok = await onAddPiece(s);
                if (ok === false) return;
                set名("");
                set足す(false);
                押す(s);
              }}>{ADD_OK}</Btn>
            <Btn small ghost onClick={() => { set足す(false); set名(""); }}>
              {tx("やめる")}
            </Btn>
          </div>
          {/* ★★「作った人」は まだ 置けません。★列が ありません。 */}
          {NOT_YET.map((x) => (
            <p key={x.key} style={{ ...小, margin: `${rem(6)} 0 0` }}>
              {x.label}　……　{tx("まだ できません")}
            </p>
          ))}
        </Card>
      ) : null}

      <H3>{OR_HEAD}</H3>
      <Card>
        {FALLBACKS.map((x, i) => (
          <Li key={x.key} last={i === FALLBACKS.length - 1}
            // ★★下を 選んだら、★曲の えらびは 外します。
            onClick={() => 直({ fallback: f.fallback === x.key ? null : x.key, pieces: [] })}
            right={<丸 on={f.fallback === x.key} />}>
            <span>{x.label}</span>
          </Li>
        ))}
      </Card>

      {!canSubmit(f) ? (
        <p style={{ ...小, margin: `${rem(10)} 0 0` }}>{whyNot(f)}</p>
      ) : null}
      {error ? <p style={{ ...小, color: C.curtain, margin: `${rem(6)} 0 0` }}>{error}</p> : null}

      <Btn disabled={busy || !canSubmit(f)}
        onClick={() => onSubmit && onSubmit(toRow(f))}
        style={{ marginTop: rem(12) }}>{SUBMIT}</Btn>

      <Note>
        {NOTES.map((t) => (
          <span key={t} style={{ display: "block" }}>
            {t.indexOf(NOTES_BOLD) >= 0 ? (
              <>
                <b style={{ color: C.ink }}>{NOTES_BOLD}</b>
                {t.slice(NOTES_BOLD.length)}
              </>
            ) : t}
          </span>
        ))}
      </Note>
    </div>
  );
}
