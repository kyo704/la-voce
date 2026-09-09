"use client";

import { C } from "@/lib/tokens";
import { CONDITION_CHOICES, conditionValue, mayUseQuickCondition, readConditionValue, RECORD_FOLDS } from "@/lib/recordV2";

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

export default function RecordV2Head({
  entry, dateLabel, onPick, saved, openFold, onToggleFold, onSkip
}) {
  const quick = mayUseQuickCondition(entry);
  const current = readConditionValue(entry);

  return (
    <div className="space-y-3">
      {/* ★★見本③の 右上。★「保存しました」。★押しどころでは ありません。 */}
      <div className="flex items-center justify-between">
        <p style={{ fontSize: "0.6875rem", color: C.inkSoft }}>{dateLabel}</p>
        {saved ? (
          <p style={{ fontSize: "0.6875rem", color: C.curtain }}>保存しました</p>
        ) : null}
      </div>

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

      {/* ★★見本③の 但し書き。★「完了」を 作りません。
          ★★完了があると、★埋まっていない日が 未完成に なります。
            ★書かない日を、★失敗に しません。 */}
      <p style={{ fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.7 }}>
        ここでもう保存されています。「完了」はありません。<br />
        この先は、足したい人だけ。
      </p>

      {/* ★★折りたたみ 5つ（★見本③）。★開いた時点で 並んでいます＝0タップ。
          ★★1つずつ 開きます。★開くと、ほかは 閉じます。
          ★★中身が どこに あるかは lib/recordV2.js が 持ちます。
            ★節そのものは 動かしていません。★出し分けているだけです。 */}
      <div className="space-y-2">
        {RECORD_FOLDS.map((f) => {
          const on = openFold === f.key;
          return (
            <button key={f.key} type="button" onClick={() => onToggleFold(f.key)}
              aria-expanded={on}
              className="w-full flex items-center justify-between"
              style={{
                minHeight: 52, borderRadius: 12, padding: "0 14px",
                border: `1px solid ${on ? C.ink : C.line}`,
                background: on ? C.paper : C.card,
                color: C.ink, fontSize: "0.9375rem"
              }}>
              <span>{on ? "−" : "＋"}　{f.label}</span>
              <span style={{ color: C.inkSoft }}>{on ? "﹀" : "›"}</span>
            </button>
          );
        })}
      </div>

      {/* ★★「きょうは、書かない」（★見本③）。
          ★★出口の ない画面を 作らないこと。★答えられない日が あります。
          ★★とばした数を 数えません。★「未入力」も「完了度」も 出しません。 */}
      <button type="button" onClick={onSkip}
        className="w-full"
        style={{
          minHeight: 44, border: "none", background: "transparent",
          color: C.inkSoft, fontSize: "0.8125rem"
        }}>
        きょうは、書かない
      </button>
    </div>
  );
}
