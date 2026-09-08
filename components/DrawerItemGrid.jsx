"use client";

import { C } from "@/lib/tokens";
import { SIZES } from "@/lib/homeDrawer";

// ============================================================================
// 引き出しの中の、品物の一覧（2026-09-08）
//
//   ★出どころ 仕様 §3-2「★4列」・§6
//
//   ★★これまで、★品物を並べるところが★3か所にありました。
//     ★着せかえ／内装／古いお店。★同じ決めが3つに分かれていました。
//   ★★ここ1つにします。★何を並べるかは lib/drawerItems.js が決めます。
//
//   ★★数を、書きません（★「54点」と出さないこと）。
//   ★★選んでいるものは、★色だけでなく★わくの太さでも示します。
//   ★★持っていないものは、★隠しません。★薄くして、★そう書きます（★試着・§9）。
//
//   ★見張り components/tests/home-drawer.test.js
// ============================================================================

export default function DrawerItemGrid({
  items, srcOf, isOn, isOwned, onTap, emptyText, renderThumb
}) {
  const list = Array.isArray(items) ? items : [];

  if (list.length === 0) {
    // ★★黙って空にしません。★何を押せば戻れるかを、書きます。
    return (
      <p className="text-xs" style={{ color: C.inkSoft, lineHeight: 1.8, padding: "8px 2px" }}>
        {emptyText || "ここには、まだ ありません。「ぜんぶ」を押すと、戻ります。"}
      </p>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${SIZES.gridColumns}, 1fr)`,
      gap: 8
    }}>
      {list.map((it) => {
        const on = isOn ? isOn(it) : false;
        const owned = isOwned ? isOwned(it) : true;
        return (
          <button key={it.key} type="button"
            onClick={() => onTap && onTap(it)}
            aria-pressed={on}
            title={it.name}
            style={{
              minHeight: SIZES.cellPx,
              // ★★丸いピル型にしません（★§7-2「形」）。
              //   ★桐たんすの引き出しの前板に寄せます。★角は小さめ、★下に木の線。
              borderRadius: 6,
              border: `1px solid ${on ? C.curtain : C.line}`,
              borderBottomWidth: on ? 3 : 2,
              background: on ? C.paper : C.card,
              padding: 4,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 3,
              position: "relative",
              // ★★隠しません。★薄くして、★見えるようにします（★試着・§9）。
              opacity: owned ? 1 : 0.62
            }}>
            {renderThumb
              ? renderThumb(it)
              : (srcOf && srcOf(it)
                ? <img src={srcOf(it)} alt="" aria-hidden="true"
                    style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "contain" }} />
                : null)}
            <span style={{
              fontSize: "0.625rem", color: C.inkSoft, lineHeight: 1.3,
              textAlign: "center", overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
            }}>
              {it.name}
            </span>
            {/* ★★選んでいるしるし。★色だけにしないこと。 */}
            {on && (
              <span aria-hidden="true" style={{
                position: "absolute", right: 4, bottom: 4,
                width: 8, height: 8, borderRadius: 999, background: C.curtain
              }} />
            )}
            {/* ★★持っていないもの。★隠さず、★そう書きます。 */}
            {!owned && (
              <span style={{ fontSize: "0.5625rem", color: C.inkSoft }}>まだ</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
