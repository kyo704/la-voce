"use client";

import { useState, useMemo } from "react";
import useWindowWidth from "@/components/useWindowWidth";
import { C } from "@/lib/tokens";
// ★★学校の 形（★裁定 その98）。★学科・コースを 出します。★決めは lib です。
import { choosableFor, shapeLineOf } from "@/lib/orgDivisions";
// ★★小見出しの 字は uiKit が 持ちます（★2つ目の 決めを 作りません）。
import { TYPE } from "@/lib/uiKit";
// ★★名簿の 表（★裁定 その80・2026-09-18）。★広い ときだけ 出します。
import OpsRosterTable from "@/components/OpsRosterTable";
import { showRosterTable } from "@/lib/opsRosterTable";
// ★★生徒を 招く（★裁定 その82・2026-09-18）。★字は lib が 持ちます。
import {
  INVITE_HEAD, INVITE_NOTES, INVITE_NOTES_BOLD, NOT_YET, CODE_LEAD, CODE_HOW, CODE_DAYS
} from "@/lib/studentInvite";
import {
  rosterCount, countsByStatus, statusLabel, isCounted, STATUSES,
  monthlyFee, perHead, yen, MONTHLY_FLOOR,
  ROSTER_CHIPS, chipCounts, matchesChip,
  teacherFilterOptions, matchesTeacher, TEACHER_FILTER_ALL,
  gradeFilterOptions, matchesGrade, GRADE_FILTER_ALL,
  // ★★名簿の 画面の 字（★2026-09-18・裁定 その84 NEW_ORDER 2）。★lib が 持ちます。
  rosterSubLine, NOT_COUNTED_HEAD, notCountedRows, rosterNotes, ROSTER_NOTE_BOLD
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

// ★★★`FilterRow` を 外しました（★2026-09-18）。
//   ★★「絞る」1枚の 中でだけ 使って いた 部品 です。
//   ★★1枚を 外した ので、★読む 人が 居なく なりました。
//   ★★★使われない 部品を 残しません。★残すと、★半年後に
//     ★「どちらが 正か」を また 調べる ことに なります。
//   ★★中身は `git show 015f49c2:components/OpsRoster.jsx` で 引けます。

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
  // ★★★在籍の ようす（★見本 `P_sonohito`・2026-09-19）。
  //   ★★在籍 ／ 休会 ／ 退会 の 3つ。★台帳も 同じ 3つ に なりました。
  //   ★★休会は **数える 人数に 入りません**。★お金に かかります。
  //   ★★渡されなければ、★その 節ごと 出しません（★§8⑤）。
  onSetStatus,
  // ★★★学校の 形（★裁定 その98）。★学科・コースを 出します。
  //   ★★学部は その 上から 出ます。★選ばせません。
  divisions = [], onSetDivision,
  // ★★★レッスンの 出席（★この3か月）。★数 だけ です。★率は 出しません。
  attendanceOf,
  // ★★★この 画面から 見えない もの（★見本の「見られないもの」）。
  wallItems = [],
  // ★★役職（★2026-09-11・裁定 §7 ／ 3段目）。
  //   ★★posts が 渡されなければ、★役職の 行を 出しません。
  //     ★1段目の SQL を 流す 前でも、★画面が 壊れません。
  posts, postsById, myPerms, onSetPost, inviteCode = null, inviteError = "", onCloseInvite}) {
  // ★★幅を 見ます（★`components/Renraku.jsx` と 同じ 形）。
  //   ★★はじめは null です。★分からない うちは 表を 出しません
  //     （★出して から 縮めない）。
  // ★★幅を 見る 仕掛けは `components/useWindowWidth.js` の 1本 です（★2026-09-18）。
  const winW = useWindowWidth();

  const [q, setQ] = useState("");
  // ★★しぼり込み（★見本 G07 ／ 2026-09-11）。
  //   ★★決めは lib/orgRoster.js が 持ちます。★ここでは 数えません。
  //   ★★2段 あります。★上の 札（ようす）と、★下から 上がる 1枚（担当の先生）。
  const [chip, setChip] = useState("all");
  const [teacher, setTeacher] = useState(TEACHER_FILTER_ALL);
  // ★★1枚が 開いている あいだの、★まだ 決めていない えらび。
  //   ★★押すたびに 一覧が 変わると、★何人に なるかが 分かりません。
  //     ★「この しぼりで 見る」を 押したときに、★はじめて 効きます。
  // ★★2026-09-11、★新しい 動く見本（SH['shiboru']）に そろえました。
  //   ★★えらんだ その場で 効きます。★「この しぼりで 見る」は やめました。
  //     ★見本に その ボタンが ありません。★1枚は 開いた ままで 一覧が 動きます。
  //   ★★学年も 足しました。
  const [grade, setGrade] = useState(GRADE_FILTER_ALL);
  // ★いま 学年を 入れている 方（★user_id）と、打っている 途中の 文字。
  const [gradeEdit, setGradeEdit] = useState(null);
  // ★★招く ときの 決め（★学年・学科）。★決めなくて かまいません。
  const [inviteAim, setInviteAim] = useState({ gradeYear: null, divisionId: null });
  // ★★招く 1枚を 開いて いるか（★2026-09-19）。★開く → 決める → 作る。
  const [inviteOpen, setInviteOpen] = useState(false);
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

  // ★★★二段組に する か（★2026-09-18・坂本さんの お決め 1）。
  //   ★★見本 ── `col2`。★左が 表（flex:3）、★右が ご請求の 欄（flex:1・min 230）。
  //   ★★★境目を **新しく 作りません**。★表を 出す 境目 と 同じ もの を 使います
  //     （★`lib/opsRosterTable.js` の `ROSTER_TABLE_AT` ＝ 885）。
  //     ★★2つ 目の 境目を 作ると、★表は 出て いるのに 右の 欄が 無い 幅 が できます。
  //   ★★狭い ときは これまで どおり ── ★1段組 ＋ 下に 貼りつく 合計 です。
  const 二段 = showRosterTable(winW);

  // ★★★ご請求の 中身 ── ★1つの 関数 です。
  //   ★★広い ときは 右の 箱の 中、★狭い ときは 下の 帯の 中 に 出ます。
  //   ★★★写して 2つに しません。★片方だけ 直る 日が 来ます。
  function 請求の中身() {
    return (
      <>
        <div className="flex items-center justify-between"
          style={{ fontSize: "0.8125rem", color: C.ink }}>
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
            <div className="flex items-center justify-between"
              style={{ fontSize: "0.8125rem", color: C.ink }}>
              <span>今月のご請求</span>
              <span>{yen(fee)}円</span>
            </div>
            <p style={small}>
              {counted > 0 ? `1人あたり ${yen(perHead(counted))}円` : "—"}
              {fee === MONTHLY_FLOOR && counted > 0 ? `　／　月額の下限 ${yen(MONTHLY_FLOOR)}円` : ""}
            </p>
          </>
        ) : null}
      </>
    );
  }

  // ★★右の 欄の 1枚目（★見本の「いまの ご請求」）。
  function 請求の箱() {
    return (
      <div style={card}>
        <h3 style={{ ...TYPE.h3, margin: "0 0 7px" }}>いまの ご請求</h3>
        {請求の中身()}
      </div>
    );
  }

  // ★★右の 欄の 2枚目（★見本の「数えないもの」）。★字は lib が 持ちます。
  function 数えないものの箱() {
    return (
      <div style={card}>
        <h3 style={{ ...TYPE.h3, margin: "0 0 7px" }}>{NOT_COUNTED_HEAD}</h3>
        {notCountedRows().map((r) => (
          <div key={r.name} className="flex items-center justify-between"
            style={{ ...small, padding: "3px 0" }}>
            <span>{r.name}</span>
            <span>{r.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    // ★★下の 帯に かぶらないよう、★下に 余白を 取ります。
    /* ★★下の 帯に かぶらないよう、★下に 余白を 取ります。
         ★★★二段組の ときは、★合計が 右に 移るので 余白は 要りません。 */
    <div className="space-y-3" style={{ paddingBottom: 二段 ? 24 : 132 }}>
      <div>
        {/* ★★★`.ff-display italic` を 外しました（★2026-09-18・坂本さんの お決め 3）。
             ★★見本の 題は その 書体 ですが、★この 蔵には 先に 決めが あります ──
               ★★`lib/uiKit.js`「門の中の 画面では .ff-display を 使いません」。
               ★★Cormorant の 0 は 背の低い 旧式数字で、★小文字の o に 見えます。
               ★★2026-09-09 の 実機で、★ねむりが「6時間o分」と 出て いました。
             ★★★1画面の 見本合わせ より、★全体の 揃いを 採ります。 */}
        <h2 style={{ fontSize: "1.25rem", color: C.ink }}>名簿</h2>
        <p style={small}>
          {/* ★★2026-09-13、★ここが「在籍 NaN人」に なって いました。
              ★★countsByStatus の 形を active／left に 変えた とき、
                ★★by.paused が 無く なりました。★数 ＋ undefined ＝ NaN。
              ★★描いて みて 気づきました。★見張りは 通って いました。
              ★★数えるのは 在籍中 だけ です。★退会した 方は 数えません。 */}
          {/* ★★★字は lib が 持ちます（★2026-09-18）。★ここで 組み立てません。
               ★★見本 ──「N人　／　在籍 M人（＝ご請求の 人数）　／　
                 ★休会・退会・招待中は 数えません」
               ★★「＝ご請求の 人数」が、★これが お金の 話だ と 分かる 唯一の 印 です。 */}
          {rosterSubLine(members.length, by.counted)}
        </p>
      </div>

      {/* ★★★二段組（★見本の `col2`）。★左が 表、★右が ご請求の 欄。
           ★★狭い ときは 1段に なります。★`flexWrap` では なく、
             ★★右の 欄 そのものを 出しません（★下に 貼りつく 合計が 出ます）。
           ★★`alignItems: flex-start` ── ★見本の ままです。
             ★★これが 無いと、★右の 箱が 表の 高さまで 伸びます。 */}
      <div style={{
        display: "flex", gap: 14,
        alignItems: "flex-start", flexDirection: 二段 ? "row" : "column"
      }}>
      <div className="space-y-3" style={{ flex: 3, minWidth: 0, width: "100%" }}>

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

      {/* ★★★学年・先生の 札を、★表の 上に 並べます（★2026-09-18・坂本さんの お決め 2）。
           ★★きょうまで、★この 2つは「絞る」1枚（下から 上がる）の 中に ありました。
             ★★2026-09-11 に こちらで 足した ものです。★見本に ありません。
             ★★★見本に 根拠の ない 独自の 形は、★この 機会に 見本へ 寄せます。
           ★★見本 ── `pills` が 2列。★状態の 列と、★学科・コース ＋ 学年の 列。
           ★★★この 蔵に「学科・コース」の 表が まだ ありません。
             ★★`gradeFilterOptions` は 名簿に 入って いる 学年 だけ を 出します。
             ★★1つも 無ければ、★列 ごと 出しません（★押せない 札を 置きません）。
           ★★押した その場で 効きます。★決める ボタンは ありません。 */}
      {gradeOptions.length > 0 ? (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {gradeOptions.map((o) => (
            <button key={o.id} type="button" onClick={() => setGrade(o.id)}
              aria-pressed={grade === o.id}
              style={{
                whiteSpace: "nowrap", minHeight: 44, padding: "0 11px",
                borderRadius: 999, fontSize: "0.71875rem",
                border: `1px solid ${grade === o.id ? C.curtain : C.line}`,
                background: grade === o.id ? C.curtain : C.card,
                color: grade === o.id ? "#FFFDF8" : C.inkSoft
              }}>{o.label}</button>
          ))}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        {teacherOptions.map((o) => (
          <button key={o.id} type="button" onClick={() => setTeacher(o.id)}
            aria-pressed={teacher === o.id}
            style={{
              whiteSpace: "nowrap", minHeight: 44, padding: "0 11px",
              borderRadius: 999, fontSize: "0.71875rem",
              border: `1px solid ${teacher === o.id ? C.curtain : C.line}`,
              background: teacher === o.id ? C.curtain : C.card,
              color: teacher === o.id ? "#FFFDF8" : C.inkSoft
            }}>{o.label}</button>
        ))}
      </div>

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

              {/* ★★★学科・コース（★見本 `P_sonohito`・2026-09-19）。
                  ★★学部は その 上から 出ます。★選ばせません。
                  ★★形が 1つも 無ければ、★出しません。 */}
              {choosableFor(divisions).length > 0 ? (
                <p style={small}>
                  {(() => {
                    const 形 = shapeLineOf(divisions, m);
                    return `学科・コース　${形.department}　／　学部　${形.faculty}`;
                  })()}
                </p>
              ) : null}
              {canEdit && onSetDivision && choosableFor(divisions).length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {choosableFor(divisions)
                    .filter((d) => d.kind === "department")
                    .map((d) => (
                      <button key={d.id} type="button"
                        onClick={() => onSetDivision(m.user_id,
                          m.division_id === d.id ? null : d.id)}
                        style={{
                          minHeight: 44, padding: "0 12px", borderRadius: 999,
                          border: `1px solid ${m.division_id === d.id ? C.curtain : C.line}`,
                          background: m.division_id === d.id ? C.paper : C.card,
                          color: C.ink, fontSize: "0.75rem"
                        }}>{d.name}</button>
                    ))}
                </div>
              ) : null}

              {/* ★★★レッスンの 出席（★この3か月・見本 `P_sonohito`）。
                  ★★出席 ／ 休み ／ 休講 の 3つ。★数 だけ です。
                  ★★★率（％）は 出しません。★人を くらべません。 */}
              {attendanceOf ? (() => {
                const a = attendanceOf(m.user_id) || null;
                if (!a) return null;
                return (
                  <p style={small}>
                    {`この3か月　出席 ${a.came}　休み ${a.absent}　休講 ${a.canceled}`}
                  </p>
                );
              })() : null}

              {/* ★★★在籍の ようす（★見本 `P_sonohito`・2026-09-19）。
                  ★★在籍 ／ 休会 ／ 退会。★台帳も 同じ 3つ です。
                  ★★★休会は 数える 人数に 入りません。★その ことを 書きます。
                  ★★変えられない 方には 出しません（★押せない 札を 置きません）。 */}
              {canEdit && onSetStatus ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {/* ★★★退会は ここに 出しません（★2026-09-19）。
                      ★★退会は 台帳の 関数（`leave_enrollment`）が します。
                        ★★あちらは `left_at` も 書き、★後始末も します。
                      ★★★画面から 直に 書くと、★同じ ことが 2か所に なります。
                        ★★片方だけ 直る 日が 来ます。★この 蔵の 持病 です。
                      ★★台帳 08-19 に 預けました。 */}
                  {STATUSES.filter((x) => x.key !== "left").map((x) => (
                    <button key={x.key} type="button"
                      onClick={() => { if (st !== x.key) onSetStatus(m.user_id, x.key); }}
                      style={{
                        minHeight: 44, padding: "0 12px", borderRadius: 999,
                        border: `1px solid ${st === x.key ? C.curtain : C.line}`,
                        background: st === x.key ? C.paper : C.card,
                        color: C.ink, fontSize: "0.75rem"
                      }}>
                      {st === x.key ? `✓ ${x.label}` : x.label}
                    </button>
                  ))}
                </div>
              ) : null}
              {canEdit && onSetStatus ? (
                <>
                  <p style={small}>
                    {(STATUSES.find((x) => x.key === st) || STATUSES[0]).note}
                  </p>
                  <p style={small}>退会は、ご本人の 画面から 承ります。</p>
                </>
              ) : null}
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
                        // ★★`inkFaint` は 押せない 字 だけ です（★裁定 その84）。
                        //   ★★ここは ふつうの 字 です。★4段目（`ink4`）に します。
                        color: mayTouch ? C.inkSoft : C.ink4, fontSize: "0.6875rem"
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
                              // ★★同じ 直し（★裁定 その84）。
                              color: on ? "#FFFDF8" : (allowed ? C.inkSoft : C.ink4)
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
      {/* ★★★招く ── ★開く → 決める → 作る の 順に しました
          （★2026-09-19・実機の ご報告）。
          ★★きょうまで、★決める 前から 合言葉が 出て いました。
            ★★前に 作った ものが、★画面に 残った まま だった からです。
          ★★★合言葉は、★作った ときの 学年・学科を **持って います**。
            ★★あとから 選び直すと、★その 合言葉は 古い ものに なります。
            ★★だから、★選び直したら 合言葉を 消します。
          ★★決めなくて かまいません。★あとから ご本人が 直せます。 */}
      {onInvite ? (
        <div>
          {!inviteOpen ? (
            <button type="button"
              onClick={() => { setInviteOpen(true); if (onCloseInvite) onCloseInvite(); }}
              className="w-full"
              style={{
                minHeight: 52, borderRadius: 12, border: `1px solid ${C.curtain}`,
                borderBottomWidth: 3, background: C.curtain, color: "#FFFDF8",
                fontSize: "0.9375rem"
              }}>＋ 招く</button>
          ) : (
            <div style={{ ...card, borderColor: C.curtain }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: C.ink, margin: "0 0 6px" }}>
                招く
              </p>
              <p style={small}>
                学年と 学科を 決めて おけます。決めなくて かまいません。
                あとから ご本人が 直せます。
              </p>

              {choosableFor(divisions).filter((d) => d.kind === "department").length > 0 ? (
                <>
                  <p style={small}>学科・コース</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                    {choosableFor(divisions).filter((d) => d.kind === "department").map((d) => (
                      <button key={d.id} type="button"
                        onClick={() => {
                          setInviteAim((v) =>
                            ({ ...v, divisionId: v.divisionId === d.id ? null : d.id }));
                          if (onCloseInvite) onCloseInvite();
                        }}
                        style={札の形(inviteAim.divisionId === d.id)}>{d.name}</button>
                    ))}
                  </div>
                </>
              ) : (
                <p style={small}>
                  学科・コースは、設定の「学校の 形」で 足すと ここに 出ます。
                </p>
              )}

              <p style={small}>学年</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {[1, 2, 3, 4, 5, 6].map((g) => (
                  <button key={g} type="button"
                    onClick={() => {
                      setInviteAim((v) => ({ ...v, gradeYear: v.gradeYear === g ? null : g }));
                      if (onCloseInvite) onCloseInvite();
                    }}
                    style={札の形(inviteAim.gradeYear === g)}>{`${g}年`}</button>
                ))}
              </div>

              {/* ★★★決めて から 作ります（★2026-09-19・実機の ご報告）。
                  ★★決める 前から 押せて いました。★順が 崩れます。
                  ★★★「決めずに 作る」道も 残します ── ★決めなくて よい から です。
                    ★★けれど そちらは 控えめな 札に します。★はじめに 目に 入るのは、
                      ★★「決めて から」の ほう です。 */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {/* ★★★この 形で 決まりました（★2026-09-19・坂本さんの お決め D31）。
                    ★★学年・学科は **任意** です（★見本 ──「あとから ご本人が 直せます」）。
                    ★★★けれど「合言葉を 作る」は、★両方 選ぶまで 押せません。
                      ★★決めずに お渡しする ときは、★下の「決めずに 作る」を 押します。
                      ★★★わけ ── ★押し間違いで、★決めかけの まま 出来て しまうのを
                        ★★防ぎます。★「決めない」は、★選んで いただく 形に します。
                    ★★★この 2つの 札を 1つに しないで ください。
                      ★★1つに すると、★どちらの 意味で 押したかが 残りません。 */}
                <button type="button"
                  disabled={!(inviteAim.gradeYear && inviteAim.divisionId)}
                  onClick={() => onInvite(inviteAim)}
                  style={{
                    flex: 1, minHeight: 52, borderRadius: 12,
                    border: `1px solid ${C.curtain}`, borderBottomWidth: 3,
                    background: (inviteAim.gradeYear && inviteAim.divisionId)
                      ? C.curtain : C.line,
                    color: "#FFFDF8", fontSize: "0.9375rem"
                  }}>合言葉を 作る</button>
                <button type="button"
                  onClick={() => {
                    setInviteOpen(false);
                    setInviteAim({ gradeYear: null, divisionId: null });
                    if (onCloseInvite) onCloseInvite();
                  }}
                  style={{
                    minHeight: 52, padding: "0 14px", borderRadius: 12,
                    border: `1px solid ${C.line}`, background: C.card,
                    color: C.inkSoft, fontSize: "0.8125rem"
                  }}>やめる</button>
              </div>
              {/* ★★★いま 何が 決まって いるかを、★押す 前に 出します。
                  ★★「決めかけで 出来て しまった」を、★字で 防ぎます。 */}
              {!(inviteAim.gradeYear && inviteAim.divisionId) ? (
                <div style={{ marginTop: 8 }}>
                  <p style={small}>
                    {`いま …… 学年 ${inviteAim.gradeYear ? inviteAim.gradeYear + "年" : "まだ"}`
                      + `　／　学科 ${inviteAim.divisionId
                        ? ((divisions || []).find((d) => d.id === inviteAim.divisionId) || {}).name
                          || "まだ" : "まだ"}`}
                  </p>
                  <p style={small}>
                    両方 選ぶと「合言葉を 作る」を 押せます。
                    決めずに お渡しする ことも できます。
                  </p>
                  <button type="button" onClick={() => onInvite(
                    { gradeYear: null, divisionId: null })}
                    style={{
                      minHeight: 44, padding: "0 14px", borderRadius: 999,
                      border: `1px solid ${C.line}`, background: C.card,
                      color: C.inkSoft, fontSize: "0.75rem"
                    }}>決めずに 作る</button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {/* ★★★招く 1枚（★裁定 その82・見本 `SC['招く']`）。
          ★★★いま できるのは「合言葉を お作りする」ところ までです。
            ★★メールで お送りする 道は、★まだ ありません。
            ★★外へ 送る ことは、★坂本さんの お許しを いただいて から に します。
            ★★★だから メールの 口を **置きません**。★押せない 札に なります（★§8⑤）。
          ★★注記は 見本の ままです。★1行も 減らして いません（★裁定 その82）。
          ★★字は lib/studentInvite.js が 持ちます。 */}
      {(inviteCode || inviteError) && inviteOpen ? (
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
              {/* ★★★その 合言葉が 持って いる 決めを、★そばに 書きます。
                  ★★あとで「どれを 選んだか」を 思い出せる ように します。 */}
              <p style={{ ...small, margin: 0 }}>
                {`この 合言葉 …… 学年 ${inviteAim.gradeYear ? inviteAim.gradeYear + "年" : "決めて いません"}`
                  + `　／　学科 ${inviteAim.divisionId
                    ? ((divisions || []).find((d) => d.id === inviteAim.divisionId) || {}).name
                      || "決めて いません"
                    : "決めて いません"}`}
              </p>
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
                {`${x.label} …… ${x.say}`}
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

      </div>{/* ★左の 列 ここまで */}

      {/* ★★★右の 欄（★見本の `flex:1;min-width:230px`）。
           ★★2枚 ── ★「いまの ご請求」と「数えないもの」。
           ★★★貼りつけます。★表を 下まで 送っても、★合計が 見えて います
             （★見本の 但し書き ──「合計は 右に 貼りつけます」）。
           ★★狭い ときは 出しません。★下に 貼りつく 合計が その 役 です。 */}
      {二段 ? (
        <aside className="space-y-3" style={{
          flex: 1, minWidth: 230, position: "sticky", top: 0
        }}>
          {請求の箱()}
          {数えないものの箱()}
        </aside>
      ) : null}
      </div>{/* ★二段組 ここまで */}

      {/* ★★★「数えないもの」── ★狭い ときは ここに 出します（★見本の 2枚目）。
           ★★2026-09-18 まで、★この 箱が ありません でした。
           ★★休会・招待中・先生と事務・5人まで 0円 ── ★どれも お金の 話 です。
             ★★出さないと、★数が 合わない ように 見えます。 */}
      {二段 ? null : 数えないものの箱()}

      {/* ★★★下の 但し書き（★見本の `.note`）。★字は lib が 持ちます。
           ★★1行目は 太字 です。★健康の 断り です。★減らしません。 */}
      <p style={{ ...small, lineHeight: 1.9 }}>
        {rosterNotes().map((t, i) => (
          <span key={t} style={{ display: "block" }}>
            {t === ROSTER_NOTE_BOLD ? <b style={{ color: C.ink }}>{t}</b> : t}
          </span>
        ))}
      </p>

      {/* ★★★狭い ときの 合計 ── ★下に 貼りつけます（★裁定・2026-09-09）。
           ★★人数を 変えながら、★いくらに なるかを 見られます。
           ★★★二段組の ときは 出しません。★右の 欄に 同じ ものが あります。
             ★★2つ 出すと、★同じ 数が 2か所に 見えます。★どちらが 本当か 迷います。
           ★★中身は `請求の箱`（上）と 同じ 1つの 関数 です。★写して いません。 */}
      {二段 ? null : (
        <div style={{
          position: "fixed", left: 0, right: 0, bottom: 56,
          background: C.card, borderTop: `1px solid ${C.line}`,
          padding: "10px 14px calc(10px + env(safe-area-inset-bottom))",
          zIndex: 3
        }}>
          {請求の中身()}
        </div>
      )}

      {/* ★★★「絞る」1枚（下から 上がる）を 外しました（★2026-09-18・お決め 2）。
           ★★2026-09-11 に こちらで 足した ものです。★見本に ありません。
           ★★中に あったのは 3つ ── ★状態／学年／先生 の 札 です。
             ★★どれも 消えて いません。★表の 上の 列に 移しました。
             ★★値を 書き込む ところは 1つも ありませんでした。★失う 記録は ありません。
           ★★★但し書き「{n}人未満の かたまりは、数を 出しません」は、
             ★★いまも ご請求の 箱の 中に 出て います（★`TOO_SMALL_NOTE`）。
           ★★中身は `git show 015f49c2:components/OpsRoster.jsx` で 引けます。 */}
    </div>
  );
}

// ★★選ぶ 札の 形（★1か所に します）。
function 札の形(on) {
  return {
    minHeight: 44, padding: "0 12px", borderRadius: 999,
    border: `1px solid ${on ? C.curtain : C.line}`,
    background: on ? C.paper : C.card,
    color: C.ink, fontSize: "0.75rem"
  };
}
