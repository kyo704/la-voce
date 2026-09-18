"use client";

import { navGroupsFor, navWidth, SIDE_WIDTH, RAIL_WIDTH } from "@/lib/opsNav";
import { ICON_SIZE, ICON_SIZE_RAIL } from "@/lib/opsIcons";
import OpsIcon from "@/components/OpsIcon";
import { rem, FONT_STACK, TYPE } from "@/lib/uiKit";
import { v } from "@/lib/visualTokens";
import { tx } from "@/lib/t";

// ============================================================================
// ★左の ナビ（★裁定 その78 §1 §2 §4 ／ その81 §4）
//
//   ★★★たたんでも、★ラベルを 消しません（★§4-4）。
//     ★★読み上げには 残します（★`sr` の 形）。★指を 乗せると 名前が 出ます。
//     ★★NN/g ──「★デスクトップで、ナビを アイコンだけに 隠すな」
//
//   ★★★選んだ ときに、★しるしを 塗りつぶしません（★その81 §3-6）。
//     ★★左に 3px の 線を 引きます。★絵の 後ろを 塗りません。
//
//   ★★★色を 直に 書きません（★その81 §1-3・§6）。★`--…` の 名で 呼びます。
//
//   ★★決めは lib/opsNav.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/ops-nav.test.js
// ============================================================================

// ★★読み上げには 残し、★目には 出さない（★§4-4 の `.lb`）。
const 読み上げだけ = {
  position: "absolute", width: 1, height: 1,
  overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap"
};

export default function OpsNav({ perms, current, onGo, rail, onToggleRail }) {
  const groups = navGroupsFor(perms);
  if (groups.length === 0) return null;
  const 幅 = navWidth(rail);

  return (
    <nav aria-label={tx("運営の ナビ")}
      style={{
        width: 幅, minWidth: 幅, flex: "none",
        background: v("paper"), borderRight: `1px solid ${v("line")}`,
        fontFamily: FONT_STACK, display: "flex", flexDirection: "column",
        overflowY: "auto"
      }}>
      {groups.map((g) => (
        <div key={g.head || "_"} style={{ padding: `${rem(8)} 0` }}>
          {/* ★★まとまりの 見出し。★たたんだ ときは 出しません。
              ★★★見出しは 場所の 名では ありません。★飾り です。
                ★★行の 名（ラベル）は、★たたんでも 消しません。★あちらは 消しません。 */}
          {g.head && !rail ? (
            <div style={{
              ...TYPE.h3, color: v("ink4"),
              padding: `${rem(4)} ${rem(14)}`
            }}>{g.head}</div>
          ) : null}

          {g.items.map((it) => {
            const on = current === it.key;
            return (
              <button key={it.key} type="button"
                onClick={() => onGo && onGo(it.key)}
                aria-current={on ? "page" : undefined}
                title={rail ? it.label : undefined}
                style={{
                  width: "100%", minHeight: 44,
                  display: "flex", alignItems: "center",
                  justifyContent: rail ? "center" : "flex-start",
                  gap: rail ? 0 : 10,
                  padding: rail ? 0 : `0 ${rem(14)}`,
                  border: "none", background: "transparent",
                  // ★★選んだ ことは、★色と 線の 2つで 示します。★色 だけに しません。
                  color: on ? v("enji") : v("ink2"),
                  boxShadow: on ? `inset 3px 0 0 ${v("enji")}` : "none",
                  fontWeight: on ? 700 : 400,
                  fontSize: rem(13.5), fontFamily: FONT_STACK,
                  textAlign: "left", cursor: "pointer"
                }}>
                <OpsIcon name={it.icon} size={rail ? ICON_SIZE_RAIL : ICON_SIZE} />
                <span style={rail ? 読み上げだけ : undefined}>{it.label}</span>
              </button>
            );
          })}
        </div>
      ))}

      {/* ★★たたむ／ひらく。★いちばん 下に 置きます。 */}
      {onToggleRail ? (
        <button type="button" onClick={onToggleRail}
          title={rail ? tx("ひらく") : tx("たたむ")}
          style={{
            marginTop: "auto", minHeight: 44,
            display: "flex", alignItems: "center",
            justifyContent: rail ? "center" : "flex-start",
            gap: rail ? 0 : 10, padding: rail ? 0 : `0 ${rem(14)}`,
            border: "none", borderTop: `1px solid ${v("line2")}`,
            background: "transparent", color: v("ink3"),
            fontSize: rem(12.5), fontFamily: FONT_STACK, cursor: "pointer"
          }}>
          <OpsIcon name={rail ? "unfold" : "fold"} size={ICON_SIZE} />
          <span style={rail ? 読み上げだけ : undefined}>
            {rail ? tx("ひらく") : tx("たたむ")}
          </span>
        </button>
      ) : null}
    </nav>
  );
}

export { SIDE_WIDTH, RAIL_WIDTH };
