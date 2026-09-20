"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, Card, Note, Pill, Tag, Btn, EmptyBox, H3, Li, Wl } from "@/components/UiV2";
import {
  KASA_HEAD, KASA_SUB_TAIL, KASA_FILTERS, KASA_EMPTY, KASA_EMPTY_SUB,
  STATE_LINE, KIND_LINE, statusOf, lessonIdsOf, openCount, filterKasa, mineRows,
  mayTell, mayClose, mayUndo,
  TELL_LABEL, TELL_AGAIN_LABEL, CLOSE_LABEL, UNDO_LABEL, GO_SCHEDULE_LABEL,
  TELL_WHAT_HEAD, TELL_WHAT, KASA_WHAT_HEAD, KASA_WHAT, KASA_NOTES,
  KASA_MINE_SUB_TAIL, KASA_MINE_EMPTY, KASA_MINE_EMPTY_SUB, MOVE_LABEL,
  KASA_MINE_NOTES, KASA_NOT_YET
} from "@/lib/opsKasa";

// ============================================================================
// ★重なり（★見本 `P_kasa`＝事務 ／ `P_kasaT`＝先生・裁定 その108 ③）
//
//   ★★★2つの 姿を 1つの 画面が 持ちます（★見本と 同じ 形）。
//     ★★見本の 1行目 ── `if(!can('sched_all'))return P_kasaT()`。
//
//   ★★★見本に ある のに 置いて いない 札が あります。
//     ★★「動かせません」「事務に お願いする」── ★答えを しまう 列が ありません。
//     ★★★押せない 札を 置きません（★§8⑤）。★だから 出しません。
//     ★★何を 置いて いないかは、★下の 断りに 出します（★`KASA_NOT_YET`）。
//
//   ★★決めは lib/opsKasa.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/ops-kasa.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };
const 姿の色 = { "まだ": C.curtain, "知らせた": C.gold, "解決": C.sage };

/** ★ぶつかって いる コマの 1行（★見本の ①②）。 */
function コマの行(l, nameOf, placeNameOf) {
  return [
    (nameOf && nameOf(l.teacher_id)) || "",
    (placeNameOf && placeNameOf(l.place_id)) || "",
    (nameOf && nameOf(l.student_id)) || ""
  ].filter(Boolean).join("　");
}

