"use client";

import { C } from "@/lib/tokens";
import { CLOTH_COLORS, swatchHex, needsEdge, edgeHex } from "@/lib/clothColors";
import { SIZES } from "@/lib/homeDrawer";
import { allowedSecondKeys } from "@/lib/secondColorChoice";
import { secondColorKey } from "@/lib/patternColors";

// ============================================================================
// 柄の 2色目を 選ぶ 帯（2026-09-08 夜）
//
//   ★出どころ second-color-table.json（final2）の override
//
//   ★★既定は 全員 同じです。★1色目から 表を引いて 決めます。
//     ★この帯は、★その上に 重ねるだけです。★選ばなければ 既定のままです。
//
//   ★★押せない色が あります。
//     ★1色目との 明るさの対比が 2.2 未満だと、★柄が 消えます。
//     ★★消しません。★押せない灰色に します。★あることは 見えたままです。
//
//   ★★「もとにもどす」を、★必ず 置きます。
//     ★選び直したまま 戻れなくならないためです。
//     ★★これは 既定に 戻すだけです。★1色目にも 着ているものにも 触りません。
//
//   ★見張り components/tests/second-color-choice.test.js
// ============================================================================

export default function ClothSecondColorRow({ firstKey, chosen, onChange, onReset }) {
  const allowed = allowedSecondKeys(firstKey);
  const fallback = secondColorKey(firstKey);
  // ★★いま 効いている 2色目。★選んでいなければ 既定です。
  const now = chosen || fallback;

  return (
    <div style={{
      height: SIZES.colorBandPx, flexShrink: 0,
      borderTop: `1px solid ${C.line}`, background: C.card,
      display: "flex", alignItems: "center", gap: SIZES.swatchGapPx,
      padding: `0 ${SIZES.swatchGapPx}px`, overflowX: "auto"
    }}>
      {/* ★★何の帯かを、★短く 書きます。★2段あるので、見分けが要ります。 */}
      <span style={{ fontSize: "0.6875rem", color: C.inkSoft, whiteSpace: "nowrap", flexShrink: 0 }}>
        がらの いろ
      </span>
      {CLOTH_COLORS.map((c) => {
        const on = now === c.key;
        // ★★選べない色は、押せない灰色に します（★対比 2.2 未満）。
        const dead = !allowed.includes(c.key);
        return (
          <button key={c.key} type="button"
            aria-pressed={on} aria-label={c.name}
            disabled={dead}
            title={dead ? "この いろでは、がらが きえます" : c.name}
            onClick={() => onChange && onChange(c.key)}
            style={{
              flexShrink: 0,
              width: SIZES.swatchPx, height: SIZES.swatchPx,
              borderRadius: SIZES.swatchRadiusPx, background: swatchHex(c.key),
              // ★★大きさを 変えません。★変えると、並びが ずれます。
              border: needsEdge(c.key)
                ? `1px solid ${edgeHex(c.key)}` : "1px solid rgba(0,0,0,0.10)",
              boxShadow: on ? `0 0 0 3px ${C.ink}` : "none",
              opacity: dead ? 0.28 : 1,
              filter: dead ? "grayscale(1)" : "none",
              padding: 0
            }} />
        );
      })}
      {/* ★★もとにもどす。★選び直したまま 戻れなくならないためです。 */}
      <button type="button" onClick={() => onReset && onReset()}
        disabled={!chosen}
        style={{
          flexShrink: 0, marginLeft: 4,
          minHeight: 28, padding: "0 8px", borderRadius: 4,
          border: `1px solid ${C.line}`, borderBottomWidth: 2,
          background: C.paper, color: C.inkSoft, fontSize: "0.6875rem",
          whiteSpace: "nowrap", opacity: chosen ? 1 : 0.45
        }}>
        もとに もどす
      </button>
    </div>
  );
}
