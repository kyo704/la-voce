// ============================================================================
// ★吹き出しが 見切れて いないか（★2026-09-14・坂本さんの ご指摘 ⑤）
//
//   ★「カメラが 寄って いる とき、★セリフが 見切れる」
//
//   ★★測る のは 2つ です。
//     ① 吹き出しが、★部屋の 箱から どれだけ はみ出して いるか（★px）
//     ② ★カメラの 倍率。★寄ると、★吹き出しも 一緒に 大きく なります
//        （★吹き出しは カメラの **中** に 居ます）
//
//   ★★大事な こと。
//     ★吹き出しの 幅は `lib/sheepSpeech.js` の `maxWidthPx` ── ★px 固定 です。
//     ★★カメラが z 倍に 寄ると、★見かけの 幅は maxWidthPx × z に なります。
//       ★★箱の 幅は 変わりません。★だから 寄るほど はみ出します。
//
//   ★使い方（★ブラウザの コンソール）
//     ① ひつじ の 画面で、★吹き出しが 出るまで 待つ
//     ② この ファイルの 中身を 貼って diagnoseBubble()
// ============================================================================

function diagnoseBubble() {
  const bubble = document.querySelector('[aria-live="polite"]');
  const room = document.getElementById("room-anchor");
  if (!bubble || !room) {
    console.log("★見つかりません", { 吹き出し: !!bubble, 部屋: !!room });
    return null;
  }
  const b = bubble.getBoundingClientRect();
  const c = room.getBoundingClientRect();

  // ★★カメラの 倍率。★吹き出しは カメラの 中に 居ます。
  let zoom = 1;
  const cam = [...room.querySelectorAll("div")].find((d) => {
    const s = getComputedStyle(d);
    return s.transform && s.transform !== "none" && s.transitionProperty.includes("transform");
  });
  if (cam) {
    const m = new DOMMatrix(getComputedStyle(cam).transform);
    zoom = m.a;
  }

  const inner = bubble.firstElementChild;
  const ib = inner ? inner.getBoundingClientRect() : b;

  const over = {
    上: Math.round(c.top - ib.top),
    下: Math.round(ib.bottom - c.bottom),
    左: Math.round(c.left - ib.left),
    右: Math.round(ib.right - c.right)
  };
  const clipped = Object.values(over).some((v) => v > 0);

  console.log("★吹き出しの 見切れ", {
    "★見切れて いるか": clipped,
    "はみ出し(px)": over,
    "★カメラの 倍率": Math.round(zoom * 100) / 100,
    "字の 大きさ": getComputedStyle(inner || bubble).fontSize,
    "★見かけの 字": Math.round(parseFloat(getComputedStyle(inner || bubble).fontSize) * zoom * 10) / 10,
    "吹き出しの 幅": Math.round(ib.width),
    "部屋の 幅": Math.round(c.width),
    文: (bubble.textContent || "").slice(0, 30)
  });
  if (clipped) {
    const side = Object.entries(over).filter(([, v]) => v > 0)
      .map(([k, v]) => k + " " + v + "px").join(" / ");
    console.warn("  ★はみ出して いる ところ: " + side);
  }
  return { clipped, over, zoom };
}

if (typeof module !== "undefined") { module.exports = { diagnoseBubble }; }
