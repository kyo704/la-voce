"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, Card, Note, Btn, Li, H3 } from "@/components/UiV2";
import {
  HEADS, REC_GO, REP_NOTE, NOTES, NOTES_BOLDS, NOT_YET,
  splitCareer, wordOf, isAsking, hostOf
} from "@/lib/applicantDetail";
import { tx } from "@/lib/t";

// ============================================================================
// ★応募者の 詳細（★見本 `SC['応募者の詳細']`・裁定 その94 §4e・§4f・§7）
//
//   ★★★字も 決めも lib/applicantDetail.js が 持ちます。
//   ★★★出す のは、★ご本人が 選んだ ものだけ です。
//     ★★選ばなかった ものは、★台帳が 空で 返します。★ここで 隠して いません。
//   ★★★録画は 外へ 出ます。★この 中で 再生しません（★§4f）。
//     ★★どこへ 行くかを、★押す 前に お見せします。
//
//   ★見張り components/tests/applicant-detail.test.js
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

/** ★行の 並び（★1つも 無ければ 節ごと 出しません）。 */
function 節({ head, items, render, note }) {
  if (!items || items.length === 0) return null;
  return (
    <>
      <H3>{head}</H3>
      <Card>
        {items.map((x, i) => render(x, i === items.length - 1))}
      </Card>
      {note ? <p style={{ ...小, margin: `${rem(4)} 0 0` }}>{note}</p> : null}
    </>
  );
}

export default function ApplicantDetail({
  detail, onClose, onAnswer, onDecide, busy, loadError = ""
}) {
  if (!detail) {
    return (
      <div style={{ fontFamily: FONT_STACK }}>
        <ScreenHead title={tx("応募者")} />
        <p style={小}>{loadError || tx("いま 読めませんでした。")}</p>
      </div>
    );
  }
  const 経 = splitCareer(detail.career);
  const 録 = Array.isArray(detail.recordings) ? detail.recordings : [];
  const 曲 = Array.isArray(detail.repertoire) ? detail.repertoire : [];
  const 日 = Array.isArray(detail.available_days) ? detail.available_days : [];

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <ScreenHead title={detail.display_name || tx("お名前が ありません")}
        right={onClose ? (
          <button type="button" onClick={onClose} style={{
            background: "transparent", border: "none", color: C.inkSoft,
            ...TYPE.mini, minHeight: 44, padding: `0 ${rem(4)}`, fontFamily: FONT_STACK
          }}>{tx("‹ もどる")}</button>
        ) : null} />

      {/* ★★学んだ ところ と 師事。★写真は まだ ありません。 */}
      {(経.school.length > 0 || 経.teacher.length > 0 || detail.instrument) ? (
        <Card>
          {detail.instrument ? (
            <p style={{ ...TYPE.li, color: C.ink, margin: 0 }}>{detail.instrument}</p>
          ) : null}
          {経.school.map((e) => (
            <p key={e.title} style={{ ...TYPE.li, color: C.ink, margin: `${rem(4)} 0 0` }}>
              {e.title}{e.detail ? <span style={小}>　{e.detail}</span> : null}
            </p>
          ))}
          {経.teacher.length > 0 ? (
            <p style={{ ...小, margin: `${rem(5)} 0 0` }}>
              {HEADS.teacher}　{経.teacher.map((e) => e.title).join("・")}
            </p>
          ) : null}
        </Card>
      ) : null}

      {/* ★★送られた ことば。★たずねられて いれば 色を 変えます。 */}
      <H3>{HEADS.word}</H3>
      <Card>
        <p style={{
          ...TYPE.li, margin: 0,
          color: isAsking(detail) ? C.curtain : C.ink
        }}>{wordOf(detail)}</p>
      </Card>

      {/* ★★★たずねられて いる ときだけ、★答える 道を 出します（★§4c）。
           ★★たずねられて いない のに 出すと、★送れない 札に なります。
           ★★台帳の 門も 同じ ことを 見て います（★2026-09-21）。 */}
      {onAnswer && isAsking(detail) ? (
        <Btn ghost onClick={onAnswer} style={{ marginTop: rem(9) }}>
          {tx("曲目を 答える")}
        </Btn>
      ) : null}

      <節 head={HEADS.days} items={日}
        render={(d, last) => <Li key={d} last={last}><span>{d}</span></Li>} />

      {/* ★★録画 ── ★外へ 出ます。★行き先を 先に 見せます（★§4f）。 */}
      <節 head={HEADS.rec} items={録}
        render={(r, last) => (
          <Li key={r.url} last={last}
            right={<span style={小}>{REC_GO} ›</span>}>
            <a href={r.url} target="_blank" rel="noreferrer noopener"
              style={{ color: C.ink, textDecoration: "none" }}>
              {r.title}
              <span style={{ display: "block", ...TYPE.mini, color: C.inkSoft }}>
                {hostOf(r.url)}
              </span>
            </a>
          </Li>
        )} />

      <節 head={HEADS.rep} items={曲} note={REP_NOTE}
        render={(s, last) => <Li key={s} last={last}><span>{s}</span></Li>} />

      <節 head={HEADS.award} items={経.award}
        render={(e, last) => (
          <Li key={e.title} last={last}>
            <span>
              {e.title}
              {e.detail ? <span style={小}>　{e.detail}</span> : null}
            </span>
          </Li>
        )} />

      {/* ★★★決めると、★ほかの 応募は 閉じます（★見本の 断り）。
           ★★負けた、とは 伝えません。★わけを 書きません。 */}
      {onDecide ? (
        <Btn disabled={busy} onClick={onDecide} style={{ marginTop: rem(10) }}>
          {tx("この方に 決める")}
        </Btn>
      ) : null}

      <Note>
        {NOTES.map((t) => (
          <span key={t} style={{ display: "block" }}>{太く(t, NOTES_BOLDS)}</span>
        ))}
      </Note>

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
