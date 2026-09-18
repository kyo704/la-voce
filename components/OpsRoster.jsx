"use client";

import { useEffect, useState, useMemo } from "react";
import { C } from "@/lib/tokens";
// ★★名簿の 表（★裁定 その80・2026-09-18）。★広い ときだけ 出します。
import OpsRosterTable from "@/components/OpsRosterTable";
import { showRosterTable } from "@/lib/opsRosterTable";
// ★★生徒を 招く（★裁定 その82・2026-09-18）。★字は lib が 持ちます。
import {
  INVITE_HEAD, INVITE_NOTES, INVITE_NOTES_BOLD, NOT_YET, CODE_LEAD, CODE_HOW, CODE_DAYS
} from "@/lib/studentInvite";
import {
  rosterCount, countsByStatus, statusLabel, isCounted,
  monthlyFee, perHead, yen, MONTHLY_FLOOR,
  ROSTER_CHIPS, chipCounts, matchesChip,
  teacherFilterOptions, matchesTeacher, TEACHER_FILTER_ALL,
  gradeFilterOptions, matchesGrade, GRADE_FILTER_ALL
} from "@/lib/orgRoster";
import {
  mayGrantPost, mayChangePerson, CANNOT_CHANGE_REASON
} from "@/lib/opsPerms";
import { tx } from "@/lib/t";
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
  canEdit, onSetGrade,
  // ★★役職（★2026-09-11・裁定 §7 ／ 3段目）。
  //   ★★posts が 渡されなければ、★役職の 行を 出しません。
  //     ★1段目の SQL を 流す 前でも、★画面が 壊れません。
  posts, postsById, myPerms, onSetPost, inviteCode = null, inviteError = "", onCloseInvite}) {
  // ★★幅を 見ます（★`components/Renraku.jsx` と 同じ 形）。
  //   ★★はじめは null です。★分からない うちは 表を 出しません
  //     （★出して から 縮めない）。
  const [winW, setWinW] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const on = () => setWinW(window.innerWidth);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

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
  // ★いま 役職を えらんでいる 方と、★だめだった わけ。
  const [postEdit, setPostEdit] = useState(null);
  const [postMessage, setPostMessage] = useState("");

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
          {/* ★★2026-09-13、★ここが「在籍 NaN人」に なって いました。
              ★★countsByStatus の 形を active／left に 変えた とき、
                ★★by.paused が 無く なりました。★数 ＋ undefined ＝ NaN。
              ★★描いて みて 気づきました。★見張りは 通って いました。
              ★★数えるのは 在籍中 だけ です。★退会した 方は 数えません。 */}
          在籍 {by.counted}人
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

      {/* ★★★広い ときは 表、★狭い ときは 札（★裁定 その80・2026-09-18）。
          ★★★どちらも 残します。★用が ちがいます ──
            ★表 … ★200人を 横に 並べて くらべる。★担当・状態を 一目で。
            ★札 … ★1人を 見る。★触って 直す。
          ★★名簿は 最大 500人 です。★札だけ では 一覧できません。
          ★★境目は lib/opsRosterTable.js の `ROSTER_TABLE_AT`。
            ★★★役職の 表（933）とは **別の 数** です。★列の 数も 幅も ちがいます。
          ★★狭い ときに 表を 出すと、★横に 切れるか、★字が 読めなく なります。 */}
      {list.length > 0 && showRosterTable(winW) ? (
        <OpsRosterTable rows={list} nameOf={nameOf} teacherNameOf={teacherNameOf}
          onOpen={undefined} />
      ) : list.length === 0 ? (
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
                }}>{statusLabel(st)}</span>
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
                  // ★★2026-09-13、★実機の ご報告 ──「できたが 分かりづらい」。
                  //   ★★押せる ほうと 押せない ほうが、★同じ 見た目 でした。
                  //     ★どちらも 薄い 色（inkSoft）・小さい 字（0.6875rem）で、
                  //     ★ちがいは 右の `›` だけ。★気づけません。
                  //   ★★この家の 形に そろえます（★RecordSheets の SheetRow）──
                  //     ★枠を 付ける。★中の 色を 紙と 分ける。
                  //     ★入って いるか どうかを **形**で 出す（★✓／＋）。
                  //     ★★色だけに 意味を 持たせません。
                  <button type="button"
                    onClick={() => {
                      setGradeDraft(m.grade_label || "");
                      setGradeEdit(m.user_id);
                    }}
                    style={{
                      display: "flex", alignItems: "center",
                      justifyContent: "space-between", gap: 8,
                      width: "100%", textAlign: "left",
                      marginTop: 6, minHeight: 44, padding: "0 12px",
                      background: C.card, border: `1px solid ${C.line}`,
                      borderRadius: 12, color: C.ink, fontSize: "0.8125rem"
                    }}>
                    <span>
                      <b style={{
                        color: m.grade_label ? C.sage : C.curtain, marginRight: 8
                      }}>{m.grade_label ? "✓" : "＋"}</b>
                      {tx("学年・コース")}
                    </span>
                    <span style={{ color: C.inkSoft, fontSize: "0.6875rem" }}>
                      {m.grade_label || tx("入れる")}　›
                    </span>
                  </button>
                )
              ) : (
                // ★★直せない 方には、★ただの 1行に します。
                //   ★★枠も 印も 付けません。★押せる ように 見せない ため。
                //   ★★入って いなければ 何も 出しません（★空の 見出しを 置かない）。
                m.grade_label ? (
                  <p style={small}>{tx("学年・コース")}　{m.grade_label}</p>
                ) : null
              )}

              {/* ★★役職（★見本 SC['役職を変える'] ／ 2026-09-11・3段目）。
                  ★★渡せない 役職は 灰色。★押すと わけを 出します。★隠しません。
                    ★★守りは サーバに あります（★/api/org/posts の assign）。
                  ★★いま 付いている 役職を 触れない ときは、★はじめから 開きません。
                    ★自分より 強い 方を 降ろせない ため（★裁定 §7-4）。 */}
              {posts && posts.length > 0 ? (() => {
                const mine = m.post_id ? (postsById || {})[m.post_id] : null;
                const label = mine ? mine.name : tx("—");
                if (!canEdit || !onSetPost) {
                  return mine ? <p style={small}>{tx("役職　")}{label}</p> : null;
                }
                const mayTouch = mayChangePerson(myPerms, mine);
                if (postEdit !== m.user_id) {
                  return (
                    <button type="button"
                      onClick={() => {
                        setPostMessage("");
                        if (!mayTouch) { setPostMessage(CANNOT_CHANGE_REASON); return; }
                        setPostEdit(m.user_id);
                      }}
                      style={{
                        marginTop: 4, minHeight: 44, padding: 0, textAlign: "left",
                        background: "transparent", border: "none",
                        color: mayTouch ? C.inkSoft : C.inkFaint, fontSize: "0.6875rem"
                      }}>
                      {tx("役職　")}{label}　›
                    </button>
                  );
                }
                return (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {[{ id: null, name: tx("役職なし") }, ...posts].map((p) => {
                        const on = (m.post_id || null) === p.id;
                        const allowed = p.id === null ? true : mayGrantPost(myPerms, p);
                        return (
                          <button key={p.id || "none"} type="button"
                            onClick={() => {
                              if (!allowed) { setPostMessage(CANNOT_CHANGE_REASON); return; }
                              onSetPost(m.user_id, p.id);
                              setPostEdit(null);
                            }}
                            style={{
                              minHeight: 44, padding: "0 11px", borderRadius: 999,
                              fontSize: "0.71875rem", whiteSpace: "nowrap",
                              border: `1px solid ${on ? C.curtain : C.line}`,
                              background: on ? C.curtain : C.card,
                              color: on ? "#FFFDF8" : (allowed ? C.inkSoft : C.inkFaint)
                            }}>
                            {p.name}{on ? tx("　✓ いま") : ""}
                          </button>
                        );
                      })}
                    </div>
                    <button type="button" onClick={() => setPostEdit(null)}
                      style={{
                        minHeight: 44, padding: 0, background: "transparent", border: "none",
                        color: C.inkSoft, fontSize: "0.6875rem"
                      }}>{tx("やめる")}</button>
                  </div>
                );
              })() : null}
            </div>
          );
        })
      )}

      {/* ★★渡せない ときの わけ。★字だけの 案内に しません。
          ★★出しっぱなしに しません。★次に えらぶと 消えます。 */}
      {postMessage ? (
        <div style={{ ...card, background: C.paper, borderColor: C.line }}>
          <p style={small}>{postMessage}</p>
        </div>
      ) : null}

      {/* ★★操作は、★画面の 下半分に（★裁定）。
          ★★上に 置くと、★片手で 持ったとき 親指が 届きません。 */}
      {onInvite ? (
        <button type="button" onClick={onInvite}
          className="w-full"
          style={{
            minHeight: 52, borderRadius: 12, border: `1px solid ${C.curtain}`,
            borderBottomWidth: 3, background: C.curtain, color: "#FFFDF8",
            fontSize: "0.9375rem"
          }}>＋ 招く</button>
      ) : null}

      {/* ★★★招く 1枚（★裁定 その82・見本 `SC['招く']`）。
          ★★★いま できるのは「合言葉を お作りする」ところ までです。
            ★★メールで お送りする 道は、★まだ ありません。
            ★★外へ 送る ことは、★坂本さんの お許しを いただいて から に します。
            ★★★だから メールの 口を **置きません**。★押せない 札に なります（★§8⑤）。
          ★★注記は 見本の ままです。★1行も 減らして いません（★裁定 その82）。
          ★★字は lib/studentInvite.js が 持ちます。 */}
      {inviteCode || inviteError ? (
        <div style={{ ...card, borderColor: C.curtain }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 700, color: C.ink, margin: "0 0 6px" }}>
            {INVITE_HEAD}
          </p>
          {inviteError ? (
            <p style={{ ...small, color: C.curtain, margin: 0 }}>{inviteError}</p>
          ) : (
            <>
              <p style={{ ...small, margin: "0 0 6px" }}>{CODE_LEAD}</p>
              <p className="ff-mono" style={{
                textAlign: "center", fontSize: "1.375rem", letterSpacing: "0.22em",
                color: C.curtain, background: C.paper, borderRadius: 10,
                padding: "10px 0", margin: "0 0 6px"
              }}>{inviteCode}</p>
              <p style={{ ...small, margin: 0 }}>{CODE_HOW}</p>
              <p style={{ ...small, margin: 0 }}>
                {`${CODE_DAYS}日で 切れます。`}
              </p>
            </>
          )}

          <div style={{ marginTop: 10 }}>
            {INVITE_NOTES.map((line) => {
              const b = INVITE_NOTES_BOLD.find((x) => line.includes(x));
              return (
                <p key={line} style={{ ...small, margin: 0 }}>
                  {b ? (
                    <>
                      {line.slice(0, line.indexOf(b))}
                      <b style={{ color: C.ink }}>{b}</b>
                      {line.slice(line.indexOf(b) + b.length)}
                    </>
                  ) : line}
                </p>
              );
            })}
          </div>

          {/* ★★★まだ 作って いない ものを、★隠しません。
              ★★口を 置かない かわりに、★何が まだかを 書きます。
              ★★「作って いない」と「壊れて いる」は ちがいます。 */}
          <div style={{ marginTop: 10 }}>
            {NOT_YET.map((x) => (
              <p key={x.key} style={{ ...small, margin: 0, color: C.inkSoft }}>
                {`${x.label} …… ${x.why}`}
              </p>
            ))}
          </div>

          {onCloseInvite ? (
            <button type="button" onClick={onCloseInvite}
              style={{
                marginTop: 10, minHeight: 44, padding: "0 14px", borderRadius: 10,
                border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
                fontSize: "0.8125rem"
              }}>閉じる</button>
          ) : null}
        </div>
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
          if (safe.left != null && safe.left > 0) parts.push(`退会 ${safe.left}人`);
          // ★★休会・返事まちは 台帳に ありません（★2026-09-13）。出しません。
          const hidden = (safe.left == null);
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
