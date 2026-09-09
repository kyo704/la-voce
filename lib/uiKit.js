// ============================================================================
// ★見本の 共通の 部品（★2026-09-10 ／ design.zip・tokens-2026-09-10）
//
//   ★出どころ docs/design/pack/tokens.md ＋ docs/design/pack/screens/*.html
//     ★★食い違ったら HTML が 正です（★README の 決め）。
//
//   ★★ここは「★形」だけを 持ちます。★色は 持ちません。
//     ★色は lib/tokens.js（C）です。★2か所に 置くと、★片方だけ 直ります。
//     ★★見本の 色と アプリの 色は、★数が すこし ちがいます
//       （★えんじ #840C24 ／ #7A1F2B など）。
//       ★★これには 既に お決めが あります ──「★実際に 画面に 出ている 値を 正とし、
//         ★仕様書の〈役割〉だけを 割り当てる」（★lib/tokens.js の 註）。
//       ★★だから ここでは 色を 上書きしません。★大きさ・太さ・間だけです。
//
//   ★★足す ときの 決め。★見本の どこかで 実際に 使うものだけを 置きます。
//     ★「いつか 要る」で 置かないこと。★読まれない 値は、★間違っていても
//     ★誰も 気づけません。
//
//   ★見張り components/tests/ui-kit.test.js
// ============================================================================

import { C } from "@/lib/tokens";

// ----------------------------------------------------------------------------
// ★書体
// ----------------------------------------------------------------------------
//   ★★tokens.md §2「★アプリは 全部 ゴシックです。★明朝は 使いません。
//     （★明朝を 使うのは 紙もの＝PDF だけです）」「★数字も 同じ書体」
//
//   ★★これは 好みの 話では ありません。★実際に 読めなく なっていました。
//     ★2026-09-09 の 実機で、★ねむりが「6時間o分」と 出ていました。
//     ★★Cormorant（.ff-display）の 0 は 背の低い 旧式数字で、
//       ★小文字の o に 見えます。★時間の 0 が o に 見えていました。
//   ★★だから、★門の中の 画面では .ff-display を 使いません。
//     ★入口（app/page.js）や 紙ものは これまでどおりです。★別の話です。
export const FONT_STACK = '"Hiragino Sans","Noto Sans JP",system-ui,sans-serif';

