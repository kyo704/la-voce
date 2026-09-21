"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
// ★★表の すべり・貼り付けは 1か所が 持ちます（★裁定 その81 §5-1）。
import { TABLE_CLASS, ANCHOR_CLASSES } from "@/lib/visualTokens";
import { ScreenHead, H3, Box, Li, Note, Usu, Warn, Ask } from "@/components/UiV2";
import {
  HEAD, DAYS, slotKey, weekDates, weekWord, periodWord,
  freeAt, whoWrote, countWord, NOTES, NOT_WRITTEN_LINE, NOT_YET,
  // ★★誰の 分を 組むか（★裁定 その99 F1・2026-09-19）。
  PICK_TEACHER_HEAD, PICK_TEACHER_SUB, PICK_TEACHER_EMPTY, PICK_TEACHER_EMPTY_HOW,
  needsTeacherPick, whoseWord,
  // ★★やり直す（★裁定 その142・2026-09-21）。★決めは lib が 持ちます。
  REDO_LABEL, REDO_ASK, REDO_NOTE, mayRedo,
  // ★★自分の 予定だけ 全部 外す（★裁定 その142）。
  CLEAR_BUSY_LABEL, CLEAR_BUSY_ASK, CLEAR_BUSY_NOTE
} from "@/lib/opsKumu";

