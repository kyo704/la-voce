"use client";

import { C } from "@/lib/tokens";
import { TYPE, SPACE, RADIUS, FONT_STACK, cardStyle } from "@/lib/uiKit";

// ============================================================================
// ★見本の 共通の 部品（★design.zip ／ 2026-09-10）
//
//   ★出どころ docs/design/pack/screens/*.html の 共通の CSS
//            docs/design/pack/tokens.md
//
//   ★★44画面が、★同じ 10 ほどの 形で できています。
//     .hd ／ .h3 ／ .card ／ .seg ／ .pill ／ .warn ／ .note ／ .li ／ .bar ／ .btn
//   ★★1画面ずつ 書き写すと、★44の 写しが できます。★1つ 直すと 43が 残ります。
//     ★だから、★ここに 1つずつ 置きます。
//
//   ★★大きさ・間は lib/uiKit.js、★色は lib/tokens.js が 持ちます。
//     ★ここでは 決めません。★組み立てるだけです。
//
//   ★★--ink3 は 小さい字に 使いません（★2026-09-10・坂本さんの お決め）。
//     ★見本の CSS が --ink3 と 書いている ところも、★ink2 に します。
//
//   ★見張り components/tests/ui-v2.test.js
// ============================================================================

/** ★画面の 頭（.hd）。★題と、★右の 1つ。 */
export function ScreenHead({ title, right }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 1px 6px"
    }}>
      <h2 style={TYPE.title}>{title}</h2>
      {right || null}
    </div>
  );
}

/**
 * ★頭の 右の 丸（.gear）。★⚙ ／ ＋ ／ ×。
 *
 *   ★★見えるのは 26px の 丸、★押せるのは 44px です。
 *     ★見本は 26px ですが、★tokens.md §5 は「どの段でも 44 以上」と 言います。
 *     ★負の 余白で、★行の 高さを 26 に 戻します。★どちらも 譲りません。
 */
export function HeadRound({ mark, label, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label={label}
      style={{
        width: SPACE.tapMin, height: SPACE.tapMin, margin: "-9px -9px -9px 0",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "transparent", border: "none", padding: 0
      }}>
      <span aria-hidden="true" style={{
        width: 26, height: 26, borderRadius: "50%",
        border: `1px solid ${C.line}`, background: C.card,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: C.inkSoft, fontSize: 12
      }}>{mark}</span>
    </button>
  );
}

/** ★小見出し（.h3）。★10.5px・字間 .12em・上 14 ／ 下 7。 */
export function H3({ children }) {
  return (
    <p style={{ ...TYPE.h3, margin: `${SPACE.h3Top}px 0 ${SPACE.h3Bottom}px` }}>
      {children}
    </p>
  );
}

/** ★カード（.card）。★角 14・内側 12/13・下に 9。 */
export function Card({ children, style, onClick, ...rest }) {
  const s = { ...cardStyle, marginBottom: SPACE.cardGap, ...style };
  if (!onClick) return <div style={s} {...rest}>{children}</div>;
  return (
    <button type="button" onClick={onClick}
      style={{ ...s, display: "block", width: "100%", textAlign: "left", fontFamily: FONT_STACK }}
      {...rest}>
      {children}
    </button>
  );
}

/**
 * ★切替（.seg）。★2つ〜4つを 横に 並べます。
 *
 *   ★★選ばれた ものが 白く 浮きます。★えんじの 文字・700。
 *   ★★はみ出しません。★流れません。★4つまでの ものです。
 */
