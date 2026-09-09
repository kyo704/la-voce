"use client";

import { C } from "@/lib/tokens";
import SheepDressed from "@/components/SheepDressed";
import { conditionWord, sleepWord, usualOf } from "@/lib/todayCard";

// ============================================================================
// 「きょう」の画面（見本① ／ 2026-09-09）
//
//   ★出どころ Woolsong 画面の見本（2026年9月9日）① きょう／生徒
//
//   ★★見本の 決まり
//     ★グラフを 1つも 置きません。
//     ★点数を 出しません（★69/100 も 4.0/5 も 出しません）。
//     ★出すのは「きょうの ことば」と「あなたの ふだん」だけです。
//     ★★該当が なければ、★その行を 出しません。★空の枠を 置きません。
//
//   ★★名簿に 載っている方にだけ 出します（★lib/layoutV2.js）。
//     ★一般の 38人には、★これまでの ホームが 出ます。★1つも 変えません。
//
//   ★★数と 言葉は lib/todayCard.js が 持ちます。★ここで 決めません。
//
//   ★見張り components/tests/home-v2.test.js
// ============================================================================

export default function HomeV2({
  entries, todayISO, wearing, clothColors, clothColors2,
  hitokoto, todayLessons, upcoming, onRecord, onOpenMore, children
}) {
  const today = (entries || {})[todayISO] || null;
  const cond = today ? conditionWord(today.throatCondition) : null;
  const condUsual = conditionWord(usualOf(entries, todayISO, (e) => e && e.throatCondition));
  const sleep = today ? sleepWord(today.sleepHours) : null;
  const sleepUsual = sleepWord(usualOf(entries, todayISO, (e) => e && e.sleepHours));

  const card = {
    background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14
  };
  const small = { fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.6 };

  return (
    <div className="space-y-3">
      {/* ★★見出しと 歯車。★歯車は「もっと」へ 行きます。
          ★★同意の撤回と 書き出しは、★法で 求められる 道です。★塞ぎません。 */}
      <div className="flex items-center justify-between">
        <h2 className="ff-display italic" style={{ fontSize: "1.5rem", color: C.ink }}>きょう</h2>
        <button type="button" onClick={onOpenMore} aria-label="もっとを開く"
          style={{
            minWidth: 40, minHeight: 40, borderRadius: 999,
            border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft
          }}>⚙</button>
      </div>

      {/* ★★羊。★見本では、★部屋を 出しません。★羊だけです。 */}
      <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
        <SheepDressed wearing={wearing || {}} colors={clothColors || {}} colors2={clothColors2 || {}}
          size={180} motion="still" blink alt="羊" />
      </div>

      {/* ★★ひとこと。★1日じゅう 変わりません（★台詞集 §3-3）。 */}
      {hitokoto ? (
        <div style={card}>
          <p style={{ fontSize: "0.875rem", color: C.ink, lineHeight: 1.8, margin: 0 }}>{hitokoto}</p>
        </div>
      ) : null}

      {/* ★★きょうの 予定。★無ければ 出しません。 */}
      {(todayLessons || []).length > 0 && (
        <div style={card}>
          <p style={{ ...small, marginBottom: 4 }}>きょう</p>
          {todayLessons.map((l) => (
            <p key={l.id} style={{ fontSize: "0.875rem", color: C.ink, margin: "2px 0" }}>
              {l.time}　{l.label}
            </p>
          ))}
        </div>
      )}

      {/* ★★この先の 予定。★本番など。★無ければ 出しません。 */}
      {(upcoming || []).map((u) => (
        <div key={u.id} style={card}>
          <p style={{ ...small, marginBottom: 4, color: C.curtain }}>{u.dateLabel}</p>
          <div className="flex items-center gap-2">
            <p style={{ fontSize: "0.875rem", color: C.ink, margin: 0 }}>{u.label}</p>
            {u.badge ? (
              <span style={{
                fontSize: "0.625rem", color: "#FFFDF8", background: C.curtain,
                borderRadius: 999, padding: "2px 8px"
              }}>{u.badge}</span>
            ) : null}
          </div>
        </div>
      ))}

      {/* ★★こえの調子 と ねむり。★2つ 並べます。
          ★★点数を 出しません。★言葉と、★あなたの ふだん だけです。
          ★★足りなければ、★黙って 空けます。「データ不足」と 書きません。 */}
      {(cond || sleep) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={card}>
            <p style={small}>こえの調子</p>
            <p className="ff-display" style={{ fontSize: "1.375rem", color: C.ink, margin: "2px 0" }}>
              {cond || "—"}
            </p>
            {condUsual ? <p style={small}>あなたのふだん　{condUsual}</p> : null}
          </div>
          <div style={card}>
            <p style={small}>ねむり</p>
            <p className="ff-display" style={{ fontSize: "1.375rem", color: C.ink, margin: "2px 0" }}>
              {sleep || "—"}
            </p>
            {sleepUsual ? <p style={small}>あなたのふだん　{sleepUsual}</p> : null}
          </div>
        </div>
      )}

      {/* ★★記録へ。★見本では、いちばん大きい 押しどころです。 */}
      <button type="button" onClick={onRecord}
        className="w-full"
        style={{
          minHeight: 52, borderRadius: 10,
          border: `1px solid ${C.curtain}`, borderBottomWidth: 3,
          background: C.curtain, color: "#FFFDF8",
          fontSize: "1rem", fontWeight: 600
        }}>
        きょうを 記録する
      </button>

      {/* ★★みつけたこと。★呼ぶ側が 入れます。 */}
      {children}
    </div>
  );
}
