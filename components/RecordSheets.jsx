"use client";

// ============================================================================
// 記録の 入力シート ── 見本の SH['ねむり'] ／ SH['こえ']
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//   ★決めごと lib/recordSheets.js（★言葉と 選択肢）
//   ★器　　　 components/BottomSheet.jsx
//
//   ★★ここは「並べるだけ」です。★数えません。★決めません。
// ============================================================================

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, FONT_STACK, rem, cardStyle } from "@/lib/uiKit";
import BottomSheet, { SheetNote, Pills } from "@/components/BottomSheet";
import {
  KOE, NEMURI, sleepLength, sleepWord, wakeFromBed
} from "@/lib/recordSheets";

/** ★見本の .mini（★1枚の 中の 小見出し）。 */
function Mini({ children, style }) {
  return <div style={{ ...TYPE.mini, color: C.inkSoft, ...style }}>{children}</div>;
}

/**
 * ★1枚の 中の、★引っ越してきた 節が 入る ところ。
 *
 *   ★★節そのものは 動かしていません（★JSX の 場所は これまでどおり）。
 *     ★描く 先だけを、★開いている 1枚の 中へ 移します（★createPortal）。
 *   ★★動かすと、★入れ子の 条件（showGroup・型ごとの項目）が ずれます。
 *     ★「消えた」より「動かしていない」ほうが、★はるかに 安全です。
 *
 *   ★★だから 入れ物は 1つだけです。★22枚に 1つずつ 作りません。
 *     ★2つ あると、★節が どちらに 出たか 分からなく なります。
 */
export const SHEET_SLOT_ID = "record-sheet-slot";

export function SheetSlot() {
  return <div id={SHEET_SLOT_ID} style={{ marginTop: rem(14) }} />;
}

/**
 * ★引っ越してきた 節 だけの 1枚（★本番・レッスン ／ ひとこと ／ お仕事）。
 *
 *   ★★見本の 札を ここに 作り直しません。
 *     ★同じ 列への 入口が 2つに なると、★片方で 書いて もう片方で 消えます。
 *   ★★これが「③引っ越す ── 機能は そのまま。置き場所だけ」の 意味です。
 */
export function SectionSheet({ spec, onClose }) {
  return (
    <BottomSheet title={spec.title} onClose={onClose} closeLabel={spec.done}>
      <SheetSlot />
      {spec.note ? (
        <SheetNote>
          {spec.note.split("\n").map((line, i) => (
            <span key={i}>{i > 0 ? <br /> : null}{line}</span>
          ))}
        </SheetNote>
      ) : null}
    </BottomSheet>
  );
}

/**
 * ★本番以外で 声を使った 時間。
 *
 *   ★★選択肢は 渡してもらいます。★ここに 書き写しません。
 *     ★いまの SPEECH_MINUTE_CHOICES と 見本の 4つは 同じです。
 */
export function KoeSheet({ choices, value, onChange, onDetail, onClose }) {
  return (
    <BottomSheet title={KOE.title} onClose={onClose} closeLabel={KOE.done}>
      <div style={{ ...TYPE.usual, color: C.inkSoft, marginBottom: rem(11) }}>{KOE.lead}</div>
      <Pills
        options={(choices || []).map((c) => ({ value: c.value, label: c.label }))}
        value={value}
        onSelect={(v) => onChange(v === value ? null : v)} />
      <SheetNote>
        {KOE.note.split("\n").map((line, i) => (
          <span key={i}>{i > 0 ? <br /> : null}{line}</span>
        ))}
      </SheetNote>
      {/* ★★「詳しく 書く（分で）」。★毎日 数字を 打たせない ための 逃げ道です。
          ★★渡されなければ 出しません。★押せない ボタンを 置かない ため。 */}
      {onDetail ? (
        <button type="button" onClick={onDetail}
          style={{
            width: "100%", minHeight: 48, marginTop: rem(11), borderRadius: 12,
            border: `1px solid ${C.line}`, background: C.card, color: C.ink,
            ...TYPE.li, fontFamily: FONT_STACK
          }}>{KOE.detail}</button>
      ) : null}
      <SheetSlot />
    </BottomSheet>
  );
}

/**
 * ★昨夜の 睡眠。
 *
 *   ★★寝た 時刻と 起きた 時刻を 選ぶと、★長さが 出ます。
 *   ★★しまうのは 寝た 時刻と 長さです（★起きた 時刻の 欄は 作りません）。
 *
 *   @param bedtime    しまってある 寝た 時刻（★"23:30"）
 *   @param sleepHours しまってある 長さ（★7.5）
 *   @param onDone     (bedtime, hours) を 受け取ります
 */
