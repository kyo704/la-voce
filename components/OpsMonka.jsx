"use client";

import useWindowWidth from "@/components/useWindowWidth";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK, cardStyle } from "@/lib/uiKit";
import { TABLE_CLASS, ANCHOR_CLASSES } from "@/lib/visualTokens";
import {
  HEAD, subLine, monkaRows, REPRESENTATIVE_MARK, lessonsOfStudent,
  presetOf, presetCount, MANY_PRESETS_LINE, NO_PRESET_LINE,
  NOTES, NOTES_BOLD, EMPTY_HEAD, EMPTY_HOW, NOT_YET, freeWord,
  // ★★日程を 組む へ（★2026-09-19・裁定 その98 ①）。
  GO_KUMU_LABEL, GO_KUMU_SUB,
  // ★★代表を 決める へ（★2026-09-19・見本 `P_daihyo`）。
  GO_DAIHYO_LABEL, GO_DAIHYO_SUB
} from "@/lib/opsMonka";
import {
  cameCount, cameWord, heldCount, progressWord, looksShort,
  SHORT_WORD, SHORT_WORD_SIZE_PX, SHORT_WORD_TOKEN, NO_RATE_LINE
} from "@/lib/attendanceCount";
import { showEventTable } from "@/lib/opsEventTable";
// ★★色は 名前で 呼びます（★裁定 その81 §1-3）。
import { v, rem as remv } from "@/lib/visualTokens";
import { tx } from "@/lib/t";

// ============================================================================
// ★門下（★見本 `P_monka` ／ ★裁定 その90・2026-09-18）
//
//   ★★★見えるのは 担当の 生徒だけ です。★学校 全部の 名簿は 見えません。
//   ★★★出席の 数を 出します。★率（％）は 出しません。
//     ★★並びは 名前順（★学年 → 名前）。★出席の 多い順に しません。
//   ★★★★印は「足りない 見込み」です。★色を 使いません。★わけも 添えます。
//
//   ★★決めは lib/opsMonka.js と lib/attendanceCount.js が 持ちます。
//
//   ★見張り components/tests/ops-monka.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };
const 罫 = `1px solid ${C.line}`;

function Note({ items, bold }) {
  return (
    <p style={{ ...小, marginTop: rem(10) }}>
      {items.map((t) => {
        const b = (bold || []).find((x) => t.includes(x));
        return (
          <span key={t} style={{ display: "block" }}>
            {b ? (
              <>
                {t.slice(0, t.indexOf(b))}
                <b style={{ color: C.ink }}>{b}</b>
                {t.slice(t.indexOf(b) + b.length)}
              </>
            ) : t}
          </span>
        );
      })}
    </p>
  );
}

