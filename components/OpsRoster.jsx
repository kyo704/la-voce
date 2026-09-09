"use client";

import { useState, useMemo } from "react";
import { C } from "@/lib/tokens";
import {
  rosterCount, countsByStatus, statusLabel, isCounted,
  monthlyFee, perHead, yen, MONTHLY_FLOOR
} from "@/lib/orgRoster";

// ============================================================================
// 名簿 ── 見本③⑦（2026-09-09・第3便）
//
//   ★出どころ docs/opus/woolsong-見本-運営モード8点（9月9日）.jpg ③⑦
//            坂本さん経由・Opus の裁定（2026-09-09）
//     「★表ではなく、★1行を1枚のカードにする
//      ★操作系のボタンは、★画面の下半分に配置する
//      ★合計金額などは、★下に固定して常に見えるようにする
//      ★さがす機能を、★一覧の前に配置する
//      ★ボタンサイズは 44pt 以上」
//
//   ★★先生・事務は 数えません（★§10）。★休会中も 数えません。
//   ★★％も 連続日数も 出しません。
//   ★★この画面から、★生徒の健康の記録には たどりつけません。
//     ★出すのは 名前・担当・入った日・ようす だけです（★見本⑦）。
//
//   ★数と 決めは lib/orgRoster.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/org-roster.test.js
// ============================================================================

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 };
const small = { fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.8 };

/** ★入った日。★「2024年4月」。★日にちまでは 出しません。 */
function joinedWord(iso) {
  if (typeof iso !== "string" || iso.length < 7) return "";
  return `${iso.slice(0, 4)}年${Number(iso.slice(5, 7))}月`;
}

export default function OpsRoster({ members, nameOf, teacherNameOf, canSeeMoney, onInvite }) {
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const s = q.trim();
    if (!s) return members || [];
    return (members || []).filter((m) => {
      const n = nameOf ? nameOf(m.user_id) : "";
      const tn = (m.teacher_ids || []).map((id) => (teacherNameOf ? teacherNameOf(id) : "")).join(" ");
      return `${n} ${tn}`.includes(s);
    });
  }, [members, q, nameOf, teacherNameOf]);

  const counted = rosterCount(members);
  const by = countsByStatus(members);
  const fee = monthlyFee(counted);

  return (
    // ★★下の 帯に かぶらないよう、★下に 余白を 取ります。
    <div className="space-y-3" style={{ paddingBottom: 132 }}>
      <div>
        <h2 className="ff-display italic" style={{ fontSize: "1.25rem", color: C.ink }}>名簿</h2>
        <p style={small}>
          在籍 {by.counted + by.paused}人
          {/* ★★何が 数えられているかを、★はじめに 書きます。
              ★★あとから「先生も 数えた」と 思われないためです。 */}
          <br />ご請求はこの人数です。先生と事務の方は数えません。
        </p>
      </div>

      {/* ★★さがすを、★一覧の 前に 置きます（★裁定）。
          ★★54人を 上から 送るのは、★探すことに なりません。 */}
      <input
        type="search" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="名前や、担当の先生でさがす"
        style={{
          width: "100%", minHeight: 44, borderRadius: 12, padding: "0 14px",
          border: `1px solid ${C.line}`, background: C.card, color: C.ink,
          fontSize: "1rem"
        }} />

      {/* ★★1行を 1枚の カードに（★裁定）。★表に しません。
          ★★狭い画面で 表を 出すと、★横に 切れるか、★字が 読めなくなります。 */}
      {list.length === 0 ? (
        <div style={card}>
          <p style={small}>
            {q.trim() ? "見つかりませんでした。" : "まだどなたも名簿にいません。"}
          </p>
        </div>
      ) : (
        list.map((m) => {
          const on = isCounted(m);
          const st = m.status || "enrolled";
          return (
            <div key={m.user_id || m.id} style={card}>
              <div className="flex items-center justify-between gap-2">
                <span style={{ fontSize: "0.9375rem", color: C.ink }}>
                  {nameOf ? nameOf(m.user_id) : ""}
                </span>
                {/* ★★ようす。★色を 分けません。★休会中を 赤く しません。
                    ★★休むことは、★悪いことでは ありません。 */}
                <span style={{
                  fontSize: "0.625rem", color: on ? C.ink : C.inkSoft,
                  background: C.paper, border: `1px solid ${C.line}`,
                  borderRadius: 999, padding: "3px 9px", whiteSpace: "nowrap"
                }}>{statusLabel(st)}{st === "invited" ? "・返事まち" : ""}</span>
              </div>
              <p style={{ ...small, marginTop: 4 }}>
                担当　{(m.teacher_ids || []).map((id) => (teacherNameOf ? teacherNameOf(id) : "")).filter(Boolean).join("・") || "—"}
                {m.joined_on ? `　／　${joinedWord(m.joined_on)}` : ""}
              </p>
              {/* ★★数えるか どうかを、★1人ずつ 書きます（★見本③）。
                  ★★あとで「なぜ この人数か」を 説明できるようにです。 */}
              <p style={{ ...small, color: on ? C.inkSoft : C.inkSoft }}>
                {on ? "ご請求に数えます" : "ご請求には数えません"}
              </p>
            </div>
          );
        })
      )}

      {/* ★★操作は、★画面の 下半分に（★裁定）。
          ★★上に 置くと、★片手で 持ったとき 親指が 届きません。 */}
      {onInvite ? (
        <button type="button" onClick={onInvite}
          className="w-full"
          style={{
            minHeight: 52, borderRadius: 12, border: `1px solid ${C.curtain}`,
            borderBottomWidth: 3, background: C.curtain, color: "#FFFDF8",
            fontSize: "0.9375rem"
          }}>名簿に招く</button>
      ) : null}

      {/* ★★合計は、★下に 固定して いつも 見えるように（★裁定）。
          ★★人数を 変えながら、★いくらに なるかを 見られます。
          ★★お金は 責任者だけ（★§1-1）。★admin には 出しません。 */}
      <div style={{
        position: "fixed", left: 0, right: 0, bottom: 56,
        background: C.card, borderTop: `1px solid ${C.line}`,
        padding: "10px 14px calc(10px + env(safe-area-inset-bottom))",
        zIndex: 3
      }}>
        <div className="flex items-center justify-between" style={{ fontSize: "0.8125rem", color: C.ink }}>
          <span>数える人数</span>
          <span>{counted}人</span>
        </div>
        {by.paused > 0 || by.invited > 0 ? (
          <p style={small}>
            {by.paused > 0 ? `休会中 ${by.paused}人` : ""}
            {by.paused > 0 && by.invited > 0 ? "　／　" : ""}
            {by.invited > 0 ? `返事まち ${by.invited}人` : ""}
          </p>
        ) : null}
        {canSeeMoney ? (
          <>
            <div className="flex items-center justify-between" style={{ fontSize: "0.8125rem", color: C.ink }}>
              <span>今月のご請求</span>
              <span>{yen(fee)}円</span>
            </div>
            <p style={small}>
              {counted > 0 ? `1人あたり ${yen(perHead(counted))}円` : "—"}
              {fee === MONTHLY_FLOOR && counted > 0 ? `　／　月額の下限 ${yen(MONTHLY_FLOOR)}円` : ""}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
