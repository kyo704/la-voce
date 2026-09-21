"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, Card, Note, Btn, Li, H3 } from "@/components/UiV2";
import {
  HEAD, DAYS_HEAD_ALL, DAYS_HEAD_ANY, ALL_NOTE,
  SHOW_HEAD, SHOW_ITEMS, SHOW_EMPTY, SHOW_GO, SHOW_NOTES, SHOW_NOTES_BOLD,
  FEE_HEAD, SODAN_YES, WORD_HEAD, wordsFor,
  NOTES, NOTES_BOLDS, SUBMIT, NOT_YET,
  emptyForm, canSubmit, whyNot, toRow
} from "@/lib/applyForm";
import { tx } from "@/lib/t";

// ============================================================================
// ★応募する（★見本 `SC['応募する']`・裁定 その94 §4・§4e・§4f）
//
//   ★★★字も 決めも lib/applyForm.js が 持ちます。★ここでは 決めません。
//   ★★★自由に 書ける 欄を **1つも 置きません**（★§4「L2_TEMPLATE」）。
//     ★★台帳にも 列が ありません。★入れ口だけ 作りません。
//   ★★★見本は 募集の 下に「○○音楽大学 2年 声楽」を 出して います。
//     ★★「2年」は **学年** です。★§7 は 学年を 出さない と 決めて います。
//     ★★出しません。★見本と ちがいます（★報告に 書きました）。
//
//   ★見張り components/tests/apply-form.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

function 太く(t, 太たち) {
  const 当 = (太たち || []).find((b) => t.indexOf(b) >= 0);
  if (!当) return t;
  const i = t.indexOf(当);
  return (
    <>
      {t.slice(0, i)}
      <b style={{ color: C.ink }}>{当}</b>
      {t.slice(i + 当.length)}
    </>
  );
}

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

