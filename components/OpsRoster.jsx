"use client";

import { useState, useMemo } from "react";
import { C } from "@/lib/tokens";
import {
  rosterCount, countsByStatus, statusLabel, isCounted,
  monthlyFee, perHead, yen, MONTHLY_FLOOR,
  ROSTER_CHIPS, chipCounts, matchesChip,
  teacherFilterOptions, matchesTeacher, TEACHER_FILTER_ALL,
  gradeFilterOptions, matchesGrade, GRADE_FILTER_ALL
} from "@/lib/orgRoster";
import { safeBreakdown, TOO_SMALL_NOTE, MIN_GROUP } from "@/lib/smallGroups";

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

/**
 * ★絞りの 1段（★状態／学年／先生）。
 *
 *   ★★3つとも 同じ 形です。★1か所で 作ります。
 *   ★★押した その場で 効きます。★決める ボタンは ありません。
 */
function FilterRow({ title, options, value, onChange }) {
  return (
    <>
      <h3 style={{ fontSize: "0.65625rem", color: C.inkSoft, letterSpacing: "0.08em",
        margin: "12px 0 7px" }}>{title}</h3>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map((o) => {
          const on = value === o.id;
          return (
            <button key={o.id} type="button" onClick={() => onChange(o.id)}
              aria-pressed={on}
              style={{
                minHeight: 44, padding: "0 11px", borderRadius: 999,
                fontSize: "0.71875rem", whiteSpace: "nowrap",
                border: `1px solid ${on ? C.curtain : C.line}`,
                background: on ? C.curtain : C.card,
                color: on ? "#FFFDF8" : C.inkSoft
              }}>
              {o.label}{o.count != null ? ` ${o.count}` : ""}
            </button>
          );
        })}
      </div>
    </>
  );
}
const small = { fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.8 };

/** ★入った日。★「2024年4月」。★日にちまでは 出しません。 */
function joinedWord(iso) {
  if (typeof iso !== "string" || iso.length < 7) return "";
  return `${iso.slice(0, 4)}年${Number(iso.slice(5, 7))}月`;
}