export default function OpsKasa({
  overlaps = [], notices = [], lessons = [], myId, dateLabel = "",
  // ★★`mine` … ★先生の 姿（★`sched_all` を 持たない 方）。
  mine = false, filter = "全部", onFilter,
  nameOf, placeNameOf, kindNameOf,
  onTell, onClose_, onUndo, onGoSchedule, onMove, onBack,
  busy, error = ""
}) {
  const 並び = mine ? [] : filterKasa(overlaps, filter);
  // ★★★先生の 側は、★別の 作り方 です（★決めは lib/opsKasa.js）。
  //   ★★ご自分で 数えられる ぶん と、★事務が 知らせた ぶん を 合わせます。
  const 私の = mine ? mineRows({ lessons, overlaps, notices, myId }) : [];
  const のこり = openCount(overlaps, notices);

  return (
    <div style={{ fontFamily: FONT_STACK }} data-v2-kasa="1">
      <ScreenHead title={KASA_HEAD} right={
        onBack ? (
          <button type="button" onClick={onBack}
            style={{
              background: "transparent", border: "none", color: C.inkSoft,
              ...TYPE.mini, minHeight: 44, padding: "0 4px", fontFamily: FONT_STACK
            }}>‹ 戻る</button>
        ) : null} />
      <p style={{ ...小, margin: "-4px 0 10px" }}>
        {dateLabel ? `${dateLabel}　／　` : ""}
        {mine ? `あなたの ぶん　${私の.length}件　／　${KASA_MINE_SUB_TAIL}`
          : `${のこり}件 のこっています　／　${KASA_SUB_TAIL}`}
      </p>

      {/* ★★絞りは 事務の 側 だけ です（★見本の とおり）。 */}
      {!mine ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: rem(8) }}>
          {KASA_FILTERS.map((v) => (
            <Pill key={v} on={filter === v} onClick={() => onFilter && onFilter(v)}>
              {v}{v === "全部" ? "" : `　${filterKasa(overlaps, v).length}`}
            </Pill>
          ))}
        </div>
      ) : null}

      {/* ★★★先生の 側 ── ★ご自分の コマ 1つ ずつ です。 */}
      {mine ? (私の.length === 0 ? (
        <EmptyBox title={KASA_MINE_EMPTY} sub={KASA_MINE_EMPTY_SUB} />
      ) : 私の.map((r) => (
        <Card key={r.key} style={{
          borderLeft: `3px solid ${姿の色[r.status] || C.line}`, marginBottom: rem(8)
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            {r.kind ? <Tag>{KIND_LINE[r.kind] || r.kind}</Tag> : null}
            <span style={小}>{r.at}</span>
            <span style={{ marginLeft: "auto" }}><Tag>{STATE_LINE[r.status]}</Tag></span>
          </div>
          <div style={{ ...小, color: C.ink }}>
            <div>① {コマの行(r.lesson, nameOf, placeNameOf)}</div>
            {r.others.map((l) => (
              <div key={l.id}>② {コマの行(l, nameOf, placeNameOf)}</div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: rem(10) }}>
            <Btn small disabled={busy} onClick={() => onMove && onMove(r)}>{MOVE_LABEL}</Btn>
          </div>
        </Card>
      ))) : 並び.length === 0 ? (
        <EmptyBox title={KASA_EMPTY} sub={KASA_EMPTY_SUB} />
      ) : 並び.map((o) => {
        const 姿 = statusOf(notices, lessonIdsOf(o));
        return (
          <Card key={o.key} style={{
            borderLeft: `3px solid ${姿の色[姿] || C.line}`,
            marginBottom: rem(8), opacity: 姿 === "解決" ? 0.72 : 1
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Tag>{KIND_LINE[o.kind] || o.kind}</Tag>
              <span style={小}>{o.at}</span>
              <span style={{ marginLeft: "auto" }}><Tag>{STATE_LINE[姿]}</Tag></span>
            </div>
            <p style={{ ...TYPE.li, color: C.ink, margin: "0 0 6px", fontWeight: 700 }}>
              {(kindNameOf && kindNameOf(o)) || ""}
            </p>
            <div style={{ ...小, color: C.ink }}>
              {o.lessons.map((l, i) => (
                <div key={l.id}>{i === 0 ? "① " : i === 1 ? "② " : "・ "}
                  {コマの行(l, nameOf, placeNameOf)}</div>
              ))}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: rem(10) }}>
              {mayTell(姿) ? (
                <Btn small ghost={姿 !== "まだ"} disabled={busy}
                  onClick={() => onTell && onTell(o)}>
                  {姿 === "まだ" ? TELL_LABEL : TELL_AGAIN_LABEL}</Btn>
              ) : null}
              {onGoSchedule ? (
                <Btn small ghost disabled={busy}
                  onClick={() => onGoSchedule(o)}>{GO_SCHEDULE_LABEL}</Btn>
              ) : null}
              {mayClose(姿) ? (
                <Btn small ghost disabled={busy}
                  onClick={() => onClose_ && onClose_(o)}>{CLOSE_LABEL}</Btn>
              ) : null}
              {mayUndo(姿) ? (
                <Btn small disabled={busy}
                  onClick={() => onUndo && onUndo(o)}>{UNDO_LABEL}</Btn>
              ) : null}
            </div>
          </Card>
        );
      })}

      {error ? <p style={{ ...小, margin: "8px 0 0", color: C.ink }}>{error}</p> : null}

      {/* ★★右の 2つの 箱（★せまい ところでは 下に 続きます）。 */}
      {!mine ? (
        <>
          <H3>{TELL_WHAT_HEAD}</H3>
          <Card>
            {TELL_WHAT.map((t) => (
              <p key={t} style={{ ...小, color: C.ink, margin: 0 }}>{t}</p>
            ))}
          </Card>
          <H3>{KASA_WHAT_HEAD}</H3>
          <Card style={{ padding: 0 }}>
            {KASA_WHAT.map((x, i) => (
              <Li key={x.line} last={i === KASA_WHAT.length - 1}
                right={<span style={小}>{x.show ? "見ます" : "出しません"}</span>}
                style={x.show ? undefined : { color: C.inkSoft }}>
                {x.line}
                <div style={小}>{x.sub}</div>
              </Li>
            ))}
          </Card>
        </>
      ) : (
        /* ★★★先生の 側 ── ★置いて いない 札を、★黙って 消しません。 */
        <Wl style={{ marginTop: rem(10) }}>
          {KASA_NOT_YET.filter((x) => x.key === "teacher_answer").map((x) => (
            <span key={x.key} style={{ display: "block" }}>
              いまは「{MOVE_LABEL}」だけ です。{x.why}。
            </span>
          ))}
        </Wl>
      )}

      <Note>
        {(mine ? KASA_MINE_NOTES : KASA_NOTES).map((n) => (
          <span key={n.text} style={{ display: "block" }}>{n.text}</span>
        ))}
      </Note>
    </div>
  );
}
