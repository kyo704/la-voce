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
  // ★★小さい絵が 無いときの、★戻り先（★2026-09-08 夜）。
  //   ★★渡されなければ、★戻しません。★出ないまま にはしません。
  fallbackSrcOf,
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
    /* ★★1マスは 72×72 で 固定です（★2026-09-08 夕・Opus の決め）。
        ★★機種で 変えません。★変えるのは 列の数だけです（auto-fill）。
          ★もとは「4列を 幅で割る」形で、★機種ごとに 大きさが 変わっていました。
        ★★横に広い画面では、★664px で止めて、まん中へ寄せます。
        ★数は lib が持ちます。★ここで書かないこと。 */
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(auto-fill, ${SIZES.cellPx}px)`,
      gap: SIZES.gridGapPx,
      justifyContent: "center",
      maxWidth: SIZES.gridMaxWidthPx,
      margin: "0 auto",
      maxHeight: SIZES.gridMaxHeightPx,
      overflowY: "auto"
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
              // ★★72×72 で 固定です。★機種で 変えません。
              width: SIZES.cellPx, height: SIZES.cellPx,
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
              // ★★1マスから、★はみ出させません（★2026-09-08 夜のご報告）。
              //   ★★パソコンと iPad で、★帽子や首元の絵が
              //     ★1マスの外へ はみ出す、と ご報告をいただきました。
              //   ★★縦に並べる flex の 中では、★絵の「これ以上 縮まない下限」が
              //     ★もとの絵の大きさ（1024px）に なることが あります。
              //     ★height:100% を 書いても、★下限のほうが 勝ちます。
              //   ★★だから 2つ入れます。
              //     ① 絵に minWidth:0 / minHeight:0（★下限を 外す）
              //     ② 1マスに overflow:hidden（★何があっても 外に出さない）
              boxSizing: "border-box",
              overflow: "hidden",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              position: "relative",
              // ★★隠しません。★薄くして、★見えるようにします（★試着・§9）。
              // ★★まだの品は、★うすく 出します（★v3追補 ②・不透明度 45%）。
              //   ★★隠しません。★錠前も 出しません。
              //   ★★「あと◆てん」を 書かないこと。★足りないときは、
              //     ★下のボタンが 押せない灰色に なるだけです。
              opacity: owned ? 1 : 0.45
            }}>
            {renderThumb
              ? renderThumb(it)
              : (srcOf && srcOf(it)
                ? <img src={srcOf(it)} alt="" aria-hidden="true"
                    // ★★小さい絵が 無ければ、★もとの絵に 戻します。
                    //   ★1度だけです。★戻した絵も 無ければ、そこで やめます。
                    onError={(e) => {
                      const alt = fallbackSrcOf && fallbackSrcOf(it);
                      if (alt && e.currentTarget.src !== alt && !e.currentTarget.dataset.fell) {
                        e.currentTarget.dataset.fell = "1";
                        e.currentTarget.src = alt;
                      }
                    }}
                    // ★★見えているものだけ 読み込みます（★2026-09-08 夜）。
                    //   ★★きるもの166点／おくもの111点／かべとゆか138点を、
                    //     ★これまで 一度に ぜんぶ 読んでいました。
                    //   ★★引き出しを いつも置く形に したので、
                    //     ★これが 無いと、★おうち画面を開いた瞬間に ぜんぶ読みます。
                    loading="lazy" decoding="async"
                    style={{
                      width: "100%", height: "100%", objectFit: "contain",
                      // ★★縮まない下限を、外します（★上の説明のとおり）。
                      minWidth: 0, minHeight: 0,
                      maxWidth: "100%", maxHeight: "100%"
                    }} />
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
