"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, SPACE, RADIUS, FONT_STACK, cardStyle, rem } from "@/lib/uiKit";

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
        color: C.inkSoft, fontSize: rem(12)
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
              fontSize: rem(11.5), fontWeight: on ? 700 : 400,
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
    fontSize: rem(11.5), fontWeight: on ? 700 : 400,
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
 *   ★見本 .warn{background:#F6F1E4;border:1px solid #E8DFC8;border-radius:12px;
 *              padding:9px 11px;font-size:11px;color:var(--ink2);
 *              line-height:1.75;margin-bottom:10px}
 *
 *   ★★2026-09-11、★地と 枠が 見本と ちがって いました。
 *     ★地　C.paper（#F6F1E7）→ ★見本は #F6F1E4
 *     ★枠　C.line（#E4DCC9）→ ★見本は #E8DFC8
 *   ★★近い 色ですが、★同じでは ありません。
 *     ★★この 箱は「ここに出るのは…」の 断りに 使います。
 *       ★下地（.paper）と 同じ 色だと、★箱に 見えません。
 *     ★★見本は、★下地より わずかに 濃くして 箱に 見せて います。
 *
 *   ★★Wl（.wl・#F6EFDF）とは 別の 箱です。★1つに まとめません。
 *     ★見本が 2つを 使い分けて います。
 */
export function Warn({ children, style }) {
  return (
    <div style={{
      background: "#F6F1E4", border: "1px solid #E8DFC8", borderRadius: 12,
      padding: "9px 11px", ...TYPE.note, lineHeight: 1.75, marginBottom: 10,
      ...style
    }}>
      {children}
    </div>
  );
}

/**
 * ★注記（.note）。★11px・ink2。★薄い 色に しません。
 *
 *   ★★2026-09-11、★見本の 中に foldNotes() という 関数を 見つけました。
 *     ★★見本は、★描くたびに .note を すべて 畳んでいます。
 *       ★はじめは 閉じていて、★「くわしい 決まりを 見る」の 札だけが 見えます。
 *       ★押すと 開き、★札の 字が「閉じる」に なります。
 *     ★★だから 見本の 画面には、★注記の 本文が 出ていません。
 *
 *   ★★はじめは 畳みません（fold={false} が 既定）。
 *     ★★Note は、★門（layoutV2）の 外の 画面でも 使われています。
 *       ★components/LookBackPanel.jsx（★分析タブの !layoutV2 の 側）
 *       ★components/OpsPosts.jsx／components/RangeCalendar.jsx
 *     ★★既定で 畳むと、★38人の 画面が 変わります。★それは できません。
 *       ★★2026-09-11、★一度 既定を「畳む」に して しまい、
 *         ★呼び出し元を 数えて 気づきました。★戻しました。
 *     ★★畳ませたい 画面で <Note fold> と 書きます。★1画面ずつ 移します。
 *
 *   ★★これは、★私の 前の 報告の 訂正です。
 *     ★★9月11日、★私は「見本に 畳む しくみは ありません」と 申しました。
 *       ★<details>／<summary> を 数えて、★0 だったからです。
 *     ★★見本は <details> を 使わず、★JavaScript で 畳んでいました。
 *       ★数え方が 誤っていました。★坂本さんは、★誤った 前提の 上で
 *       ★㋐（畳まず 隠す）を お決めに なりました。
 *     ★★このまま 開いて 出すか、★見本どおり 畳むかは、★お決めください。
 *       ★fold={false} を 渡すと、★畳まずに 出ます。
 *
 *   ★★札の 色は ink2 です。★見本の CSS は --ink3 ですが、
 *     ★この 帳面の 決まり（★上の 見出し）で ink2 に します。
 */
