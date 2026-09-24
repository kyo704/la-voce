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

  // ★★★鍵が 閉じて いれば、★1文字も 出しません。
  if (!開) return null;

  if (開いた) {
    const koen = koens[開いた.koenId] || { id: 開いた.koenId };
    const 行 = rows.find((r) => r.koen_id === 開いた.koenId) || {};
    return (
      <div style={{ fontFamily: FONT_STACK }}>
        <Back onClick={() => set開いた(null)}>{tx(MINE_HEAD)}</Back>
        {開いた.view === "mine" ? (
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
                  <span style={{ ...小, display: "block" }}>{tx(l.sub)}</span>
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
