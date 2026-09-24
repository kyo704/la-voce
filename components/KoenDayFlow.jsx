"use client";

import { useEffect, useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import {
  dayRows, myCallTime, hasAny, myRoomName,
  DAY_HEAD, DAY_NOT_CALLED, DAY_ALSO_YOU, DAY_MY_CALL, DAY_GO_MINE, DAY_ROOM, DAY_NOTE,
  MINE_HEAD, MINE_PAPER, STAFF_PAPER_WHY, STAFF_PLACE, STAFF_DAY, STAFF_NOTE
} from "@/lib/myKoenDay";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★本番の 日の 流れ ／ スタッフの 自分の 予定 ── ★見本 2画面・★1つの 部品
//   ★出どころ 裁定148 Q6 ／ 裁定178
//     ／ woolsong-2026-09-21_1.zip（md5 67c56244 ／ 0132714e）
//
//   ★★★出演者か スタッフかで 出る ものが ちがいます。
//     ★★決めて いるのは **台帳** です（`my_runsheet`）──
//       ★出演者には ぜんぶ、★スタッフには 自分の 区切り だけ を 返します。
//     ★★★画面では 分けません。★分けると、★台帳と ずれる 日が 来ます。
//       ★ここが するのは、★返って きた ものの **見せ方** だけ です。
//
//   ★★★ほかの 方の 入りの 時刻は 出しません。★体調の ことも 出しません。
//   ★★★お知らせは 送りません。★変わったら 画面が 変わる だけ です。
//
//   ★見張り components/tests/koen-day-screens.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };

export default function KoenDayFlow({
  supabase, koen, isStaff = false, myPart, place, myMemberId, onSeeMine
}) {
  const [rows, setRows] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomMembers, setRoomMembers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase || !koen) return;
    let 生 = true;
    (async () => {
      try {
        const { data, error: e } = await supabase.rpc("my_runsheet", { p_koen: koen.id });
        if (e) throw e;
        if (生) setRows(data || []);
        // ★★楽屋 …… ★自分の 行 だけ が 返ります（★台帳の 決めで 止めて います）。
        const [{ data: rm }, { data: mb }] = await Promise.all([
          supabase.from("koen_rooms").select("id, koen_id, name, sort_order").eq("koen_id", koen.id),
          supabase.from("koen_room_members").select("id, room_id, member_id")
        ]);
        if (生) { setRooms(rm || []); setRoomMembers(mb || []); }
      } catch (e) { if (生) setError(String((e && e.message) || e)); }
    })();
    return () => { 生 = false; };
  }, [supabase, koen]);

  const 行 = useMemo(() => dayRows(rows), [rows]);
  const 入 = useMemo(() => myCallTime(行), [行]);
  const 楽 = useMemo(() => myRoomName(rooms, roomMembers, myMemberId), [rooms, roomMembers, myMemberId]);

  // ★★紙に 出す …… ★いま 見えて いる ものを その まま 字に します。
  //   ★★見えて いない ものは 入りません ── ★もとから 持って いません。
  function 紙に出す() {
    const 字 = [["時こく", "区切り", "誰"].join(",")]
      .concat(行.map((r) => ['"' + r.time + '"', '"' + r.what + '"', '"' + r.who + '"'].join(",")))
      .join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + 字], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = (koen.title || "koen") + "_kugiri.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!koen) return null;

  return (
    <div>
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(6)}` }}>
        {isStaff ? tx(MINE_HEAD) : tx(DAY_HEAD)}
      </h2>
      <div style={{ ...小, marginBottom: rem(10) }}>
        {isStaff && myPart ? myPart + "　／　" : ""}{koen.title}
        {!isStaff && koen.opens_on ? "　" + koen.opens_on : ""}
        {!isStaff && place ? "　" + place : ""}
      </div>

      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden"
      }}>
        {行.map((r, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            gap: rem(8), padding: `${rem(9)} ${rem(12)}`,
            borderBottom: `1px solid ${C.line2}`,
            // ★★呼ばれて いない ところは 薄く。★消しません ── ★流れは 見えた ほうが よい
            opacity: isStaff || r.mine ? 1 : 0.5, ...TYPE.li
          }}>
            <span>
              <b>{r.time}</b>　{r.what}
              {r.who ? <span style={{ ...小, display: "block" }}>{r.who}</span> : null}
            </span>
            {/* ★★★呼ばれて **いる** ほうに 字を 置きます（★見本・2026-09-24）。
                ★★逆に して いました ── ★呼ばれて いない 行 ぜんぶに
                  ★「あなたは 呼ばれていません」が 並んで いました。
                ★★薄さでも、★下の 註でも、★同じ ことを 言って います。
                  ★★3度 言うと、★2度目からは 責める 字に なります。 */}
            {!isStaff && r.mine ? (
              <span style={小}>{tx(DAY_ALSO_YOU)}</span>
            ) : null}
          </div>
        ))}
      </div>

      {/* ★★★1つも 呼ばれて いない ときだけ、★1度 だけ 申し上げます。
          ★★行ごとに 繰り返しません。★それが これまでの 姿 でした。 */}
      {!isStaff && 行.length > 0 && !行.some((r) => r.mine) ? (
        <p style={{ ...小, margin: `${rem(6)} 0 0` }}>{tx(DAY_NOT_CALLED)}</p>
      ) : null}

      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
        marginTop: rem(11), overflow: "hidden"
      }}>
        {isStaff ? (
          <>
            <div style={{
              display: "flex", justifyContent: "space-between", gap: rem(8),
              padding: `${rem(9)} ${rem(12)}`, borderBottom: `1px solid ${C.line2}`, ...TYPE.li
            }}>
              <span>{tx(STAFF_PLACE)}</span><span>{place || koen.venue || ""}</span>
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between", gap: rem(8),
              padding: `${rem(9)} ${rem(12)}`, borderBottom: `1px solid ${C.line2}`, ...TYPE.li
            }}>
              <span>{tx(STAFF_DAY)}</span><span>{koen.opens_on || ""}</span>
            </div>
            {/* ★★紙に 出す …… ★区切りと 場所 だけ。★出番は 入りません（★裁定148 Q6）。 */}
            <button type="button" onClick={紙に出す}
              style={{
                width: "100%", minHeight: 44, display: "flex", alignItems: "center",
                justifyContent: "space-between", padding: `${rem(9)} ${rem(12)}`,
                background: "transparent", border: "none", color: C.ink,
                fontFamily: FONT_STACK, textAlign: "left", ...TYPE.li
              }}>
              <span>
                {tx(MINE_PAPER)}
                <span style={{ ...小, display: "block" }}>{tx(STAFF_PAPER_WHY)}</span>
              </span>
              <span style={{ color: C.inkSoft }}>›</span>
            </button>
          </>
        ) : (
          <>
            {/* ★★★自分の 入り だけ。★ほかの 方の 時刻は ありません。 */}
            {/* ★★★楽屋は 自分の ところ だけ。★ほかの 方の 楽屋は 出しません。 */}
            {楽 ? (
              <div style={{
                display: "flex", justifyContent: "space-between", gap: rem(8),
                padding: `${rem(9)} ${rem(12)}`, borderBottom: `1px solid ${C.line2}`, ...TYPE.li
              }}>
                <span>{tx(DAY_ROOM)}</span><span>{楽}</span>
              </div>
            ) : null}
            {入 ? (
              <div style={{
                display: "flex", justifyContent: "space-between", gap: rem(8),
                padding: `${rem(9)} ${rem(12)}`, borderBottom: `1px solid ${C.line2}`, ...TYPE.li
              }}>
                <span>{tx(DAY_MY_CALL)}</span><span><b>{入}</b></span>
              </div>
            ) : null}
            {onSeeMine && hasAny(行) ? (
              <button type="button" onClick={onSeeMine}
                style={{
                  width: "100%", minHeight: 44, display: "flex", alignItems: "center",
                  justifyContent: "space-between", padding: `${rem(9)} ${rem(12)}`,
                  background: "transparent", border: "none", color: C.ink,
                  fontFamily: FONT_STACK, textAlign: "left", ...TYPE.li
                }}>
                <span>{tx(DAY_GO_MINE)}</span><span style={{ color: C.inkSoft }}>›</span>
              </button>
            ) : null}
          </>
        )}
      </div>

      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}

      {/* ★★★見本の 但し書き。★1字 も 足しません。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {(isStaff ? STAFF_NOTE : DAY_NOTE).map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
