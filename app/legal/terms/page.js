import { C } from "@/lib/tokens";

// ============================================================================
// 利用規約（terms-ja-2026-09-v1）
//
//   ★2026-09-03 に公開しました。★制定日は 2026年9月3日です。
//
//   ★★この本文を、ここで直接書き換えないでください。
//     ★正は docs/legal/terms-ja-2026-09-v1.md です。
//     ★あちらを直してから、こちらへ写します。
//     ★ここだけ直すと、★どちらが本当かが分からなくなります。
//
//   ★「※ これは草案テンプレートです」の1行は、公開と同時に消しました。
//   ★教室で何が渡るかの正は docs/legal/consent-scope-ja-2026-09-v1.md です。
//     ★この文書の第5条は、そこから引いています。
// ============================================================================

export default function TermsPage() {
  return (
    <main className="legal-doc" style={{ margin: "0 auto", padding: "56px 24px 96px", color: C.ink }}>
      <h1 className="ff-display italic" style={{ fontSize: "2rem", color: C.curtain, marginBottom: 24 }}>
        利用規約
      </h1>
      <p>版　terms-ja-2026-09-v1制定日　2026年9月3日</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>第1条（適用）</h2>
      <p>本規約は、Woolsong（坂本 響）（以下「当方」といいます）が提供する「Woolsong」（https://woolsong.app 以下「本サービス」といいます）の利用条件を定めるものです。</p>
      <p>利用者は、本サービスを利用することにより、本規約に同意したものとみなします。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>第2条（登録）</h2>
      <p>本サービスの利用を希望する方は、当方所定の方法により利用登録を行うものとします。</p>
      <p>登録にあたってお預かりする情報、その利用目的、および取扱いについては、プライバシーポリシー（https://woolsong.app/legal/privacy）に定めます。</p>
      <p>お子さまのご利用については、別途お知らせします。</p>
      <p>なお、現在の仕様では、18歳未満の方は指導者との連携を行うことができません。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>第3条（料金）</h2>
      <p><strong style={{ color: C.ink }}>現在、本サービスは、すべての機能を無料で提供しています。</strong></p>
      <p><strong style={{ color: C.ink }}>自動的に有料に切り替わることはありません。</strong></p>
      <p>有料での提供を開始する場合には、事前にお知らせします。その際、有料の機能をご利用になるかどうかは、利用者がお選びいただけます。</p>
      <p>有料での提供を開始した後の料金、支払方法、更新および解約の条件については、別途定めて公表します。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>第4条（記録の帰属と取扱い）</h2>
      <p>利用者が本サービスに記録した内容は、<strong style={{ color: C.ink }}>利用者ご本人のもの</strong>です。</p>
      <p>・利用者は、いつでも自身の記録を閲覧し、書き出し、削除することができます・当方は、利用者の記録を、プライバシーポリシーに定める目的以外に使用しません・当方は、利用者の記録を、第三者に販売しません・当方は、利用者の記録を、広告に使用しません</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>第5条（教室・学校でのご利用）</h2>
      <p>利用者は、教室・学校等の団体（以下「教室等」といいます）に参加して本サービスを利用することができます。</p>
      <p><strong style={{ color: C.ink }}>教室等に参加した場合、次のとおりとなります。</strong></p>
      <p>教室等の指導者・運営者に伝わるもの</p>
      <div className="legal-list" style={{ margin: "10px 0 18px", paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・利用者の表示名</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・利用者の職業</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・レッスンの予定</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・レッスンをやったかどうか</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・利用者が送った連絡（欠席、遅れます、相談したいことがあります）</p>
      </div>
      <p>本サービスは、教室等の指導者・運営者が次のものを参照する機能を持ちません。</p>
      <div className="legal-list" style={{ margin: "10px 0 18px", paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・体調の記録</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・既往症、服薬、その他の健康に関する情報</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・月経周期の記録</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・本サービスが示す分析の結果</p>
        <p style={{ margin: "2px 0", whiteSpace: "pre-wrap" }}>・記録の中の、自由に書ける欄</p>
      </div>
      <p>利用者は、いつでも教室等から離れることができます。教室等から離れた後、当該教室等の指導者・運営者は、利用者の予定および連絡を新たに参照することはできません。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>第6条（禁止事項）</h2>
      <p>利用者は、本サービスの利用にあたり、次の行為をしてはなりません。</p>
      <p>・法令または公序良俗に違反する行為・他の利用者、第三者、または当方の権利を侵害する行為・本サービスの運営を妨害する行為・他人になりすまして本サービスを利用する行為・本サービスを通じて得た他の利用者の情報を、目的外に利用する行為・当方の書面による承諾なく、本サービスを商業的に再提供する行為</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>第7条（免責）</h2>
      <p><strong style={{ color: C.ink }}>本サービスは、体調の記録と、その傾向を示すことを補助するものであり、医学的な診断、治療、または助言を提供するものではありません。</strong></p>
      <p><strong style={{ color: C.ink }}>本サービスが示す内容は、医師その他の医療専門家による診療に代わるものではありません。</strong></p>
      <p>健康上の懸念がある場合、症状が続く場合、または症状が重い場合には、医療機関にご相談ください。</p>
      <p>当方は、本サービスの利用により利用者に生じた損害について、当方の故意または重大な過失による場合を除き、責任を負いません。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>第8条（サービスの中断・変更）</h2>
      <p>当方は、次の場合に、本サービスの全部または一部を、事前の通知なく中断または停止することがあります。</p>
      <p>・保守または更新を行う場合・不可抗力により本サービスの提供が困難となった場合・その他、当方が必要と判断した場合</p>
      <p>当方は、本サービスの内容を変更することがあります。利用者に不利益となる重要な変更については、事前にお知らせします。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>第9条（退会と、記録の取扱い）</h2>
      <p>利用者は、いつでも退会することができます。</p>
      <p>退会すると</p>
      <p>・記録は、当方のデータベースから削除されます・安全のために取得しているバックアップには、最大30日残り、その後、自動的に削除されます・バックアップから復元することとなった場合も、削除された記録を元に戻すことはありません</p>
      <p>退会の前に、記録を書き出すことをおすすめします。</p>
      <p>法令により保存が義務づけられている記録については、削除のご依頼をいただいた場合でも、法定の期間、保存します。（現在、そのような記録はお預かりしていません）</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>第10条（サービスの終了）</h2>
      <p>当方は、本サービスの提供を終了する場合、<strong style={{ color: C.ink }}>終了の日の少なくとも90日前までにお知らせします。</strong></p>
      <p>利用者は、その期間内に、記録を書き出すことができます。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>第11条（規約の変更）</h2>
      <p>当方は、次のいずれかに該当する場合、本規約を変更することがあります。</p>
      <p>・変更が、利用者の一般の利益に適合するとき・変更が、契約の目的に反せず、かつ、変更の必要性、変更後の内容の相当性その他の事情に照らして合理的であるとき</p>
      <p>本規約を変更する場合、当方は、変更後の内容および効力発生時期を、<strong style={{ color: C.ink }}>効力発生時期の前に</strong>、本サービス上に表示する方法により周知します。</p>
      <p><strong style={{ color: C.ink }}>過去の版は、そのまま残します。</strong>利用者は、同意した時点の内容を、後から確認することができます。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>第12条（準拠法）</h2>
      <p>本規約は、日本法に準拠します。</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>第13条（お問い合わせ）</h2>
      <p>本規約および本サービスに関するお問い合わせは、次までお願いします。</p>
      <p>woolsong.app@gmail.com</p>
      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
    </main>
  );
}