export function NemuriSheet({ bedtime, sleepHours, onDone, onClose }) {
  // ★★初めから 入っている 値。★きのうの ぶんです。
  //   ★★無ければ 見本の 既定（23:30 / 7:00）です。
  const [bed, setBed] = useState(bedtime || NEMURI.BED_DEFAULT);
  const [wake, setWake] = useState(
    wakeFromBed(bedtime || NEMURI.BED_DEFAULT, sleepHours) || NEMURI.WAKE_DEFAULT);
  const hours = sleepLength(bed, wake);

  return (
    <BottomSheet title={NEMURI.title} onClose={onClose} closeLabel={null}>
      <div style={{ ...TYPE.usual, color: C.inkSoft, marginBottom: rem(11) }}>{NEMURI.lead}</div>

      <Mini>{NEMURI.bedLabel}</Mini>
      <div style={{ margin: `${rem(7)} 0 ${rem(10)}` }}>
        <Pills options={[...NEMURI.BED]} value={bed} onSelect={setBed} small />
      </div>

      <Mini>{NEMURI.wakeLabel}</Mini>
      <div style={{ margin: `${rem(7)} 0 ${rem(10)}` }}>
        <Pills options={[...NEMURI.WAKE]} value={wake} onSelect={setWake} small />
      </div>

      <div style={{ ...cardStyle, textAlign: "center" }}>
        {/* ★★見本は 20px・700。★ここも 文字なので rem です。 */}
        <div style={{ fontSize: rem(20), fontWeight: 700, color: C.ink }}>
          {sleepWord(hours)}
        </div>
        <div style={{ ...TYPE.usual, color: C.inkSoft }}>{bed} → {wake}</div>
      </div>

      <SheetNote>{NEMURI.note}</SheetNote>

      <button type="button"
        onClick={() => { onDone(bed, hours); onClose(); }}
        style={{
          width: "100%", minHeight: 52, marginTop: rem(11), borderRadius: 12,
          border: `1px solid ${C.curtain}`, borderBottomWidth: 3,
          ...TYPE.li, background: C.curtain, color: "#FFFDF8",
          fontWeight: 700, fontFamily: FONT_STACK
        }}>{NEMURI.done}</button>
      <SheetSlot />
    </BottomSheet>
  );
}

/**
 * ★からだのこと ／ 食べたもの（★SH['karada'] ／ SH['tabe']）。
 *
 *   ★★いくつでも 選べます。★もう一度 押すと 外れます。
 *   ★★数を 出しません。★「◯つ 選びました」と 書きません。
 *   ★★良い・悪いを 決めません（★見本の 但し書き）。
 */
export function MarksSheet({ spec, options, value, onChange, time, onTime, times, timeLabel, onClose }) {
  const chosen = Array.isArray(value) ? value : [];
  const toggle = (v) =>
    onChange(chosen.includes(v) ? chosen.filter((x) => x !== v) : [...chosen, v]);
  return (
    <BottomSheet title={spec.title} onClose={onClose} closeLabel={spec.done}>
      <div style={{ ...TYPE.usual, color: C.inkSoft, marginBottom: rem(11) }}>{spec.lead}</div>
      <Pills options={options} value={chosen} onSelect={toggle} multiple />
      {/* ★★食べ終えた 時刻は、★食べたもの の ときだけ 出します。
          ★渡されなければ 出しません。★空の 見出しを 置かない ため。 */}
      {times ? (
        <>
          <Mini style={{ marginTop: rem(12) }}>{timeLabel}</Mini>
          <div style={{ marginTop: rem(7) }}>
            <Pills options={[...times]} value={time}
              onSelect={(v) => onTime(v === time ? null : v)} small />
          </div>
        </>
      ) : null}
      <SheetNote>{spec.note}</SheetNote>
      <SheetSlot />
    </BottomSheet>
  );
}

/**
 * ★＋の 行（★見本の rowIn）。
 *
 *   ★★入っていれば みどりの ✓、★入っていなければ えんじの ＋。
 *   ★★色だけに 意味を 持たせません。★形（✓／＋）が 先に あります。
 */
export function SheetRow({ label, value, onOpen }) {
  const filled = value != null && value !== "";
  return (
    <button type="button" onClick={onOpen}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", textAlign: "left",
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 14,
        padding: rem(13), marginBottom: rem(9), minHeight: 44,
        ...TYPE.li, fontFamily: FONT_STACK, color: C.ink
      }}>
      <span>
        <b style={{ color: filled ? C.sage : C.curtain, marginRight: rem(8) }}>
          {filled ? "✓" : "＋"}
        </b>{label}
      </span>
      <span style={{ color: C.inkSoft, ...TYPE.mini }}>{filled ? value : ""} ›</span>
    </button>
  );
}

/** ★行を 並べるだけの 1枚（★見本の list()）。★account／tsuchi／notemeta が これです。 */
export function ListSheet({ title, rows, note, onClose, onPick }) {
  return (
    <BottomSheet title={title} onClose={onClose}>
      <div style={{ ...cardStyle, padding: `${rem(4)} ${rem(12)}` }}>
        {(rows || []).map((r, i) => {
          const label = typeof r === "object" ? r.label : r;
          const act = typeof r === "object" ? r.onClick : null;
          const clickable = !!(act || onPick);
          const inner = (
            <>
              <span>{label}</span>
              <span style={{ color: C.inkSoft }}>{clickable ? "›" : ""}</span>
            </>
          );
          const style = {
            display: "flex", alignItems: "center", justifyContent: "space-between",
            width: "100%", textAlign: "left", minHeight: 44, padding: `${rem(9)} 0`,
            ...TYPE.li, fontFamily: FONT_STACK, color: C.ink,
            background: "transparent", border: "none",
            borderBottom: i === rows.length - 1 ? "none" : `1px solid ${C.line2}`
          };
          // ★★押せない 行は、★ボタンに しません。★押せそうに 見せない ためです。
          return clickable
            ? <button key={label} type="button" style={style}
                onClick={() => (act ? act() : onPick(label))}>{inner}</button>
            : <div key={label} style={style}>{inner}</div>;
        })}
      </div>
      {note ? <SheetNote>{note}</SheetNote> : null}
    </BottomSheet>
  );
}