// ----------------------------------------------------------------------------
// ★大きさ（★tokens.md §3・スマホ 360px 幅）
// ----------------------------------------------------------------------------
//   ★★--ink3 について。
//     ★見本の §3 の表は、★小見出し（.h3）と「あなたのふだん」(.usu) の 色を
//       ★--ink3 と 書いています。
//     ★★けれど 同じ文書の §1-2 と §5-2、★そして 坂本さんの お決め（2026-09-10）が、
//       ★「--ink3 は、これから 罫線・アイコン・区切りにだけ。
//          ★小さい文字には 使わない」と 言っています。
//     ★★決めのほうを 採ります。★小さい字は ぜんぶ ink2（C.inkSoft）です。
export const TYPE = {
  /** ★画面の題（h2）。★17px・400・字間 .06em */
  title: { fontSize: 17, fontWeight: 400, letterSpacing: "0.06em", color: C.ink },
  /** ★小見出し（.h3）。★10.5px・字間 .12em */
  h3: { fontSize: 10.5, fontWeight: 400, letterSpacing: "0.12em", color: C.inkSoft },
  /** ★本文（.obi .m など）。★13.5px */
  body: { fontSize: 13.5, fontWeight: 400, color: C.ink, lineHeight: 1.6 },
  /** ★一覧の行・カードの中の 1文（.li）。★13px */
  li: { fontSize: 13, fontWeight: 400, color: C.ink, lineHeight: 1.7 },
  /** ★カードの 小さな見出し（.mini）。★11.5px */
  mini: { fontSize: 11.5, fontWeight: 400, color: C.inkSoft, lineHeight: 1.85 },
  /** ★「あなたのふだん」（.usu）。★11px */
  usual: { fontSize: 11, fontWeight: 400, color: C.inkSoft },
  /** ★大きな数字（.big）。★26px・700・字間 −.01em */
  big: { fontSize: 26, fontWeight: 700, letterSpacing: "-0.01em", color: C.ink },
  /** ★大きな数字の 単位（.big s）。★12px・400 */
  bigUnit: { fontSize: 12, fontWeight: 400, letterSpacing: "normal", color: C.inkSoft },
  /** ★帯の 小見出し（.obi .t）。★10.5px・700・字間 .08em・山吹 */
  obiTitle: { fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", color: C.gold },
  /** ★タブの文字。★10px（★選ばれたら 700） */
  tab: { fontSize: 10, fontWeight: 400 },
  /** ★主ボタン（.btn）。★16px・700・字間 .06em */
  btn: { fontSize: 16, fontWeight: 700, letterSpacing: "0.06em" }
};

// ----------------------------------------------------------------------------
// ★角の 丸み（★tokens.md §4）
// ----------------------------------------------------------------------------
export const RADIUS = { card: 14, btn: 13, speak: 16 };

// ----------------------------------------------------------------------------
// ★余白（★tokens.md §5）
// ----------------------------------------------------------------------------
export const SPACE = {
  /** ★カードの 内側。★上下 12 ／ 左右 13 */
  cardPadY: 12,
  cardPadX: 13,
  /** ★カードどうしの あいだ */
  cardGap: 9,
  /** ★小見出しの 上 ／ 下 */
  h3Top: 14,
  h3Bottom: 7,
  /** ★押せるところは、★どの段でも 44 以上（★tokens.md §5・「文字の大きさ」§3-1） */
  tapMin: 44
};

/** ★下のタブの 高さ（★tokens.md §7）。 */
export const TAB_BAR_HEIGHT = 56;

/**
 * ★羊の 幅（★本文の 列の 幅に 対する 割合）。
 *
 *   ★出どころ 見本① .sheep{width:186px} ／ .bd{padding:0 15px} ／ .ph{width:360px}
 *
 *   ★★坂本さんの お決め（2026-09-10）
 *     「★以前の 判断（120px）を 優先せず、★見本の サイズ
 *       （幅186px／画面360px＝51.7%）に、★合わせてください」
 *
 *   ★★なぜ px で 持たないか。
 *     ★見本は 360px 幅で 描かれています。★実機は 390 や 414 です。
 *     ★★120 や 186 と 書くと、★端末が 変わるたびに ずれます。
 *
 *   ★★なぜ 分母が 330 なのか。
 *     ★坂本さんの 数（51.7%）は、★画面の 幅 360 に 対する 割合です。
 *     ★★羊が 実際に 入っているのは、★左右 15px を 除いた 本文の 列＝330px です。
 *     ★測れるのは その 列なので、★列に 対する 割合に 直しています。
 *       186／330 ＝ 56.4%（★列）　＝　186／360 ＝ 51.7%（★画面）　★同じ 大きさです。
 *     ★★アプリの 列は 左右 16px なので、★2px ぶん だけ ちがいます。
 */
export const SHEEP_WIDTH_RATIO = 186 / 330;

// ----------------------------------------------------------------------------
// ★形の もと
// ----------------------------------------------------------------------------

/** ★カード 1枚（.card）。 */
export const cardStyle = {
  background: C.card,
  border: `1px solid ${C.line}`,
  borderRadius: RADIUS.card,
  padding: `${SPACE.cardPadY}px ${SPACE.cardPadX}px`
};

/** ★予定の 帯（.obi）。★カードより 内側が すこし 狭いです。 */
export const obiStyle = {
  background: C.card,
  border: `1px solid ${C.line}`,
  borderRadius: RADIUS.card,
  padding: "10px 12px"
};

/** ★羊の ひとこと（.speak）。★角が すこし 丸いです。 */
export const speakStyle = {
  background: C.card,
  border: `1px solid ${C.line}`,
  borderRadius: RADIUS.speak,
  padding: "11px 13px",
  ...TYPE.body,
  lineHeight: 1.65
};

/** ★主ボタン（.btn）。★いちばん 大きい 押しどころ。 */
export const primaryButtonStyle = {
  ...TYPE.btn,
  width: "100%",
  background: C.curtain,
  color: "#FFFDF8",
  border: "none",
  borderRadius: RADIUS.btn,
  padding: "15px 0",
  boxShadow: "0 3px 10px rgba(122,31,43,.22)",
  fontFamily: FONT_STACK
};
