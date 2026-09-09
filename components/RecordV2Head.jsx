"use client";

import { C } from "@/lib/tokens";
import { CONDITION_CHOICES, conditionValue, mayUseQuickCondition, readConditionValue } from "@/lib/recordV2";

// ============================================================================
// 「記録」の いちばん上（見本③ ／ 2026-09-09）
//
//   ★出どころ Woolsong 画面の見本（2026年9月9日）③ 記録／生徒
//
//   ★★2タップで 終わります。★3択を1つ、★「きろくする」を1つ。
//     ★下の いつもの 欄は、★そのまま 残っています。★消していません。
//
//   ★★行き先を ここで 決めません。★lib/recordV2.js だけが 決めます。
//
//   ★★数を 出しません。★「4」も「あと◯つ」も 出しません。
//
//   ★見張り components/tests/record-v2.test.js
// ============================================================================

export default function RecordV2Head({ entry, dateLabel, onPick, onSave, saving }) {
  const quick = mayUseQuickCondition(entry);
  const current = readConditionValue(entry);

  return (
    <div className="space-y-3">
      <p style={{ fontSize: "0.6875rem", color: C.inkSoft }}>{dateLabel}</p>

      {/* ★★こえのちょうし。★これ1つで、★その日の記録が 成り立ちます。 */}
      {quick ? (
        <div style={{
          background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14
        }}>
          <p style={{ fontSize: "0.875rem", color: C.ink, marginBottom: 10 }}>きょうの こえは</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {CONDITION_CHOICES.map((w) => {
              const on = current != null && conditionValue(w) === current;
              return (
                <button key={w} type="button" onClick={() => onPick(w)}
                  aria-pressed={on}
                  style={{
                    minHeight: 56, borderRadius: 10,
                    border: `1px solid ${on ? C.ink : C.line}`,
                    borderBottomWidth: on ? 3 : 1,
                    background: on ? C.paper : C.card,
                    color: C.ink, fontSize: "0.9375rem"
                  }}>{w}</button>
              );
            })}
          </div>
        </div>
      ) : (
        // ★★場面ごとに もう 書いてある日です。★3択を 出しません。
        //   ★出すと、★書いてあるものを 1つの答えで 上書きしてしまいます。
        <div style={{
          background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14
        }}>
          <p style={{ fontSize: "0.875rem", color: C.ink, margin: 0 }}>
            きょうは、場面ごとに 書いてくださっています。
          </p>
          <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "6px 0 0" }}>
            直すときは、下の「声・のど」から どうぞ。
          </p>
        </div>
      )}

      {/* ★★きろくする。★いつでも 押せます。★3択を 選ばなくても 押せます。
          ★★止めません。★止めると、★その日の記録が まるごと 消えます。 */}
      <button type="button" onClick={onSave} disabled={saving}
        className="w-full"
        style={{
          minHeight: 52, borderRadius: 10,
          border: `1px solid ${C.curtain}`, borderBottomWidth: 3,
          background: saving ? C.line : C.curtain, color: "#FFFDF8",
          fontSize: "1rem", fontWeight: 600
        }}>
        {saving ? "きろく中" : "きろくする"}
      </button>
    </div>
  );
}
