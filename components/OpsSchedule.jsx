"use client";

import { useState } from "react";
import useWindowWidth from "@/components/useWindowWidth";
import { C } from "@/lib/tokens";
// ★★小見出しの 字は uiKit が 持ちます。
import { TYPE, FONT_STACK } from "@/lib/uiKit";
import {
  VIEWS, WIDE_AT, layoutOf, hours, hourOf, timeOf, dateOf,
  // ★★コマが 1つも 無い 日の 1行（★2026-09-19・実機の ご報告）。
  NO_KOMA, NO_KOMA_SUB, isEmptyDay,
  // ★★誰に どの 姿を 出すか（★裁定 その85 Q1・2026-09-18）。
  scheduleViewFor, MINE_ONLY_HEAD, MINE_ONLY_LINE, overlapChipLabel,
  // ★★字（★裁定 その85 R1〜R4・2026-09-18）。★lib が 持ちます。
  SUB_LINE, DAY_NOTES, WEEK_NOTES, WEEK_HEAD_TAIL, SLOT_MARK, SLOT_NOT_YET,
  dayGrid, overlapsOf, weekHeat, OVERLAP_NOT_YET
} from "@/lib/opsSchedule";
import { mayDragBlocks, DRAG_NOTE } from "@/lib/opsShell";
// ★★コマを 押した ときの 行き先（★裁定 その79 の 入口 ②・2026-09-18）。
import { tapGoesTo, tappable, TAP_GOES } from "@/lib/opsAttendance";

// ============================================================================
// 日程 ── 1つの日程を、3つの 見せ方で（見本②⑥⑧ ／ 2026-09-09・第3便）
//
//   ★出どころ 坂本さん経由・Opus の裁定（2026-09-09）
//     ★⑧ 1日 × 先生よこ　　★時間列は position: sticky で 固定、横に ずらす
//     ★⑨ 1週間 × 濃さの地図　★1色の 濃淡のみ。★赤黄青は 使わない
//     ★⑩ よこ持ち　　　　　★812px を 超えた時点で 自動。★選ばせない
//
//   ★★3つは 別々の画面では ありません。★1つの日程の、見せ方の 切り替えです。
//
//   ★★守りつづけるもの
//     ★重なりは 印だけ。★自動で 動かしません。
//     ★連続日数・％を 出しません。
//     ★この画面から、★生徒の健康の記録には たどりつけません。
//
//   ★数と 決めは lib/opsSchedule.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/ops-schedule.test.js
// ============================================================================

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 };
// ★★★12より 小さい 字を 使いません（★裁定 その103・2026-09-19）。
//   ★★11 → 12.5（★添える 字・コマの 名）
//   ★★10／9 → 12（★曜日・時刻の 列・コマの 中の 字）
//   ★★★表の 中が 12 に なります。★横に すべる 幅が 足りるか、★実機で 要 確認。
//     ★★裁定 その81 §2-2 ──「1画面に 入る 量が 減る。★横に すべる 表が 増える」。
const small = { fontSize: "0.78125rem", color: C.inkSoft, lineHeight: 1.8 };
const TIME_COL = 46;

// ★★幅を 見る 仕掛けは `components/useWindowWidth.js` に 移しました（★2026-09-18）。
//   ★★同じ ものが 4か所に あり、★2つだけ 向きの 変化を 聞いて いました。

/**
 * ★注の 1行（★太い ところは 行の 頭 とは 限りません）。
 *
 *   ★★2026-09-18、★役職の 表で そこを 読み違えました。★同じ 形を 使います。
 */
function Note({ items }) {
  return (
    <p style={{ ...small, lineHeight: 1.9 }}>
      {items.map((n) => (
        <span key={n.text} style={{ display: "block" }}>
          {n.bold ? (
            <>
              {n.text.slice(0, n.text.indexOf(n.bold))}
              <b style={{ color: C.ink }}>{n.bold}</b>
              {n.text.slice(n.text.indexOf(n.bold) + n.bold.length)}
            </>
          ) : n.text}
        </span>
      ))}
    </p>
  );
}

function mmdd(iso) {
  return `${Number(iso.slice(5, 7))}月${Number(iso.slice(8, 10))}日`;
}