export default function ApplyForm({
  posting, portfolio, onSubmit, onClose, onGoPortfolio, onCutSheet, busy, error = ""
}) {
  const [f, setF] = useState(() => emptyForm(posting));
  if (!posting) return null;
  const 直 = (patch) => setF((x) => ({ ...x, ...patch }));
  const 日たち = posting.days || [];
  const ことば = wordsFor(posting);
  const 空か = (key) => {
    if (!portfolio) return false;
    if (key === "career") return !(portfolio.entries || []).length && !portfolio.bio;
    if (key === "recordings") return !(portfolio.recordings || []).length;
    if (key === "repertoire") return !(portfolio.repertoire || []).length;
    return false;
  };

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <ScreenHead title={HEAD} right={onClose ? (
        <button type="button" onClick={onClose} style={{
          background: "transparent", border: "none", color: C.inkSoft,
          ...TYPE.mini, minHeight: 44, padding: `0 ${rem(4)}`, fontFamily: FONT_STACK
        }}>{tx("‹ もどる")}</button>
      ) : null} />

      {/* ★★募集の 札。★出している 方の 学年・学校は 出しません（★§7）。 */}
      <Card>
        <p style={{ ...TYPE.li, color: C.ink, fontWeight: 700, margin: 0 }}>
          {posting.title || posting.kind || ""}
        </p>
        <p style={{ ...小, margin: `${rem(4)} 0 0` }}>{日たち.join("　")}</p>
        {posting.piece ? <p style={{ ...小, margin: 0 }}>{posting.piece}</p> : null}
      </Card>

      {/* ★★日どり。★時間は ありません（★§4g）。 */}
      <H3>{posting.need_all_days ? DAYS_HEAD_ALL : DAYS_HEAD_ANY}</H3>
      <Card>
        {日たち.map((d, i) => (
          <Li key={d} last={i === 日たち.length - 1}
            onClick={posting.need_all_days ? undefined : () => 直({
              days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d].sort()
            })}
            right={posting.need_all_days ? null : <角 on={f.days.includes(d)} />}>
            <span>{d}</span>
          </Li>
        ))}
      </Card>
      {posting.need_all_days ? (
        <p style={{ ...小, margin: `${rem(4)} 0 0` }}>{ALL_NOTE}</p>
      ) : null}

      {/* ★★お見せするもの（★§4e）。★空の ものには 書く 道を 出します（★§4f）。 */}
      <H3>{SHOW_HEAD}</H3>
      <Card>
        {SHOW_ITEMS.map((x, i) => {
          const 空 = 空か(x.key);
          return (
            <Li key={x.key} last={i === SHOW_ITEMS.length - 1}
              onClick={空 ? onGoPortfolio : () => 直({ show: { ...f.show, [x.key]: !f.show[x.key] } })}
              right={空 ? <span style={小}>{tx("書く")} ›</span> : <角 on={!!f.show[x.key]} />}>
              <span>
                {x.label}
                {空 ? (
                  <span style={{ display: "block", ...TYPE.mini, color: C.curtain }}>
                    {SHOW_EMPTY}　{SHOW_GO}
                  </span>
                ) : null}
              </span>
            </Li>
          );
        })}
      </Card>
      <Note>
        {SHOW_NOTES.map((t) => (
          <span key={t} style={{ display: "block" }}>{太く(t, [SHOW_NOTES_BOLD])}</span>
        ))}
      </Note>

      {/* ★★お礼。★読むだけ です。★ここでは 決めません。 */}
      <H3>{FEE_HEAD}</H3>
      <Card>
        <p style={{ ...TYPE.li, color: C.ink, fontWeight: 700, margin: 0 }}>
          {posting.fee_amount ? `${posting.fee_amount}円` : tx("決めていません")}
        </p>
        {posting.fee_unit ? <p style={{ ...小, margin: 0 }}>{posting.fee_unit}</p> : null}
        {posting.sodan ? (
          <p style={{ ...小, margin: `${rem(4)} 0 0`, color: C.sage }}>{SODAN_YES}</p>
        ) : null}
      </Card>

      {/* ★★送る ことば。★この 中から 選びます。★打つ 欄は ありません。 */}
      <H3>{WORD_HEAD}</H3>
      <Card>
        {ことば.map((w, i) => (
          <Li key={w.key} last={i === ことば.length - 1} onClick={() => 直({ word: w.key })}
            right={(
              <span aria-hidden="true" style={{
                display: "inline-block", width: 17, height: 17, borderRadius: "50%",
                border: `1.6px solid ${f.word === w.key ? C.curtain : C.line}`,
                background: f.word === w.key ? C.curtain : "transparent",
                boxShadow: f.word === w.key ? `inset 0 0 0 3px ${C.card}` : undefined
              }} />
            )}>
            <span>{w.label}</span>
          </Li>
        ))}
      </Card>

      {!canSubmit(f, posting) ? (
        <p style={{ ...小, margin: `${rem(10)} 0 0` }}>{whyNot(f, posting)}</p>
      ) : null}
      {error ? <p style={{ ...小, color: C.curtain, margin: `${rem(6)} 0 0` }}>{error}</p> : null}

      <Btn disabled={busy || !canSubmit(f, posting)}
        onClick={() => onSubmit && onSubmit(toRow(f))}
        style={{ marginTop: rem(12) }}>{SUBMIT}</Btn>

      <Note>
        {NOTES.map((t) => (
          <span key={t} style={{ display: "block" }}>{太く(t, NOTES_BOLDS)}</span>
        ))}
      </Note>

      {/* ★★★この人との やりとりについて（★見本の とおり・§5-4）。
           ★★応募する 前でも、★切る 口と 通報の 口が あります。
           ★★切ったら 通報できない、に しません。 */}
      {onCutSheet ? (
        <Btn ghost onClick={onCutSheet} style={{ marginTop: rem(9) }}>
          {tx("この人との やりとりについて")}
        </Btn>
      ) : null}

      {/* ★★まだ できない こと。★札を 置かず、★字で お伝えします。 */}
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