export default function OpsMonka({
  assignments = [], lessons = [], presets = [], teacherId,
  nameOf, gradeOf, teacherNameOf, need, onOpenOne, onInvite,
  // ★★★空いて いる コマの 数（★2026-09-19・お決め Q2）。
  //   ★★`{ 生徒の 番号: 数 }`。★渡されなければ「—」に します。
  //   ★★★中身は 来ません。★数 だけ です。
  freeCounts = {},
  // ★★★日程を 組む へ（★2026-09-19・裁定 その98 ①）。
  //   ★★渡されなければ、★札を 出しません（★押せない 札を 置きません）。
  onGoKumu,
  // ★★★代表を 決める へ（★2026-09-19）。★渡されなければ 札を 出しません。
  onGoDaihyo
}) {
  const width = useWindowWidth();
  const rows = monkaRows(assignments, teacherId, { gradeOf, nameOf });
  const 型 = presetOf(presets, teacherId);
  const 型の数 = presetCount(presets, teacherId);

  // ★★★行われた 回数は、★門下の みなさん 同じ です（★裁定 その90 §2）。
  //   ★★いちばん 多く 行われた 方の 回数を 使います。
  //     ★★★休んだ 方も「行われた」に 入ります。★数は 同じ に なる はず です。
  //     ★★ずれる とき（★途中から 入った 方）は、★多い ほうが 門下の 進み です。
  const 行われた = rows.reduce((a, r) =>
    Math.max(a, heldCount(lessonsOfStudent(lessons, teacherId, r.studentId))), 0);

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <h2 style={{ ...TYPE.title, color: C.ink, margin: 0 }}>{HEAD}</h2>
      <p style={小}>{subLine((teacherNameOf && teacherNameOf(teacherId)) || "", rows.length)}</p>

      {rows.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: `${rem(26)} ${rem(15)}` }}>
          <p style={{ ...TYPE.li, color: C.ink, margin: 0 }}>{EMPTY_HEAD}</p>
          <p style={{ ...小, marginTop: 6 }}>{EMPTY_HOW}</p>
        </div>
      ) : (
        <>
          {/* ★★★進み ぐあい ── ★この 門下 みなさん 同じ です。
               ★★型が 無ければ、★分母を 出しません。★無い ものを 見せません。 */}
          <p style={{ ...TYPE.li, color: C.ink, margin: `${rem(9)} 0 ${rem(4)}` }}>
            {型 ? `${型.name}　${progressWord(行われた, 型.total_count)}` : progressWord(行われた, null)}
            　<span style={{ ...小, color: C.ink4 }}>{tx("（この門下 みんな 同じです）")}</span>
          </p>
          {!型 ? <p style={小}>{NO_PRESET_LINE}</p> : null}
          {型の数 > 1 ? <p style={{ ...小, color: C.curtain }}>{MANY_PRESETS_LINE}</p> : null}

          {showEventTable(width) ? (
            <div className={TABLE_CLASS}>
              <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%" }}>
                <thead>
                  <tr>
                    <th className={ANCHOR_CLASSES[1]} style={{ ...見出しの形, minWidth: 170 }}>
                      {tx("お名前")}
                    </th>
                    <th style={{ ...見出しの形, minWidth: 130 }}>{tx("学年・コース")}</th>
                    <th style={{ ...見出しの形, minWidth: 110, textAlign: "right" }}>{tx("出席")}</th>
                    {/* ★★空いて いる コマ ── ★数 だけ です（★中身は 来ません）。 */}
                    <th style={{ ...見出しの形, minWidth: 110, textAlign: "right" }}>
                      {tx("空いている コマ")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.studentId}>
                      <td className={ANCHOR_CLASSES[1]} style={ますの形}>
                        <お名前 r={r} onOpenOne={onOpenOne} />
                      </td>
                      <td style={ますの形}>{r.grade || "—"}</td>
                      <td style={{ ...ますの形, textAlign: "right" }}>
                        <出席 r={r} lessons={lessons} teacherId={teacherId}
                          型={型} 行われた={行われた} need={need} />
                      </td>
                      <td style={{ ...ますの形, textAlign: "right" }}>
                        {freeWord(freeCounts[r.studentId])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            rows.map((r) => (
              <div key={r.studentId} style={{ ...cardStyle, marginBottom: rem(7) }}>
                <お名前 r={r} onOpenOne={onOpenOne} />
                <p style={{ ...小, margin: "2px 0 0" }}>
                  {r.grade || "—"}　
                  <出席 r={r} lessons={lessons} teacherId={teacherId}
                    型={型} 行われた={行われた} need={need} />
                  　{tx("空いている コマ")} {freeWord(freeCounts[r.studentId])}
                </p>
              </div>
            ))
          )}

          {/* ★★率を 出さない ことを、★書いて おきます（★裁定 その90 §6-4）。 */}
          {/* ★★★率を 出さない ことを、★書いて おきます（★裁定 その90 §6-4）。
               ★★★「足りない見込み」の 説明は 置きません（★2026-09-19・Opus）。
                 ★★言葉 そのものが 意味を 持ちます。★説明が 要りません。 */}
          <p style={{ ...小, marginTop: rem(8) }}>{NO_RATE_LINE}</p>
        </>
      )}

      {onInvite ? (
        <button type="button" onClick={onInvite}
          style={{
            width: "100%", minHeight: 48, marginTop: rem(10), borderRadius: 12,
            border: `1px solid ${C.line}`, background: C.card, color: C.ink,
            ...TYPE.li, fontFamily: FONT_STACK
          }}>＋ {tx("門下に 招く")}</button>
      ) : null}

      <Note items={NOTES} bold={NOTES_BOLD} />

      {/* ★★★日程を 組む（★見本 `P_monka` の 1つ目の 札・2026-09-19）。
          ★★空いて いる コマから 組みます。★中身は 見えません。
          ★★読み道（`get_student_free_slots`）が 2値 しか 返しません。 */}
      {onGoKumu ? (
        <button type="button" onClick={onGoKumu}
          style={{
            width: "100%", minHeight: 52, marginTop: rem(10), borderRadius: 12,
            border: `1px solid ${C.curtain}`, borderBottomWidth: 3,
            // ★★★6段に 寄せました（★裁定 その103・2026-09-19）。
            //   ★★15 → 15.5 …… ★大きい ほうの 押し札 です。
            //     ★★14.5 に 下げると、★下の 添える字（12.5）との 差が 縮みます。
            background: C.curtain, color: C.onCurtain, fontSize: rem(15.5),
            fontFamily: FONT_STACK, textAlign: "left", padding: `0 ${rem(14)}`
          }}>
          {GO_KUMU_LABEL}
          {/* ★★11.5 → 12.5 …… ★札に 添える 字 です（★役で 寄せます）。 */}
          <span style={{ display: "block", fontSize: rem(12.5), opacity: 0.9 }}>
            {GO_KUMU_SUB}
          </span>
        </button>
      ) : null}

      {/* ★★★代表を 決める へ（★見本 `P_daihyo`・2026-09-19）。
           ★★渡されなければ 札を 出しません（★押せない 札を 置きません）。
           ★★★決めるのは その 門下の 先生 だけ です。★役職では ありません。 */}
      {onGoDaihyo ? (
        <button type="button" onClick={onGoDaihyo}
          style={{
            width: "100%", minHeight: 52, marginTop: rem(10), borderRadius: 12,
            border: `1px solid ${C.line}`, background: C.card, color: C.ink,
            fontSize: rem(15.5), fontFamily: FONT_STACK,
            textAlign: "left", padding: `0 ${rem(14)}`
          }}>
          {GO_DAIHYO_LABEL}
          <span style={{ display: "block", fontSize: rem(12.5), color: C.inkSoft }}>
            {GO_DAIHYO_SUB}
          </span>
        </button>
      ) : null}

      {/* ★★★見本に ある のに、★置いて いない もの。
           ★★空の 列を 並べません。★何が まだかを 書きます（★§8⑤）。 */}
      <p style={{ ...小, marginTop: rem(8) }}>
        {NOT_YET.map((x) => (
          <span key={x.key} style={{ display: "block" }}>
            {x.label}　{tx("── まだ 出せません。")}
          </span>
        ))}
      </p>
    </div>
  );
}

