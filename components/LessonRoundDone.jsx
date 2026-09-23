"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import {
  DONE_REACH, DONE_NOTE, DONE_AFTER, DONE_AFTER_HOW,
  confirmLines, canConfirm, placedCount
} from "@/lib/lessonRound";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★確定して 配る ── ★見本 `P_wariDone`
//
//   ★出どころ woolsong-2026-09-21_7.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 29e1d658）
//     ★2026-09-23 に 展開・docs/design/pack-final/ に 反映。
//
//   ★★★芯は 1つ です ── ★「置けていない 方が いても、★確定できます」。
//     ★★人数で 止めません。★止めると、★1人の ために 皆が 待ちます。
//
//   ★★★「お知らせは 送りません。★学生が 開いた ときに 見えます。」
//     ★催促しない（★変えない原則）。★押し出しを 作りません。
//
//   ★★カレンダーの 住所は **出しません**。★1人ずつ ちがう もの です。
//     ★★ここは 先生の 画面 です。★他人の 住所を 置く ところでは ありません。
//
//   ★見張り components/tests/lesson-round-done.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };
const 札 = {
  background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
  padding: rem(12), flex: 1, minWidth: 260
};

function 行({ label, value }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: `${rem(6)} 0`, ...TYPE.li
    }}>
      <span style={{ color: C.inkSoft }}>{label}</span>
      <span style={{ color: C.ink }}>{value}</span>
    </div>
  );
}

export default function LessonRoundDone({
  round, total = 0, placed = {}, notPlaced = [], onPlace, onConfirm, busy = false
}) {
  if (!round) return null;
  const 数 = placedCount(placed, total);
  const 出せる = canConfirm(round);

  return (
    <div>
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(4)}` }}>
        {tx("確定して 配る")}
      </h2>
      <div style={{ ...小, marginBottom: rem(10) }}>{round.name}</div>

      <div style={{ display: "flex", gap: rem(12), alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={札}>
          <行 label={tx("置いた方")} value={`${数.placed} / ${数.total}` + tx("人")} />
          <行 label={tx("期間")} value={`${round.period_from}〜${round.period_to}`} />
          <行 label={tx("届く ところ")} value={tx(DONE_REACH)} />
        </div>

        <div style={札}>
          <h3 style={{ ...TYPE.h3, marginTop: 0 }}>
            {tx("置けていない方")}　{数.left}{tx("人")}
          </h3>
          {notPlaced.length === 0 ? (
            <div style={小}>{tx("いません")}</div>
          ) : notPlaced.map((x) => (
            <div key={x.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: `${rem(4)} 0`, ...TYPE.li
            }}>
              <span>{x.name}</span>
              {出せる ? (
                <button type="button" onClick={() => onPlace && onPlace(x.id)}
                  style={{
                    minHeight: 44, padding: `0 ${rem(11)}`, borderRadius: 999,
                    border: `1px solid ${C.line}`, background: C.card,
                    color: C.curtain, fontFamily: FONT_STACK, ...TYPE.usual
                  }}>{tx("置く")}</button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {!出せる ? (
        <div style={{
          background: C.band, border: `1px solid ${C.line3}`, borderRadius: 12,
          padding: rem(12), marginTop: rem(12), ...TYPE.li
        }}>
          <div>{tx(DONE_AFTER)}</div>
          <div style={{ ...小, marginTop: rem(4) }}>{tx(DONE_AFTER_HOW)}</div>
          {/* ★★★住所そのものは 出しません。★1人ずつ ちがう もの です。 */}
        </div>
      ) : (
        <div style={{ marginTop: rem(12) }}>
          {/* ★★★確定の 前に、★何が 起きるかを 3行で お見せします（★見本の askShow）。 */}
          <div style={{ ...小, marginBottom: rem(8) }}>
            {confirmLines(数.placed).map((l) => (
              <span key={l} style={{ display: "block" }}>{tx(l)}</span>
            ))}
          </div>
          <button type="button" onClick={onConfirm} disabled={busy}
            style={{
              width: "100%", minHeight: 44, borderRadius: 13, padding: `${rem(14)} 0`,
              background: C.curtain, color: C.onCurtain, border: "none",
              fontFamily: FONT_STACK, fontWeight: 700, opacity: busy ? 0.5 : 1, ...TYPE.body
            }}>{tx("確定して 配る")}</button>
        </div>
      )}

      <div style={{ ...小, marginTop: rem(12) }}>
        {DONE_NOTE.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
