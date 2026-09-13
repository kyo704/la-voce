"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem } from "@/lib/uiKit";
import { H3, Card, Kv, Note, Li } from "@/components/UiV2";
import { USUAL_ROWS, usualOf, writtenDays, histogramOf } from "@/lib/countView";

// ============================================================================
// かぞえる（見本⑭ ／ 2026-09-09）
//
//   ★出どころ docs/opus/woolsong-見本-くらべる・かぞえる（9月9日）.html ⑭
//     「★あなたのふだん・数えるだけ」
//     「★まんなかの値です。★くらべる先は、あなた自身です。
//      　★よその目安は 出しません。」
//
//   ★★数えるだけです。★良し悪しを 言いません。
//   ★★よそと くらべません。★平均も、★目安も、★基準値も 出しません。
//   ★★点数・順位・信号色・％・進捗を、★1つも 出しません。
//
//   ★★11月の 項目は 置きません（★査読 §9-2）。
//     ★週ごとに まとめる／去年の 今ごろ／季節の 1枚
//     ★見本⑭では 灰色で 出ていますが、★押しどころを 先に 出しません。
//
//   ★数と 決めは lib/countView.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/count-view.test.js
// ============================================================================

/** ★単位に あわせて 言葉に します。★数だけを 裸で 出しません。 */
function word(unit, v) {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  if (unit === "hours") {
    const h = Math.floor(v);
    const m = Math.round((v - h) * 60);
    return `${h}時間${String(m).padStart(2, "0")}分`;
  }
  if (unit === "clock") {
    const t = v >= 24 ? v - 24 : v;
    const h = Math.floor(t);
    const m = Math.round((t - h) * 60);
    return `${h}時${String(m).padStart(2, "0")}分`;
  }
  if (unit === "minutes") {
    const h = Math.floor(v / 60);
    const m = Math.round(v % 60);
    return h === 0 ? `${m}分` : `${h}時間${String(m).padStart(2, "0")}分`;
  }
  return String(v);
}

export default function CountV2({ entries, dates, todayISO }) {
  const rows = USUAL_ROWS
    .map((r) => ({ ...r, got: usualOf(entries, dates, r.key, todayISO) }))
    .filter((r) => r.got);
  const written = writtenDays(entries, dates);
  const hist = histogramOf(entries, dates, "dinnerToBed");
  const maxCount = hist ? Math.max(...hist.bars.map((b) => b.count), 1) : 1;

  if (rows.length === 0 && !hist) {
    return (
      <Card>
        <p style={{ ...TYPE.li, color: C.inkSoft, lineHeight: 1.9, margin: 0 }}>
          まだ、数える ものが ありません。<br />
          記録が 10日ぶん たまると、あなたの 普段の 値が 出ます。
        </p>
      </Card>
    );
  }

  return (
    <div>
      {/* ★★あなたの ふだん。★1つも 出せなければ、★枠ごと 出しません。 */}
      {rows.length > 0 || written > 0 ? (
        <>
          <H3>あなたの ふだん</H3>
          <Card>
            {rows.map((r) => (
              <Kv key={r.key} right={word(r.unit, r.got.value)}>{r.label}</Kv>
            ))}
            <Kv right={`${written}日`} last>書いた日</Kv>
          </Card>
          {/* ★★見本⑭の 但し書き。★1文字も 変えないこと。
              ★★これが、★この画面の 芯です。★よそと くらべません。 */}
          <Note style={{ margin: "-1px 0 10px" }}>
            まんなかの値です。くらべる先は、あなた自身です。よその目安は 出しません。
          </Note>
        </>
      ) : null}

      {/* ★★分布（★見本⑭）。★数えるだけです。★多い・少ないを 言いません。 */}
      {hist ? (
        <Card>
          <div style={TYPE.mini}>
            食べ終えてから 寝るまで（{hist.n}日）
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 88, margin: "8px 0 3px" }}>
            {hist.bars.map((b) => (
              <div key={b.label} style={{
                flex: 1, background: C.curtain, borderRadius: "3px 3px 0 0",
                // ★★高さは 数から。★色は 1つ。★段で 変えません。
                height: `${Math.round((b.count / maxCount) * 100)}%`,
                minHeight: b.count > 0 ? 3 : 0
              }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {hist.bars.map((b) => (
              <span key={b.label} style={{ flex: 1, textAlign: "center", fontSize: rem(8.5), color: C.inkSoft }}>
                {b.label}
              </span>
            ))}
          </div>
          <div style={{ ...TYPE.usual, textAlign: "right" }}>時間</div>
        </Card>
      ) : null}

      <H3>詳しく 数える</H3>
      <Card>
        {[
          "本番の 前の 3日だけ",
          "出づらかった日の 普段",
          "曜日ごとの 普段"
        ].map((label, i) => (
          <Li key={label} right={<span style={{ color: C.inkSoft }}>調べる</span>} last={i === 2}>
            {label}
          </Li>
        ))}
      </Card>
      <Note>
        有料のものを <b>隠しません</b>。見せて、押せなくします。押したときだけ 案内へ。<br />
        札は「調べる」の 1語だけ。「PRO」「プレミアム」と 書きません。催促しません。<br />
        ％を 出しません。良い／悪いを 言いません。
      </Note>
    </div>
  );
}
