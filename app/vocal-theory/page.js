import { C } from "@/lib/tokens";

const LANGS = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "it", label: "Italiano" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "ko", label: "한국어" }
];

// T: すべてのテキストを保持する辞書。各言語が未整備の場合は日本語→英語の順にフォールバックする。
const T = {
  eyebrow: { ja: "VOCAL THEORY", en: "VOCAL THEORY", zh: "VOCAL THEORY", it: "VOCAL THEORY", de: "VOCAL THEORY", fr: "VOCAL THEORY", es: "VOCAL THEORY", ko: "VOCAL THEORY" },
  title: { ja: "発声理論ノート", en: "Notes on Vocal Theory", zh: "发声理论笔记", it: "Note di teoria vocale", de: "Notizen zur Stimmtheorie", fr: "Notes de théorie vocale", es: "Notas sobre teoría vocal", ko: "발성 이론 노트" },
  intro: {
    ja: "声楽の技術は、単一の「正解」があるわけではなく、時代や国、歌われるレパートリーによって異なる発展を遂げてきました。ここでは、伝統的なベルカント、20世紀イタリアで独自の発展を遂げたメロッキ・メソッド、近代声楽理論の礎を築いたマヌエル・ガルシアの科学的アプローチ、そしてドイツ歌曲・フランス歌曲を歌う際に求められる技術について、それぞれの「結果として現れる声と体のメカニズム」を中心にまとめています。練習方法そのものではなく、各流派が目指す音の性質と、その背景にある身体の使い方の考え方に焦点を当てています。",
    en: "Vocal technique has no single \"correct answer\" — it has developed differently across eras, countries, and repertoires. This page looks at traditional bel canto, the Melocchi Method that developed its own path in 20th-century Italy, the scientific approach of Manuel García that laid the foundation of modern vocal theory, and the technique required for singing German Lieder and French mélodie — focusing on the resulting sound and the underlying body mechanics for each. Rather than practice methods themselves, the focus is on the character of sound each school aims for, and the thinking behind the physical use of the body."
  },
  // ===== ベルカント =====
  s1eyebrow: { ja: "TRADITIONAL TECHNIQUE", en: "TRADITIONAL TECHNIQUE", zh: "TRADITIONAL TECHNIQUE", it: "TRADITIONAL TECHNIQUE", de: "TRADITIONAL TECHNIQUE", fr: "TRADITIONAL TECHNIQUE", es: "TRADITIONAL TECHNIQUE", ko: "TRADITIONAL TECHNIQUE" },
  s1title: { ja: "伝統的なベルカント", en: "Traditional Bel Canto", zh: "传统美声唱法（Bel Canto）", it: "Il bel canto tradizionale", de: "Traditionelles Belcanto", fr: "Le bel canto traditionnel", es: "El bel canto tradicional", ko: "전통적인 벨칸토" },
  s1subtitle: {
    ja: "17〜19世紀のイタリアに起源を持つ、声楽の基層をなす様式",
    en: "The foundational style of Western singing, originating in 17th–19th century Italy"
  },
  s1p1: {
    ja: "ベルカント（belcanto、「美しい歌」の意）は、特定の一人の創始者を持つ技法ではなく、ロッシーニ、ベッリーニ、ドニゼッティらの時代を通じて磨かれていった、イタリア語の発声原理に基づく歌唱様式の総称です。その核にあるのは、声域全体を通じて途切れることのない滑らかな声のライン（レガート）と、「キアロスクーロ（chiaro-scuro、明暗）」と呼ばれる音色の考え方です。これは、声に明るさ（chiaro）と暗さ・深み（oscuro）の両方を同時に持たせるバランス感覚を指し、単に明るいだけでも、暗いだけでもない、芯のある響きを生み出す土台になっています。",
    en: "Bel canto (\"beautiful singing\") is not a technique with a single founder, but a general term for a style of singing based on Italian vocal principles, refined across the eras of Rossini, Bellini, and Donizetti. At its core are an unbroken, smooth vocal line (legato) across the whole range, and a tonal concept called \"chiaro-scuro\" (light-dark). This refers to a balance that gives the voice both brightness (chiaro) and darkness/depth (oscuro) at once — the foundation of a resonance that is neither merely bright nor merely dark, but has a solid core."
  },
  s1p2: {
    ja: "身体の使い方としては、横隔膜と肋骨の拡張状態をできるだけ長く保ちながら息を送り出す「アッポッジョ（appoggio、支え）」という考え方が中心に置かれます。これにより、声帯にかかる息の圧力が安定し、声区の変わり目（パッサッジョ）を、音色を大きく変えることなく滑らかに通過できるようになります。",
    en: "In terms of physical technique, the central idea is \"appoggio\" (support) — sending out breath while keeping the diaphragm and ribs expanded for as long as possible. This stabilizes the breath pressure on the vocal folds, allowing the singer to move smoothly through register transitions (passaggio) without a major shift in tone color."
  },
  s1callout: {
    ja: "この様式の声が大編成のオーケストラを伴っても客席の奥まで届く理由は、感覚的な「気合い」だけでは説明できません。スウェーデンの音声科学者ヨハン・スンドベリ（Johan Sundberg）らの研究により、訓練された声には2800〜3200Hz付近に倍音のエネルギーが集中する「シンガーズフォルマント」が現れることが分かっています。オーケストラの音響エネルギーは概ね500Hz付近をピークに高い周波数ほど減衰していくため、この帯域にエネルギーを持つ声は、音量そのものを上げなくても、オーケストラの音の「上」を通って客席に届きます。声区や声種によって中心周波数は異なり、バスで約2384Hz、バリトンで約2454Hz、テノールで約2705Hz、ソプラノで約3092Hzという報告もあります（Müller et al., 2022）。",
    en: "The fact that this style of voice can reach the back of the hall even over a full orchestra cannot be explained by sheer willpower alone. Research by the Swedish voice scientist Johan Sundberg and others has shown that trained voices produce a \"singer's formant\" — a concentration of overtone energy around 2800–3200 Hz. Since orchestral sound energy peaks around 500 Hz and falls off at higher frequencies, a voice with energy in this band can be heard over the orchestra without simply singing louder. The center frequency varies by voice type: roughly 2384 Hz for bass, 2454 Hz for baritone, 2705 Hz for tenor, and 3092 Hz for soprano, according to one report (Müller et al., 2022)."
  },
  singersLabel: { ja: "代表的な歌手", en: "Representative singers", zh: "代表歌唱家", it: "Cantanti rappresentativi", de: "Repräsentative Sänger", fr: "Chanteurs représentatifs", es: "Cantantes representativos", ko: "대표 성악가" },
  s1singers: {
    ja: ["エンリコ・カルーソ", "ルチアーノ・パヴァロッティ", "マリア・カラス", "ジョーン・サザーランド", "カルロ・ベルゴンツィ", "ルイジ・アルヴァ"],
    en: ["Enrico Caruso", "Luciano Pavarotti", "Maria Callas", "Joan Sutherland", "Carlo Bergonzi", "Luigi Alva"]
  },
  // ===== メロッキ =====
  s2eyebrow: { ja: "A 20TH-CENTURY DEPARTURE", en: "A 20TH-CENTURY DEPARTURE", zh: "A 20TH-CENTURY DEPARTURE", it: "A 20TH-CENTURY DEPARTURE", de: "A 20TH-CENTURY DEPARTURE", fr: "A 20TH-CENTURY DEPARTURE", es: "A 20TH-CENTURY DEPARTURE", ko: "A 20TH-CENTURY DEPARTURE" },
  s2title: { ja: "メロッキ・メソッド", en: "The Melocchi Method", zh: "梅洛基发声法", it: "Il Metodo Melocchi", de: "Die Melocchi-Methode", fr: "La méthode Melocchi", es: "El método Melocchi", ko: "멜로키 메소드" },
  s2subtitle: {
    ja: "喉頭の位置を技術の出発点に据えた、20世紀イタリアの声楽教師アルトゥーロ・メロッキの方法論",
    en: "The pedagogy of Arturo Melocchi, a 20th-century Italian voice teacher who made laryngeal position the starting point of technique"
  },
  s2p1: {
    ja: "アルトゥーロ・メロッキ（Arturo Melocchi、1879–1960）はミラノ出身のバリトン・声楽教師で、伝統的なベルカントとは異なる、独自の身体操作を核とした指導法で知られています。その中心にあるのが、イタリア語で「沈み込ませる」を意味する「アッフォンド（affondo）」と呼ばれる操作です。伝統的なベルカントでも喉頭は歌唱中に自然と低めの位置に落ち着きますが、メロッキ・メソッドでは、これを意図的かつ最大限に、歌唱の出発点として固定的に用いる点が大きく異なります。",
    en: "Arturo Melocchi (1879–1960) was a baritone and voice teacher from Milan, known for a pedagogy centered on a distinctive physical maneuver, distinct from traditional bel canto. At its core is a movement called \"affondo\" — Italian for \"sinking\" or \"plunging.\" In traditional bel canto the larynx naturally settles into a lower position during singing, but the Melocchi Method differs significantly in that it uses this deliberately and maximally, as a fixed starting point for singing itself."
  },
  s2p2: {
    ja: "喉頭を深く下げることで、声帯から咽頭・口腔にかけての「声道」が物理的に延長され、共鳴腔である咽頭腔が拡大します。これにより、より低い倍音成分が強調された、暗く重厚で、しばしば「鋼鉄のような」と形容される力強い音色が生まれます。この方法は特にドラマティックな役柄を歌うテノールにおいて、オーケストラを突き抜けるような強靭な響きをもたらす一方、声帯や喉周辺の筋群への負荷が大きく、声を痛める危険性が高いことでも知られており、声楽教育の中では今なお評価が分かれる、議論の多い方法論です。",
    en: "By lowering the larynx deeply, the \"vocal tract\" — from the vocal folds through the pharynx to the mouth — is physically lengthened, enlarging the pharyngeal resonating cavity. This emphasizes lower overtone components, producing a dark, weighty tone often described as \"steely.\" This method, especially for tenors singing dramatic roles, produces a powerful sound that can cut through an orchestra — but it is also known for placing heavy strain on the vocal folds and surrounding throat muscles, carrying a high risk of vocal damage, and remains a much-debated, divisive methodology within vocal pedagogy."
  },
  s2singers: {
    ja: ["マリオ・デル・モナコ（メロッキの代表的な体現者）", "マルチェロ・デル・モナコ", "（間接的な影響として）フランコ・コレッリ"],
    en: ["Mario Del Monaco (the method's foremost exponent)", "Marcello Del Monaco", "Franco Corelli (indirectly influenced)"]
  },
  // ===== ガルシア =====
  s3eyebrow: { ja: "THE BIRTH OF VOICE SCIENCE", en: "THE BIRTH OF VOICE SCIENCE", zh: "THE BIRTH OF VOICE SCIENCE", it: "THE BIRTH OF VOICE SCIENCE", de: "THE BIRTH OF VOICE SCIENCE", fr: "THE BIRTH OF VOICE SCIENCE", es: "THE BIRTH OF VOICE SCIENCE", ko: "THE BIRTH OF VOICE SCIENCE" },
  s3title: { ja: "マヌエル・ガルシアの発声理論", en: "Manuel García's Vocal Theory", zh: "曼努埃尔·加西亚的发声理论", it: "La teoria vocale di Manuel García", de: "Manuel Garcías Stimmtheorie", fr: "La théorie vocale de Manuel García", es: "La teoría vocal de Manuel García", ko: "마누엘 가르시아의 발성 이론" },
  s3subtitle: {
    ja: "喉頭鏡を発明し、声楽指導を経験則から観察科学へと転換させた先駆者",
    en: "The pioneer who invented the laryngoscope and transformed vocal pedagogy from folklore into observational science"
  },
  s3p1: {
    ja: "マヌエル・パトリシオ・ロドリゲス・ガルシア（Manuel Patricio Rodríguez García、1805–1906）は、スペイン出身のバリトン歌手であり、19世紀を代表する声楽教育者です。彼の最大の功績は、1854年から55年にかけて「喉頭鏡（laryngoscope）」を発明し、鏡と太陽光を使って、自分自身の声帯が振動する様子を史上初めて直接観察したことにあります。これにより声楽の指導は、感覚や比喩に頼るものから、解剖学的・生理学的な観察に基づく科学へと大きく踏み出しました。",
    en: "Manuel Patricio Rodríguez García (1805–1906) was a Spanish baritone and the leading vocal pedagogue of the 19th century. His greatest achievement was inventing the laryngoscope in 1854–55, becoming the first person in history to directly observe his own vibrating vocal folds using a mirror and sunlight. This marked a major step for vocal pedagogy, moving it from reliance on sensation and metaphor toward a science grounded in anatomical and physiological observation."
  },
  s3p2: {
    ja: "ガルシアはまた、著書『歌唱芸術大全（Traité complet de l'art du chant）』の中で「クー・ド・グロット（coup de la glotte、声門の一撃）」という概念を提唱しました。これは、発声の始まりにおいて声帯（声門）を正確かつ迅速に閉じることで、息漏れのない、明瞭でクリアな音の立ち上がりを得るための考え方です。この概念は発表以来、賛否の分かれる議論を呼び続けていますが、「声門がどのように閉じるか」という視点そのものを声楽理論に持ち込んだこと自体が、その後の発声研究の出発点になったと評価されています。",
    en: "In his treatise Traité complet de l'art du chant, García also proposed the concept of \"coup de la glotte\" (the glottal stroke) — the idea of achieving a clean, breath-free, clear tone onset by closing the vocal folds (glottis) precisely and swiftly at the start of phonation. This concept has remained controversial since it was first proposed, but the very act of bringing the question of \"how the glottis closes\" into vocal theory is credited as a starting point for later research into voice production."
  },
  s3callout: {
    ja: "ガルシアの教え子には、伝説的ソプラノのジェニー・リンドや、のちに一大声楽教育の系譜を築いたマティルデ・マルケージなどがいます。彼が切り拓いた「観察に基づく声楽科学」という発想は、現代の音声科学（voice science）や音声生理学の礎として、今日まで受け継がれています。",
    en: "García's students included the legendary soprano Jenny Lind and Mathilde Marchesi, who later built a major lineage of vocal pedagogy. The idea he pioneered — an observation-based vocal science — remains foundational to modern voice science and vocal physiology today."
  },
  // ===== ドイツリート =====
  s4eyebrow: { ja: "REPERTOIRE-DRIVEN TECHNIQUE", en: "REPERTOIRE-DRIVEN TECHNIQUE", zh: "REPERTOIRE-DRIVEN TECHNIQUE", it: "REPERTOIRE-DRIVEN TECHNIQUE", de: "REPERTOIRE-DRIVEN TECHNIQUE", fr: "REPERTOIRE-DRIVEN TECHNIQUE", es: "REPERTOIRE-DRIVEN TECHNIQUE", ko: "REPERTOIRE-DRIVEN TECHNIQUE" },
  s4title: { ja: "ドイツ歌曲（リート）を歌う際の技術", en: "Technique for Singing German Lieder", zh: "演唱德国艺术歌曲（Lied）的技术", it: "La tecnica per cantare il Lied tedesco", de: "Technik für das Singen deutscher Lieder", fr: "La technique pour chanter le lied allemand", es: "La técnica para cantar el lied alemán", ko: "독일 가곡(리트)을 부를 때의 기술" },
  s4subtitle: {
    ja: "大歌劇場ではなくサロンやリサイタルホールで育まれた、言葉に寄り添う声の使い方",
    en: "A way of using the voice that stays close to the words, cultivated in salons and recital halls rather than grand opera houses"
  },
  s4p1: {
    ja: "シューベルト、シューマン、ブラームス、ヴォルフらに代表されるドイツ・リートは、もともと大歌劇場ではなく、サロンやごく小さなリサイタルホールでピアノ一台とともに歌われることを前提に書かれています。そのため、オーケストラを突き抜けるための音量や、遠くの客席まで届く投射力よりも、詩の言葉そのものが持つ意味とニュアンスをいかに繊細に伝えるかが、技術の中心に置かれます。",
    en: "German Lieder, represented by Schubert, Schumann, Brahms, and Wolf, were originally written to be sung with a single piano in salons or very small recital halls, not grand opera houses. Because of this, the central technical concern is not volume to cut through an orchestra or projection to reach distant seats, but rather how delicately the meaning and nuance of the poetic text itself can be conveyed."
  },
  s4p2: {
    ja: "身体の使い方としては、胸声と頭声を混合させた「ミックスヴォイス（voix mixte）」や、息の量を絞った弱声（メッツァヴォーチェ）を自在に使い分け、ごく小さな音量の中でも音程と響きの芯を失わない制御力が求められます。また、ドイツ語特有の子音の明瞭な処理と、詩の韻律（プロソディ）を音楽的なフレーズの抑揚と一致させる感覚が重視され、シンガーズフォルマントに頼った「通る声」よりも、聴き手のすぐそばで語りかけるような、テキストと音楽が一体化した発声が理想とされます。",
    en: "Physically, this requires freely switching between \"mixed voice\" (voix mixte, blending chest and head registers) and a soft, breath-restrained mezza voce, with the control to keep pitch and tonal core intact even at very low volumes. Clear handling of German consonants and matching the poem's prosody to musical phrasing are also emphasized. Rather than a \"carrying\" voice reliant on the singer's formant, the ideal is a delivery where text and music become one, as if speaking intimately right beside the listener."
  },
  s4singers: {
    ja: ["ディートリヒ・フィッシャー=ディースカウ", "エリーザベト・シュヴァルツコップ", "クリスタ・ルートヴィヒ", "ハンス・ホッター"],
    en: ["Dietrich Fischer-Dieskau", "Elisabeth Schwarzkopf", "Christa Ludwig", "Hans Hotter"]
  },
  // ===== フランスメロディ =====
  s5eyebrow: { ja: "REPERTOIRE-DRIVEN TECHNIQUE", en: "REPERTOIRE-DRIVEN TECHNIQUE", zh: "REPERTOIRE-DRIVEN TECHNIQUE", it: "REPERTOIRE-DRIVEN TECHNIQUE", de: "REPERTOIRE-DRIVEN TECHNIQUE", fr: "REPERTOIRE-DRIVEN TECHNIQUE", es: "REPERTOIRE-DRIVEN TECHNIQUE", ko: "REPERTOIRE-DRIVEN TECHNIQUE" },
  s5title: { ja: "フランス歌曲（メロディ）を歌う際の技術", en: "Technique for Singing French Mélodie", zh: "演唱法国艺术歌曲（Mélodie）的技术", it: "La tecnica per cantare la mélodie francese", de: "Technik für das Singen französischer Mélodies", fr: "La technique pour chanter la mélodie française", es: "La técnica para cantar la mélodie francesa", ko: "프랑스 가곡(멜로디)을 부를 때의 기술" },
  s5subtitle: {
    ja: "フォーレ、ドビュッシー、デュパルクらの作品に求められる、母音の純度と語りの感覚",
    en: "Vowel purity and a sense of speech required by the works of Fauré, Debussy, and Duparc"
  },
  s5p1: {
    ja: "フォーレ、ドビュッシー、デュパルク、ラヴェルらによるフランス歌曲（メロディ）は、ドイツ・リート以上に親密で、詩と音楽の融合を追求した様式です。技術面でまず求められるのは、母音、とりわけ閉じた母音（é、u など）と、フランス語特有の鼻母音（an、on、in など）を、音色を崩さずに正確に発音する能力です。",
    en: "French mélodie by Fauré, Debussy, Duparc, and Ravel is even more intimate than German Lieder, pursuing a fusion of poetry and music. Technically, what is required first is the ability to pronounce vowels accurately without breaking tone color — especially closed vowels (é, u) and the nasal vowels unique to French (an, on, in)."
  },
  s5p2: {
    ja: "声のライン（ligne de chant）を滑らかに保ちながら、過度なヴィブラートを抑え、フレーズの終わりを重く着地させず軽く収める――これは、朗唱（デクラマシオン、déclamation）に近い性質を持つフランス的な歌唱美学を反映したものです。ドイツ・リートが言葉の意味と感情表現を前面に出す傾向があるのに対し、フランス・メロディはより抑制的で、詩の響きそのものの美しさ、音と言葉の質感を丁寧に磨き上げることに重きが置かれます。",
    en: "Keeping the vocal line (ligne de chant) smooth, restraining excess vibrato, and landing the end of a phrase lightly rather than heavily — this reflects a French singing aesthetic close in nature to declamation (déclamation). Where German Lieder tend to foreground the meaning and emotional expression of the words, French mélodie is more restrained, placing weight on carefully polishing the beauty of the poem's sound itself and the texture of words and music."
  },
  s5singers: {
    ja: ["ピエール・ベルナック", "ジェラール・スゼー", "レジーヌ・クレスパン", "フェリシティ・ロット"],
    en: ["Pierre Bernac", "Gérard Souzay", "Régine Crespin", "Felicity Lott"]
  },
  // ===== 関係性 =====
  s6eyebrow: { ja: "HOW THESE TRADITIONS RELATE", en: "HOW THESE TRADITIONS RELATE", zh: "HOW THESE TRADITIONS RELATE", it: "HOW THESE TRADITIONS RELATE", de: "HOW THESE TRADITIONS RELATE", fr: "HOW THESE TRADITIONS RELATE", es: "HOW THESE TRADITIONS RELATE", ko: "HOW THESE TRADITIONS RELATE" },
  s6title: { ja: "それぞれの流派の関係性", en: "How These Traditions Relate", zh: "各流派之间的关系", it: "Come si relazionano queste tradizioni", de: "Wie diese Traditionen zusammenhängen", fr: "Comment ces traditions se rejoignent", es: "Cómo se relacionan estas tradiciones", ko: "각 유파의 관계성" },
  s6p1: {
    ja: "ガルシアが切り拓いた「観察に基づく声楽科学」は、特定の様式ではなく、あらゆる声楽指導の土台となる方法論的な転換点でした。伝統的なベルカントは、その科学的視点が確立される以前から経験的に磨かれてきた様式であり、メロッキ・メソッドは、その中でも特にドラマティックな声を求める潮流が、喉頭位置という一点を極端に強調する形で20世紀に枝分かれしたものと捉えることができます。",
    en: "The observation-based vocal science pioneered by García was not a specific style, but a methodological turning point underlying all vocal pedagogy. Traditional bel canto is a style refined empirically before that scientific viewpoint was established, while the Melocchi Method can be seen as a 20th-century offshoot of the current within it seeking especially dramatic voices, taking the single factor of laryngeal position to an extreme."
  },
  s6p2: {
    ja: "一方、ドイツ・リートとフランス・メロディの技術は、「どの流派に属するか」というより、「どのホールで、どんな伴奏編成で、どの言語の詩を歌うか」というレパートリーそのものの要求から導き出された、実践的な適応と見ることができます。オペラで鍛えられた声の土台の上に、それぞれの言語とレパートリーが求める繊細さを重ねていく――多くの声楽家にとって、これらは対立する選択肢ではなく、重なり合う技術の層なのです。",
    en: "The techniques of German Lieder and French mélodie, meanwhile, can be seen less as belonging to one \"school\" and more as practical adaptations drawn from the demands of the repertoire itself — which hall, which accompanying forces, which language's poetry. Layering the delicacy each language and repertoire demands onto a vocal foundation built through opera — for many singers, these are not opposing choices, but overlapping layers of technique."
  },
  // ===== 用語集 =====
  glossaryEyebrow: { ja: "GLOSSARY", en: "GLOSSARY", zh: "GLOSSARY", it: "GLOSSARY", de: "GLOSSARY", fr: "GLOSSARY", es: "GLOSSARY", ko: "GLOSSARY" },
  glossaryTitle: { ja: "専門用語まとめ", en: "Glossary of Terms", zh: "术语汇总", it: "Glossario dei termini", de: "Glossar der Begriffe", fr: "Glossaire des termes", es: "Glosario de términos", ko: "전문 용어 정리" },
  g1term: { ja: "アッポッジョ", en: "Appoggio", zh: "支持法（Appoggio）", it: "Appoggio", de: "Appoggio", fr: "Appoggio", es: "Appoggio", ko: "아포조" },
  g1def: {
    ja: "横隔膜と肋骨の拡張状態をできるだけ長く保ちながら息を送り出す、支えの考え方。イタリア語で「支える」の意。",
    en: "The idea of breath support: sending out breath while keeping the diaphragm and ribs expanded for as long as possible. Italian for \"to support.\""
  },
  g2term: { ja: "キアロスクーロ", en: "Chiaro-scuro", zh: "明暗（Chiaro-scuro）", it: "Chiaroscuro", de: "Chiaroscuro", fr: "Chiaroscuro", es: "Claroscuro", ko: "키아로스쿠로" },
  g2def: {
    ja: "声に明るさ（chiaro）と暗さ・深み（oscuro）を同時に持たせる、ベルカントの音色バランスの考え方。",
    en: "The bel canto concept of tonal balance: giving the voice both brightness (chiaro) and darkness/depth (oscuro) at the same time."
  },
  g3term: { ja: "パッサッジョ", en: "Passaggio", zh: "换声点（Passaggio）", it: "Passaggio", de: "Passaggio", fr: "Passaggio", es: "Passaggio", ko: "파사조" },
  g3def: {
    ja: "胸声・ミックス・頭声など、声区が移行するポイント。この前後で音色や発声の仕組みが変化する。",
    en: "The point where vocal registers transition — chest, mixed, head voice, and so on. Tone color and vocal mechanics shift around this point."
  },
  g4term: { ja: "シンガーズフォルマント", en: "Singer's Formant", zh: "歌手共振峰", it: "Formante del cantante", de: "Sängerformant", fr: "Formant du chanteur", es: "Formante del cantante", ko: "싱어즈 포먼트" },
  g4def: {
    ja: "2800〜3200Hz付近に現れる倍音エネルギーの集積。訓練された声がオーケストラを超えて届く音響的な鍵とされる。",
    en: "A concentration of overtone energy appearing around 2800–3200 Hz. Considered the acoustic key to how a trained voice carries over an orchestra."
  },
  g5term: { ja: "クー・ド・グロット", en: "Coup de la Glotte", zh: "声门冲击（Coup de la glotte）", it: "Colpo di glottide", de: "Coup de la glotte", fr: "Coup de la glotte", es: "Golpe de glotis", ko: "쿠 드 글로트" },
  g5def: {
    ja: "声門を正確かつ迅速に閉じることで、息漏れのない明瞭な音の立ち上がりを得る考え方。マヌエル・ガルシアが提唱。",
    en: "The idea of achieving a clean, breath-free tone onset by closing the glottis precisely and swiftly. Proposed by Manuel García."
  },
  g6term: { ja: "ミックスヴォイス（ヴォワ・ミクスト）", en: "Mixed Voice (Voix Mixte)", zh: "混声（Voix mixte）", it: "Voce mista (voix mixte)", de: "Mischstimme (voix mixte)", fr: "Voix mixte", es: "Voz mixta (voix mixte)", ko: "믹스 보이스(부아 믹스트)" },
  g6def: {
    ja: "胸声と頭声を混合させた声区。中間的な音域で音色の断絶を避けるために用いられる。",
    en: "A vocal register blending chest and head voice, used to avoid a tonal break in the middle range."
  },
  g7term: { ja: "メッツァヴォーチェ", en: "Mezza Voce", zh: "半声（Mezza voce）", it: "Mezza voce", de: "Mezza voce", fr: "Mezza voce", es: "Mezza voce", ko: "메차보체" },
  g7def: {
    ja: "息の量を絞った弱声。小さな音量でも音程と響きの芯を保つ制御力が求められる。",
    en: "A soft voice with restrained breath flow. Requires the control to keep pitch and tonal core intact even at low volume."
  },
  g8term: { ja: "アッフォンド", en: "Affondo", zh: "沉喉法（Affondo）", it: "Affondo", de: "Affondo", fr: "Affondo", es: "Affondo", ko: "아폰도" },
  g8def: {
    ja: "イタリア語で「沈み込ませる」の意。メロッキ・メソッドにおいて喉頭を意図的に深く下げる操作を指す。",
    en: "Italian for \"sinking\" or \"plunging.\" Refers to the deliberate, deep lowering of the larynx in the Melocchi Method."
  },
  g9term: { ja: "声道", en: "Vocal Tract", zh: "声道", it: "Tratto vocale", de: "Vokaltrakt", fr: "Conduit vocal", es: "Tracto vocal", ko: "성도(보컬 트랙트)" },
  g9def: {
    ja: "声帯から唇までの空間全体。その長さと形状が、声の共鳴（倍音構成）を決定づける。",
    en: "The entire space from the vocal folds to the lips. Its length and shape determine the voice's resonance (overtone structure)."
  },
  footer: {
    ja: "主な参考: Sundberg, J. (1974, 1987) の singer's formant に関する一連の研究／Müller et al. (2022) 声種別シンガーズフォルマント中心周波数の報告／Bloothooft & Plomp (1986) 音圧レベルとシンガーズフォルマントの関係／García, M. (1840–47) Traité complet de l'art du chant／Arturo Melocchi の指導法に関する歴史的記述（Del Monaco家および同時代証言に基づく）。本ページは声楽史・声楽教育に関する一般的な知見をまとめたものであり、特定の指導法を推奨するものではありません。",
    en: "Main references: Sundberg, J. (1974, 1987), a series of studies on the singer's formant / Müller et al. (2022), reported center frequencies of the singer's formant by voice type / Bloothooft & Plomp (1986), the relationship between sound pressure level and singer's formant / García, M. (1840–47), Traité complet de l'art du chant / historical accounts of Arturo Melocchi's pedagogy (based on the Del Monaco family and contemporary testimony). This page summarizes general knowledge on vocal history and pedagogy and does not recommend any specific method."
  },
  langLabel: { ja: "言語", en: "Language", zh: "语言", it: "Lingua", de: "Sprache", fr: "Langue", es: "Idioma", ko: "언어" }
};