// ============================================================================
// ★日程を 組む ── ★見本 `P_kumu`（★裁定 その97 ／ その98 ①・2026-09-19）
//
//   ★★★見えるのは「空いて いるか どうか」だけ です。
//     ★★読み道（`get_student_free_slots`）が、★2値 しか 返しません。
//     ★★授業の 名・教室・備考は、★そもそも 手元に 来ません。
//
//   ★★行は ご自分の コマ（`my_periods`）。★列は 7日。
//   ★★マスを 押すと、★その 時間に 来られる 方が 右に 出ます。
//
//   ★★決めは lib/opsKumu.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/ops-kumu.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsKumu({
  todayISO, periods = [], slots = [], students = [], lessons = [],
  nameOf, onPlace, onRemove, onClose, saving, error = "",
  // ★★★誰の 分を 組むか（★裁定 その99 F1・2026-09-19）。
  //   ★★学長・事務長に、★ご自分の 門下は ありません。★それで 正しい です。
  //   ★★けれど「組む」のは 運営の 仕事 です。★門下の 有無と 関わりません。
  //   ★`perms` … ★`sched_all` を 持つ 方には、★先に 先生を 選んで いただきます
  //   ★`teachers` … ★受け持ちの ある 先生
  //   ★`teacherId` … ★いま 選んで いる 先生（★null なら まだ）
  perms, teachers = [], teacherId, onPickTeacher,
  // ★★★入れられる 枠へ（★見本 `P_okeru`・裁定 その108・2026-09-20）。
  //   ★★渡されなければ 押しどころに しません。
  onOpenOkeru,
  // ★★★やり直す（★裁定 その142・2026-09-21）。
  //   ★`onRedo` … ★その 週に 置いた ものを 受け取って、まとめて 外します
  //   ★`published` … ★出した あとか どうか。★出した あとは やり直せません
  //     ★★`NOT_YET` …… ★「出す」は まだ ありません（★この 紙の `publish`）。
  //       ★★作る 日に、★ここへ 本当の 値を 渡して ください。★いまは false です。
  onRedo, published = false,
  // ★★★自分の 予定だけ 全部 外す（★裁定 その142・2026-09-21）。
  //   ★★渡されなければ 札を 出しません（★押せない 札を 置きません）。
  //   ★★外れるのは **押した ご本人の** 印 だけ です。★台帳が そう 縛ります。
  onClearBusy
}) {
  const [week, setWeek] = useState(0);
  const [cell, setCell] = useState(null);
  // ★★やり直す 前に 一度 お尋ねします（★戻せない ため）。
  const [やり直す, setやり直す] = useState(false);
  const [予定外す, set予定外す] = useState(false);
  // ★★★`sched_all` の 方は、★先生を 選んで から です。
  //   ★★選ぶまで 表を 出しません。★誰の 分か 分からない 表は、★出せません。
  const 選ぶ = needsTeacherPick(perms) && !teacherId;
  const 日々 = weekDates(todayISO, week);
  const 書いた = whoWrote(slots);

  // ★★その 週に 置いて ある もの（★日づけで 見ます）。
  const 置いた = (lessons || []).filter((l) =>
    l && 日々.includes(String(l.scheduled_at || "").slice(0, 10)));
  const 置いた方 = new Set(置いた.map((l) => l.student_id));

  const マスの中身 = (di, p) => {
    const 来られる = freeAt(slots, di, p.ord);
    const 日 = 日々[di];
    const ここ = 置いた.filter((l) =>
      String(l.scheduled_at || "").slice(0, 10) === 日
      && l.period_ord === p.ord);
    return { 来られる, 日, ここ };
  };

  // ★★★先生を 選ぶ 画面（★裁定 その99 F1）。★別の 返り に します。
  //   ★★1つの 返りの 中で 混ぜると、★どの 節が どちらの ものか 分からなく なります。
  if (選ぶ) {
    return (
      <div style={{ fontFamily: FONT_STACK }}>
        <ScreenHead title={HEAD} right={onClose ? (
          <button type="button" onClick={onClose}
            style={{
              background: "transparent", border: "none", color: C.inkSoft,
              ...TYPE.mini, minHeight: 44, fontFamily: FONT_STACK
            }}>門下へ 戻る</button>
        ) : null} />
        <H3>{PICK_TEACHER_HEAD}</H3>
        <Usu>{PICK_TEACHER_SUB}</Usu>
        {teachers.length > 0 ? (
          <Box>
            {teachers.map((t, i) => (
              <Li key={t} last={i === teachers.length - 1} right="この 先生の 分"
                onClick={() => onPickTeacher && onPickTeacher(t)}>
                {nameOf ? nameOf(t) : ""}
              </Li>
            ))}
          </Box>
        ) : (
          <>
            <p style={{ ...TYPE.li, color: C.ink, margin: 0 }}>{PICK_TEACHER_EMPTY}</p>
            <Usu>{PICK_TEACHER_EMPTY_HOW}</Usu>
          </>
        )}
        <Note>{NOTES.map((t) => (<div key={t}>{t}</div>))}</Note>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      {/* ★★戻り道を 置きます（★門下から 来ます）。 */}
      <ScreenHead title={HEAD} right={onClose ? (
        <button type="button" onClick={onClose}
          style={{
            background: "transparent", border: "none", color: C.inkSoft,
            ...TYPE.mini, minHeight: 44, fontFamily: FONT_STACK
          }}>門下へ 戻る</button>
      ) : null} />
      {/* ★★★いま 誰の 分を 見て いるか（★裁定 その99 F1）。 */}
      <p style={小}>
        {`${whoseWord(teacherId && nameOf ? nameOf(teacherId) : null)}　／　`
          + `${置いた方.size} / ${students.length}人 置きました　／　${weekWord(week)}`}
      </p>
      {teacherId && onPickTeacher ? (
        <button type="button" onClick={() => onPickTeacher(null)} style={札}>
          ほかの 先生に する
        </button>
      ) : null}

      {/* ★★週を 移る。★数だけ です。★暦は まだ 出しません。 */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: `${rem(8)} 0` }}>
        <button type="button" onClick={() => setWeek(week - 1)} style={札}>‹ 前の週</button>
        <span style={{ ...TYPE.li, color: C.ink }}>{日々[0] || ""}</span>
        <button type="button" onClick={() => setWeek(week + 1)} style={札}>次の週 ›</button>
        {week !== 0 ? (
          <button type="button" onClick={() => setWeek(0)} style={札}>今週へ</button>
        ) : null}
        {/* ★★★やり直す（★裁定 その142）。★この 週 だけ です。
             ★★置いた ものが 無い ときは 出しません ── ★外す ものが ありません。
             ★★押せない 札を 置きません（★§8⑤）。 */}
        {onRedo && mayRedo({ published, placedCount: 置いた.length }) ? (
          <button type="button" onClick={() => setやり直す(true)} style={札}>
            {REDO_LABEL}
          </button>
        ) : null}
        {/* ★★★ご自分の「来られない」の 印を まとめて 外します（★裁定 その142）。
             ★★「やり直す」とは 別の もの です ── ★あちらは レッスン、
               ★こちらは ご自分の 印 です。★字も 分けて あります。 */}
        {onClearBusy ? (
          <button type="button" onClick={() => set予定外す(true)} style={札}>
            {CLEAR_BUSY_LABEL}
          </button>
        ) : null}
      </div>

      {periods.length === 0 ? (
        <Warn>
          ご自分の コマが まだ ありません。時間割を 書くと、ここに 行が 出ます。
        </Warn>
      ) : (
        /* ★★★同じ 決めが 2つに なって いました（★2026-09-19・裁定 その81 §5-1）。
             ★★すべりも、★左の 列の 貼り付けも、★ここに 手で 書いて ありました。
             ★★★`.tblwrap` が 一度に します。★`lib/visualTokens.js` が 持ちます。
               ★★見出しの 行も 貼り付きます（★ここには 無かった もの です）。
               ★★高さは 文字の つまみに 連動します（★`--scale`）。 */
        <div className={TABLE_CLASS}>
          <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", minWidth: 560 }}>
            <tbody>
              <tr>
                {/* ★★左の 列は 錨 です。★貼り付けは `.tblwrap` が します。 */}
                <th className={ANCHOR_CLASSES[1]} style={見出し}>コマ</th>
                {DAYS.map((d, di) => (
                  <th key={d} style={見出し}>
                    {d}
                    <div style={小}>{(日々[di] || "").slice(5)}</div>
                  </th>
                ))}
              </tr>
              {periods.map((p) => (
                <tr key={p.id || p.ord}>
                  <td className={ANCHOR_CLASSES[1]} style={マス}>
                    <div style={{ ...TYPE.mini, color: C.ink }}>{periodWord(p)}</div>
                  </td>
                  {DAYS.map((d, di) => {
                    const { 来られる, 日, ここ } = マスの中身(di, p);
                    const えらび = cell === slotKey(di, p.ord);
                    return (
                      <td key={d} style={マス}>
                        <button type="button"
                          onClick={() => setCell(えらび ? null : slotKey(di, p.ord))}
                          style={{
                            width: "100%", minHeight: 44, borderRadius: 8,
                            border: `1px solid ${えらび ? C.curtain : C.line}`,
                            background: ここ.length ? C.paper : C.card,
                            color: C.ink, ...TYPE.mini, fontFamily: FONT_STACK
                          }}>
                          {ここ.length
                            ? (nameOf ? nameOf(ここ[0].student_id) : "置いて います")
                            : countWord(来られる.length)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ★★選んだ マス ── ★その 時間に 来られる 方。 */}
      {/* ★★★やり直す 前の お尋ね。★戻せません。★何枚 外すかを 言います。 */}
      {やり直す ? (
        <Ask title={REDO_ASK}
          note={`${REDO_NOTE}（${置いた.length}件）`}
          okLabel={REDO_LABEL}
          onOk={() => { if (onRedo) onRedo(置いた); setやり直す(false); setCell(null); }}
          onCancel={() => setやり直す(false)} />
      ) : null}

      {/* ★★★ご自分の 印を 外す 前の お尋ね。★戻せません。 */}
      {予定外す ? (
        <Ask title={CLEAR_BUSY_ASK} note={CLEAR_BUSY_NOTE}
          okLabel={CLEAR_BUSY_LABEL}
          onOk={() => { if (onClearBusy) onClearBusy(); set予定外す(false); }}
          onCancel={() => set予定外す(false)} />
      ) : null}

      {cell ? (() => {
        const [di, ord] = cell.split("-").map(Number);
        const p = periods.find((x) => Number(x.ord) === ord) || null;
        const 来られる = freeAt(slots, di, ord);
        const 日 = 日々[di];
        const ここ = 置いた.filter((l) =>
          String(l.scheduled_at || "").slice(0, 10) === 日 && l.period_ord === ord);
        return (
          <div style={{ marginTop: rem(10) }}>
            <H3>{`${DAYS[di]} ${String(日 || "").slice(5)}　${periodWord(p)}`}</H3>
            {ここ.length > 0 ? (
              <Box>
                {ここ.map((l, i) => (
                  <Li key={l.id} last={i === ここ.length - 1}
                    right={onRemove ? "外す" : ""}
                    onClick={onRemove ? () => onRemove(l) : null}>
                    {nameOf ? nameOf(l.student_id) : ""}
                  </Li>
                ))}
              </Box>
            ) : null}
            {来られる.length > 0 ? (
              <Box>
                {来られる.map((uid, i) => (
                  <Li key={uid} last={i === 来られる.length - 1}
                    right={置いた方.has(uid) ? "もう 置いて います" : "ここに 置く"}
                    onClick={(!置いた方.has(uid) && onPlace && p)
                      ? () => onPlace({ studentId: uid, dateISO: 日, period: p })
                      : null}>
                    {nameOf ? nameOf(uid) : ""}
                  </Li>
                ))}
              </Box>
            ) : (
              <Usu>この 時間に 来られる 方は、いまの ところ いません。</Usu>
            )}
          </div>
        );
      })() : (
        <Usu>マスを 押すと、その 時間に 来られる 方が 出ます。</Usu>
      )}

      {/* ★★門下の 名簿 ── ★置いた か どうか だけ。★並べ替えません。 */}
      <H3>{`門下の 名簿（${students.length}人）`}</H3>
      <Box>
        {students.map((s, i) => (
          <Li key={s} last={i === students.length - 1}
            /* ★★★押すと、★入れられる 枠の 一覧へ（★見本 `P_okeru`・裁定 その108）。
                 ★★時間割を 書いて いない 方は 押せません ── ★枠が 出せません。
                 ★★★押せない 札を 置きません（★§8⑤）。 */
            onClick={onOpenOkeru && 書いた.includes(s) ? () => onOpenOkeru(s) : undefined}
            right={置いた方.has(s)
              ? <span style={{ color: C.sage }}>置きました</span>
              : (書いた.includes(s)
                ? (onOpenOkeru ? "枠を 見る ›" : "まだ")
                : "時間割が ありません")}>
            {nameOf ? nameOf(s) : ""}
          </Li>
        ))}
      </Box>
      <Usu>{NOT_WRITTEN_LINE}</Usu>

      {error ? (
        <p style={{ ...小, color: C.curtain, margin: `${rem(8)} 0 0` }}>{error}</p>
      ) : null}
      {saving ? <p style={小}>書いて います…</p> : null}

      {/* ★★★まだ できない こと。★押せる 札に しません（★§8⑤）。 */}
      <H3>まだ できない こと</H3>
      <Box>
        {NOT_YET.map((x, i) => (
          <Li key={x.key} last={i === NOT_YET.length - 1} right="まだ">
            {x.label}
            <div style={小}>{x.needs}</div>
          </Li>
        ))}
      </Box>

      <Note>{NOTES.map((t) => (<div key={t}>{t}</div>))}</Note>
    </div>
  );
}

const 札 = {
  minHeight: 44, padding: `0 ${rem(12)}`, borderRadius: 999,
  border: `1px solid ${C.line}`, background: C.card, color: C.ink,
  ...TYPE.mini, fontFamily: FONT_STACK
};
const 見出し = {
  ...TYPE.mini, color: C.inkSoft, textAlign: "left", padding: "6px 4px",
  borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap"
};
const マス = { padding: 3, borderBottom: `1px solid ${C.line}`, verticalAlign: "top" };