/** ★お名前（★押すと その方 1人へ）。★代表の 印は 字 です。★色では ありません。 */
function お名前({ r, onOpenOne }) {
  const 中 = (
    <>
      {r.name || "—"}
      {r.isRepresentative ? (
        <span style={{
          ...TYPE.mini, color: C.inkSoft, border: `1px solid ${C.line}`,
          borderRadius: 999, padding: "2px 7px", marginLeft: 6
        }}>{REPRESENTATIVE_MARK}</span>
      ) : null}
    </>
  );
  if (!onOpenOne) return <span style={{ ...TYPE.usual, color: C.ink }}>{中}</span>;
  return (
    <button type="button" onClick={() => onOpenOne(r.studentId)}
      style={{
        background: "transparent", border: "none", padding: 0, minHeight: 44,
        color: C.curtain, ...TYPE.usual, fontFamily: FONT_STACK, textAlign: "left"
      }}>{中} ›</button>
  );
}

/** ★出席の 数（★率を 出しません）。★★印は 足りない 見込み の ときだけ。 */
function 出席({ r, lessons, teacherId, 型, 行われた, need }) {
  const 本 = lessonsOfStudent(lessons, teacherId, r.studentId);
  const 短い = looksShort({
    came: cameCount(本), held: 行われた,
    total: 型 ? 型.total_count : null, need
  });
  return (
    <span style={{ ...TYPE.usual, color: C.ink }}>
      {cameWord(本)}
      {/* ★★★印では なく **言葉** です（★2026-09-19・Opus）。
           ★★小さく、★`--ink3`。★色は 使いません。
           ★★★「足りません」と 言い切りません。★残りの 回が あります。 */}
      {短い ? (
        <span style={{
          marginLeft: 8, fontSize: remv(SHORT_WORD_SIZE_PX), color: v(SHORT_WORD_TOKEN)
        }}>{SHORT_WORD}</span>
      ) : null}
    </span>
  );
}

const 見出しの形 = {
  padding: `${rem(9)} ${rem(10)}`, borderBottom: 罫,
  ...TYPE.mini, color: C.inkSoft, fontWeight: 400
};
const ますの形 = {
  padding: `${rem(9)} ${rem(10)}`, borderBottom: 罫, ...TYPE.usual, color: C.ink
};