function tr(key, lang) {
  const entry = T[key];
  if (!entry) return "";
  return entry[lang] || entry.en || entry.ja || "";
}
function trList(key, lang) {
  const entry = T[key];
  if (!entry) return [];
  return entry[lang] || entry.en || entry.ja || [];
}

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

function SingerList({ names, label }) {
  return (
    <p style={{ marginTop: 14, fontSize: 13.5, color: C.inkSoft }}>
      <span style={{ fontWeight: 600, color: C.ink }}>{label}　</span>
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

export default function VocalTheoryPage({ searchParams }) {
  const lang = LANGS.some((l) => l.code === searchParams?.lang) ? searchParams.lang : "ja";
  const glossaryIds = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px 96px", lineHeight: 1.8, fontSize: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <p style={{ fontSize: 11.5, letterSpacing: "0.14em", color: C.gold, fontWeight: 700, margin: 0 }}>
          {tr("eyebrow", lang)}
        </p>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {LANGS.map((l) => (
            <a
              key={l.code}
              href={`/vocal-theory?lang=${l.code}`}
              style={{
                fontSize: 11, padding: "3px 8px", borderRadius: 999,
                border: `1px solid ${lang === l.code ? C.curtain : C.line}`,
                background: lang === l.code ? C.curtain : "transparent",
                color: lang === l.code ? "#FFFDF8" : C.inkSoft,
                textDecoration: "none"
              }}
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>

      <h1 className="ff-display italic" style={{ fontSize: "2.6rem", color: C.curtain, margin: "10px 0 0", lineHeight: 1.2 }}>
        {tr("title", lang)}
      </h1>
      <p style={{ color: C.inkSoft, marginTop: 16, lineHeight: 1.9 }}>
        {tr("intro", lang)}
      </p>

      {/* ベルカント */}
      <Section eyebrow={tr("s1eyebrow", lang)} title={tr("s1title", lang)} subtitle={tr("s1subtitle", lang)}>
        <p>{tr("s1p1", lang)}</p>
        <p>{tr("s1p2", lang)}</p>
        <Callout>{tr("s1callout", lang)}</Callout>
        <SingerList names={trList("s1singers", lang)} label={tr("singersLabel", lang)} />
      </Section>

      {/* メロッキ */}
      <Section eyebrow={tr("s2eyebrow", lang)} title={tr("s2title", lang)} subtitle={tr("s2subtitle", lang)} accent={C.rust}>
        <p>{tr("s2p1", lang)}</p>
        <p>{tr("s2p2", lang)}</p>
        <SingerList names={trList("s2singers", lang)} label={tr("singersLabel", lang)} />
      </Section>

      {/* ガルシア */}
      <Section eyebrow={tr("s3eyebrow", lang)} title={tr("s3title", lang)} subtitle={tr("s3subtitle", lang)} accent={C.sage}>
        <p>{tr("s3p1", lang)}</p>
        <p>{tr("s3p2", lang)}</p>
        <Callout>{tr("s3callout", lang)}</Callout>
      </Section>

      {/* ドイツ歌曲 */}
      <Section eyebrow={tr("s4eyebrow", lang)} title={tr("s4title", lang)} subtitle={tr("s4subtitle", lang)}>
        <p>{tr("s4p1", lang)}</p>
        <p>{tr("s4p2", lang)}</p>
        <SingerList names={trList("s4singers", lang)} label={tr("singersLabel", lang)} />
      </Section>

      {/* フランス歌曲 */}
      <Section eyebrow={tr("s5eyebrow", lang)} title={tr("s5title", lang)} subtitle={tr("s5subtitle", lang)}>
        <p>{tr("s5p1", lang)}</p>
        <p>{tr("s5p2", lang)}</p>
        <SingerList names={trList("s5singers", lang)} label={tr("singersLabel", lang)} />
      </Section>

      {/* 流派の関係性 */}
      <Section eyebrow={tr("s6eyebrow", lang)} title={tr("s6title", lang)} accent={C.gold}>
        <p>{tr("s6p1", lang)}</p>
        <p>{tr("s6p2", lang)}</p>
      </Section>

      {/* 用語集 */}
      <Section eyebrow={tr("glossaryEyebrow", lang)} title={tr("glossaryTitle", lang)} accent={C.sage}>
        <div>
          {glossaryIds.map((n) => (
            <GlossaryItem key={n} term={tr(`g${n}term`, lang)} reading={lang === "ja" ? T[`g${n}term`].en : null}>
              {tr(`g${n}def`, lang)}
            </GlossaryItem>
          ))}
        </div>
      </Section>

      <p style={{ marginTop: 56, fontSize: 11.5, color: C.inkSoft, borderTop: `1px solid ${C.line}`, paddingTop: 20, lineHeight: 1.8 }}>
        {tr("footer", lang)}
      </p>
    </main>
  );
}
