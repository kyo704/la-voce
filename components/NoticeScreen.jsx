"use client";

import { C } from "@/lib/tokens";
import { NOTICE_TEXT, NOTICE_PARAGRAPHS } from "@/lib/notices";

// ============================================================================
// お知らせの画面（v3・2026-09-03 確定 → 2026-09-05 実装）
//
//   出どころ docs/lavoce-お知らせ画面-文面（2026-09-03確定-v3）.md
//
//   ★★文面は、★1文字も変えません。
//     ★要約も、言い換えも、丁寧にすることも、しません。
//     ★文面は lib/notices.js が持ちます。★ここには書きません。
//     ★確かめが、正の md と突き合わせます。
//
//   ★★2つのボタンを置きます。
//     ［同意の画面へ］  ★次にすることが、はっきり分かること
//     ［あとで］        ★★出口を必ず置くこと。★閉じ込めないこと
//
//   ★「あとで」を押した方を、★責めないこと。★次にまた出します。
//     ★★ですが、★催促の言葉は足しません（9月4日の決まり）。
//
//   ★お詫びの画面です。★明るくしないこと。★羊も、点も、出しません。
// ============================================================================

export default function NoticeScreen({ onGoConsent, onLater }) {
  return (
    <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.line }}>
      {/* ★見出しは、正のとおりです。 */}
      <h2 style={{
        fontSize: "1.125rem", fontWeight: 600, color: C.ink,
        margin: "0 0 16px", lineHeight: 1.6
      }}>
        {NOTICE_TEXT.consentApology2026}
      </h2>

      {/* ★段落の切れ目は、★正の md の空行と同じです。 */}
      {NOTICE_PARAGRAPHS.consentApology2026.map((p) => (
        <p key={p.slice(0, 12)} style={{
          fontSize: "1rem", color: C.ink, margin: "0 0 14px", lineHeight: 1.9
        }}>
          {p}
        </p>
      ))}

      {/* ★2つの文書へ。★読める形で置きます（★小さくしすぎないこと）。 */}
      <p style={{ fontSize: "1rem", margin: "18px 0 20px", lineHeight: 1.9 }}>
        <a href="/legal/privacy" style={{ color: C.curtain, textDecoration: "underline" }}>
          プライバシーポリシー
        </a>
        <span style={{ color: C.inkSoft }}>　／　</span>
        <a href="/legal/terms" style={{ color: C.curtain, textDecoration: "underline" }}>
          利用規約
        </a>
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button type="button" onClick={onGoConsent}
          style={{
            flex: "1 1 160px", padding: "15px", borderRadius: 999, border: "none",
            background: C.curtain, color: "#FFFDF8", fontSize: "1.0625rem",
            fontWeight: 600, minHeight: 52
          }}>
          同意の画面へ
        </button>
        {/* ★★出口を必ず置くこと。★出口のない画面を作らない。 */}
        <button type="button" onClick={onLater}
          style={{
            flex: "1 1 120px", padding: "15px", borderRadius: 999,
            border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
            fontSize: "1.0625rem", minHeight: 52
          }}>
          あとで
        </button>
      </div>
    </div>
  );
}
