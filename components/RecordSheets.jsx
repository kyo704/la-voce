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
  KOE, NEMURI, HONBAN, HITOKOTO, HONBAN_CHOICES, HONBAN_REPERTOIRE_LABEL,
  sleepLength, sleepWord, wakeFromBed
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
// ★★SheetSlotContext ／ SheetSlot を 外しました（★2026-09-11・お決め ㋐）。
//   ★★1枚の 中に 節を 入れなく なったので、★差し込み口が 要りません。
//   ★★「作った ものは、必ず どこかから 呼ばれているか」──★いいえ、でした。
//   ★節そのものは 消していません。★門の外（38人）では これまでどおり 出ます。

/**
 * ★本番・レッスン（★見本 SH['honban']）。
 *
 *   ★★見本の 5つの 札です。★節を 入れません（★お決め ㋐）。
 *   ★★「本番の 予定を 書く」の ボタンは 置いていません。
 *     ★★押した 先（本番の 予定を 書く 画面）が、★まだ ありません。
 *     ★押せない ボタンを 置かない、という 決めです。
 */
export function HonbanSheet({ choice, onPick, repertoire, picked, onPickSong, onClose }) {
  const isHonban = choice === "本番（ソロ）" || choice === "本番（合唱・アンサンブル）";
  return (
    <BottomSheet title={HONBAN.title} onClose={onClose} closeLabel={HONBAN.done}>
      <div style={{ marginTop: rem(10) }}>
        <Pills
          options={HONBAN_CHOICES.map((c) => c.label)}
          value={choice}
          onSelect={(v) => onPick(v === choice ? null : v)} />
      </div>
      {/* ★★曲は、★本番を 選んだ ときだけ 出ます（★見本の とおり）。 */}
      {isHonban && (repertoire || []).length > 0 ? (
        <>
          <Mini style={{ marginTop: rem(12) }}>{HONBAN_REPERTOIRE_LABEL}</Mini>
          <div style={{ marginTop: rem(7) }}>
            <Pills options={[...repertoire]} value={picked} onSelect={onPickSong} multiple small />
          </div>
        </>
      ) : null}
      <SheetNote>
        {HONBAN.note.split("\n").map((line, i) => (
          <span key={i}>{i > 0 ? <br /> : null}{line}</span>
        ))}
      </SheetNote>
    </BottomSheet>
  );
}

/**
 * ★ひとこと（★見本 SH['hito']）。
 *
 *   ★★見本の とおり、★書く枠 1つだけです。★節を 入れません。
 *   ★★但し書きは 見本の まま。★1文字も 変えないこと。
 */
export function HitokotoSheet({ value, onChange, onClose }) {
  return (
    <BottomSheet title={HITOKOTO.title} onClose={onClose} closeLabel={HITOKOTO.done}>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={HITOKOTO.placeholder}
        aria-label={HITOKOTO.title}
        style={{
          width: "100%", minHeight: 110, marginTop: rem(9), borderRadius: 12,
          border: `1px solid ${C.line}`, background: C.card, color: C.ink,
          padding: rem(12), fontSize: 16, lineHeight: 1.8, fontFamily: FONT_STACK
        }} />
      <SheetNote>{HITOKOTO.note}</SheetNote>
    </BottomSheet>
  );
}

/**
 * ★本番以外で 声を使った 時間。
 *
 *   ★★選択肢は 渡してもらいます。★ここに 書き写しません。
 *     ★いまの SPEECH_MINUTE_CHOICES と 見本の 4つは 同じです。
 */
