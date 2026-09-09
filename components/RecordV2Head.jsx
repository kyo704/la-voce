"use client";

import { C } from "@/lib/tokens";
import {
  CONDITION_CHOICES, conditionValue, conditionMark,
  mayUseQuickCondition, readConditionValue, RECORD_FOLDS
} from "@/lib/recordV2";
import { TYPE, SPACE, FONT_STACK, cardStyle } from "@/lib/uiKit";

// ============================================================================
// 「記録」の いちばん上 ── ★A03「2タップで完成」（★design.zip ／ 2026-09-10）
//
//   ★出どころ docs/design/pack/screens/A03-記録2タップで完成.html（★HTML が 正）
//            docs/design/pack/screens/A03-記録2タップで完成.txt（★画面に 出る 文字）
//
//   ★★見本の 並び
//     hd（記録＋保存しました）／ こえの ちょうし ／ 3択 ／
//     折りたたみ 5つ ／ きょうは、書かない
//
//   ★★2タップで 終わります。★3択を1つ 押すと、★その場で 保存されます。
//     ★「きろくする」も「完了」も ありません（★A03 の 注記）。
//     ★★完了が あると、★埋まっていない日が 未完成に なります。
//       ★書かない日を、★失敗に しません。
//
//   ★★但し書きを 画面から 外しました（★2026-09-10）。
//     ★前は「ここでもう保存されています。「完了」はありません。」を 出していました。
//     ★★design.zip の 決め ──「★で始まる行は、画面に出ない、実装への注記です」
//       ★あの文は A03-….notes.md に 書かれた 注記でした。
//       ★★.txt（画面に 出る 文字だけ）にも、★入っていません。
//     ★★注記を 画面に 写していました。★外しました。
//
//   ★★日付を ここから 外しました。
//     ★見本の hd は「記録」と「保存しました」だけです。
//     ★★すぐ 下に 日付の 帯（‹ 9月9日 ›）が 出ており、★消えていません。
//
//   ★★行き先を ここで 決めません。★lib/recordV2.js だけが 決めます。
//   ★★大きさ・間・書体は lib/uiKit.js が 持ちます。★ここで 決めません。
//   ★★数を 出しません。★「4」も「あと◯つ」も 出しません。
//
//   ★見張り components/tests/record-v2.test.js
//         components/tests/a03-kiroku.test.js
// ============================================================================

