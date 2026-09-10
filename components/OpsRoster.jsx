"use client";

import { useState, useMemo } from "react";
import { C } from "@/lib/tokens";
import {
  rosterCount, countsByStatus, statusLabel, isCounted,
  monthlyFee, perHead, yen, MONTHLY_FLOOR,
  ROSTER_CHIPS, chipCounts, matchesChip,
  teacherFilterOptions, matchesTeacher, TEACHER_FILTER_ALL
} from "@/lib/orgRoster";
import { safeBreakdown, TOO_SMALL_NOTE } from "@/lib/smallGroups";

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
  // ★★しぼり込み（★見本 G07 ／ 2026-09-11）。
  //   ★★決めは lib/orgRoster.js が 持ちます。★ここでは 数えません。
  //   ★★2段 あります。★上の 札（ようす）と、★下から 上がる 1枚（担当の先生）。
  const [chip, setChip] = useState("all");
  const [teacher, setTeacher] = useState(TEACHER_FILTER_ALL);
  // ★★1枚が 開いている あいだの、★まだ 決めていない えらび。
  //   ★★押すたびに 一覧が 変わると、★何人に なるかが 分かりません。
  //     ★「この しぼりで 見る」を 押したときに、★はじめて 効きます。
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPick, setSheetPick] = useState(TEACHER_FILTER_ALL);

  const chips = useMemo(() => chipCounts(members), [members]);
  const teacherOptions = useMemo(
    () => teacherFilterOptions(members, teacherNameOf), [members, teacherNameOf]);

  const list = useMemo(() => {
    const s = q.trim();
    return (members || []).filter((m) => {
      if (!matchesChip(m, chip)) return false;
      if (!matchesTeacher(m, teacher)) return false;
      if (!s) return true;
      const n = nameOf ? nameOf(m.user_id) : "";
      const tn = (m.teacher_ids || []).map((id) => (teacherNameOf ? teacherNameOf(id) : "")).join(" ");
      return `${n} ${tn}`.includes(s);
    });
  }, [members, q, chip, teacher, nameOf, teacherNameOf]);

  const teacherLabel = (teacherOptions.find((o) => o.id === teacher) || {}).label || "";

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

      {/* ★★ようす の 札（★見本 G02・G07 の .chips）。
          ★★数は しぼっても 変わりません。★名簿ぜんぶの 数です。
            ★「いま 何人 見えているか」では なく、★「何人 いるか」です。 */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        {ROSTER_CHIPS.map((c) => {
          const on = chip === c.key;
          return (
            <button key={c.key} type="button" onClick={() => setChip(c.key)}
              aria-pressed={on}
              style={{
                whiteSpace: "nowrap", minHeight: 44, padding: "0 11px",
                borderRadius: 999, fontSize: "0.71875rem",
                border: `1px solid ${on ? C.curtain : C.line}`,
                background: on ? C.curtain : C.card,
                color: on ? "#FFFDF8" : C.inkSoft
              }}>{c.label} {chips[c.key]}</button>
          );
        })}
      </div>

      {/* ★★担当の先生で しぼる（★見本 G07）。
          ★★開く 口は ここです。★いま 何で しぼっているかも、ここに 出します。
            ★★絞ったまま 忘れると、★「1人 減った」に 見えます。 */}
      <button type="button" onClick={() => { setSheetPick(teacher); setSheetOpen(true); }}
        style={{
          width: "100%", minHeight: 44, borderRadius: 12, padding: "0 13px",
          border: `1px solid ${C.line}`, background: C.card, color: C.ink,
          fontSize: "0.8125rem", textAlign: "left"
        }}>
        担当の先生で しぼる
        <span style={{ float: "right", color: C.inkSoft }}>
          {teacher === TEACHER_FILTER_ALL ? "すべて" : teacherLabel}　›
        </span>
      </button>

      {/* ★★1行を 1枚の カードに（★裁定）。★表に しません。
          ★★狭い画面で 表を 出すと、★横に 切れるか、★字が 読めなくなります。 */}
      {list.length === 0 ? (
        <div style={card}>
          {/* ★★「いません」と「絞ったので 見えません」を、★言い分けます。
              ★★絞ったまま 忘れると、★人が 減ったように 見えます。
              ★★出口は、★押せる ボタンで 置きます。★字だけの 案内に しません。 */}
          {(chip !== "all" || teacher !== TEACHER_FILTER_ALL || q.trim()) ? (
            <>
              <p style={small}>いまの しぼりでは、どなたも 出ません。</p>
              <button type="button"
                onClick={() => { setQ(""); setChip("all"); setTeacher(TEACHER_FILTER_ALL); }}
                style={{
                  marginTop: 8, minHeight: 44, padding: "0 14px", borderRadius: 10,
                  border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
                  fontSize: "0.8125rem"
                }}>しぼりを けす</button>
            </>
          ) : (
            <p style={small}>まだどなたも名簿にいません。</p>
          )}
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
        {/* ★★内訳は、★5人に 満たなければ 出しません（★2026-09-10）。
            ★★54人の 中の「休会中 2人」は、★近い人には 見当が つきます。
            ★★合計（数える人数）は 出します。★あれは かたまりでは ありません。
            ★決めるのは lib/smallGroups.js だけです。 */}
        {(() => {
          const safe = safeBreakdown(by);
          const parts = [];
          if (safe.paused != null && safe.paused > 0) parts.push(`休会中 ${safe.paused}人`);
          if (safe.invited != null && safe.invited > 0) parts.push(`返事まち ${safe.invited}人`);
          const hidden = (safe.paused == null) || (safe.invited == null);
          if (parts.length === 0 && !hidden) return null;
          return (
            <p style={small}>
              {parts.join("　／　")}
              {hidden ? (parts.length > 0 ? <br /> : null) : null}
              {hidden ? TOO_SMALL_NOTE : null}
            </p>
          );
        })()}
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

      {/* ★★担当の先生で しぼる ── 下から 上がる 1枚（★見本 G07 の .sheetup）。
          ★★えらんだ だけでは 効きません。「この しぼりで 見る」で 効きます。
            ★★押すたびに 一覧が 動くと、★何人 いるかを 読めません。
          ★★閉じる 道を 2つ 置きます（★暗い ところと「やめる」）。
            ★出口の ない 1枚を 作らないこと。 */}
      {sheetOpen ? (
        <>
          <div onClick={() => setSheetOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 70,
              background: "rgba(36,25,20,0.35)"
            }} />
          <div role="dialog" aria-label="担当の先生で しぼる"
            style={{
              position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 71,
              maxHeight: "70vh", overflowY: "auto",
              background: C.paper, borderRadius: "18px 18px 0 0",
              border: `1px solid ${C.line}`, borderBottom: "none",
              padding: "12px 13px calc(14px + env(safe-area-inset-bottom))"
            }}>
            <div aria-hidden="true" style={{
              width: 40, height: 4, borderRadius: 2, background: "#DFD4BE",
              margin: "0 auto 12px"
            }} />
            <h3 style={{ fontSize: "0.65625rem", color: C.inkSoft, letterSpacing: "0.08em",
              marginBottom: 7 }}>担当の先生で しぼる</h3>

            {teacherOptions.map((o) => {
              const on = sheetPick === o.id;
              return (
                <button key={o.id} type="button" onClick={() => setSheetPick(o.id)}
                  aria-pressed={on}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", minHeight: 46, marginBottom: 6,
                    background: C.card, border: `1px solid ${C.line}`,
                    borderRadius: 11, padding: "0 12px",
                    fontSize: "0.8125rem", color: C.ink, textAlign: "left"
                  }}>
                  <span>{o.label}{o.count != null ? `　${o.count}人` : ""}</span>
                  {/* ★★丸は 印です。★色だけに 意味を 持たせません。
                      ★えらんだ ものは、★中が 埋まります（★見本 .ck.on）。 */}
                  <span aria-hidden="true" style={{
                    width: 20, height: 20, borderRadius: "50%", flex: "none",
                    border: `1.5px solid ${on ? C.curtain : C.line}`,
                    background: on ? C.curtain : "transparent"
                  }} />
                </button>
              );
            })}

            <button type="button"
              onClick={() => { setTeacher(sheetPick); setSheetOpen(false); }}
              style={{
                width: "100%", minHeight: 52, marginTop: 8, borderRadius: 12,
                border: `1px solid ${C.curtain}`, borderBottomWidth: 3,
                background: C.curtain, color: "#FFFDF8", fontSize: "0.9375rem"
              }}>この しぼりで 見る</button>
            <button type="button" onClick={() => setSheetOpen(false)}
              style={{
                width: "100%", minHeight: 44, marginTop: 6, borderRadius: 12,
                border: "none", background: "transparent", color: C.inkSoft,
                fontSize: "0.8125rem"
              }}>やめる</button>
          </div>
        </>
      ) : null}
    </div>
  );
}
