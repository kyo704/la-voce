"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import {
  COLS_ITEM, COLS_SCORE, COLS_REVIEW, pointChoices, itemsInUse, pointOf, scoreRow,
  total, maxTotal, canSubmit, isConfirmed, needsReason, canEditWithReason, typeLine,
  SCORE_REVIEW_HEAD, SCORE_SUBMIT, SCORE_EDIT, SCORE_OTHERS_HEAD, SCORE_MAX_SUFFIX,
  SCORE_EDIT_ASK, SCORE_DONE, SCORE_DOING, SCORE_YET, SCORE_NOTE
} from "@/lib/scoreEntry";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★点を 入れる ── ★見本 `SC['点を入れる']`
//   ★出どころ 裁定50 ／ 裁定165
//     ／ woolsong-2026-09-21_1.zip ／ 00-動く見本-iPhoneで開く用.html（md5 67c56244）
//
//   ★★★点は **札** です。★打ち込む 欄を 作りません（★見本の 註）。
//     ★満点を 超える 札は 作りません ── ★はじめから ありません。
//   ★★★確定の あとに 直す ときは、★わけを うかがいます（★裁定50）。
//     ★台帳の `edit_confirmed_score` を 通します。★`score_log` に 残り、
//     ★学生に お知らせが 届きます。
//
//   ★★★ほかの 審査員の 点は 出しません。★自分の 点 だけ 読みます。
//     ★止めて いるのは 台帳の 決め です。★こちらも 求めません。
//
//   ★見張り components/tests/score-entry-screen.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };

