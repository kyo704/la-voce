"use client";

import { C } from "@/lib/tokens";
import { COPY, hasMarker } from "@/lib/periodMarkers";

// ============================================================================
// 区切りマーカー（★理由は書かせない）── 2026-09-08
//
//   ★出どころ docs/lavoce-食事と就寝の設計.md §6
//
//   ★★★理由の入力欄を、作らないこと。
//     ★服薬・受診そのものを、記録させません。
//     ★治療の内容は、要配慮性がさらに上がり、そのわりに分析には効きません。
//     ★★何があったかは、★ご本人だけが知っていれば足ります。
//
//   ★★押しどころは、1つだけです。
//     ★「何がありましたか」と、★聞きません。
//     ★「薬を飲み始めましたか」とも、★聞きません。
//
//   ★★良い・悪いを、★1文字も書きません。★前後を分けるだけです。
//
//   ★見張り components/tests/period-markers.test.js
// ============================================================================

/**
 * ★字の 大きさは 2通り です（★2026-09-19・お決め D66(a)）。
 *
 *   ★★この 部品は、★古い 画面にも、★門の 中にも 出ます。
 *     ★★だから 呼ぶ 側（置き所）が 決めます。★部品の 中では 決めません。
 *   ★★★`六段` を 渡された ときだけ、★裁定 その103 の 6段に 寄せます。
 *     ★★渡されなければ いまの まま ── ★38人の 画面は 変わりません。
 *   ★★★部品に 門（`layoutV2`）を 足して いません。
 *     ★★坂本さんの お決め ── ★UiV2 の ような 門を もう1つ 増やさない。
 */
export default function PeriodMarkerButton({ 六段 = false, dateISO, markers, onToggle, busy }) {
  if (!dateISO) return null;
  const on = hasMarker(markers, dateISO);

  return (
    <div className="rounded-xl p-3" style={{ background: C.paper }}>
      <button type="button"
        disabled={busy}
        onClick={() => onToggle && onToggle(dateISO, !on)}
        aria-pressed={on}
        style={{
          width: "100%", minHeight: 44, padding: "10px 14px", borderRadius: 999,
          // ★色だけで示しません。★わくの太さでも示します。
          border: `${on ? 2 : 1}px solid ${on ? C.curtain : C.line}`,
          background: on ? C.curtain : C.card,
          color: on ? "#FFFDF8" : C.ink,
          fontSize: 六段 ? "0.96875rem" : "0.9375rem", opacity: busy ? 0.6 : 1
        }}>
        {on ? COPY.remove : COPY.add}
      </button>
      <p className="text-xs" style={{ color: C.inkSoft, margin: "8px 0 0", lineHeight: 1.8 }}>
        {COPY.note}
      </p>
      {/* ★★なぜ理由を聞かないのかを、書いておきます。★黙って省くと、不親切です。
          ★★ここに「何があったか」を書く欄を、★足さないこと。 */}
      <p className="text-xs" style={{ color: C.inkSoft, margin: "4px 0 0", lineHeight: 1.8 }}>
        {COPY.whyNoReason}
      </p>
    </div>
  );
}
