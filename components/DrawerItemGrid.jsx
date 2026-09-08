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
  items, srcOf, isOn, isOwned, onTap, emptyText, renderThumb,
  // ★★いま えらんでいる品（★2026-09-08・2段階）。
  //   ★「着ている」とは、★別のしるしです。★混ぜないこと。
  isPicked
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
      gap: SIZES.gridGapPx
    }}>
      {list.map((it) => {
        const on = isOn ? isOn(it) : false;
        const owned = isOwned ? isOwned(it) : true;
        const picked = isPicked ? isPicked(it) : false;
        return (
          <button key={it.key} type="button"
            onClick={() => onTap && onTap(it)}
            aria-pressed={on}
            title={it.name}
            // ★★見本には、★字がありません。★絵だけです。
            //   ★★字を付けると、★1つが2行ぶん高くなり、★3段目が見えません。
            //     ★実機で「大きすぎる」とご指摘をいただきました。★そのとおりです。
            //   ★★読み上げには、★名前を残します。★見た目から消しても、意味は消しません。
            aria-label={it.name}
            style={{
              // ★★四角にします。★字のぶんの高さを、足しません。
              aspectRatio: "1 / 1",
              // ★★丸いピル型にしません（★§7-2「形」）。
              //   ★桐たんすの引き出しの前板に寄せます。★角は小さめ、★下に木の線。
              borderRadius: 6,
              // ★★えらんでいる品は、★わくを太くします（★見本③の 濃い枠）。
              //   ★★着ている品とは、★別のしるしです。
              //     ★着ている … 右下に ●
              //     ★えらんでいる … わくが太い
              border: `${picked ? 2 : 1}px solid ${picked ? C.ink : (on ? C.curtain : C.line)}`,
              borderBottomWidth: picked ? 3 : (on ? 2 : 1),
              background: on ? C.paper : C.card,
              padding: 3,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              position: "relative",
              // ★★隠しません。★薄くして、★見えるようにします（★試着・§9）。
              opacity: owned ? 1 : 0.62
            }}>
            {renderThumb
              ? renderThumb(it)
              : (srcOf && srcOf(it)
                ? <img src={srcOf(it)} alt="" aria-hidden="true"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                : null)}
            {/* ★★選んでいるしるし。★色だけにしないこと。 */}
            {on && (
              <span aria-hidden="true" style={{
                position: "absolute", right: 3, bottom: 3,
                width: 7, height: 7, borderRadius: 999, background: C.curtain
              }} />
            )}
            {/* ★★持っていないもの。★隠さず、★しるしを出します。
                ★★字を1行足すと、★1つが高くなります。★角に小さく置きます。 */}
            {!owned && (
              <span aria-hidden="true" style={{
                position: "absolute", left: 3, top: 3,
                fontSize: "0.5rem", color: C.inkSoft, lineHeight: 1
              }}>まだ</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
