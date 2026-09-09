"use client";

import { C } from "@/lib/tokens";
import { USUAL_ROWS, usualOf, writtenDays, histogramOf, marksPerWeek } from "@/lib/countView";

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

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 };
const small = { fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.8 };

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
  const marks = marksPerWeek(entries, dates);
  const maxCount = hist ? Math.max(...hist.bars.map((b) => b.count), 1) : 1;

  return (
    <div className="space-y-3">
      {/* ★★あなたの ふだん。★1つも 出せなければ、★枠ごと 出しません。 */}
      {rows.length > 0 || written > 0 ? (
        <>
          <p style={{ ...small, letterSpacing: "0.08em" }}>あなたの ふだん</p>
          <div style={card}>
            {rows.map((r) => (
              <div key={r.key} className="flex items-center justify-between"
                style={{ padding: "9px 0", borderBottom: `1px solid ${C.line}`, fontSize: "0.8125rem" }}>
                <span style={{ color: C.ink }}>{r.label}</span>
                <span style={{ color: C.ink }}>{word(r.unit, r.got.value)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between"
              style={{ padding: "9px 0", fontSize: "0.8125rem" }}>
              <span style={{ color: C.ink }}>書いた 日</span>
              <span style={{ color: C.ink }}>{written}日</span>
            </div>
          </div>
          {/* ★★見本⑭の 但し書き。★1文字も 変えないこと。
              ★★これが、★この画面の 芯です。★よそと くらべません。 */}
          <p style={small}>
            まんなかの値です。くらべる先は、あなた自身です。よその目安は 出しません。
          </p>
        </>
      ) : null}

      {/* ★★分布（★見本⑭）。★数えるだけです。★多い・少ないを 言いません。 */}
      {hist ? (
        <div style={card}>
          <p style={{ fontSize: "0.8125rem", color: C.ink, marginBottom: 8 }}>
            食べ終えてから 寝るまで（{hist.n}日）
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 88 }}>
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
              <span key={b.label} style={{ flex: 1, textAlign: "center", fontSize: "0.53rem", color: C.inkSoft }}>
                {b.label}
              </span>
            ))}
          </div>
          <p style={{ ...small, textAlign: "right" }}>時間</p>
        </div>
      ) : null}

      {/* ★★印の 1週間あたり（★見本⑭）。★7日に 満たなければ 出しません。 */}
      {marks ? (
        <div style={card}>
          <p style={{ fontSize: "0.8125rem", color: C.ink, marginBottom: 4 }}>印の 1週間あたり</p>
          {marks.rows.map((r) => (
            <div key={r.key} className="flex items-center justify-between"
              style={{ padding: "8px 0", borderTop: `1px solid ${C.line}`, fontSize: "0.8125rem" }}>
              <span style={{ color: C.ink }}>{r.label}</span>
              <span style={{ color: C.ink }}>{r.perWeek}回</span>
            </div>
          ))}
        </div>
      ) : null}

      {/* ★★何も 出せない期間。★空の枠を 置かず、★何が あれば 出るかだけ 置きます。
          ★★「データ不足」と 書きません。★足りないことを 責めに しません。 */}
      {rows.length === 0 && !hist && !marks ? (
        <div style={card}>
          <p style={{ fontSize: "0.8125rem", color: C.inkSoft, lineHeight: 1.9 }}>
            この期間に、数えられる記録がまだありません。
          </p>
        </div>
      ) : null}
    </div>
  );
}