export default function RecordV2Head({
  entry, onPick, saved, openFold, onToggleFold, onSkip
}) {
  const quick = mayUseQuickCondition(entry);
  const current = readConditionValue(entry);

  return (
    <div style={{ fontFamily: FONT_STACK }}>

      {/* ★★見本 .hd。★題と、★保存の 知らせ。
          ★★「保存しました」は 押しどころでは ありません。★緑です。
            ★えんじは 押しどころの 色なので、★押せると 読めてしまいます。 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 1px 6px"
      }}>
        <h2 style={TYPE.title}>記録</h2>
        {saved ? (
          <span style={{ fontSize: 11.5, color: C.sage }}>保存しました</span>
        ) : null}
      </div>

      {/* ★★こえの ちょうし（★見本 .h3）。
          ★★A01 は「こえの調子」、★A03 は「こえの ちょうし」です。
            ★見本の 中で 揺れていますが、★画面ごとの HTML に 従います。
            ★★どちらかに 寄せると、★寄せた ほうが 見本と ずれます。 */}
      <p style={{ ...TYPE.h3, margin: `${SPACE.h3Top}px 0 ${SPACE.h3Bottom}px` }}>
        こえの ちょうし
      </p>

      {quick ? (
        // ★★カード 3枚（★見本 .two ── gap 7 ／ 下に 12）。
        <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
          {CONDITION_CHOICES.map((w) => {
            const on = current != null && conditionValue(w) === current;
            return (
              <button key={w} type="button" onClick={() => onPick(w)}
                aria-pressed={on}
                style={{
                  ...cardStyle,
                  flex: 1, minWidth: 0,
                  padding: "16px 6px",
                  textAlign: "center",
                  // ★★選ばれた 印は、★2px の 枠です。★色は その 上の 念押しです。
                  //   ★★形（◎○△）と 枠と 太さで 分かります。
                  //     ★色だけに 意味を 持たせていません。
                  border: on ? `2px solid ${C.curtain}` : cardStyle.border,
                  fontFamily: FONT_STACK
                }}>
                <span aria-hidden="true" style={{
                  display: "block", fontSize: 30, lineHeight: 1,
                  color: on ? C.curtain : C.ink
                }}>
                  {conditionMark(w)}
                </span>
                <span style={{
                  display: "block", fontSize: 12, marginTop: 5,
                  color: on ? C.curtain : C.ink,
                  fontWeight: on ? 700 : 400
                }}>{w}</span>
              </button>
            );
          })}
        </div>
      ) : (
        // ★★場面ごとに もう 書いてある日です。★3択を 出しません。
        //   ★出すと、★書いてあるものを 1つの答えで 上書きしてしまいます。
        //   ★★この姿は 見本に ありません。★見本が 描いていない 日の ことです。
        <div style={{ ...cardStyle, marginBottom: 12 }}>
          <p style={{ ...TYPE.body, margin: 0 }}>
            きょうは、場面ごとに 書いてくださっています。
          </p>
          <p style={{ ...TYPE.usual, margin: "6px 0 0" }}>
            直すときは、下の「声・のど」から どうぞ。
          </p>
        </div>
      )}

      {/* ★★折りたたみ 5つ（★見本の .card ＋ .li）。
          ★★開いた時点で 並んでいます＝0タップ。★タブを 増やしません。
          ★★1つずつ 開きます。★開くと、ほかは 閉じます。
            ★2つ開くと、★下まで 見に行くことに なります。
          ★★中身が どこに あるかは lib/recordV2.js が 持ちます。
            ★節そのものは 動かしていません。★出し分けているだけです。
          ★★開いた 姿は 見本に ありません（★見本は 5つとも 閉じています）。
            ★印を「＋」から「−」に 変え、★枠を 濃くするだけに しています。 */}
      {RECORD_FOLDS.map((f) => {
        const on = openFold === f.key;
        return (
          <button key={f.key} type="button" onClick={() => onToggleFold(f.key)}
            aria-expanded={on}
            style={{
              ...cardStyle,
              display: "block", width: "100%", textAlign: "left",
              marginBottom: SPACE.cardGap,
              border: on ? `1px solid ${C.ink}` : cardStyle.border,
              fontFamily: FONT_STACK
            }}>
            {/* ★★見本 .li ── ★上下 9px、★13px、★右に「›」。 */}
            <span style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 0", ...TYPE.li
            }}>
              <span>{on ? "−" : "＋"} {f.label}</span>
              <span style={{ color: C.inkSoft, fontSize: 11.5 }}>{on ? "﹀" : "›"}</span>
            </span>
          </button>
        );
      })}

      {/* ★★「きょうは、書かない」（★見本 ── 中央・12px・上に 14）。
          ★★出口の ない画面を 作らないこと。★答えられない日が あります。
          ★★とばした数を 数えません。★「未入力」も「完了度」も 出しません。
          ★★見本の 色は --ink3 ですが、★小さい字には 使いません
            （★2026-09-10・坂本さんの お決め）。★ink2 に します。 */}
      <div style={{ marginTop: SPACE.h3Top, textAlign: "center" }}>
        <button type="button" onClick={onSkip}
          style={{
            minHeight: SPACE.tapMin, padding: "0 16px",
            border: "none", background: "transparent",
            color: C.inkSoft, fontSize: 12, fontFamily: FONT_STACK
          }}>
          きょうは、書かない
        </button>
      </div>
    </div>
  );
}
