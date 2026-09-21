"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, Card, Note, Btn, Li, Warn, H3, Pill } from "@/components/UiV2";
import {
  HEAD, TOP_LINES, TOP_BOLDS, KIND_PILLS, KIND_NOT_YET,
  PF_HEAD, PF_DONE, PF_EMPTY, PF_GO_DONE, PF_GO_EMPTY,
  SECTION_OPEN, SECTION_MINE, SECTION_CUT,
  EMPTY_HEAD, EMPTY_SUB, EMPTY_NOTES,
  GO_NEW, GO_NEW_MINE, GO_APPLIED, CUT_UNDO, CUT_EMPTY, NO_ENROLL, NO_ENROLL_SUB,
  SCHOOL_HEAD, showSchoolPicker,
  CUT_NOTES, CUT_NOTES_BOLD, NOTES,
  applicationWord, postingLine, portfolioState, SODAN_LINE
} from "@/lib/matchingSearch";
import { ENDED_LABEL } from "@/lib/postingForm";
import { tx } from "@/lib/t";

// ============================================================================
// ★さがす（★見本 `SC['伴奏をさがす']`・裁定 その94 §4d「もっと の 直下」）
//
//   ★★★字も 決めも lib/matchingSearch.js が 持ちます。★ここでは 決めません。
//   ★★★募集は `get_postings()` から 来ます。★表を 直に 引きません（★裁定 その122）。
//     ★★引くのは 呼ぶ側 です。★この 画面は もらった ものを 出すだけ です。
//
//   ★★★出す 順を ここで 変えません。★台帳が 新しい順に 返します。
//     ★★おすすめ順に しません（★裁定 その95）。
//
//   ★見張り components/tests/matching-search.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

/** ★太い ところを 切って 出します。★字は lib が 持ちます。 */
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