export function Note({ children, style, fold = false }) {
  const [open, setOpen] = useState(false);
  const body = (
    <p style={{
      ...TYPE.note, lineHeight: 1.8, marginTop: 9,
      display: fold && !open ? "none" : undefined, ...style
    }}>{children}</p>
  );
  if (!fold) return body;
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)}
        style={{
          display: "inline-block", marginTop: 14, fontSize: rem(11.5),
          color: open ? C.curtain : C.inkSoft,
          border: `1px solid ${open ? "#CFC0A4" : C.line}`,
          borderRadius: 99, padding: "5px 12px", background: C.paper,
          minHeight: SPACE.tapMin, fontFamily: FONT_STACK
        }}>{open ? NOTE_CLOSE : NOTE_OPEN}</button>
      {body}
    </div>
  );
}

/** ★畳んだ 注記の 札（★見本 foldNotes の textContent、★1文字も 変えない）。 */
export const NOTE_OPEN = "くわしい 決まりを 見る";
export const NOTE_CLOSE = "閉じる";

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
        <span style={{ color: C.inkSoft, fontSize: rem(11.5), flex: "none", marginLeft: 8 }}>{right}</span>
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
      fontSize: rem(11.5), color: C.inkSoft, padding: "5px 0",
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
    fontSize: rem(9.5), color: C.inkSoft,
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
      <span style={{ width: 34, flex: "none", fontSize: rem(10), color: C.inkSoft }}>{label}</span>
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


// ============================================================================
// ★足りて いなかった 共通の 部品（★2026-09-11・坂本さんの ㋑）
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//     の <style>（★git hash 7c7c720）
//
//   ★★一斉の 確かめ（tools/audit-source.js）で 分かった こと ──
//     ★31画面の うち 24画面が、★見本と 半分も 合って いませんでした。
//     ★★「余分な もの」が 20件を 超える 画面が 12 ありました。
//     ★★その 多くは、★同じ 形を 画面ごとに 書き写した もの でした。
//       ★入力欄 12か所　★枠だけの ボタン 20か所　★戻る 6か所
//       ★cardStyle じかに 28か所　★TYPE.usual じかに 25か所
//
//   ★★写しが あると、★1つ 直しても、★ほかが 残ります。
//     ★だから、★ここに 1つずつ 置きます。
//
//   ★★値は 見本の CSS の ままです。★2つだけ 変えます。
//     ★① ink3 は 小さい字に 使いません（★2026-09-10・坂本さんの お決め）。
//       ★見本が var(--ink3) と 書いて いる ところも、★ink2 に します。
//     ★② 入力欄の 字は 16px です（★見本は 13.5px）。
//       ★iOS は 16px 未満の 入力欄で、★触ると 画面を 拡大します。
//       ★app/globals.css が すでに そう しています。★そろえます。
//
//   ★見張り components/tests/ui-parts.test.js
// ============================================================================

/**
 * ★白地の 入れもの（.box）。★中に Li を 並べます。
 *
 *   ★見本 .box{background:#fff;border:1px solid var(--line);
 *              border-radius:14px;padding:0 12px;margin-bottom:9px}
 *   ★★Card（.card）とは ちがいます。★padding が 上下 0 です。
 *     ★★行（.li）が 自分で 上下の 余白を 持つ からです。
 */
