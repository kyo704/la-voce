"use client";

import { useEffect, useRef } from "react";
import { C } from "@/lib/tokens";
import { TYPE, SPACE, FONT_STACK, cardStyle } from "@/lib/uiKit";
import { ROW_H, VISIBLE_PAD, WHEEL_H, indexAt, topOf } from "@/lib/wheelPicker";

// ============================================================================
// ★スワイプの ホイール（★2026-09-11）
//
//   ★出どころ 裁定-9月11日の12点 §9 ／ 裁定-9月10日夜（役職への一本化）§2
//     「★±ボタンは 数が 多いと つらい」
//     「★上下に スワイプして 合わせる 従来の 形（時 ／ 分）」
//     「★上に いまの 時間が 大きく 出ます」
//
//   ★★指で 転がします。★端末の ふつうの 転がりに まかせます。
//     ★★自分で 動きを 作りません。★iOS の 転がりが いちばん 自然です。
//     ★scroll-snap で、★段の まん中に 止まります。
//
//   ★★決め打ちの ボタンを 置きません（★「30分／45分／60分」）。
//     ★学校ごとに 時間の わり方が ちがいます。★1分きざみです。
//
//   ★★読み上げにも 応えます。★数を 打ち込む 道も 残します
//     （★転がせない 方・転がしにくい 方の ために）。
//
//   ★見張り components/tests/wheel-picker.test.js
// ============================================================================

function Column({ values, value, onChange, label, format }) {
  const ref = useRef(null);
  const lock = useRef(false);

  // ★★外から 値が 変わったら、★その 段へ 合わせます。
  //   ★★指で 回している あいだは、★横から 動かしません（lock）。
  useEffect(() => {
    const el = ref.current;
    if (!el || lock.current) return;
    const i = values.indexOf(value);
    if (i < 0) return;
    el.scrollTop = topOf(i);
  }, [value, values]);

  let t = 0;
  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    lock.current = true;
    clearTimeout(t);
    // ★★止まってから 決めます。★転がっている あいだ 毎回 決めると、
    //   ★★下の 画面が そのたびに 描き直されて、★指に ついてきません。
    t = setTimeout(() => {
      lock.current = false;
      const i = indexAt(el.scrollTop);
      const v = values[Math.min(i, values.length - 1)];
      if (v !== value) onChange(v);
    }, 90);
  };

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ ...TYPE.mini, textAlign: "center", marginBottom: 2 }}>{label}</div>
      <div ref={ref} onScroll={onScroll}
        style={{
          height: WHEEL_H, overflowY: "auto", scrollSnapType: "y mandatory",
          // ★★段の まん中に 止めます。★上下に 余白を 足して、
          //   ★★はじめと おわりの 段も まん中に 来られるように します。
          paddingTop: ROW_H * VISIBLE_PAD, paddingBottom: ROW_H * VISIBLE_PAD,
          WebkitOverflowScrolling: "touch",
          // ★スクロールの 棒は 出しません（★見本のとおり）。
          scrollbarWidth: "none"
        }}>
        {values.map((v) => (
          <div key={v} style={{
            height: ROW_H, scrollSnapAlign: "start",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: v === value ? 20 : 15,
            fontWeight: v === value ? 700 : 400,
            color: v === value ? C.ink : C.inkSoft,
            fontFamily: FONT_STACK
          }}>{format ? format(v) : v}</div>
        ))}
      </div>
      {/* ★★転がせない 方の ための 道。★同じ 値を 打てます。
          ★★見えなく しません。★別の 道を 消さないこと。 */}
      <input type="number" value={value} aria-label={label}
        min={values[0]} max={values[values.length - 1]}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (values.includes(n)) onChange(n);
        }}
        style={{
          width: "100%", minHeight: SPACE.tapMin, marginTop: 4,
          border: `1px solid ${C.line}`, borderRadius: 8, background: C.card,
          color: C.ink, fontSize: 16, textAlign: "center", fontFamily: FONT_STACK
        }} />
    </div>
  );
}

/**
 * ★2つの ホイール（★時 ／ 分、または 時間 ／ 分）。
 *
 *   @param head      上に 大きく 出す 言葉（★見本「上に いまの 時間が 大きく 出ます」）
 *   @param onUnset   「未定に する」を 出すなら（★無ければ 出しません）
 */
export default function WheelPicker({
  head, leftLabel, leftValues, leftValue, onLeft,
  rightLabel, rightValues, rightValue, onRight,
  pad2 = false, onUnset, unsetLabel = "未定に する"
}) {
  const fmt = pad2 ? (v) => String(v).padStart(2, "0") : null;
  return (
    <div style={{ ...cardStyle, marginBottom: SPACE.cardGap }}>
      {/* ★★上に いまの 値が 大きく 出ます（★見本のとおり）。 */}
      <div style={{ textAlign: "center", ...TYPE.big, marginBottom: 6 }}>{head}</div>
      <div style={{ display: "flex", gap: 10, position: "relative" }}>
        {/* ★★まん中の 段を、★うすい 帯で 示します。★どこが 選ばれているか 分かるように。 */}
        <div aria-hidden="true" style={{
          position: "absolute", left: 0, right: 0,
          top: ROW_H * VISIBLE_PAD + 18, height: ROW_H,
          background: C.paper, borderRadius: 8, pointerEvents: "none"
        }} />
        <Column label={leftLabel} values={leftValues} value={leftValue} onChange={onLeft} format={fmt} />
        <Column label={rightLabel} values={rightValues} value={rightValue} onChange={onRight} format={fmt} />
      </div>
      {onUnset ? (
        <button type="button" onClick={onUnset}
          style={{
            width: "100%", minHeight: SPACE.tapMin, marginTop: 8,
            borderRadius: 999, border: `1px solid ${C.line}`,
            background: C.card, color: C.inkSoft, fontSize: 13, fontFamily: FONT_STACK
          }}>{unsetLabel}</button>
      ) : null}
    </div>
  );
}
