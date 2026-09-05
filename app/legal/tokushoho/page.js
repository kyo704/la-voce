import { C } from "@/lib/tokens";

// ============================================================================
// 特定商取引法に基づく表記（tokushoho-ja-2026-09-v1）
//
//   ★★この本文を、ここで直接書き換えないでください。
//     ★正は docs/legal/tokushoho-ja-2026-09-v1.md です。
//     ★あちらを直してから、こちらへ写します。
//     ★ここだけ直すと、★どちらが本当かが分からなくなります。
//     ★（components/tests/legal-copy-matches-source.test.js が見ています）
//
//   ★★まだ公開の判断が済んでいません。
//     □ 所在地を「請求があれば遅滞なく開示」で通してよいか（★弁護士の確認）
//     □ 制定日を入れること
//   ★画面としては出来ています。★上の2つが済んだら、そのまま出せます。
//
//   ★値段の正は docs/opus/lavoce-価格と課金の正（9月4日・確定）です。
//   ★返金の約束は lib/minorBilling.js の REFUND_PROMISE と同じ文です。
// ============================================================================

export default function TokushohoPage() {
  const hr = { border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" };
  const h2 = { fontWeight: 600, marginTop: 28, marginBottom: 8 };
  const list = {
    margin: "10px 0 18px", paddingLeft: 14, borderLeft: `2px solid ${C.line}`
  };
  const li = { margin: "2px 0", whiteSpace: "pre-wrap" };

  return (
    <main className="legal-doc" style={{ margin: "0 auto", padding: "56px 24px 96px", color: C.ink }}>
      <h1 className="ff-display italic" style={{ fontSize: "2rem", color: C.curtain, marginBottom: 24 }}>
        特定商取引法に基づく表記
      </h1>
      <p>版　tokushoho-ja-2026-09-v1</p>

      <hr style={hr} />
      <h2 style={h2}>販売事業者</h2>
      <div className="legal-list" style={list}>
        <p style={li}>Woolsong（坂本 響）</p>
      </div>

      <h2 style={h2}>運営統括責任者</h2>
      <div className="legal-list" style={list}>
        <p style={li}>坂本 響</p>
      </div>

      <h2 style={h2}>所在地</h2>
      <div className="legal-list" style={list}>
        <p style={li}>お問い合わせいただければ、遅滞なくお答えします</p>
      </div>

      <h2 style={h2}>電話番号</h2>
      <div className="legal-list" style={list}>
        <p style={li}>050-1725-0553</p>
      </div>
      <p>お電話は、内容によってはお時間をいただくことがあります。メールでもお受けしています。</p>

      <h2 style={h2}>メールアドレス</h2>
      <div className="legal-list" style={list}>
        <p style={li}>woolsong.app@gmail.com</p>
      </div>

      <hr style={hr} />
      <h2 style={h2}>販売価格</h2>
      <div className="legal-list" style={list}>
        <p style={li}>月額プラン　　580円（税込）</p>
        <p style={li}>年額プラン　　5,800円（税込）　18歳以上の方のみ</p>
        <p style={li}>季節の装い　　500円（税込・都度のお支払い）</p>
      </div>
      {/* ★★正（md）と、1字ずつ合わせてあります。
          ★「記録と」ではなく「記録・」です。★正がそう書いています。
          ★下の1文は、★はじめ写し忘れていました（2026-09-05・確かめが見つけました）。 */}
      <p>記録・書き出しは、無料です。お金をいただきません。</p>
      <p>お金をいただくのは、8日前より前のふりかえり、複数の指標を並べて見ること、本番モード、今日の目安です。</p>
      <p>体験期間はありません。直近7日は、はじめからずっと無料です。</p>

      <h2 style={h2}>商品代金以外に必要な費用</h2>
      <p>ありません。通信にかかる費用は、お客さまのご負担です。</p>

      <hr style={hr} />
      <h2 style={h2}>支払方法・支払時期</h2>
      <div className="legal-list" style={list}>
        <p style={li}>支払方法　　クレジットカード（Stripe）</p>
        <p style={li}>支払時期　　お申し込みの手続きが済んだとき</p>
      </div>
      <p>以後は、同じ日に、自動で更新されます（月額は毎月、年額は毎年）。</p>
      <p>季節の装いは、都度のお支払いです。自動で更新されません。</p>
      <p>カードの情報は、当方では持ちません。Stripe が扱います。</p>

      <h2 style={h2}>役務の提供時期</h2>
      <p>お支払いの手続きが済んだ時点から、すぐにご利用いただけます。</p>

      <hr style={hr} />
      <h2 style={h2}>解約について</h2>
      <p>いつでも解約できます。アプリの中から、ご自身で手続きできます。</p>
      <p>解約なさると、次の更新日から、お金はいただきません。</p>
      <p>日割りでのお返しはありません。更新日までは、そのままお使いいただけます。</p>
      <p><strong style={{ color: C.ink }}>記録は、解約しても残ります。書き出しは、いつでも無料です。</strong></p>

      <h2 style={h2}>返品・返金について</h2>
      <p>役務（サービス）のご提供なので、返品はできません。</p>
      <p>ただし、次の場合は、お返しします。</p>
      <div className="legal-list" style={list}>
        <p style={li}>18歳未満の方、またはその保護者の方からお申し出があった場合は、直近のお支払いを返金し、すぐに解約します。理由は伺いません。</p>
        <p style={li}>当方の不具合により、ご利用いただけなかった場合は、その期間分をお返しします。</p>
      </div>
      <p>お申し出は、上のメールまたはお電話へお願いします。</p>

      <hr style={hr} />
      <h2 style={h2}>動作環境</h2>
      <div className="legal-list" style={list}>
        <p style={li}>iPhone / iPad　　Safari（最新版）</p>
        <p style={li}>Android　　　　　Chrome（最新版）</p>
        <p style={li}>パソコン　　　　 Chrome / Safari / Edge（いずれも最新版）</p>
      </div>
      {/* ★★「スマートフォンでは」を落とさないこと。
          ★これは動作環境の説明であって、★案内ではありません。
          ★パソコンの方に「ホーム画面に置いてください」と読ませないためです。 */}
      <p>スマートフォンでは、ホーム画面に置いてお使いいただけます。</p>
      <p>アプリストアからの導入は不要です。</p>

      <h2 style={h2}>未成年の方のご利用について</h2>
      <p>18歳未満の方も、お使いいただけます。</p>
      {/* ★★「確かめる」と書かないこと（2026-09-05）。
          ★実際にしているのは、★お尋ねして、ご本人に押していただくことです。
          ★保護者の方ご本人に、★確かめてはいません。
          ★押すのは、結局その端末を持っている方です。★それは変えられません。
          ★9月4日の決まり ── ★確かめられないことを、表示しない。 */}
      <p>お支払いの前に、保護者の方の同意についてお尋ねする画面を出します。</p>
      <p>年額プランは、18歳以上の方のみです。</p>
    </main>
  );
}