export default function OpsRoster({
  members, nameOf, teacherNameOf, canSeeMoney, onInvite,
  // ★★学年を 入れる 道（★2026-09-11）。
  //   ★★これが 無いと、★学年の 札が 永久に 出ません。
  //     ★読む 道だけ 作って、★書く 道を 作らない ── これが
  //     ★notOutDates と 同じ 形の 穴です。
  //   ★★「その人」の 画面（★見本 SC['その人']）の、はじめの 1欄です。
  //     ★のこりは、その画面を 作る ときに 足します。
  canEdit, onSetGrade
}) {
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
  // ★★2026-09-11、★新しい 動く見本（SH['shiboru']）に そろえました。
  //   ★★えらんだ その場で 効きます。★「この しぼりで 見る」は やめました。
  //     ★見本に その ボタンが ありません。★1枚は 開いた ままで 一覧が 動きます。
  //   ★★学年も 足しました。
  const [grade, setGrade] = useState(GRADE_FILTER_ALL);
  // ★いま 学年を 入れている 方（★user_id）と、打っている 途中の 文字。
  const [gradeEdit, setGradeEdit] = useState(null);
  const [gradeDraft, setGradeDraft] = useState("");

  const chips = useMemo(() => chipCounts(members), [members]);
  const teacherOptions = useMemo(
    () => teacherFilterOptions(members, teacherNameOf), [members, teacherNameOf]);
  // ★★学年は、★名簿に 実際に 入っている ものだけです。
  //   ★1つも 無ければ 空。★空なら 札を 出しません（★押せない 札を 置かない）。
  const gradeOptions = useMemo(() => gradeFilterOptions(members), [members]);

  const list = useMemo(() => {
    const s = q.trim();
    return (members || []).filter((m) => {
      if (!matchesChip(m, chip)) return false;
      if (!matchesTeacher(m, teacher)) return false;
      if (!matchesGrade(m, grade)) return false;
      if (!s) return true;
      const n = nameOf ? nameOf(m.user_id) : "";
      const tn = (m.teacher_ids || []).map((id) => (teacherNameOf ? teacherNameOf(id) : "")).join(" ");
      return `${n} ${tn}`.includes(s);
    });
  }, [members, q, chip, teacher, grade, nameOf, teacherNameOf]);

  const teacherLabel = (teacherOptions.find((o) => o.id === teacher) || {}).label || "";
  const narrowed = chip !== "all" || teacher !== TEACHER_FILTER_ALL
    || grade !== GRADE_FILTER_ALL || q.trim() !== "";

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
      <button type="button" onClick={() => setSheetOpen(true)}
        style={{
          width: "100%", minHeight: 44, borderRadius: 12, padding: "0 13px",
          border: `1px solid ${C.line}`, background: C.card, color: C.ink,
          fontSize: "0.8125rem", textAlign: "left"
        }}>
        絞る
        <span style={{ float: "right", color: C.inkSoft }}>
          {narrowed ? "しぼっています" : "すべて"}　›
        </span>
      </button>

      {/* ★★1行を 1枚の カードに（★裁定）。★表に しません。
          ★★狭い画面で 表を 出すと、★横に 切れるか、★字が 読めなくなります。 */}
      {list.length === 0 ? (
        <div style={card}>
          {/* ★★「いません」と「絞ったので 見えません」を、★言い分けます。
              ★★絞ったまま 忘れると、★人が 減ったように 見えます。
              ★★出口は、★押せる ボタンで 置きます。★字だけの 案内に しません。 */}
          {narrowed ? (
            <>
              <p style={small}>いまの しぼりでは、どなたも 出ません。</p>
              <button type="button"
                onClick={() => {
                  setQ(""); setChip("all");
                  setTeacher(TEACHER_FILTER_ALL); setGrade(GRADE_FILTER_ALL);
                }}
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
              {/* ★★学年・コース（★見本 SC['その人'] の はじめの 1欄）。
                  ★★学校が 決める 文字です。★1年〜4年と 決め打ちに しません。
                  ★★入っていない ときは「—」です。★勝手に 埋めません。 */}
              {canEdit && onSetGrade ? (
                gradeEdit === m.user_id ? (
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <input
                      type="text" value={gradeDraft} autoFocus
                      onChange={(e) => setGradeDraft(e.target.value.slice(0, 40))}
                      placeholder="れい：声楽3年"
                      style={{
                        flex: 1, minWidth: 0, minHeight: 44, borderRadius: 10,
                        padding: "0 10px", border: `1px solid ${C.line}`,
                        background: C.paper, color: C.ink, fontSize: "1rem"
                      }} />
                    <button type="button"
                      onClick={() => { onSetGrade(m.user_id, gradeDraft.trim()); setGradeEdit(null); }}
                      style={{
                        minHeight: 44, padding: "0 14px", borderRadius: 10,
                        border: `1px solid ${C.curtain}`, background: C.curtain,
                        color: "#FFFDF8", fontSize: "0.8125rem", flex: "none"
                      }}>入れる</button>
                    {/* ★★やめる 道を 置きます。★打ちかけを 捨てられる ように。 */}
                    <button type="button" onClick={() => setGradeEdit(null)}
                      style={{
                        minHeight: 44, padding: "0 10px", borderRadius: 10,
                        border: "none", background: "transparent",
                        color: C.inkSoft, fontSize: "0.8125rem", flex: "none"
                      }}>やめる</button>
                  </div>
                ) : (
                  <button type="button"
                    onClick={() => {
                      setGradeDraft(m.grade_label || "");
                      setGradeEdit(m.user_id);
                    }}
                    style={{
                      marginTop: 4, minHeight: 44, padding: 0,
                      background: "transparent", border: "none",
                      color: C.inkSoft, fontSize: "0.6875rem", textAlign: "left"
                    }}>
                    学年・コース　{m.grade_label || "—"}　›
                  </button>
                )
              ) : (
                m.grade_label ? (
                  <p style={small}>学年・コース　{m.grade_label}</p>
                ) : null
              )}
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

      {/* ★★絞る ── 下から 上がる 1枚（★新しい 動く見本 SH['shiboru'] ／ 2026-09-11）。
          ★★えらんだ その場で 効きます。★決める ボタンは ありません。
            ★★はじめ「この しぼりで 見る」を 置いていました（★静止画 G07）。
              ★新しい 見本に その ボタンが ないため、外しました。
              ★1枚は 開いた まま、★後ろの 一覧が 動きます。
          ★★状態は、★上の 札と ここの 両方に あります（★見本も そうです）。
            ★★同じ 1つの 値を 見ています。★決めが 2つに なっていません。
          ★★閉じる 道を 2つ 置きます（★暗い ところと「閉じる」）。
            ★出口の ない 1枚を 作らないこと。 */}
      {sheetOpen ? (
        <>
          <div onClick={() => setSheetOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 70,
              background: "rgba(36,25,20,0.35)"
            }} />
          <div role="dialog" aria-label="絞る"
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
            <div style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: 10 }}>絞る</div>

            <FilterRow title="状態"
              options={ROSTER_CHIPS.map((c) => ({ id: c.key, label: c.label, count: chips[c.key] }))}
              value={chip} onChange={setChip} />

            {/* ★★学年は、★名簿に 入っているときだけ 出します。
                ★1つも 無いのに 札を 並べると、★押しても 何も 起きません。 */}
            {gradeOptions.length > 0 ? (
              <FilterRow title="学年" options={gradeOptions} value={grade} onChange={setGrade} />
            ) : null}

            <FilterRow title="先生" options={teacherOptions} value={teacher} onChange={setTeacher} />

            {/* ★★見本の 但し書き（★1文字も 変えないこと）。
                ★仕組みは lib/smallGroups.js に 前から あります。
                ★言葉が 画面に 出ていませんでした。 */}
            <p style={{ ...small, marginTop: 12 }}>
              下から 出します（iPhoneでは 上に 置きません）。{MIN_GROUP}人未満の かたまりは、数を 出しません。
            </p>

            <button type="button" onClick={() => setSheetOpen(false)}
              style={{
                width: "100%", minHeight: 48, marginTop: 10, borderRadius: 12,
                border: `1px solid ${C.line}`, background: C.card, color: C.ink,
                fontSize: "0.875rem"
              }}>閉じる</button>
          </div>
        </>
      ) : null}
    </div>
  );
}
