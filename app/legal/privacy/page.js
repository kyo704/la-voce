import { C } from "@/lib/tokens";

// ============================================================================
// プライバシーポリシー（privacy-ja-2026-09-v1）
//
//   ★2026-09-03 に公開しました。★制定日は 2026年9月3日です。
//
//   ★★この本文を、ここで直接書き換えないでください。
//     ★正は docs/legal/privacy-ja-2026-09-v1.md です。
//     ★あちらを直してから、こちらへ写します。
//     ★ここだけ直すと、★どちらが本当かが分からなくなります。
//
//   ★「※ これは草案テンプレートです」の1行は、公開と同時に消しました。
//   ★教室で何が渡るかの正は docs/legal/consent-scope-ja-2026-09-v1.md です。
//     ★この文書の第5項は、そこから引いています。
// ============================================================================

export default function PrivacyPage() {
  return (
    <main className="legal-doc" style={{ margin: "0 auto", padding: "56px 24px 96px", color: C.ink }}>
      <h1 className="ff-display italic" style={{ fontSize: "2rem", color: C.curtain, marginBottom: 24 }}>
        プライバシーポリシー
      </h1>
      <p>版　privacy-ja-2026-09-v1制定日　2026年9月3日</p>
      <p>Woolsong（以下「本サービス」）は、声を使う方の体調の記録をお預かりします。記録には、健康に関するものが含まれます。どのようにお預かりし、何に使い、どこまで守るのかを、以下にお示しします。</p>
      <p>読みやすさを優先して書いていますが、内容は個人情報の保護に関する法律（以下「法」）に沿ったものです。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>1　わたしたちについて</h2>
      <div className="legal-list" style={{ margin: "10px 0 18px", paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>事業者    Woolsong（坂本 響）</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>所在地    お問い合わせいただければ、遅滞なくお答えします</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>連絡先    woolsong.app@gmail.com</p>
      </div>
      <p>本サービスは、個人が運営しています。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>2　お預かりする情報</h2>
      <p><strong style={{ color: C.ink }}>あなたが入力するもの</strong></p>
      <div className="legal-list" style={{ margin: "10px 0 18px", paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・お名前または表示名、メールアドレス</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・体調の記録</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>　　睡眠時間、のどの状態、声を使った時間、むくみ、</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>　　本番の翌日かどうか、その日の活動と強さ、など</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・既往症（一覧からお選びいただくもの）</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・常用薬、アレルギー</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・健康に関する自由記述</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・レッスンの予定と出欠（教室・学校でお使いの場合）</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・年齢の区分（15歳未満／15〜17歳／18歳以上）</p>
        <p style={{ height: 10 }} />
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>　　生年月日は、お預かりしません。</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>　　　年齢の区分だけをお聞きし、それ以外は記録しません。</p>
      </div>
      <p><strong style={{ color: C.ink }}>自動で記録されるもの</strong></p>
      <div className="legal-list" style={{ margin: "10px 0 18px", paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・ログインの日時</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・アプリの利用に伴う技術的な記録（エラーの記録など）</p>
      </div>
      <p><strong style={{ color: C.ink }}>外から取り込むもの</strong></p>
      <div className="legal-list" style={{ margin: "10px 0 18px", paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・お住まいの地域の気温・湿度（お住まいの地域をご指定いただいた場合）</p>
      </div>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>3　何に使うか（利用目的）</h2>
      <div className="legal-list" style={{ margin: "10px 0 18px", paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>1  あなたの記録を保存し、あなたに見せるため</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>2  あなたの記録から、不調と関係の深い要因を統計で示すため</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>3  教室・学校でお使いの場合、レッスンの予定と出欠を管理するため</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>4  本サービスの不具合を見つけ、直すため</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>5  お問い合わせにお答えするため</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>6  本サービスの改善のため、個人を特定できない形にしたうえで集計するため</p>
      </div>
      <p>上記以外の目的には使いません。目的を追加するときは、事前にお知らせし、必要な場合はあらためて同意をいただきます。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>4　健康の記録について（要配慮個人情報）</h2>
      <p>体調の記録のうち、<strong style={{ color: C.ink }}>既往症（逆流性食道炎・声帯結節などの持病）に関するもの</strong>は、法律上「要配慮個人情報」にあたります。これをお預かりするには、あらかじめご本人の同意が必要です（法20条2項）。</p>
      <p><strong style={{ color: C.ink }}>いただいた記録は、すべて要配慮個人情報に準じて取り扱います。</strong></p>
      <p>同意は、いつでも撤回できます。撤回の方法は、第11項に記載しています。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>5　だれが見られるか</h2>
      <div className="legal-list" style={{ margin: "10px 0 18px", paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>本サービスは、あなたの体調の記録を</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>あなた以外の方が参照する機能を持ちません。</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>教室・学校でお使いの場合も同じです。</p>
      </div>
      <p>教室・学校の指導者・運営者に伝わるもの</p>
      <div className="legal-list" style={{ margin: "10px 0 18px", paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・あなたの表示名</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・あなたの職業</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・レッスンの予定</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・レッスンをやったかどうか</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・あなたが送った連絡（欠席、遅れます、相談したいことがあります）</p>
      </div>
      <p>本サービスは、教室・学校の指導者・運営者、および他の利用者が次のものを参照する機能を持ちません。</p>
      <div className="legal-list" style={{ margin: "10px 0 18px", paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・体調の記録</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・既往症、服薬、その他の健康に関する情報</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・月経周期の記録</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・本サービスが示す分析の結果</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・記録の中の、自由に書ける欄</p>
      </div>
      <p>（この通りでない状態が見つかったときの扱いは、第14項に書いています。）</p>
      <p><strong style={{ color: C.ink }}>運営者について</strong></p>
      <p>不具合の調査のために、運営者（坂本 響）が記録に触れることがあります。そのときは、必要な範囲に限り、目的が終われば見ません。調査のために体調の記録そのものを読む必要が生じた場合は、あらかじめご本人にご連絡します。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>6　第三者への提供</h2>
      <p>法令に基づく場合を除き、あなたの記録を第三者に提供することはありません。</p>
      <div className="legal-list" style={{ margin: "10px 0 18px", paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>売りません</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>広告に使いません</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>同意なく、外部の事業者に渡しません</p>
      </div>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>7　業務を委ねている先と、データの置き場所</h2>
      <p>本サービスを動かすために、次の事業者のしくみを使っています。いずれも、契約により、記録の内容を取り扱わないこととしています。</p>
      <div className="legal-list" style={{ margin: "10px 0 18px", paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>役割              契約の相手方の所在地   データが取り扱われる場所</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>────────────────────────────────────────────────────────────</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>データベース      シンガポール           日本（東京）</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>メールの送信      アメリカ               アメリカ</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>お問い合わせの受信 アメリカ               アメリカ</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>────────────────────────────────────────────────────────────</p>
      </div>
      <p>外国において個人データを取り扱う場合があるため、当該国の個人情報の保護に関する制度を把握したうえで、安全管理のための措置を講じています。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>8　自由に書ける欄について</h2>
      <p>体調の記録には、ご自身で自由に書ける欄があります。</p>
      <p>その欄に、診断名やお薬の名前を書かれた場合、それも要配慮個人情報として、同じようにお預かりします。</p>
      <p>持病については、自由記述ではなく、一覧からお選びいただくことをおすすめします。あとから「持病の記録だけを消したい」とご希望いただいたときに、確実にお応えできるためです。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>9　どのくらい保存するか</h2>
      <div className="legal-list" style={{ margin: "10px 0 18px", paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>アプリの中        あなたが削除するまで</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>バックアップの中  削除後、最大30日。その後、自動的に消えます</p>
      </div>
      <p>削除をご希望の場合、アプリからはすぐに見えなくなり、記録も消えます。安全のために取っているバックアップには最大30日残り、その後、自動的に消えます。<strong style={{ color: C.ink }}>バックアップから復元することになった場合も、削除された記録は元に戻しません。</strong></p>
      <p>法令で保存が義務づけられているもの（取引の記録など）は、削除のご依頼をいただいても、法定の期間、保存します。現在、そのような記録はお預かりしていません。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>10　統計への利用</h2>
      <p>本サービスは、記録から「不調と関係の深い要因」を統計で示します。</p>
      <div className="legal-list" style={{ margin: "10px 0 18px", paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>あなたに示す統計    あなたの記録だけを使います</p>
        <p style={{ height: 10 }} />
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>サービス改善のための集計</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>　　個人を特定できない形にしたうえで行います</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>　　人数が少ないと個人が分かってしまうため、</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>　　一定の人数に満たない集計は、そもそも作りません</p>
      </div>
      <p>あなたの記録が、他の方に示される統計に使われることはありません。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>11　あなたができること</h2>
      <div className="legal-list" style={{ margin: "10px 0 18px", paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>見る          いつでも、ご自身の記録をご覧いただけます</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>　　　　　　　（「今日」「ノート」「分析」の各画面）</p>
        <p style={{ height: 10 }} />
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>書き出す      「もっと ＞ アカウント ＞ データの書き出し」から、</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>　　　　　　　ファイルとして取り出せます</p>
        <p style={{ height: 10 }} />
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>直す          誤りがあれば、その場で直せます</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>　　　　　　　（記録した日を開いて、書き直してください）</p>
        <p style={{ height: 10 }} />
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>消す          「もっと ＞ アカウント ＞ アカウントの削除」から、</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>　　　　　　　いつでも削除できます</p>
        <p style={{ height: 10 }} />
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>同意をやめる  「もっと ＞ 設定 ＞ プロフィール・記録項目 ＞</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>　　　　　　　　記録データの同意状況」から、いつでも撤回できます</p>
      </div>
      <p>撤回されても、これまでの記録は消えません。ご覧いただくことも、書き出すことも、削除することも、同意の状態とは関わりなくできます。</p>
      <p>これらのほか、法の定めにより、利用目的の通知、開示、訂正、利用の停止、消去、第三者提供の停止をご請求いただけます（法32条〜35条）。</p>
      <div className="legal-list" style={{ margin: "10px 0 18px", paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>ご請求の方法    woolsong.app@gmail.com 宛にご連絡ください</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>手数料          いただきません</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>お答えする期間  おおむね2週間以内にご連絡します</p>
      </div>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>12　お子さまについて</h2>
      <p>お子さまのご利用については、別途お知らせします。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>13　Cookie などについて</h2>
      <p>本サービスは、ログインの状態を保つために、ブラウザに情報を保存します。広告や、外部の事業者による行動の追跡には使っていません。</p>
      <p>アクセス解析のサービスは使っていません。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>14　漏えいなどが起きたとき</h2>
      <p>万一、あなたの記録が漏れた、失われた、壊れたといったことが起きた場合、法令に従い、個人情報保護委員会へ報告し、あなたにご連絡します。</p>
      <div className="legal-list" style={{ margin: "10px 0 18px", paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>ご連絡する内容　何が起きたか / 何が漏れたか / いま何をしているか</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>　　　　　　　　あなたにしていただきたいこと</p>
      </div>
      <p>分かっていないことは「まだ分かっていません」とお伝えします。分かるまでお待たせすることは、しません。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>15　このポリシーの改定</h2>
      <p>内容を変えるときは、新しい版として公開し、版番号を改めます。</p>
      <p><strong style={{ color: C.ink }}>過去の版も、そのまま残します。</strong>あなたが同意した時点の文面を、あとからご確認いただけます。</p>
      <p>重要な変更のときは、事前にお知らせし、必要な場合はあらためて同意をいただきます。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>16　お問い合わせ・苦情の申出先</h2>
      <div className="legal-list" style={{ margin: "10px 0 18px", paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>woolsong.app@gmail.com</p>
      </div>
      <p>本サービスの個人情報の取扱いについてのご意見・苦情は、上記へお寄せください。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
    </main>
  );
}