export default function OpsSchedule({
  lessons, teachers, dateISO, weekDays, nameOf, studentNameOf, onPickDate,
  // ★★できこと（★裁定 その85 Q1）。★渡されなければ 何も 出しません。
  perms,
  // ★★見て いる 方（★自分の 日程だけ の ときに 要ります）。
  myId,
  // ★★重なりの 札を 押した とき（★裁定 その85 Q3）。
  onOpenOverlap,
  // ★★★日程を 組む へ（★2026-09-19・実機の ご報告）。
  //   ★★学長・事務長に「門下」の 帯は 出ません（★`monka_write` が 要ります）。
  //   ★★★それで 正しい です ── ★ご自分の 門下は ありません。
  //     ★★けれど「組む」のは 運営の 仕事 です。★入口が どこにも ありません でした。
  //   ★★日程の 帯は `sched_all` で 開きます。★ここに 置きます。
  onGoKumu,
  // ★★★コマを 押した とき（★裁定 その79 の 入口 ②・2026-09-18）。
  //   ★★渡されなければ、★コマは 押しどころに なりません。
  onOpenAttendance
}) {
  // ★★★門（★裁定 その85 Q1・2026-09-18）。
  //   ★★`sched_all` …… ★学校 全部の 表
  //   ★★`sched_mine` … ★自分の 日程だけ
  //   ★★どちらも 無い … ★何も 出しません（★帯も 出ません）
  //   ★★★決めは lib/opsSchedule.js が 持ちます。★ここでは 判じません。
  const 姿 = scheduleViewFor(perms);
  const [view, setView] = useState("day");
  // ★★空いた ところを 押した ときの 1行（★裁定 その85 R3）。
  //   ★★出しっぱなしに しません。★別の ところを 押すと 消えます。
  const [slotNote, setSlotNote] = useState("");
  const width = useWindowWidth();
  const layout = layoutOf(width);
  const ids = (teachers || []).map((x) => x.id);

  // ★★よこ持ちのときは、★先生を 全部 横に 並べます（★⑩）。
  //   ★★選ばせません。★はばだけで 決まります。
  const perScreen = layout === "wide" ? Math.max(ids.length, 1) : 2;
  const colW = layout === "wide" ? `${Math.floor(100 / perScreen)}%` : "44%";

  // ★★★自分の 日程だけ の とき（★見本 `P_kumu`・★裁定 その85 Q1）。
  //   ★★学校 全部の 表を 出しません。★見て いる 方の レッスン だけ です。
  //   ★★★台帳も 同じ ことを して います（★`can_view_ops`）。
  //     ★★だから 数は もとから 漏れて いません。★姿だけ が ちがって いました。
  //     ★★「学校 全部の 表」に 1人ぶん だけ 並ぶと、
  //       ★★学校に 先生が 1人 しか 居ない ように 見えます。
  const 自分だけ = 姿 === "mine";
  const 出す先生 = 自分だけ ? ids.filter((x) => x === myId) : ids;

  // ★★★どちらも 持って いない とき ── ★何も 出しません。
  //   ★★呼ぶ 側（帯）が 止めますが、★ここでも 止めます。★二重に します。
  //   ★★フックの あと に 置きます（★早く 返すと 数が 合わなく なります）。
  const 何も出さない = 姿 === "none";

  const grid = dayGrid(lessons, dateISO, 出す先生);
  const overlaps = overlapsOf(lessons, dateISO);
  const heat = weekHeat(lessons, weekDays || [], 出す先生);

  const chip = (on) => ({
    minHeight: 44, padding: "0 16px", borderRadius: 999,
    border: `1px solid ${on ? C.curtain : C.line}`,
    background: on ? C.curtain : C.card,
    color: on ? C.onCurtain : C.inkSoft, fontSize: "0.8125rem"
  });

  if (何も出さない) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {/* ★★`.ff-display` を 外しました（★2026-09-18・坂本さんの お決め 3）。
            ★★`lib/uiKit.js`「門の中の 画面では .ff-display を 使いません」。 */}
        <h2 style={{ fontSize: "1.25rem", color: C.ink }}>
          {自分だけ ? MINE_ONLY_HEAD : "日程"}　{mmdd(dateISO)}
        </h2>
      </div>

      {/* ★★自分の ぶん だけ だ、と はっきり 書きます。
          ★★書かないと、★学校に レッスンが これ だけ しか 無い と 読めます。 */}
      {自分だけ ? <p style={small}>{MINE_ONLY_LINE}</p> : (
        /* ★★題の 下の 1行（★見本の `.sub`・★裁定 その85 R1）。
           ★★日づけは 題の 横に 出て います。★ここでは 繰り返しません。 */
        <p style={small}>{SUB_LINE}</p>
      )}

      {/* ★★見せ方の 切り替え。★1つの日程に 対する ものです。
          ★★よこ持ち（⑩）は ここに 出しません。★選ばせないからです。 */}
      <div className="flex gap-2">
        {VIEWS.map((v) => (
          <button key={v.key} type="button" onClick={() => setView(v.key)} style={chip(view === v.key)}>
            {v.label}
          </button>
        ))}
      </div>

      {/* ★★★日程を 組む（★2026-09-19・裁定 その99 F1 の 入口）。
          ★★渡されなければ 出しません（★押せない 札を 置きません）。 */}
      {onGoKumu ? (
        <button type="button" onClick={onGoKumu}
          style={{
            ...chip(false), width: "100%", textAlign: "left",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            minHeight: 48
          }}>
          <span>レッスンの 日程を 組む</span>
          <span style={{ color: C.inkSoft }}>›</span>
        </button>
      ) : null}

      {/* ★★★重なり ── ★押せる 札に しました（★裁定 その85 Q3・2026-09-18）。
          ★★きょうまで、★いつも 開いた 箱 でした。
            ★★0件の ときは 空の 節に なります（★§8⑤ が 嫌う 形）。
          ★★★0件 なら 節ごと 出しません。★1件 以上 なら 札 1つ です。
          ★★印だけ です。★自動で 動かしません（★§4-2）。
            ★★どちらを 動かすかは、★人が 決めます。
          ★★字は lib/opsSchedule.js が 持ちます。 */}
      {overlapChipLabel(overlaps.length) ? (
        <button type="button"
          onClick={() => {
            // ★★★2026-09-19（★見本くらべ `P_kasa`）。
            //   ★★`onOpenOverlap` は、★どこからも 渡されて いません でした。
            //   ★★★押しても 何も 起きない 札 でした（★§8⑤ の いちばん いけない 形）。
            //   ★★開く 先が 無い ときは、★「まだ できません」と お伝えします。
            if (onOpenOverlap) onOpenOverlap(overlaps);
            else setSlotNote(OVERLAP_NOT_YET);
          }}
          style={{
            ...chip(false), width: "100%", textAlign: "left",
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
          <span>{overlapChipLabel(overlaps.length)}</span>
          <span style={{ color: C.inkSoft }}>›</span>
        </button>
      ) : null}
      {/* ★★★押した わけを、★札の すぐ 下に 出します（★2026-09-19）。
          ★★下の「1日」の 中に 出して いました。★週の 姿では 見えません でした。
          ★★★押した ところの そばに 出します。★探させません。 */}
      {slotNote ? (
        <p style={{ ...small, color: C.ink, margin: 0 }}>{slotNote}</p>
      ) : null}

      {view === "day" ? (
        <>
          {/* ★★★コマが 1つも 無い 日（★2026-09-19・実機の ご報告）。
               ★★★表の わくだけが 出て いました。★中は 空 でした。
                 ★★「まだ 置いて いない」のか「出て いない」のか、
                   ★★見分けようが ありません でした。
                 ★★★台帳を 数えました ── ★コマは 0件 でした。★表は 正しい です。
                   ★★言葉が 足りません でした。★1行 置きます。
               ★★表は 消しません。★時間の 目もりは 出した ままに します。
               ★★字は lib/opsSchedule.js が 持ちます。★ここでは 決めません。 */}
          {isEmptyDay(lessons, dateISO) ? (
            <div style={{ ...card, padding: "12px 14px" }}>
              <p style={{ ...TYPE.li, color: C.ink, margin: 0 }}>{NO_KOMA}</p>
              <p style={{ ...small, margin: "2px 0 0" }}>{NO_KOMA_SUB}</p>
            </div>
          ) : null}
          {/* ★★⑧ 1日 × 先生よこ。★時間の 列を 左に 固定し、★横に ずらします。 */}
          <div style={{ ...card, padding: 0, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <div style={{ display: "flex", minWidth: layout === "wide" ? "100%" : `${TIME_COL + ids.length * 44}%` }}>
              {/* ★時間の 列。★position: sticky で 左に 貼りつけます。 */}
              <div style={{
                position: "sticky", left: 0, zIndex: 2, flex: `0 0 ${TIME_COL}px`,
                background: C.card, borderRight: `1px solid ${C.line}`
              }}>
                <div style={{ height: 34 }} />
                {hours().map((h) => (
                  <div key={h} style={{
                    height: 44, fontSize: "0.75rem", color: C.inkSoft,
                    padding: "2px 6px", borderTop: `1px solid ${C.line}`
                  }}>{h}:00</div>
                ))}
              </div>
              {grid.map((col) => (
                <div key={col.teacherId} style={{ flex: `0 0 ${colW}`, minWidth: 0 }}>
                  <div style={{
                    height: 34, fontSize: "0.78125rem", color: C.ink,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderBottom: `1px solid ${C.line}`, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 4px"
                  }}>{nameOf ? nameOf(col.teacherId) : ""}</div>
                  <div style={{ position: "relative", height: hours().length * 44 }}>
                    {/* ★★★空いて いる ところ（★見本の `.slot`・★裁定 その85 R3）。
                         ★★★押せない 札を 置きません。★けれど 押すと 何かが 起きるのは よい ──
                           ★★裁定 その84 ──「押すと『まだ できません』と 出る」は よい。
                           ★★「押せるのに 何も 起きない」が だめ です。
                         ★★コマの ある ところには 出しません。★重ねません。
                         ★★字は lib/opsSchedule.js が 持ちます。 */}
                    {hours().map((h) => {
                      const 埋まって = col.lessons.some((l) => {
                        const v = hourOf(timeOf(l));
                        return v != null && Math.floor(v) === h;
                      });
                      return (
                        <div key={h} style={{
                          position: "absolute", top: (h - hours()[0]) * 44, left: 0, right: 0,
                          height: 44, borderTop: `1px solid ${C.line}`
                        }}>
                          {埋まって ? null : (
                            <button type="button"
                              onClick={() => setSlotNote(SLOT_NOT_YET)}
                              aria-label={SLOT_NOT_YET}
                              style={{
                                width: "100%", height: "100%", minHeight: 44,
                                border: "none", background: "transparent",
                                color: C.ink4, fontSize: "0.75rem", cursor: "pointer"
                              }}>{SLOT_MARK}</button>
                          )}
                        </div>
                      );
                    })}
                    {col.lessons.map((l) => {
                      const hv = hourOf(timeOf(l));
                      if (hv == null) return null;
                      const dup = overlaps.some((o) => o.lessons.some((x) => x.id === l.id));
                      /* ★★★コマを 押す（★裁定 その79 の 入口 ②・2026-09-18）。
                           ★★見本 `P_nittei` ──
                             ★重なりの コマ … 重なりの 画面へ
                             ★それ 以外 …… 出欠の 1枚へ
                           ★★★行き先が 無い ときは、★押しどころに しません。
                             ★★`<div>` の まま 置きます。★押して 何も 起きない、を 作りません。
                           ★★決めは lib/opsAttendance.js が 持ちます。★ここでは 判じません。
                           ★★★`mayMark` は 出欠の 1枚が 見ます。★ここでは 見ません ──
                             ★★よその 先生の コマも「開く」ことは できます。
                             ★★開いた 先で「つけられません／お名前も 出しません」と 出ます。
                             ★★★閉じた 扉を 押した ことが 分かる ほうが、★探さずに 済みます。 */
                      const 行き先 = tapGoesTo({ dup, perms });
                      const 押せる = tappable({ dup, perms }) && (
                        行き先 === TAP_GOES.OVERLAP ? !!onOpenOverlap : !!onOpenAttendance
                      );
                      const わく = {
                        position: "absolute", left: 3, right: 3,
                        // ★★★押しどころに なりました。★44 以上に します（★2026-09-18）。
                        //   ★★もとは `top +2 / minHeight 40` でした。★見る だけ の 箱 でした。
                        //   ★★1時間の 行が 44px です。★上の 2px を 詰めて、★44 を 取ります。
                        //   ★★★44 を 切ると、★指が 外れます（★tokens.md §5 ／ HIG）。
                        top: (hv - hours()[0]) * 44, minHeight: 44,
                        borderRadius: 8, padding: "4px 6px",
                        // ★★色は 1つ。★重なりだけ、★わくを 太くします。
                        //   ★赤・黄・青を 使いません。★通信簿に しないためです。
                        background: C.paper,
                        border: `${dup ? 2 : 1}px solid ${dup ? C.curtain : C.line}`,
                        fontSize: "0.75rem", color: C.ink, overflow: "hidden",
                        textAlign: "left", fontFamily: FONT_STACK
                      };
                      const 中身 = (
                        <>
                          <div>{timeOf(l)}</div>
                          <div style={{ color: C.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {studentNameOf ? studentNameOf(l.student_id) : ""}
                          </div>
                        </>
                      );
                      if (!押せる) return <div key={l.id} style={わく}>{中身}</div>;
                      return (
                        <button key={l.id} type="button"
                          onClick={() => {
                            if (行き先 === TAP_GOES.OVERLAP) onOpenOverlap(overlaps);
                            else onOpenAttendance(l);
                          }}
                          style={{ ...わく, cursor: "pointer" }}>{中身}</button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* ★★うごかせるのは パソコンだけ（★見本⑧）。★見ることは どこでも できます。 */}
          {/* ★★押した わけは、★重なりの 札の すぐ 下に 出します（★2026-09-19・上）。
              ★★ここに 置くと、★週の 姿の ときに 見えません でした。 */}
          {!mayDragBlocks(width) ? <p style={small}>{DRAG_NOTE}</p> : null}
          {/* ★★★1日 × 先生よこ の 注（★裁定 その85 R4・2026-09-18）。
               ★★見本は 6行 です。★ここは 5行 です。
               ★★★4行目（「先生の『自分の 予定』は『予定あり』とだけ 出ます」）を
                 ★★置いて いません。★その 札が この 蔵に ありません。
                 ★★無い ものの 説明を すると、★探して しまいます。
                 ★★台帳 docs/ledgers/08-保留している決め.md 08-8
               ★★★5行目（「学校の 予定か、自分の 予定かも 出しません」）は 置きました。
                 ★★あれは 約束 です。★いま 守られて います ──
                   ★★運営の 表に 流れ込むのは `lessons` だけ です。
                   ★★先生 ご自身の 予定は、★1行も 取って いません。 */}
          <Note items={DAY_NOTES} />
        </>
      ) : (
        <>
          {/* ★★⑨ 1週間 × 濃さの地図。★1色の 濃淡だけです。
              ★★数を 出さず、★濃さだけに しません。★数も 添えます。
                ★濃さは 見つけるため、★数は 確かめるためです。
              ★★押すと、★その日の ⑧が 開きます。 */}
          <div style={card}>
            {/* ★★箱の 題（★見本の `h3`・2026-09-18）。
                ★★いつ から いつ まで かを 書きます。★「今週」だけ では 分かりません。 */}
            <div style={{ ...TYPE.h3, margin: "0 0 7px" }}>
              {(weekDays && weekDays.length)
                ? `${mmdd(weekDays[0])}〜${mmdd(weekDays[weekDays.length - 1])}　${WEEK_HEAD_TAIL}`
                : WEEK_HEAD_TAIL}
            </div>
            <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
              <div style={{ flex: `0 0 ${TIME_COL}px` }} />
              {(weekDays || []).map((d) => (
                <div key={d} style={{ flex: 1, textAlign: "center", fontSize: "0.75rem", color: C.inkSoft }}>
                  {Number(d.slice(8, 10))}
                </div>
              ))}
            </div>
            {heat.rows.map((r) => (
              <div key={r.teacherId} style={{ display: "flex", gap: 3, marginBottom: 3, alignItems: "center" }}>
                <div style={{
                  flex: `0 0 ${TIME_COL}px`, fontSize: "0.75rem", color: C.inkSoft,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>{nameOf ? nameOf(r.teacherId) : ""}</div>
                {r.cells.map((c) => (
                  <button key={c.date} type="button"
                    onClick={() => { if (onPickDate) onPickDate(c.date); setView("day"); }}
                    aria-label={`${mmdd(c.date)} ${c.count}件`}
                    style={{
                      flex: 1, minHeight: 44, borderRadius: 6, border: `1px solid ${C.line}`,
                      // ★★1色の 濃淡だけ。★赤黄青を 使いません。
                      background: c.count === 0 ? C.paper : C.curtain,
                      opacity: c.count === 0 ? 1 : 0.25 + 0.75 * c.density,
                      color: c.count === 0 ? C.inkSoft : C.onCurtain,
                      fontSize: "0.75rem"
                    }}>{c.count === 0 ? "" : c.count}</button>
                ))}
              </div>
            ))}
            {/* ★★中身を 出さない こと を、★はっきり 書きます（★見本の `usu`）。 */}
            <p style={{ ...small, marginTop: 8 }}>
              中身は 出しません。コマの 数だけ です。押すと その日へ。
            </p>
          </div>
          {/* ★★1週間 × 濃さ の 注（★裁定 その85 R2・2026-09-18）。
              ★★見本が 直りました（★2026-09-18・先生 × 日 の 濃さ）。
                ★★実装が 正 で、★見本の ほうが 古かった もの です（★裁定 その85 Q2）。 */}
          <Note items={WEEK_NOTES} />
        </>
      )}
    </div>
  );
}