export function Seg({ items, activeKey, onSelect }) {
  return (
    <div style={{
      display: "flex", background: C.paper, borderRadius: 11, padding: 3,
      margin: "2px 0 10px"
    }}>
      {(items || []).map((it) => {
        const on = it.key === activeKey;
        return (
          <button key={it.key} type="button" onClick={() => onSelect(it.key)}
            aria-current={on ? "true" : undefined}
            style={{
              flex: 1, minWidth: 0, textAlign: "center",
              // ★★見本は 上下 7px（＝21px）ですが、★押せるところは 44 以上です。
              //   ★中の 白い 札は 見本の 高さの まま、★指の 当たる 所だけ 広げます。
              minHeight: SPACE.tapMin,
              padding: "7px 2px", borderRadius: 9, border: "none",
              fontSize: 11.5, fontWeight: on ? 700 : 400,
              background: on ? C.card : "transparent",
              color: on ? C.curtain : C.inkSoft,
              boxShadow: on ? "0 1px 3px rgba(0,0,0,.06)" : "none",
              fontFamily: FONT_STACK, whiteSpace: "nowrap"
            }}>
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/** ★丸いボタン（.pill）。★選ばれたら えんじ。★押せないときは 薄く。 */
export function Pill({ children, on, disabled, onClick }) {
  const style = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    borderRadius: RADIUS.pill, padding: "5px 11px",
    // ★押せるところは 44 以上（★見た目は 見本の まま、★上下に 透明な 余白）。
    minHeight: onClick ? SPACE.tapMin : undefined,
    fontSize: 11.5, fontWeight: on ? 700 : 400,
    border: `1px solid ${on ? C.curtain : C.line}`,
    background: on ? C.curtain : C.card,
    color: on ? "#FFFDF8" : C.inkSoft,
    fontFamily: FONT_STACK, whiteSpace: "nowrap",
    // ★★0件に なる 組み合わせは、★押せない 灰色に します（★A09 の 注記）。
    opacity: disabled ? 0.45 : 1
  };
  if (!onClick) return <span style={style}>{children}</span>;
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={!!on} style={style}>
      {children}
    </button>
  );
}

/**
 * ★断り書きの 箱（.warn）。
 *
 *   ★★「ここに出るのは、あなたが書いたことの並びです。
 *      原因かどうかは、分かりません。疑いながら 見てください。」
 *   ★★この文は、★1文字も 変えないこと。
 */
export function Warn({ children }) {
  return (
    <div style={{
      background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12,
      padding: "9px 11px", ...TYPE.note, lineHeight: 1.75, marginBottom: 10
    }}>
      {children}
    </div>
  );
}

/** ★注記（.note）。★11px・ink2。★薄い 色に しません。 */
export function Note({ children, style }) {
  return <p style={{ ...TYPE.note, lineHeight: 1.8, ...style }}>{children}</p>;
}

/** ★一覧の 1行（.li）。★左に 名前、★右に 値。★最後の行に 線を 引きません。 */
export function Li({ children, right, last, style }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "9px 0", ...TYPE.li,
      borderBottom: last ? "none" : `1px solid ${C.line2}`,
      ...style
    }}>
      <span style={{ minWidth: 0 }}>{children}</span>
      {right != null ? (
        <span style={{ color: C.inkSoft, fontSize: 11.5, flex: "none", marginLeft: 8 }}>{right}</span>
      ) : null}
    </div>
  );
}

/**
 * ★名前と 値の 1行（.kv）。★見本 B02・B03 の カードの 中身。
 *
 *   ★★左の 名前は ink2、★右の 値は ink（★濃い）。★見本の とおりです。
 *   ★★値の ほうを 濃くします。★読みに 来ているのは 値だからです。
 */
export function Kv({ children, right, last }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
      fontSize: 11.5, color: C.inkSoft, padding: "5px 0",
      borderBottom: last ? "none" : `1px solid ${C.line2}`
    }}>
      <span style={{ minWidth: 0 }}>{children}</span>
      {right != null ? <span style={{ color: C.ink, flex: "none" }}>{right}</span> : null}
    </div>
  );
}

/**
 * ★「しらべる」の 小さな 札（.lock）。
 *
 *   ★★まだ 見ていない、という 印です。★「未達」でも「不足」でも ありません。
 *   ★★数を 出しません。★あと何日、と 書きません。
 */
export function Lock({ children = "しらべる", onClick }) {
  const style = {
    fontSize: 9.5, color: C.inkSoft,
    border: `1px solid ${C.line}`, borderRadius: 5, padding: "1px 5px",
    marginLeft: "auto", background: "transparent", flex: "none",
    fontFamily: FONT_STACK
  };
  if (!onClick) return <span style={style}>{children}</span>;
  return <button type="button" onClick={onClick} style={{ ...style, minHeight: SPACE.tapMin }}>{children}</button>;
}

/**
 * ★1色の 濃淡の 棒（.rowb ＋ .bar）。
 *
 *   ★★長さも 濃さも、★同じ 1つの 値から 作ります。
 *     ★2つの 見え方に 分けると、★2つのことを 言ったことに なります。
 *   ★★書いていない日は 空けます。★0 として 描きません。
 */
export function BarRow({ label, ratio, tint, hollow }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
      <span style={{ width: 34, flex: "none", fontSize: 10, color: C.inkSoft }}>{label}</span>
      <div style={{ flex: 1, height: 8 }}>
        {ratio == null ? null : hollow ? (
          // ★★あとから 書いた日は、★中を 抜きます。★消しません。
          //   ★「目では 見えますが、判定には 入れていません」。
          <div style={{
            width: `${Math.round(ratio * 100)}%`, height: 8, borderRadius: 4,
            border: `1.4px solid ${tint}`, opacity: 0.6
          }} />
        ) : (
          <div style={{
            width: `${Math.round(ratio * 100)}%`, height: 8, borderRadius: 4,
            background: tint, opacity: 0.47 + 0.45 * ratio
          }} />
        )}
      </div>
    </div>
  );
}