export function Box({ children, style }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.line}`,
      borderRadius: RADIUS.card, padding: "0 12px", marginBottom: SPACE.cardGap,
      ...style
    }}>{children}</div>
  );
}

/**
 * ★小さな そえ字（.usu）。★11px。
 *
 *   ★見本 .usu{font-size:11px;color:var(--ink3);margin-top:2px}
 *   ★★色は ink2 に します（★上の お決め ①）。
 */
export function Usu({ children, style }) {
  return <span style={{ ...TYPE.usual, display: "block", marginTop: 2, ...style }}>{children}</span>;
}

/**
 * ★入力欄の 上の 見出し（.fl）。
 *
 *   ★見本 .fl{font-size:10.5px;color:var(--ink3);letter-spacing:.08em;margin:12px 0 5px}
 */
export function FieldLabel({ children, htmlFor, style }) {
  return (
    <label htmlFor={htmlFor} style={{
      display: "block", fontSize: rem(10.5), color: C.inkSoft,
      letterSpacing: "0.08em", margin: "12px 0 5px", ...style
    }}>{children}</label>
  );
}

/**
 * ★白い 断りの 帯（.wl）。★Warn（.warn）より 明るい 地です。
 *
 *   ★見本 .wl{background:#F6EFDF;border:1px solid #E8DFC8;border-radius:12px;
 *             padding:9px 11px;font-size:11px;color:var(--ink2);…}
 *   ★★Warn は #F6F1E4。★1つ 上の 明るさです。★見分けが つきます。
 *     ★見本は 2つを 使い分けて います。★1つに まとめません。
 */
export function Wl({ children, style }) {
  return (
    <div style={{
      background: "#F6EFDF", border: "1px solid #E8DFC8", borderRadius: 12,
      padding: "9px 11px", ...TYPE.note, lineHeight: 1.75, marginBottom: 10, ...style
    }}>{children}</div>
  );
}

/** ★2つ 横に 並べる（.two）。★あいだ 9px。 */
export function Two({ children, style }) {
  return <div style={{ display: "flex", gap: SPACE.cardGap, ...style }}>{children}</div>;
}

/**
 * ★1行の 入力欄（.inp）。
 *
 *   ★見本 .inp{width:100%;border:1px solid var(--line);border-radius:12px;
 *              background:#fff;padding:12px;font-size:13.5px;color:var(--ink)}
 *   ★★字は 16px に します（★上の お決め ②）。
 *     ★iOS は 16px 未満の 入力欄で、★触ると 画面を 拡大します。
 *   ★★高さは 44 以上です（★どの 押しどころも 44 以上）。
 */
export function Input({ style, ...rest }) {
  return (
    <input {...rest} style={{
      width: "100%", minHeight: SPACE.tapMin, boxSizing: "border-box",
      border: `1px solid ${C.line}`, borderRadius: 12,
      background: C.card, padding: 12, fontFamily: FONT_STACK,
      fontSize: rem(16), color: C.ink, ...style
    }} />
  );
}

/**
 * ★書く枠（.ta）。
 *
 *   ★見本 .ta{width:100%;border:1px solid var(--line);border-radius:12px;
 *             background:#fff;padding:11px;font-size:13px;min-height:74px;
 *             resize:none;color:var(--ink);line-height:1.7}
 *   ★★字は 16px に します（★上の お決め ②）。
 *   ★★resize は 止めません。★見本は none ですが、★長い 文を 書く 方が います。
 *     ★★取り上げに なります。★縦だけ 伸ばせる ように します。
 */
export function TextArea({ style, ...rest }) {
  return (
    <textarea {...rest} style={{
      width: "100%", boxSizing: "border-box",
      border: `1px solid ${C.line}`, borderRadius: 12,
      background: C.card, padding: 11, fontFamily: FONT_STACK,
      fontSize: rem(16), color: C.ink, lineHeight: 1.7,
      minHeight: 74, resize: "vertical", ...style
    }} />
  );
}

/** ★1枚の 題（.sht）。★16px・700。 */
export function SheetTitle({ children, style }) {
  return (
    <div style={{
      fontSize: rem(16), fontWeight: 700, color: C.ink,
      marginBottom: 4, ...style
    }}>{children}</div>
  );
}

/**
 * ★何も 無い ときの 枠（.empty）。
 *
 *   ★見本 .empty{text-align:center;padding:26px 14px;background:#fff;
 *                border:1px dashed var(--line);border-radius:14px}
 *   ★★白紙に しません。★何を すると 埋まるかを 1行 書きます（★見本の 決め）。
 *   ★★責める 言葉を 書きません。★「まだ」「未入力」「不足」を 使わないこと。
 */
export function EmptyBox({ title, sub, style }) {
  return (
    <div style={{
      textAlign: "center", padding: "26px 14px", background: C.card,
      border: `1px dashed ${C.line}`, borderRadius: RADIUS.card,
      marginBottom: SPACE.cardGap, ...style
    }}>
      <div style={{ ...TYPE.li, color: C.ink }}>{title}</div>
      {sub ? <Usu style={{ marginTop: 6 }}>{sub}</Usu> : null}
    </div>
  );
}

/**
 * ★切替（.sw）。★44×26・つまみ 20。
 *
 *   ★見本 .sw{width:44px;height:26px;border-radius:99px;background:#DFD4BE}
 *         .sw.on{background:var(--enji)}
 *         .sw i{top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff}
 *   ★★押しどころは 44 以上 要ります。★見た目は 26px です。
 *     ★だから、★外側に 透明な 余白を 置きます。★見た目を 変えません。
 */
export function Switch({ on, onChange, label }) {
  return (
    <span role="switch" aria-checked={!!on} aria-label={label} tabIndex={0}
      onClick={() => onChange && onChange(!on)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange && onChange(!on); }
      }}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        minHeight: SPACE.tapMin, minWidth: SPACE.tapMin, cursor: "pointer", flex: "none"
      }}>
      <span style={{
        display: "block", width: 44, height: 26, borderRadius: 99,
        position: "relative", background: on ? C.curtain : "#DFD4BE",
        transition: ".16s"
      }}>
        <span style={{
          position: "absolute", top: 3, left: on ? 21 : 3,
          width: 20, height: 20, borderRadius: "50%", background: "#fff",
          boxShadow: "0 1px 2px rgba(0,0,0,.2)", transition: ".16s"
        }} />
      </span>
    </span>
  );
}

/**
 * ★戻る（.back）。★「‹ ◯◯」。
 *
 *   ★見本 .back{font-size:12.5px;color:var(--enji);padding:9px 0 3px;display:inline-block}
 *   ★★行き先の 名前を 書きます。★「戻る」だけに しません。
 *     ★どこへ 戻るのかが 分からないと、★押せません。
 */
export function Back({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: "inline-block", background: "transparent", border: "none",
      padding: "9px 1px 3px", minHeight: SPACE.tapMin,
      color: C.curtain, fontSize: rem(12.5), fontFamily: FONT_STACK,
      textAlign: "left"
    }}>‹　{children}</button>
  );
}

/**
 * ★ボタン（.btn）。
 *
 *   ★見本 .btn{width:100%;background:var(--enji);color:#fff;border-radius:13px;
 *              padding:14px 0;font-size:15px;font-weight:700}
 *         .btn.g{background:#fff;color:var(--ink);border:1px solid var(--line);
 *                font-weight:400;font-size:13.5px;padding:12px 0}
 *         .btn.sm{font-size:12.5px;padding:10px 0}
 *
 *   @param ghost ★枠だけ（.btn.g）
 *   @param small ★小さく（.btn.sm）
 */
export function Btn({ children, onClick, ghost, small, disabled, style, type = "button" }) {
  const pad = small ? "10px 0" : (ghost ? "12px 0" : "14px 0");
  const size = small ? 12.5 : (ghost ? 13.5 : 15);
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      display: "block", width: "100%", borderRadius: RADIUS.btn,
      padding: pad, minHeight: SPACE.tapMin,
      border: ghost ? `1px solid ${C.line}` : "none",
      background: ghost ? C.card : C.curtain,
      color: ghost ? C.ink : "#FFFDF8",
      fontFamily: FONT_STACK, fontSize: rem(size),
      fontWeight: ghost ? 400 : 700, textAlign: "center",
      opacity: disabled ? 0.45 : 1, ...style
    }}>{children}</button>
  );
}

/**
 * ★小さな 札（.tag）。★教室の 名前など。
 *
 *   ★見本 .tag{background:#F3ECDD;color:var(--ink2);border-radius:6px;
 *              padding:2px 7px;font-size:10px;margin-left:6px}
 */
export function Tag({ children, style }) {
  return (
    <span style={{
      display: "inline-block", background: "#F3ECDD", color: C.inkSoft,
      borderRadius: 6, padding: "2px 7px", fontSize: rem(10),
      marginLeft: 6, whiteSpace: "nowrap", lineHeight: 1.5, ...style
    }}>{children}</span>
  );
}
