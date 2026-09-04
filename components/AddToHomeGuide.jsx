"use client";

import { useEffect, useState } from "react";
import { C } from "@/lib/tokens";

// ============================================================================
// iOS：ホーム画面に置く案内（2026-09-04）
//
//   出どころ docs/opus/lavoce-仕様-ホーム画面までの動線・画面と文言（9月4日）.md §2
//
//   ★★iOS では、ホーム画面版と Safari で★保存場所が別です。
//     ★ブラウザで登録させると、★ホーム画面から開いたときログアウトしています。
//     ★★だから、★置いてから登録します。
//
//   ★守ること
//     ・★実物のスクリーンショットを使う（★描いた絵ではありません）
//     ・★「あとで」を必ず置く。★出口のない画面を作らない
//     ・★この画面のまま止める。★自動で次に進めない
//       ★★追加したかどうかは、アプリからは分かりません
//     ・★「追加ありがとうございます」と書かない。★知らないことを言わない
//     ・★「インストール」と書かない。★ストアを探されます
//
//   ★★共有ボタンの位置について
//     ★Safari の設定で、★上にも下にもなります
//       （設定 ＞ Safari ＞ タブ：「タブバー」なら下、「シングルタブ」なら上）。
//     ★★だから「画面の下の」と★言い切りません。
//       ★実物の絵で示し、★言葉では場所を断定しません。
//     ★2026-09-04 の実機（タブバー）では、★下の真ん中でした。
// ============================================================================

const STEPS = [
  {
    src: "/onboarding/ios-1.png",
    alt: "Woolsong のページを Safari で開いたところ。画面の下に、上向きの矢印のボタンが並んでいます。",
    caption: "① 上向きの矢印（⬆）のボタンを押します"
  },
  {
    src: "/onboarding/ios-2.png",
    alt: "共有のメニューが開いたところ。一覧の中に「ホーム画面に追加」があります。",
    caption: "② 下にスクロールして「ホーム画面に追加」を選びます"
  },
  {
    src: "/onboarding/ios-3.png",
    alt: "「ホーム画面に追加」の確認の画面。羊の絵と Woolsong の名前、右上に「追加」があります。",
    caption: "③ 右上の「追加」を押します"
  }
];

export default function AddToHomeGuide({ onSkip, onShow }) {
  const [i, setI] = useState(0);
  // ★出したことを、1回だけ数えます。★呼ぶ側が数え方を決めます。
  useEffect(() => { if (onShow) onShow(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const step = STEPS[i];

  // ★外側（Shell）が余白を持っています。★ここでは持ちません。
  //   ★二重に持つと、★画面が縦に伸びます。
  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: C.ink, margin: "0 0 6px" }}>
        まず、ホーム画面に置きましょう。
      </h1>
      <p style={{ fontSize: 13, color: C.inkSoft, margin: "0 0 18px" }}>
        次からは、アイコンを押すだけで開けます。
      </p>

      {/* ★段の数を見せます。★短いことが分かると、進みます。 */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 14 }}>
        {STEPS.map((s, n) => (
          <span key={s.src} style={{
            width: 8, height: 8, borderRadius: 999,
            background: n === i ? C.curtain : C.line
          }} />
        ))}
      </div>

      {/* ★★写真は、縦に長いです（828×1792）。
          ★幅いっぱいに出すと、★高さが800pxを超え、★画面に入りません。
          ★★2026-09-04、実機で「①だけ空に見える」と報告されました。
            ★空だったのではなく、★写真の淡いところだけが見えていました。
            ★下の説明も、★画面の外にありました。
          ★だから、★高さを画面に合わせて抑えます。
            ★contain なので、★切れずに、全体が入ります。 */}
      <div style={{
        display: "flex", justifyContent: "center",
        background: C.card, borderRadius: 14, border: `1px solid ${C.line}`,
        padding: 8, marginBottom: 12
      }}>
        <img src={step.src} alt={step.alt}
          style={{
            maxWidth: "100%", maxHeight: "46svh",
            width: "auto", height: "auto",
            objectFit: "contain", display: "block"
          }} />
      </div>

      <p style={{ fontSize: 15, color: C.ink, margin: "0 0 18px", textAlign: "center" }}>
        {step.caption}
      </p>

      <div style={{ display: "flex", gap: 8 }}>
        {/* ★どの画面にも「戻る」があります。 */}
        <button type="button" onClick={() => setI((n) => Math.max(0, n - 1))}
          disabled={i === 0}
          style={{
            flex: 1, padding: "11px", borderRadius: 999,
            border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
            fontSize: 13, opacity: i === 0 ? 0.4 : 1
          }}>
          もどる
        </button>
        <button type="button" onClick={() => setI((n) => Math.min(STEPS.length - 1, n + 1))}
          disabled={i === STEPS.length - 1}
          style={{
            flex: 1, padding: "11px", borderRadius: 999, border: "none",
            background: C.curtain, color: "#FFFDF8", fontSize: 13, fontWeight: 600,
            opacity: i === STEPS.length - 1 ? 0.4 : 1
          }}>
          つぎ
        </button>
      </div>

      {/* ★追加したあとの案内。★同じ画面の下に、常に出しておきます。
          ★★アイコンの絵を出します。探せない人がいます。 */}
      <div style={{ marginTop: 22, padding: 14, borderRadius: 14, background: C.paper }}>
        <p style={{ fontSize: 13, color: C.ink, margin: "0 0 8px" }}>
          追加できたら、ホーム画面に戻って
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/icon-120.png" alt="Woolsong のアイコン（羊の絵）"
            width={44} height={44}
            style={{ borderRadius: 10, border: `1px solid ${C.line}` }} />
          <p style={{ fontSize: 13, color: C.ink, margin: 0 }}>
            このアイコンを押してください。
          </p>
        </div>
      </div>

      {/* ★★「あとで」を必ず置きます。★出口のない画面を作らないこと。
          ★押した方には、★不利なことを先に伝えます（呼ぶ側の画面で）。 */}
      <button type="button" onClick={onSkip}
        style={{
          width: "100%", marginTop: 18, padding: "11px", borderRadius: 999,
          border: "none", background: "transparent", color: C.inkSoft, fontSize: 13
        }}>
        あとで
      </button>
    </div>
  );
}