export default function ScoreEntry({
  supabase, orgId, eventId, studentId, studentName, judgeId, typeName, others = [], onPick
}) {
  const [items, setItems] = useState([]);
  const [scores, setScores] = useState([]);
  const [review, setReview] = useState("");
  const [reason, setReason] = useState("");
  const [直中, set直中] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [word, setWord] = useState("");

  const 読む = useCallback(async () => {
    if (!supabase || !orgId || !eventId || !studentId || !judgeId) return;
    try {
      const [{ data: it }, { data: sc }, { data: rv }] = await Promise.all([
        supabase.from("evaluation_items").select(COLS_ITEM)
          .eq("org_id", orgId).order("ord"),
        // ★★★自分の 点 だけ。★ほかの 審査員の 分を 求めません。
        supabase.from("evaluation_scores").select(COLS_SCORE)
          .eq("event_id", eventId).eq("student_id", studentId).eq("judge_id", judgeId),
        supabase.from("evaluation_reviews").select(COLS_REVIEW)
          .eq("event_id", eventId).eq("student_id", studentId).eq("judge_id", judgeId)
      ]);
      setItems(it || []); setScores(sc || []);
      setReview(((rv || [])[0] || {}).body || "");
    } catch (e) { setError(String((e && e.message) || e)); }
  }, [supabase, orgId, eventId, studentId, judgeId]);

  useEffect(() => { 読む(); }, [読む]);

  const 使 = useMemo(() => itemsInUse(items), [items]);
  const 合 = useMemo(() => total(items, scores), [items, scores]);
  const 確 = useMemo(() => isConfirmed(scores), [scores]);

  const 選ぶ = useCallback(async (item, v) => {
    if (!supabase) return;
    setBusy(true); setError("");
    try {
      if (needsReason(scores)) {
        // ★★★確定の あと。★わけを うかがってから 台帳に 通します（★裁定50）。
        const row = scoreRow(scores, item.id);
        if (!row) throw new Error(tx("その 点が ありません。"));
        if (!canEditWithReason(reason)) { set直中(true); setBusy(false); return; }
        const { data, error: e } = await supabase.rpc("edit_confirmed_score",
          { p_score_id: row.id, p_points: v, p_reason: reason });
        if (e) throw e;
        if (!((data || [])[0] || {}).ok) throw new Error(tx("直せませんでした。"));
        setReason(""); set直中(false); setWord(tx("直しました"));
      } else {
        const { error: e } = await supabase.from("evaluation_scores").upsert({
          org_id: orgId, event_id: eventId, student_id: studentId,
          item_id: item.id, judge_id: judgeId, points: v, entered_at: new Date().toISOString()
        }, { onConflict: "event_id,student_id,item_id,judge_id" });
        if (e) throw e;
      }
      await 読む();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, scores, reason, orgId, eventId, studentId, judgeId, 読む]);

  const 入れる = useCallback(async () => {
    if (!supabase) return;
    setBusy(true); setError("");
    try {
      const { error: e } = await supabase.from("evaluation_reviews").upsert({
        org_id: orgId, event_id: eventId, student_id: studentId,
        judge_id: judgeId, body: review
      }, { onConflict: "event_id,student_id,judge_id" });
      if (e) throw e;
      setWord(tx("入れました"));
      await 読む();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, orgId, eventId, studentId, judgeId, review, 読む]);

  if (!studentId) return null;

  return (
    <div>
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(4)}` }}>{studentName}</h2>
      <div style={{ ...小, marginBottom: rem(12) }}>
        {tx(typeLine(typeName, items))}
        {合 !== null ? <><br />{tx("合計")}　{合} / {maxTotal(items)}</> : null}
      </div>

      {使.map((it) => {
        const いま = pointOf(scores, it.id);
        return (
          <div key={it.id}>
            <div style={{ ...TYPE.h3, marginTop: rem(14) }}>
              {it.name}　<span style={{ ...小, display: "inline" }}>
                {it.max_points}{tx(SCORE_MAX_SUFFIX)}
              </span>
            </div>
            {/* ★★★満点を 超える 札は ありません。★出して から 止めません。 */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: rem(5), marginTop: rem(5) }}>
              {pointChoices(it).map((v) => (
                <button key={v} type="button" disabled={busy}
                  onClick={() => 選ぶ(it, v)}
                  style={{
                    minHeight: 44, minWidth: 44, padding: `0 ${rem(10)}`, borderRadius: 999,
                    border: `1px solid ${いま === v ? C.curtain : C.line}`,
                    background: いま === v ? C.curtain : C.card,
                    color: いま === v ? C.onCurtain : C.inkSoft,
                    fontFamily: FONT_STACK, ...TYPE.usual
                  }}>{v}</button>
              ))}
            </div>
          </div>
        );
      })}

      {直中 ? (
        <div style={{
          background: C.band, border: `1px solid ${C.line3}`, borderRadius: 12,
          padding: rem(12), marginTop: rem(12)
        }}>
          <div style={TYPE.li}>{tx(SCORE_EDIT_ASK)}</div>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)}
            style={{
              width: "100%", minHeight: 64, marginTop: rem(6), borderRadius: 10,
              padding: rem(8), border: `1px solid ${C.line}`, background: C.paper,
              color: C.ink, fontFamily: FONT_STACK, ...TYPE.li
            }} />
          <div style={{ ...小, marginTop: rem(4) }}>
            {tx("直した ことは 記録に 残り、学生に お知らせが 届きます。")}
          </div>
        </div>
      ) : null}

      <div style={{ ...TYPE.h3, marginTop: rem(14) }}>{tx(SCORE_REVIEW_HEAD)}</div>
      <textarea value={review} onChange={(e) => setReview(e.target.value)}
        style={{
          width: "100%", minHeight: 84, borderRadius: 10, padding: rem(8),
          border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
          fontFamily: FONT_STACK, ...TYPE.li
        }} />

      <button type="button" onClick={入れる} disabled={busy || !canSubmit(items, scores)}
        style={{
          width: "100%", minHeight: 44, marginTop: rem(12), borderRadius: 13,
          border: "none", background: C.curtain, color: C.onCurtain,
          fontFamily: FONT_STACK, fontWeight: 700,
          opacity: busy || !canSubmit(items, scores) ? 0.5 : 1, ...TYPE.body
        }}>{確 ? tx(SCORE_EDIT) : tx(SCORE_SUBMIT)}</button>

      {word ? <p style={{ ...小, marginTop: rem(8) }}>{word}</p> : null}
      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}

      <div style={{ ...TYPE.h3, marginTop: rem(14) }}>{tx(SCORE_OTHERS_HEAD)}</div>
      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden"
      }}>
        {others.map((o) => (
          <button key={o.student_id} type="button" onClick={() => onPick && onPick(o)}
            style={{
              width: "100%", minHeight: 44, display: "flex", alignItems: "center",
              justifyContent: "space-between", padding: `${rem(9)} ${rem(12)}`,
              background: "transparent", border: "none",
              borderBottom: `1px solid ${C.line2}`, color: C.ink,
              fontFamily: FONT_STACK, textAlign: "left", ...TYPE.li
            }}>
            <span>{o.student_name}</span>
            <span style={小}>
              {o.done ? tx(SCORE_DONE) : o.started ? tx(SCORE_DOING) : tx(SCORE_YET)} ›
            </span>
          </button>
        ))}
      </div>

      {/* ★★★見本の 但し書き。★1字 も 足しません。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {SCORE_NOTE.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
