import { C } from "@/lib/tokens";

function Section({ eyebrow, title, subtitle, children, accent }) {
  return (
    <section style={{ marginTop: 56 }}>
      <p style={{ fontSize: 11.5, letterSpacing: "0.12em", color: accent || C.gold, fontWeight: 700, marginBottom: 6 }}>
        {eyebrow}
      </p>
      <h2 className="ff-display italic" style={{ fontSize: "1.9rem", color: C.ink, margin: "0 0 4px" }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ color: C.inkSoft, fontSize: 13, marginBottom: 20 }}>{subtitle}</p>
      )}
      <div style={{ color: C.ink, fontSize: 14.5, lineHeight: 1.95 }}>{children}</div>
    </section>
  );
}

function SingerList({ names }) {
  return (
    <p style={{ marginTop: 14, fontSize: 13.5, color: C.inkSoft }}>
      <span style={{ fontWeight: 600, color: C.ink }}>代表的な歌手　</span>
      {names.join("、")}
    </p>
  );
}

function Callout({ children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px", margin: "18px 0", fontSize: 13.5, color: C.inkSoft, lineHeight: 1.8 }}>
      {children}
    </div>
  );
}

function GlossaryItem({ term, reading, children }) {
  return (
    <div style={{ borderTop: `1px solid ${C.line}`, padding: "16px 0" }}>
      <p style={{ margin: 0, fontWeight: 600, color: C.curtain, fontSize: 14.5 }}>
        {term} {reading && <span style={{ color: C.inkSoft, fontWeight: 400, fontSize: 12.5 }}>（{reading}）</span>}
      </p>
      <p style={{ margin: "6px 0 0", color: C.inkSoft, fontSize: 13.5, lineHeight: 1.8 }}>{children}</p>
    </div>
  );
}

