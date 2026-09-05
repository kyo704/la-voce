"use client";

import { C } from "@/lib/tokens";
import { GATE_LINES, GATE_CLOSING_LINES } from "@/lib/freeTier";

// ============================================================================
// まとめが有料であることの、お伝え（⑫・2026-09-05）
//
//   出どころ docs/opus/lavoce-判断-無料期間は0でよい（9月5日・訂正）.md §4
//            docs/opus/lavoce-判断-週次のふりかえりを売るか（9月5日・夜）.md §4
//
//   ★★壁が来るのではありません。★見たいものが増えるのです。
//     ★同じ事実ですが、★言い方で別のものになります。
//
//   ★先に「見られるもの」を言ってから、★「増えたもの」を言います。
//     ★★順番を逆にすると、★取り上げられたように読めます。
//
//   ★★文言は lib/freeTier.js が持ちます。★ここには書きません。
//
//   ★★禁じた言い方（裁定 §6-5）
//     ✕「見られません」✕「できません」✕「無料期間が終わりました」
//     ✕「過去が見られなくなりました」✕「制限されました」
//
//   ★★催促しないこと。★断られても、また明日そこにあります。
//     ★閉じるボタンを置きません。★出したり消したりしません。
//     ★★画面を覆うモーダルにしないこと（権利と課金の線引き §6-3）。
//       ★札として、その場に置きます。
// ============================================================================

export default function GateNotice({ onSeePlans }) {
  return (
    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
      {GATE_LINES.map((line, i) => (
        line === "" ? <div key={`sp${i}`} style={{ height: 10 }} />
          : <p key={line} style={{
              fontSize: "1rem", color: C.ink, margin: "0 0 4px", lineHeight: 1.9
            }}>{line}</p>
      ))}

      <button type="button" onClick={onSeePlans}
        style={{
          width: "100%", marginTop: 16, padding: "13px", borderRadius: 999,
          border: "none", background: C.curtain, color: "#FFFDF8",
          fontSize: "1rem", fontWeight: 600, minHeight: 48
        }}>
        くわしく見る
      </button>

      {/* ★★この2行を、必ず添えること。
          ★書かないと、★「消えるのでは」と思われます。
          ★消しません。★消さないことが、この製品のいちばん大事な約束です。 */}
      <div style={{ background: C.paper, borderRadius: 12, padding: 12, marginTop: 14 }}>
        {GATE_CLOSING_LINES.map((line) => (
          <p key={line} style={{
            fontSize: "0.9375rem", color: C.ink, margin: "0 0 4px", lineHeight: 1.8
          }}>{line}</p>
        ))}
      </div>
    </div>
  );
}
