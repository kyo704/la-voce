"use client";

import { C } from "@/lib/tokens";
import SheepDressed from "@/components/SheepDressed";
import { sheepItemByKey, sheepItemSrc } from "@/lib/sheepItems";
import { DELIVERY_LINES } from "@/lib/wardrobeBoxes";

// ============================================================================
// 記録がたまったときの、よそおい（2026-09-07）
//
//   ★出どころ docs/opus/woolsong-裁定-219点の分け方と、追加38項目の安全性（9月7日・夜）.md §5
//
//   ★★数を、出さないこと。
//     ・「あと13ポイント」「あと◯日」を、★どこにも出しません
//     ・「残り2回」も出しません。★1回ぶんだけ、★静かに出します
//     ★★数が見えると、★その数のほうが、★書きつづける理由になります。
//     ★届くこと自体を、★理由のままにしておきます。
//
//   ★★えらぶものは、★毎回おなじです（★同じ回なら）。
//     ★開き直すたびに変わると、★迷って決められません。
//
//   ★★「あとで」を置きません。
//     ★★閉じる道は、★選ばないこと そのものです。
//       ★押さなければ、★次に開いたときも、★同じ3点が出ます。
//     ★月が変われば、★おまかせで1つ届きます（★呼ぶ側が決めます）。
//
//   ★選べるものは、★必ず押せる形にすること。
//     ★「どれか選んでください」と字で書いて終わり、にしないこと。
// ============================================================================

export default function Box2Gift({ choices = [], onChoose, wearing = {} }) {
  if (!choices.length) return null;

  return (
    <div className="rounded-2xl p-4 border mb-4"
      style={{ background: C.card, borderColor: C.line }}>
      {/* ★羊を、いちばん上に出します。★誰のための ものかが分かります。 */}
      <div className="flex items-center gap-3 mb-2">
        <SheepDressed wearing={wearing} size={56} motion="celebrate" travel={false}
          alt="よろこんでいる羊" />
        <div>
          <h3 className="ff-display italic text-lg" style={{ color: C.ink }}>
            よそおいが届きました
          </h3>
          {/* ★★数を混ぜないこと。★lib の文をそのまま使います。 */}
          <p className="text-xs" style={{ color: C.inkSoft, lineHeight: 1.7 }}>
            {DELIVERY_LINES.record}
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {choices.map((key) => {
          const item = sheepItemByKey(key);
          if (!item) return null;
          return (
            <button key={key} type="button"
              onClick={() => onChoose && onChoose(key)}
              aria-label={`${item.name}を受け取る`}
              style={{
                border: `1px solid ${C.line}`, borderRadius: 12,
                background: C.paper, padding: 8,
                minHeight: 112, display: "flex", flexDirection: "column",
                alignItems: "center", gap: 6, cursor: "pointer"
              }}>
              <img src={sheepItemSrc(item)} alt="" aria-hidden="true"
                style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "contain" }} />
              <span className="text-xs" style={{ color: C.ink, lineHeight: 1.4, textAlign: "center" }}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* ★★急かさないこと。★いま決めなくてよい、と書いておきます。
          ★★ただし「あとで」の押しボタンは置きません。
            ★押さないことが、★そのまま「あとで」だからです。
            ★消える札を作ると、★「押しそこねた」が生まれます。 */}
      <p className="text-xs mt-3" style={{ color: C.inkSoft, lineHeight: 1.7 }}>
        いま決めなくても、この画面は残ります。
      </p>
    </div>
  );
}
