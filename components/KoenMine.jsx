"use client";

import { useCallback, useEffect, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { Card, Li, Note, Back } from "@/components/UiV2";
import {
  mayShowKoenMine, MINE_HEAD, MINE_EMPTY, MINE_EMPTY_SUB,
  MINE_LINKS, MINE_NOTES, COLS_MINE, COLS_KOEN_MINE
} from "@/lib/koenArea";
import KoenMySchedule from "./KoenMySchedule";
import KoenDayFlow from "./KoenDayFlow";
// ★★★カレンダー（★裁定195・2026-09-24）。★切り替えで 姿が 変わります。
import CalendarConnect from "./CalendarConnect";
import { mayShowSubscribe, SUB_LEAD, ONE_LEAD } from "@/lib/calendarSub";
import { scheduleRows } from "@/lib/myKoenDay";
import { googleCalendarUrl } from "@/lib/calendarExport";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★出演者の 側の 公演（★見本 `SC['公演']`・★2026-09-24）
//
//   ★★★これが 無い ために、★`KoenMySchedule` と `KoenDayFlow` は
//     ★出来て いながら、★どこからも 呼ばれて いません でした。
//     ★★「作った」と「届く」は 別 です。★ここが その 間を つなぎます。
//
//   ★★`components/KoenArea.jsx` は **運営の 側** です（★あちらが 名のって います）。
//     ★★同じ「公演」でも 見える ものが ちがいます。★混ぜません。
//
//   ★★★鍵（`koen`）が 閉じて いる ときは、★**入口ごと 出しません**（★裁定176 §3）。
//     ★「近日公開」も 出しません。★読み込み中も false です。
//
//   ★★決めは 1つも ここで 作りません ──
//     ★何を 出すか …… `lib/koenArea.js`（`MINE_LINKS` ／ `MINE_NOTES`）
//     ★誰が 見て よいか …… 台帳の 決まり（`koen_members_select`）
//     ★列の 名前 …… `COLS_*`（★`select('*')` を 書きません）
//
//   ★見張り components/tests/koen-mine.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };

export default function KoenMine({ supabase, userId, features, onBack }) {
  // ★★★鍵の 判じは 束が 持ちます（★1つの 機能に 1か所）。
  //   ★★画面で `featureOn` を 呼びません ── ★呼ぶと 決めが 散ります。
  const 開 = mayShowKoenMine(features);
  const [rows, setRows] = useState([]);
  const [koens, setKoens] = useState({});
  const [開いた, set開いた] = useState(null);   // ★{ koenId, view }
  // ★★1件ずつ の ための 一覧（★カレンダーの 姿の ときだけ 引きます）。
  const [呼ばれ, set呼ばれ] = useState([]);
  const [error, setError] = useState("");

  const 読む = useCallback(async () => {
    if (!supabase || !userId || !開) return;
    try {
      // ★★自分の 行 だけ を 引きます。★台帳の 決まりも 同じ ことを します。
      const { data, error: e } = await supabase
        .from("koen_members").select(COLS_MINE)
        .eq("user_id", userId).is("left_at", null);
      if (e) throw e;
      const 並 = data || [];
      setRows(並);
      if (並.length === 0) { setKoens({}); return; }
      const { data: k, error: e2 } = await supabase
        .from("koen").select(COLS_KOEN_MINE)
        .in("id", 並.map((r) => r.koen_id));
      if (e2) throw e2;
      const 表 = {};
      (k || []).forEach((x) => { 表[x.id] = x; });
      setKoens(表);
    } catch (e) { setError(String((e && e.message) || e)); }
  }, [supabase, userId, 開]);

  useEffect(() => { 読む(); }, [読む]);

  // ★★★カレンダーを 開いた ときだけ 引きます。★ふだんは 引きません。
  //   ★★`my_koen_schedule` …… ★呼ばれて いる ところ だけ が 返ります。
  //     ★★ほかの 方の 時刻は 入りません（★台帳の 決め）。
  useEffect(() => {
    if (!supabase || !開いた || 開いた.view !== "cal") { set呼ばれ([]); return; }
    let 生 = true;
    (async () => {
      try {
        const { data, error: e } = await supabase.rpc("my_koen_schedule",
          { p_koen: 開いた.koenId });
        if (e) throw e;
        if (生) set呼ばれ(scheduleRows(data || [], 開いた.koenId));
      } catch (e) { if (生) setError(String((e && e.message) || e)); }
    })();
    return () => { 生 = false; };
  }, [supabase, 開いた]);

  // ★★★鍵が 閉じて いれば、★1文字も 出しません。
  if (!開) return null;

  if (開いた) {
    const koen = koens[開いた.koenId] || { id: 開いた.koenId };
    const 行 = rows.find((r) => r.koen_id === 開いた.koenId) || {};
    // ★★1件ずつ の 一覧は、★呼ばれて いる ところ だけ です。
    //   ★★`予定` は カレンダーの 姿の ときだけ 使います。
    const 予定 = (開いた.view === "cal" ? 呼ばれ : []).map((r) => ({
      id: r.id,
      title: (koen.title || "") + "　" + (r.kind || ""),
      sub: (r.place || ""),
      startsAt: r.callAt || r.startsAt,
      minutes: 60
    }));
    return (
      <div style={{ fontFamily: FONT_STACK }}>
        <Back onClick={() => set開いた(null)}>{tx(MINE_HEAD)}</Back>
        {開いた.view === "cal" ? (
          /* ★★★1件ずつ の 一覧は、★自分の 予定と 同じ ところから 出します。
               ★★`my_koen_schedule` …… ★呼ばれて いる ところ だけ が 返ります。
               ★★ほかの 方の 時刻は 入りません（★台帳の 決め）。
             ★★★切り替えが 開いた ら、★この 一覧は 出ません（★住所の 姿に なります）。 */
          <CalendarConnect
            supabase={supabase} features={features}
            items={予定}
            onPutOne={(x) => {
              // ★★カレンダーへ 送るのは 3つ だけ です（`CALENDAR_ALLOWED`）。
              //   ★★体調の ことは 1文字も 入りません。
              const u = googleCalendarUrl(
                { scheduled_at: x.startsAt, duration_minutes: x.minutes || 60 },
                () => x.title || "");
              if (u) window.open(u, "_blank", "noopener,noreferrer");
            }}
            onBack={() => set開いた(null)} />
        ) : 開いた.view === "mine" ? (
          <KoenMySchedule supabase={supabase} koen={koen} myRole={行.part || ""} />
        ) : (
          <KoenDayFlow
            supabase={supabase} koen={koen}
            isStaff={行.part === "staff"}
            myPart={行.part || ""} myMemberId={行.id}
            onSeeMine={() => set開いた({ koenId: 開いた.koenId, view: "mine" })} />
        )}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      {onBack ? <Back onClick={onBack}>{tx("もっと")}</Back> : null}
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(8)}` }}>{tx(MINE_HEAD)}</h2>

      {rows.length === 0 ? (
        /* ★★まだ 1つも 入って いない とき。★急かしません。
            ★★次に 何を すれば よいかだけ を 書きます。 */
        <>
          <p style={{ ...TYPE.li, color: C.ink, margin: `0 0 ${rem(4)}` }}>{tx(MINE_EMPTY)}</p>
          <p style={小}>{tx(MINE_EMPTY_SUB)}</p>
        </>
      ) : rows.map((r) => {
        const k = koens[r.koen_id] || {};
        return (
          <div key={r.id} style={{ marginBottom: rem(12) }}>
            <p style={{ ...TYPE.li, color: C.ink, margin: `0 0 ${rem(4)}` }}>
              {k.title || ""}
            </p>
            <Card style={{ padding: 0 }}>
              {MINE_LINKS.map((l, i) => (
                <Li key={l.key} last={i === MINE_LINKS.length - 1} right="›"
                  onClick={() => set開いた({ koenId: r.koen_id, view: l.key })}>
                  {tx(l.label)}
                  {/* ★★カレンダーの 下の 字は、★切り替えで 変わります。
                      ★★開いて いれば「1度 つなぐと…」、★閉じて いれば「1件ずつ」。
                      ★★判じるのは 束 です。★ここでは 決めません。 */}
                  <span style={{ ...小, display: "block" }}>
                    {tx(l.key === "cal"
                      ? (mayShowSubscribe(features) ? SUB_LEAD : ONE_LEAD)
                      : l.sub)}
                  </span>
                </Li>
              ))}
            </Card>
          </div>
        );
      })}

      {/* ★★3行 とも 確かめて から 書いて います（★わけは lib の 覚え書き）。 */}
      <Note>
        {MINE_NOTES.map((t) => (
          <span key={t} style={{ display: "block" }}>{tx(t)}</span>
        ))}
      </Note>

      {error ? (
        <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(10) }}>{error}</p>
      ) : null}
    </div>
  );
}