// ★★★2026-09-21、★9画面が ひととおり つながりました。
export default function MatchingSearch({
  postings = [], myPostings = [], cuts = [], portfolio, enrolled = true,
  schools = [], orgId, onPickSchool,
  onGoPortfolio, onNewPosting, onOpenPosting, onGoApplied, onOpenMine, onUndoCut,
  loadError = ""
}) {
  const pf = portfolioState(portfolio);

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <ScreenHead title={HEAD} />

      <Warn>
        {TOP_LINES.map((t) => (
          <span key={t} style={{ display: "block" }}>{太く(t, TOP_BOLDS)}</span>
        ))}
      </Warn>

      {/* ★★絞り。★いまは 1つ だけ です。★効かない 札を 並べません。 */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: `${rem(4)} 0 ${rem(9)}` }}>
        {KIND_PILLS.map((k) => <Pill key={k} on>{k}</Pill>)}
      </div>
      <p style={{ ...小, margin: `0 0 ${rem(11)}` }}>
        {KIND_NOT_YET.label}　……　{KIND_NOT_YET.say}
      </p>

      {/* ★★★経歴の 帯（★§4f）。★応募する 前に、★自分の 姿が 判ります。
           ★★「読めなかった」ときは 何も 言いません（★`pf` が null）。 */}
      {pf ? (
        <Card>
          <Li last onClick={onGoPortfolio}
            right={<span style={小}>{pf === "done" ? PF_GO_DONE : PF_GO_EMPTY} ›</span>}>
            <span>
              {PF_HEAD}
              <span style={{
                display: "block", ...TYPE.mini,
                color: pf === "done" ? C.inkSoft : C.curtain
              }}>{pf === "done" ? PF_DONE : PF_EMPTY}</span>
            </span>
          </Li>
        </Card>
      ) : null}

      {/* ★★★学校を 選ぶ（★裁定 その140）。★2校 以上の ときだけ 出します。
           ★★1校 だけ の 方に、★選ぶ ものが 1つの 札を 見せません（★裁定 その73）。
           ★★★11校 並んでも 崩れません。★折り返さず、★横に 流します（★Q7）。 */}
      {showSchoolPicker(schools) ? (
        <>
          <H3>{SCHOOL_HEAD}</H3>
          <div style={{
            display: "flex", gap: 6, overflowX: "auto", paddingBottom: rem(4),
            margin: `0 0 ${rem(9)}`, WebkitOverflowScrolling: "touch"
          }}>
            {schools.map((x) => (
              <span key={x.org_id} style={{ flex: "none" }}>
                <Pill on={x.org_id === orgId}
                  onClick={onPickSchool ? () => onPickSchool(x.org_id) : undefined}>
                  {x.name}
                </Pill>
              </span>
            ))}
          </div>
        </>
      ) : null}

      {/* ★★★学校に 在籍して いない 方には、★できない ことを 先に お伝えします。
           ★★空の 一覧と 押せる 札を 出して、★押させてから 断りません。
           ★★「いま 出せませんでした」は 嘘に なります。★仕組みで できません。 */}
      {!enrolled ? (
        <Card>
          <p style={{ ...TYPE.li, color: C.ink, margin: 0 }}>{NO_ENROLL}</p>
          <p style={{ ...小, margin: `${rem(4)} 0 0` }}>{NO_ENROLL_SUB}</p>
        </Card>
      ) : null}

      <H3>{SECTION_OPEN}</H3>
      {loadError ? (
        <p style={{ ...小, color: C.curtain }}>{loadError}</p>
      ) : postings.length === 0 ? (
        <>
          <Card>
            <p style={{ ...TYPE.li, color: C.ink, margin: 0, textAlign: "center" }}>{EMPTY_HEAD}</p>
            <p style={{ ...小, margin: `${rem(4)} 0 0`, textAlign: "center" }}>{EMPTY_SUB}</p>
          </Card>
          {/* ★★★1件も 無い ときこそ、★出す 口を 残します（★裁定 その120）。
               ★★2026-09-21、★行き先が できたので 札に 戻しました。 */}
          {onNewPosting && enrolled ? (
            <Btn onClick={onNewPosting} style={{ marginTop: rem(10) }}>{GO_NEW}</Btn>
          ) : null}
          <Note>
            {EMPTY_NOTES.map((t) => (
              <span key={t} style={{ display: "block" }}>{t}</span>
            ))}
          </Note>
        </>
      ) : (
        <Card>
          {postings.map((p, i) => {
            const 行 = postingLine(p);
            // ★★2026-09-21、★応募する 画面が できたので 押せる ように しました。
            return (
              <Li key={p.id} last={i === postings.length - 1}
                onClick={onOpenPosting ? () => onOpenPosting(p) : undefined}
                right={onOpenPosting ? <span style={小}>›</span> : null}>
                <span>
                  {行.head}
                  {行.when ? <span style={{ display: "block", ...TYPE.mini, color: C.inkSoft }}>{行.when}</span> : null}
                  {行.fee ? (
                    <span style={{ display: "block", ...TYPE.mini, color: C.inkSoft }}>
                      {行.fee}
                      {行.sodan ? <span style={{ color: C.sage }}>　{SODAN_LINE}</span> : null}
                    </span>
                  ) : null}
                </span>
              </Li>
            );
          })}
        </Card>
      )}

      <H3>{SECTION_MINE}</H3>
      {myPostings.length === 0 ? (
        <Card>
          <p style={{ ...小, margin: 0 }}>{CUT_EMPTY}</p>
        </Card>
      ) : (
        <Card>
          {myPostings.map((p, i) => (
            // ★★2026-09-21、★応募を 選ぶ 画面が できたので 押せる ように しました。
            <Li key={p.id} last={i === myPostings.length - 1}
              onClick={onOpenMine ? () => onOpenMine(p) : undefined}
              right={(
                <span style={小}>
                  {applicationWord(p.application_count) || ""}
                  {onOpenMine ? " ›" : ""}
                </span>
              )}>
              <span>
                {p.title || p.kind || ""}
                {Array.isArray(p.days) && p.days.length ? (
                  <span style={{ display: "block", ...TYPE.mini, color: C.inkSoft }}>
                    {p.days.join("　")}
                  </span>
                ) : null}
                {/* ★★期限の 来た もの（★裁定 その130）。★消えて いません。 */}
                {p.ended ? (
                  <span style={{ display: "block", ...TYPE.mini, color: C.inkSoft }}>
                    {ENDED_LABEL}
                  </span>
                ) : null}
              </span>
            </Li>
          ))}
        </Card>
      )}

      {/* ★★1件でも ある ときも、★出す 口を 置きます（★見本の「＋ 自分も 募集を 出す」）。 */}
      {onNewPosting && enrolled ? (
        <Btn ghost onClick={onNewPosting} style={{ marginTop: rem(9) }}>{GO_NEW_MINE}</Btn>
      ) : null}

      <H3>{SECTION_CUT}</H3>
      <Card>
        {cuts.length === 0 ? (
          <p style={{ ...小, margin: 0 }}>{CUT_EMPTY}</p>
        ) : cuts.map((c, i) => (
          // ★★2026-09-21、★戻せる ように しました。
          //   ★★消すのは ご本人 だけ です（★門が 見ます）。
          <Li key={c.target_user_id} last={i === cuts.length - 1}
            right={onUndoCut ? (
              <button type="button" onClick={() => onUndoCut(c)} style={{
                background: "transparent", border: "none", color: C.inkSoft,
                ...TYPE.mini, minHeight: 44, padding: `0 ${rem(4)}`, fontFamily: FONT_STACK
              }}>{CUT_UNDO}</button>
            ) : null}>
            <span>{c.display_name || tx("お名前が ありません")}</span>
          </Li>
        ))}
      </Card>
      <Note>
        {CUT_NOTES.map((t) => (
          <span key={t} style={{ display: "block" }}>{太く(t, [CUT_NOTES_BOLD])}</span>
        ))}
      </Note>


      {/* ★★2026-09-21、★応募した 募集の 画面が できたので 札に 戻しました。 */}
      {onGoApplied ? (
        <Btn ghost onClick={onGoApplied} style={{ marginTop: rem(9) }}>{GO_APPLIED}</Btn>
      ) : null}

      <Note>
        {NOTES.map((t) => (
          <span key={t} style={{ display: "block" }}>{t}</span>
        ))}
      </Note>
    </div>
  );
}