export function KoeSheet({ choices, value, onChange, onClose }) {
  // ★★「詳しく 書く（分で）」（★見本の btn g）。
  //   ★★2026-09-11 まで、★呼ぶ側が onDetail を 渡していなかったので、
  //     ★★このボタンは 1度も 出たことが ありませんでした（★notOutDates と 同じ形）。
  //   ★★だから、★外から 渡してもらう のを やめました。
  //     ★開くのも 閉じるのも、★この 1枚の 中で 完結します。
  //     ★渡し忘れの 起きようが ない 形に します。
  const [detail, setDetail] = useState(false);
  const known = (choices || []).some((c) => c.value === value);
  // ★★4つに 無い 数が すでに 入っている 日は、★初めから 開けます。
  //   ★★閉じたままだと、★その 数を 直す 道が ありません。
  const open = detail || (typeof value === "number" && !known);
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
      {open ? (
        <div style={{ marginTop: rem(11) }}>
          <Mini>{KOE.minuteLabel}</Mini>
          <div style={{ display: "flex", alignItems: "center", gap: rem(8), marginTop: rem(7) }}>
            <input type="number" inputMode="numeric" min="0" max="1440"
              value={typeof value === "number" ? value : ""}
              onChange={(e) => onChange(e.target.value === ""
                ? null
                : Math.max(0, Math.min(1440, Number(e.target.value))))}
              aria-label={KOE.minuteLabel}
              style={{
                width: 120, minHeight: 44, borderRadius: 12, padding: `0 ${rem(12)}`,
                border: `1px solid ${C.line}`, background: C.card, color: C.ink,
                ...TYPE.li, fontFamily: FONT_STACK
              }} />
            <span style={{ ...TYPE.usual }}>分</span>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setDetail(true)}
          style={{
            width: "100%", minHeight: 48, marginTop: rem(11), borderRadius: 12,
            border: `1px solid ${C.line}`, background: C.card, color: C.ink,
            ...TYPE.li, fontFamily: FONT_STACK
          }}>{KOE.detail}</button>
      )}
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
export function NemuriSheet({
  bedtime, sleepHours, prevBedtime, prevSleepHours, onDone, onClose
}) {
  // ★★初めから 入っている 値（★2026-09-11 に 直しました）。
  //   ★★1枚の 下に「きのうの値を 初めから 入れています」と 書いてあるのに、
  //     ★★きのうを 1度も 見ていませんでした。
  //     ★書いてあることを していない、★という 形でした。
  //   ★★順は こうです。
  //     ★① その日に すでに 書いてある 値（★書いた ものが 最優先）
  //     ★② きのう 書いた 値（★但し書きが 約束している もの）
  //     ★③ 見本の 既定（23:30 / 7:00）
  //   ★★ここで しまいません。★「これでいい」を 押すまで、★1文字も 保存しません。
  //     ★引き継ぎを 黙って 記録に しない、という この家の 決めの ままです。
  const hasOwn = !!bedtime || typeof sleepHours === "number";
  const baseBed = hasOwn ? bedtime : prevBedtime;
  const baseHours = hasOwn ? sleepHours : prevSleepHours;
  const [bed, setBed] = useState(baseBed || NEMURI.BED_DEFAULT);
  const [wake, setWake] = useState(
    wakeFromBed(baseBed || NEMURI.BED_DEFAULT, baseHours) || NEMURI.WAKE_DEFAULT);
  const hours = sleepLength(bed, wake);
  // ★★きのうから 持ってきた ときだけ、★その 断りを 出します。
  //   ★★その日に 書いてある 値を「きのうの値です」と 言わないこと。
  const carried = !hasOwn && (!!prevBedtime || typeof prevSleepHours === "number");

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

      {/* ★★但し書きは、★実際に きのうから 持ってきた ときだけ 出します。
          ★★持ってきていない 日に 出すと、★また 嘘に なります。 */}
      {carried ? <SheetNote>{NEMURI.note}</SheetNote> : null}

      <button type="button"
        onClick={() => { onDone(bed, hours); onClose(); }}
        style={{
          width: "100%", minHeight: 52, marginTop: rem(11), borderRadius: 12,
          border: `1px solid ${C.curtain}`, borderBottomWidth: 3,
          ...TYPE.li, background: C.curtain, color: "#FFFDF8",
          fontWeight: 700, fontFamily: FONT_STACK
        }}>{NEMURI.done}</button>
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