export default function VocalTheoryPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px 96px", lineHeight: 1.8, fontSize: 14 }}>
      <p style={{ fontSize: 11.5, letterSpacing: "0.14em", color: C.gold, fontWeight: 700, marginBottom: 10 }}>
        VOCAL THEORY
      </p>
      <h1 className="ff-display italic" style={{ fontSize: "2.6rem", color: C.curtain, margin: 0, lineHeight: 1.2 }}>
        発声理論ノート
      </h1>
      <p style={{ color: C.inkSoft, marginTop: 16, lineHeight: 1.9 }}>
        声楽の技術は、単一の「正解」があるわけではなく、時代や国、歌われるレパートリーによって異なる発展を遂げてきました。
        ここでは、伝統的なベルカント、20世紀イタリアで独自の発展を遂げたメロッキ・メソッド、
        近代声楽理論の礎を築いたマヌエル・ガルシアの科学的アプローチ、
        そしてドイツ歌曲・フランス歌曲を歌う際に求められる技術について、
        それぞれの「結果として現れる声と体のメカニズム」を中心にまとめています。
        練習方法そのものではなく、各流派が目指す音の性質と、その背景にある身体の使い方の考え方に焦点を当てています。
      </p>

      {/* ベルカント */}
      <Section eyebrow="TRADITIONAL TECHNIQUE" title="伝統的なベルカント" subtitle="17〜19世紀のイタリアに起源を持つ、声楽の基層をなす様式">
        <p>
          ベルカント（belcanto、「美しい歌」の意）は、特定の一人の創始者を持つ技法ではなく、
          ロッシーニ、ベッリーニ、ドニゼッティらの時代を通じて磨かれていった、イタリア語の発声原理に基づく歌唱様式の総称です。
          その核にあるのは、声域全体を通じて途切れることのない滑らかな声のライン（レガート）と、
          「キアロスクーロ（chiaro-scuro、明暗）」と呼ばれる音色の考え方です。
          これは、声に明るさ（chiaro）と暗さ・深み（oscuro）の両方を同時に持たせるバランス感覚を指し、
          単に明るいだけでも、暗いだけでもない、芯のある響きを生み出す土台になっています。
        </p>
        <p>
          身体の使い方としては、横隔膜と肋骨の拡張状態をできるだけ長く保ちながら息を送り出す
          「アッポッジョ（appoggio、支え）」という考え方が中心に置かれます。
          これにより、声帯にかかる息の圧力が安定し、声区の変わり目（パッサッジョ）を、
          音色を大きく変えることなく滑らかに通過できるようになります。
        </p>
        <Callout>
          この様式の声が大編成のオーケストラを伴っても客席の奥まで届く理由は、感覚的な「気合い」だけでは説明できません。
          スウェーデンの音声科学者ヨハン・スンドベリ（Johan Sundberg）らの研究により、
          訓練された声には2800〜3200Hz付近に倍音のエネルギーが集中する「シンガーズフォルマント」が現れることが分かっています。
          オーケストラの音響エネルギーは概ね500Hz付近をピークに高い周波数ほど減衰していくため、
          この帯域にエネルギーを持つ声は、音量そのものを上げなくても、オーケストラの音の「上」を通って客席に届きます。
          声区や声種によって中心周波数は異なり、バスで約2384Hz、バリトンで約2454Hz、テノールで約2705Hz、
          ソプラノで約3092Hzという報告もあります（Müller et al., 2022）。
        </Callout>
        <SingerList names={["エンリコ・カルーソ", "ルチアーノ・パヴァロッティ", "マリア・カラス", "ジョーン・サザーランド", "カルロ・ベルゴンツィ", "ルイジ・アルヴァ"]} />
      </Section>

      {/* メロッキ */}
      <Section eyebrow="A 20TH-CENTURY DEPARTURE" title="メロッキ・メソッド" subtitle="喉頭の位置を技術の出発点に据えた、20世紀イタリアの声楽教師アルトゥーロ・メロッキの方法論" accent={C.rust}>
        <p>
          アルトゥーロ・メロッキ（Arturo Melocchi、1879–1960）はミラノ出身のバリトン・声楽教師で、
          伝統的なベルカントとは異なる、独自の身体操作を核とした指導法で知られています。
          その中心にあるのが、イタリア語で「沈み込ませる」を意味する「アッフォンド（affondo）」と呼ばれる操作です。
          伝統的なベルカントでも喉頭は歌唱中に自然と低めの位置に落ち着きますが、
          メロッキ・メソッドでは、これを意図的かつ最大限に、歌唱の出発点として固定的に用いる点が大きく異なります。
        </p>
        <p>
          喉頭を深く下げることで、声帯から咽頭・口腔にかけての「声道」が物理的に延長され、
          共鳴腔である咽頭腔が拡大します。これにより、より低い倍音成分が強調された、暗く重厚で、
          しばしば「鋼鉄のような」と形容される力強い音色が生まれます。
          この方法は特にドラマティックな役柄を歌うテノールにおいて、
          オーケストラを突き抜けるような強靭な響きをもたらす一方、
          声帯や喉周辺の筋群への負荷が大きく、声を痛める危険性が高いことでも知られており、
          声楽教育の中では今なお評価が分かれる、議論の多い方法論です。
        </p>
        <SingerList names={["マリオ・デル・モナコ（メロッキの代表的な体現者）", "マルチェロ・デル・モナコ", "（間接的な影響として）フランコ・コレッリ"]} />
      </Section>

      {/* ガルシア */}
      <Section eyebrow="THE BIRTH OF VOICE SCIENCE" title="マヌエル・ガルシアの発声理論" subtitle="喉頭鏡を発明し、声楽指導を経験則から観察科学へと転換させた先駆者" accent={C.sage}>
        <p>
          マヌエル・パトリシオ・ロドリゲス・ガルシア（Manuel Patricio Rodríguez García、1805–1906）は、
          スペイン出身のバリトン歌手であり、19世紀を代表する声楽教育者です。
          彼の最大の功績は、1854年から55年にかけて「喉頭鏡（laryngoscope）」を発明し、
          鏡と太陽光を使って、自分自身の声帯が振動する様子を史上初めて直接観察したことにあります。
          これにより声楽の指導は、感覚や比喩に頼るものから、解剖学的・生理学的な観察に基づく科学へと大きく踏み出しました。
        </p>
        <p>
          ガルシアはまた、著書『歌唱芸術大全（Traité complet de l'art du chant）』の中で
          「クー・ド・グロット（coup de la glotte、声門の一撃）」という概念を提唱しました。
          これは、発声の始まりにおいて声帯（声門）を正確かつ迅速に閉じることで、
          息漏れのない、明瞭でクリアな音の立ち上がりを得るための考え方です。
          この概念は発表以来、賛否の分かれる議論を呼び続けていますが、
          「声門がどのように閉じるか」という視点そのものを声楽理論に持ち込んだこと自体が、
          その後の発声研究の出発点になったと評価されています。
        </p>
        <Callout>
          ガルシアの教え子には、伝説的ソプラノのジェニー・リンドや、
          のちに一大声楽教育の系譜を築いたマティルデ・マルケージなどがいます。
          彼が切り拓いた「観察に基づく声楽科学」という発想は、
          現代の音声科学（voice science）や音声生理学の礎として、今日まで受け継がれています。
        </Callout>
      </Section>

      {/* ドイツ歌曲 */}
      <Section eyebrow="REPERTOIRE-DRIVEN TECHNIQUE" title="ドイツ歌曲（リート）を歌う際の技術" subtitle="大歌劇場ではなくサロンやリサイタルホールで育まれた、言葉に寄り添う声の使い方">
        <p>
          シューベルト、シューマン、ブラームス、ヴォルフらに代表されるドイツ・リートは、
          もともと大歌劇場ではなく、サロンやごく小さなリサイタルホールでピアノ一台とともに歌われることを前提に書かれています。
          そのため、オーケストラを突き抜けるための音量や、遠くの客席まで届く投射力よりも、
          詩の言葉そのものが持つ意味とニュアンスをいかに繊細に伝えるかが、技術の中心に置かれます。
        </p>
        <p>
          身体の使い方としては、胸声と頭声を混合させた「ミックスヴォイス（voix mixte）」や、
          息の量を絞った弱声（メッツァヴォーチェ）を自在に使い分け、
          ごく小さな音量の中でも音程と響きの芯を失わない制御力が求められます。
          また、ドイツ語特有の子音の明瞭な処理と、詩の韻律（プロソディ）を音楽的なフレーズの抑揚と一致させる感覚が重視され、
          シンガーズフォルマントに頼った「通る声」よりも、
          聴き手のすぐそばで語りかけるような、テキストと音楽が一体化した発声が理想とされます。
        </p>
        <SingerList names={["ディートリヒ・フィッシャー=ディースカウ", "エリーザベト・シュヴァルツコップ", "クリスタ・ルートヴィヒ", "ハンス・ホッター"]} />
      </Section>

      {/* フランス歌曲 */}
      <Section eyebrow="REPERTOIRE-DRIVEN TECHNIQUE" title="フランス歌曲（メロディ）を歌う際の技術" subtitle="フォーレ、ドビュッシー、デュパルクらの作品に求められる、母音の純度と語りの感覚">
        <p>
          フォーレ、ドビュッシー、デュパルク、ラヴェルらによるフランス歌曲（メロディ）は、
          ドイツ・リート以上に親密で、詩と音楽の融合を追求した様式です。
          技術面でまず求められるのは、母音、とりわけ閉じた母音（é、u など）と、
          フランス語特有の鼻母音（an、on、in など）を、音色を崩さずに正確に発音する能力です。
        </p>
        <p>
          声のライン（ligne de chant）を滑らかに保ちながら、過度なヴィブラートを抑え、
          フレーズの終わりを重く着地させず軽く収める――
          これは、朗唱（デクラマシオン、déclamation）に近い性質を持つフランス的な歌唱美学を反映したものです。
          ドイツ・リートが言葉の意味と感情表現を前面に出す傾向があるのに対し、
          フランス・メロディはより抑制的で、詩の響きそのものの美しさ、
          音と言葉の質感を丁寧に磨き上げることに重きが置かれます。
        </p>
        <SingerList names={["ピエール・ベルナック", "ジェラール・スゼー", "レジーヌ・クレスパン", "フェリシティ・ロット"]} />
      </Section>

      {/* 流派の関係性 */}
      <Section eyebrow="HOW THESE TRADITIONS RELATE" title="それぞれの流派の関係性" accent={C.gold}>
        <p>
          ガルシアが切り拓いた「観察に基づく声楽科学」は、特定の様式ではなく、
          あらゆる声楽指導の土台となる方法論的な転換点でした。
          伝統的なベルカントは、その科学的視点が確立される以前から経験的に磨かれてきた様式であり、
          メロッキ・メソッドは、その中でも特にドラマティックな声を求める潮流が、
          喉頭位置という一点を極端に強調する形で20世紀に枝分かれしたものと捉えることができます。
        </p>
        <p>
          一方、ドイツ・リートとフランス・メロディの技術は、
          「どの流派に属するか」というより、「どのホールで、どんな伴奏編成で、どの言語の詩を歌うか」という
          レパートリーそのものの要求から導き出された、実践的な適応と見ることができます。
          オペラで鍛えられた声の土台の上に、それぞれの言語とレパートリーが求める繊細さを重ねていく――
          多くの声楽家にとって、これらは対立する選択肢ではなく、重なり合う技術の層なのです。
        </p>
      </Section>

      {/* 用語集 */}
      <Section eyebrow="GLOSSARY" title="専門用語まとめ" accent={C.sage}>
        <div>
          <GlossaryItem term="アッポッジョ" reading="appoggio">
            横隔膜と肋骨の拡張状態をできるだけ長く保ちながら息を送り出す、支えの考え方。イタリア語で「支える」の意。
          </GlossaryItem>
          <GlossaryItem term="キアロスクーロ" reading="chiaro-scuro">
            声に明るさ（chiaro）と暗さ・深み（oscuro）を同時に持たせる、ベルカントの音色バランスの考え方。
          </GlossaryItem>
          <GlossaryItem term="パッサッジョ" reading="passaggio">
            胸声・ミックス・頭声など、声区が移行するポイント。この前後で音色や発声の仕組みが変化する。
          </GlossaryItem>
          <GlossaryItem term="シンガーズフォルマント" reading="singer's formant">
            2800〜3200Hz付近に現れる倍音エネルギーの集積。訓練された声がオーケストラを超えて届く音響的な鍵とされる。
          </GlossaryItem>
          <GlossaryItem term="クー・ド・グロット" reading="coup de la glotte">
            声門を正確かつ迅速に閉じることで、息漏れのない明瞭な音の立ち上がりを得る考え方。マヌエル・ガルシアが提唱。
          </GlossaryItem>
          <GlossaryItem term="ミックスヴォイス（ヴォワ・ミクスト）" reading="voix mixte">
            胸声と頭声を混合させた声区。中間的な音域で音色の断絶を避けるために用いられる。
          </GlossaryItem>
          <GlossaryItem term="メッツァヴォーチェ" reading="mezza voce">
            息の量を絞った弱声。小さな音量でも音程と響きの芯を保つ制御力が求められる。
          </GlossaryItem>
          <GlossaryItem term="アッフォンド" reading="affondo">
            イタリア語で「沈み込ませる」の意。メロッキ・メソッドにおいて喉頭を意図的に深く下げる操作を指す。
          </GlossaryItem>
          <GlossaryItem term="声道" reading="vocal tract">
            声帯から唇までの空間全体。その長さと形状が、声の共鳴（倍音構成）を決定づける。
          </GlossaryItem>
        </div>
      </Section>

      <p style={{ marginTop: 56, fontSize: 11.5, color: C.inkSoft, borderTop: `1px solid ${C.line}`, paddingTop: 20, lineHeight: 1.8 }}>
        主な参考: Sundberg, J. (1974, 1987) の singer's formant に関する一連の研究／
        Müller et al. (2022) 声種別シンガーズフォルマント中心周波数の報告／
        Bloothooft &amp; Plomp (1986) 音圧レベルとシンガーズフォルマントの関係／
        García, M. (1840–47) <em>Traité complet de l'art du chant</em>／
        Arturo Melocchi の指導法に関する歴史的記述（Del Monaco家および同時代証言に基づく）。
        本ページは声楽史・声楽教育に関する一般的な知見をまとめたものであり、特定の指導法を推奨するものではありません。
      </p>
    </main>
  );
}
