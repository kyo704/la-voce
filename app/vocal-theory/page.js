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
    en: "Vocal technique has no single \"correct answer\" — it has developed differently across eras, countries, and repertoires. This page looks at traditional bel canto, the Melocchi Method that developed its own path in 20th-century Italy, the scientific approach of Manuel García that laid the foundation of modern vocal theory, and the technique required for singing German Lieder and French mélodie — focusing on the resulting sound and the underlying body mechanics for each. Rather than practice methods themselves, the focus is on the character of sound each school aims for, and the thinking behind the physical use of the body.",
    zh: "声乐技巧并没有单一的\"正确答案\"，而是随着时代、国家和演唱曲目的不同而发展出各异的路径。本页聚焦于传统美声唱法（bel canto）、20世纪意大利独自发展出的梅洛基发声法、为现代声乐理论奠定基础的曼努埃尔·加西亚的科学方法，以及演唱德国艺术歌曲与法国艺术歌曲所需的技巧——重点在于每种流派\"作为结果呈现出来的声音与身体机制\"。这里关注的不是练习方法本身，而是各流派所追求的声音特质，以及其背后身体运用方式的思考。",
    it: "La tecnica vocale non ha un'unica \"risposta corretta\": si è sviluppata diversamente a seconda delle epoche, dei paesi e dei repertori. Questa pagina esamina il bel canto tradizionale, il Metodo Melocchi sviluppatosi autonomamente nell'Italia del XX secolo, l'approccio scientifico di Manuel García che ha posto le basi della moderna teoria vocale, e la tecnica richiesta per cantare il Lied tedesco e la mélodie francese — concentrandosi sul suono risultante e sulla meccanica corporea sottostante a ciascuno. Piuttosto che sui metodi di pratica in sé, l'attenzione è rivolta al carattere del suono a cui ogni scuola aspira e al pensiero alla base dell'uso fisico del corpo.",
    de: "Gesangstechnik hat keine einzige „richtige Antwort\" — sie hat sich je nach Epoche, Land und Repertoire unterschiedlich entwickelt. Diese Seite betrachtet das traditionelle Belcanto, die Melocchi-Methode, die im Italien des 20. Jahrhunderts einen eigenen Weg entwickelte, den wissenschaftlichen Ansatz von Manuel García, der die Grundlage der modernen Stimmtheorie legte, sowie die Technik, die zum Singen deutscher Lieder und französischer Mélodies erforderlich ist — mit Fokus auf den resultierenden Klang und die zugrunde liegende Körpermechanik. Statt der Übungsmethoden selbst steht der Charakter des Klangs im Mittelpunkt, den jede Schule anstrebt, sowie das Denken hinter dem körperlichen Einsatz.",
    fr: "La technique vocale n'a pas de « réponse unique » — elle s'est développée différemment selon les époques, les pays et les répertoires. Cette page examine le bel canto traditionnel, la méthode Melocchi qui a suivi sa propre voie dans l'Italie du XXe siècle, l'approche scientifique de Manuel García qui a posé les fondations de la théorie vocale moderne, ainsi que la technique requise pour chanter le lied allemand et la mélodie française — en se concentrant sur le son qui en résulte et la mécanique corporelle sous-jacente à chacun. Plutôt que les méthodes de travail elles-mêmes, l'accent est mis sur le caractère du son que chaque école recherche, et la réflexion derrière l'utilisation physique du corps.",
    es: "La técnica vocal no tiene una única \"respuesta correcta\": se ha desarrollado de forma diferente según la época, el país y el repertorio. Esta página examina el bel canto tradicional, el Método Melocchi que desarrolló su propio camino en la Italia del siglo XX, el enfoque científico de Manuel García que sentó las bases de la teoría vocal moderna, y la técnica necesaria para cantar el lied alemán y la mélodie francesa, centrándose en el sonido resultante y la mecánica corporal subyacente de cada uno. En lugar de los métodos de práctica en sí, el enfoque está en el carácter del sonido que busca cada escuela y el pensamiento detrás del uso físico del cuerpo.",
    ko: "성악 기법에는 단 하나의 \"정답\"이 있는 것이 아니라, 시대와 국가, 부르는 레퍼토리에 따라 각기 다른 방식으로 발전해 왔습니다. 이 페이지에서는 전통적인 벨칸토, 20세기 이탈리아에서 독자적으로 발전한 멜로키 메소드, 근대 발성 이론의 토대를 쌓은 마누엘 가르시아의 과학적 접근, 그리고 독일 가곡과 프랑스 가곡을 부를 때 요구되는 기술에 대해, 각각 \"결과로 나타나는 목소리와 신체 메커니즘\"을 중심으로 정리했습니다. 연습 방법 자체가 아니라 각 유파가 지향하는 소리의 성질과 그 배경에 있는 신체 사용법에 대한 사고방식에 초점을 맞추고 있습니다.",
  },
  // ===== ベルカント =====
  s1eyebrow: { ja: "TRADITIONAL TECHNIQUE", en: "TRADITIONAL TECHNIQUE", zh: "TRADITIONAL TECHNIQUE", it: "TRADITIONAL TECHNIQUE", de: "TRADITIONAL TECHNIQUE", fr: "TRADITIONAL TECHNIQUE", es: "TRADITIONAL TECHNIQUE", ko: "TRADITIONAL TECHNIQUE" },
  s1title: { ja: "伝統的なベルカント", en: "Traditional Bel Canto", zh: "传统美声唱法（Bel Canto）", it: "Il bel canto tradizionale", de: "Traditionelles Belcanto", fr: "Le bel canto traditionnel", es: "El bel canto tradicional", ko: "전통적인 벨칸토" },
  s1subtitle: {
    ja: "17〜19世紀のイタリアに起源を持つ、声楽の基層をなす様式",
    en: "The foundational style of Western singing, originating in 17th–19th century Italy",
    zh: "起源于17至19世纪意大利，构成声乐基础的样式",
    it: "Lo stile fondamentale del canto, con origini nell'Italia dei secoli XVII–XIX",
    de: "Der grundlegende Gesangsstil mit Ursprung im Italien des 17.–19. Jahrhunderts",
    fr: "Le style fondamental du chant, originaire de l'Italie des XVIIe–XIXe siècles",
    es: "El estilo fundamental del canto, originario de la Italia de los siglos XVII–XIX",
    ko: "17~19세기 이탈리아에 기원을 둔, 성악의 기층을 이루는 양식",
  },
  s1p1: {
    ja: "ベルカント（belcanto、「美しい歌」の意）は、特定の一人の創始者を持つ技法ではなく、ロッシーニ、ベッリーニ、ドニゼッティらの時代を通じて磨かれていった、イタリア語の発声原理に基づく歌唱様式の総称です。その核にあるのは、声域全体を通じて途切れることのない滑らかな声のライン（レガート）と、「キアロスクーロ（chiaro-scuro、明暗）」と呼ばれる音色の考え方です。これは、声に明るさ（chiaro）と暗さ・深み（oscuro）の両方を同時に持たせるバランス感覚を指し、単に明るいだけでも、暗いだけでもない、芯のある響きを生み出す土台になっています。",
    en: "Bel canto (\"beautiful singing\") is not a technique with a single founder, but a general term for a style of singing based on Italian vocal principles, refined across the eras of Rossini, Bellini, and Donizetti. At its core are an unbroken, smooth vocal line (legato) across the whole range, and a tonal concept called \"chiaro-scuro\" (light-dark). This refers to a balance that gives the voice both brightness (chiaro) and darkness/depth (oscuro) at once — the foundation of a resonance that is neither merely bright nor merely dark, but has a solid core.",
    zh: "美声唱法（belcanto，意为\"美丽的歌唱\"）并非由某一人所创立的技法，而是在罗西尼、贝里尼、多尼采蒂等人的时代中不断磨砺、以意大利语发声原理为基础的歌唱样式总称。其核心在于贯穿整个音域、毫不间断的圆滑声线（连音），以及被称为\"明暗（chiaro-scuro）\"的音色理念。这指的是让声音同时兼具明亮（chiaro）与暗沉、深邃（oscuro）的平衡感，是既非单纯明亮、也非单纯暗沉、而具有芯的共鸣的基础。",
    it: "Il bel canto (\"canto bello\") non è una tecnica con un unico fondatore, ma un termine generale per uno stile di canto basato sui principi vocali italiani, affinato attraverso le epoche di Rossini, Bellini e Donizetti. Al suo centro vi sono una linea vocale fluida e ininterrotta (legato) su tutta l'estensione, e un concetto timbrico chiamato \"chiaro-scuro\". Questo si riferisce a un equilibrio che dona alla voce sia luminosità (chiaro) sia oscurità/profondità (oscuro) insieme — la base di una risonanza che non è né semplicemente chiara né semplicemente scura, ma possiede un nucleo solido.",
    de: "Belcanto („schöner Gesang\") ist keine Technik mit einem einzigen Begründer, sondern ein Sammelbegriff für einen Gesangsstil, der auf italienischen Stimmprinzipien beruht und über die Epochen von Rossini, Bellini und Donizetti hinweg verfeinert wurde. Im Zentrum stehen eine ununterbrochene, geschmeidige Gesangslinie (Legato) über den gesamten Umfang sowie ein Klangkonzept namens „Chiaroscuro\" (Hell-Dunkel). Dies bezeichnet eine Balance, die der Stimme gleichzeitig Helligkeit (chiaro) und Dunkelheit/Tiefe (oscuro) verleiht — die Grundlage einer Resonanz, die weder nur hell noch nur dunkel ist, sondern einen soliden Kern besitzt.",
    fr: "Le bel canto (« beau chant ») n'est pas une technique ayant un seul fondateur, mais un terme général désignant un style de chant fondé sur les principes vocaux italiens, affiné à travers les époques de Rossini, Bellini et Donizetti. En son cœur se trouvent une ligne vocale ininterrompue et fluide (legato) sur toute la tessiture, et une notion timbrique appelée « chiaro-scuro » (clair-obscur). Cela désigne un équilibre donnant à la voix à la fois luminosité (chiaro) et obscurité/profondeur (oscuro) — le fondement d'une résonance qui n'est ni simplement claire ni simplement sombre, mais possède un noyau solide.",
    es: "El bel canto (\"canto bello\") no es una técnica con un único fundador, sino un término general para un estilo de canto basado en los principios vocales italianos, refinado a lo largo de las épocas de Rossini, Bellini y Donizetti. En su núcleo están una línea vocal fluida e ininterrumpida (legato) en todo el registro, y un concepto tímbrico llamado \"chiaroscuro\" (claroscuro). Esto se refiere a un equilibrio que da a la voz tanto luminosidad (chiaro) como oscuridad/profundidad (oscuro) a la vez, la base de una resonancia que no es simplemente clara ni simplemente oscura, sino que posee un núcleo sólido.",
    ko: "벨칸토(belcanto, \"아름다운 노래\"라는 뜻)는 특정한 한 사람의 창시자가 있는 기법이 아니라, 로시니, 벨리니, 도니체티 등의 시대를 거치며 다듬어진, 이탈리아어 발성 원리에 기반한 가창 양식의 총칭입니다. 그 핵심에는 음역 전체를 관통하는 끊김 없이 매끄러운 소리의 선(레가토)과, \"키아로스쿠로(chiaro-scuro, 명암)\"라 불리는 음색에 대한 사고방식이 있습니다. 이는 목소리에 밝음(chiaro)과 어둠·깊이(oscuro)를 동시에 지니게 하는 균형 감각을 가리키며, 단순히 밝기만 하지도 어둡기만 하지도 않은, 심지가 있는 울림을 만들어내는 토대가 됩니다.",
  },
  s1p2: {
    ja: "身体の使い方としては、横隔膜と肋骨の拡張状態をできるだけ長く保ちながら息を送り出す「アッポッジョ（appoggio、支え）」という考え方が中心に置かれます。これにより、声帯にかかる息の圧力が安定し、声区の変わり目（パッサッジョ）を、音色を大きく変えることなく滑らかに通過できるようになります。",
    en: "In terms of physical technique, the central idea is \"appoggio\" (support) — sending out breath while keeping the diaphragm and ribs expanded for as long as possible. This stabilizes the breath pressure on the vocal folds, allowing the singer to move smoothly through register transitions (passaggio) without a major shift in tone color.",
    zh: "在身体运用方面，核心理念是\"支持法（appoggio）\"——尽可能长时间地保持横膈膜与肋骨的扩张状态、同时将气息送出。这样可以稳定作用于声带的气压，使换声点（passaggio）前后能够在不大幅改变音色的情况下平滑过渡。",
    it: "Per quanto riguarda l'uso del corpo, l'idea centrale è l'\"appoggio\" — emettere il respiro mantenendo il diaframma e le costole espansi il più a lungo possibile. Questo stabilizza la pressione del respiro sulle corde vocali, permettendo di attraversare senza problemi il cambio di registro (passaggio) senza un grande cambiamento nel colore del suono.",
    de: "In Bezug auf den Körpereinsatz steht die Idee des „Appoggio\" (Stütze) im Zentrum — Atem auszusenden, während Zwerchfell und Rippen so lange wie möglich ausgedehnt gehalten werden. Dies stabilisiert den Atemdruck auf den Stimmlippen und ermöglicht ein reibungsloses Durchqueren des Registerwechsels (Passaggio), ohne die Klangfarbe wesentlich zu verändern.",
    fr: "En matière d'utilisation du corps, l'idée centrale est l'« appoggio » (appui) — émettre le souffle en maintenant le diaphragme et les côtes étendus aussi longtemps que possible. Cela stabilise la pression du souffle sur les cordes vocales, permettant de traverser en douceur le passage entre les registres (passaggio) sans changement majeur de couleur vocale.",
    es: "En cuanto al uso del cuerpo, la idea central es el \"appoggio\" (apoyo) — emitir el aliento manteniendo el diafragma y las costillas expandidos el mayor tiempo posible. Esto estabiliza la presión del aire sobre las cuerdas vocales, permitiendo atravesar suavemente el cambio de registro (passaggio) sin un gran cambio en el color del sonido.",
    ko: "신체 사용법 면에서는, 횡격막과 늑골의 확장 상태를 가능한 한 오래 유지하면서 숨을 내보내는 \"아포조(appoggio, 지지)\"라는 개념이 중심에 놓입니다. 이를 통해 성대에 가해지는 호흡 압력이 안정되어, 음역이 바뀌는 지점(파사조)을 음색을 크게 바꾸지 않고도 매끄럽게 통과할 수 있게 됩니다.",
  },
  s1callout: {
    ja: "この様式の声が大編成のオーケストラを伴っても客席の奥まで届く理由は、感覚的な「気合い」だけでは説明できません。スウェーデンの音声科学者ヨハン・スンドベリ（Johan Sundberg）らの研究により、訓練された声には2800〜3200Hz付近に倍音のエネルギーが集中する「シンガーズフォルマント」が現れることが分かっています。オーケストラの音響エネルギーは概ね500Hz付近をピークに高い周波数ほど減衰していくため、この帯域にエネルギーを持つ声は、音量そのものを上げなくても、オーケストラの音の「上」を通って客席に届きます。声区や声種によって中心周波数は異なり、バスで約2384Hz、バリトンで約2454Hz、テノールで約2705Hz、ソプラノで約3092Hzという報告もあります（Müller et al., 2022）。",
    en: "The fact that this style of voice can reach the back of the hall even over a full orchestra cannot be explained by sheer willpower alone. Research by the Swedish voice scientist Johan Sundberg and others has shown that trained voices produce a \"singer's formant\" — a concentration of overtone energy around 2800–3200 Hz. Since orchestral sound energy peaks around 500 Hz and falls off at higher frequencies, a voice with energy in this band can be heard over the orchestra without simply singing louder. The center frequency varies by voice type: roughly 2384 Hz for bass, 2454 Hz for baritone, 2705 Hz for tenor, and 3092 Hz for soprano, according to one report (Müller et al., 2022).",
    zh: "这种唱法即使伴随大编制管弦乐团，声音也能传到观众席深处，其原因不能仅用感觉上的\"气势\"来解释。瑞典嗓音科学家约翰·桑德伯格（Johan Sundberg）等人的研究表明，经过训练的嗓音会在2800～3200Hz附近出现泛音能量集中的\"歌手共振峰\"。由于管弦乐团的声学能量大致在500Hz附近达到峰值、频率越高衰减越大，因此在这一频段拥有能量的嗓音，即使不提高音量本身，也能\"越过\"乐团的声音传到观众席。中心频率因声区和声种而异，据报告，男低音约为2384Hz、男中音约为2454Hz、男高音约为2705Hz、女高音约为3092Hz（Müller et al., 2022）。",
    it: "Il motivo per cui questo stile di voce riesce a raggiungere il fondo della sala anche con un'orchestra al completo non può essere spiegato solo dalla \"grinta\" percepita. Le ricerche del fonetista svedese Johan Sundberg e altri hanno dimostrato che le voci allenate producono un \"formante del cantante\" — una concentrazione di energia armonica intorno ai 2800–3200 Hz. Poiché l'energia sonora orchestrale raggiunge il picco intorno ai 500 Hz e diminuisce alle frequenze più alte, una voce con energia in questa banda può essere udita sopra l'orchestra senza semplicemente cantare più forte. La frequenza centrale varia a seconda del tipo di voce: circa 2384 Hz per il basso, 2454 Hz per il baritono, 2705 Hz per il tenore e 3092 Hz per il soprano, secondo un rapporto (Müller et al., 2022).",
    de: "Der Grund, warum diese Gesangsart selbst mit einem vollen Orchester bis zum hinteren Ende des Saals durchdringt, lässt sich nicht allein durch gefühlten „Elan\" erklären. Forschungen des schwedischen Stimmwissenschaftlers Johan Sundberg und anderer haben gezeigt, dass trainierte Stimmen einen „Sängerformanten\" erzeugen — eine Konzentration von Obertonenergie um 2800–3200 Hz. Da die Klangenergie des Orchesters bei etwa 500 Hz ihren Höhepunkt erreicht und bei höheren Frequenzen abfällt, kann eine Stimme mit Energie in diesem Band über dem Orchester gehört werden, ohne einfach lauter zu singen. Die Mittenfrequenz variiert je nach Stimmtyp: etwa 2384 Hz für Bass, 2454 Hz für Bariton, 2705 Hz für Tenor und 3092 Hz für Sopran, laut einem Bericht (Müller et al., 2022).",
    fr: "La raison pour laquelle ce style de voix parvient à atteindre le fond de la salle même avec un grand orchestre ne peut s'expliquer par la seule « fougue » ressentie. Les recherches du phonéticien suédois Johan Sundberg et d'autres ont montré que les voix entraînées produisent un « formant du chanteur » — une concentration d'énergie harmonique autour de 2800–3200 Hz. Comme l'énergie sonore orchestrale culmine autour de 500 Hz et diminue aux fréquences plus élevées, une voix possédant de l'énergie dans cette bande peut être entendue par-dessus l'orchestre sans simplement chanter plus fort. La fréquence centrale varie selon le type de voix : environ 2384 Hz pour la basse, 2454 Hz pour le baryton, 2705 Hz pour le ténor et 3092 Hz pour la soprano, selon un rapport (Müller et al., 2022).",
    es: "La razón por la que este estilo de voz logra llegar hasta el fondo de la sala incluso con una orquesta completa no puede explicarse solo por el \"ímpetu\" sentido. Investigaciones del científico vocal sueco Johan Sundberg y otros han demostrado que las voces entrenadas producen un \"formante del cantante\" — una concentración de energía armónica alrededor de 2800–3200 Hz. Dado que la energía sonora orquestal alcanza su pico alrededor de 500 Hz y disminuye en frecuencias más altas, una voz con energía en esta banda puede oírse por encima de la orquesta sin simplemente cantar más fuerte. La frecuencia central varía según el tipo de voz: aproximadamente 2384 Hz para bajo, 2454 Hz para barítono, 2705 Hz para tenor y 3092 Hz para soprano, según un informe (Müller et al., 2022).",
    ko: "이러한 양식의 목소리가 대편성 오케스트라를 동반하고도 객석 깊숙한 곳까지 전달되는 이유는 감각적인 \"기합\"만으로는 설명할 수 없습니다. 스웨덴의 음성 과학자 요한 순드베리(Johan Sundberg) 등의 연구에 따르면, 훈련된 목소리에는 2800~3200Hz 부근에 배음 에너지가 집중되는 \"싱어즈 포먼트\"가 나타난다는 것이 밝혀졌습니다. 오케스트라의 음향 에너지는 대체로 500Hz 부근을 정점으로 주파수가 높아질수록 감쇠하기 때문에, 이 대역에 에너지를 가진 목소리는 음량 자체를 높이지 않아도 오케스트라 소리의 \"위\"를 뚫고 객석에 전달됩니다. 음역과 성종에 따라 중심 주파수는 다르며, 베이스는 약 2384Hz, 바리톤은 약 2454Hz, 테너는 약 2705Hz, 소프라노는 약 3092Hz라는 보고도 있습니다(Müller et al., 2022).",
  },
  singersLabel: { ja: "代表的な歌手", en: "Representative singers", zh: "代表歌唱家", it: "Cantanti rappresentativi", de: "Repräsentative Sänger", fr: "Chanteurs représentatifs", es: "Cantantes representativos", ko: "대표 성악가" },
  s1singers: {
    ja: ["エンリコ・カルーソ", "ルチアーノ・パヴァロッティ", "マリア・カラス", "ジョーン・サザーランド", "カルロ・ベルゴンツィ", "ルイジ・アルヴァ"],
    en: ["Enrico Caruso", "Luciano Pavarotti", "Maria Callas", "Joan Sutherland", "Carlo Bergonzi", "Luigi Alva"],
    zh: ["恩里科·卡鲁索", "卢奇亚诺·帕瓦罗蒂", "玛丽亚·卡拉斯", "琼·萨瑟兰", "卡洛·贝尔冈齐", "路易吉·阿尔瓦"],
    it: ["Enrico Caruso", "Luciano Pavarotti", "Maria Callas", "Joan Sutherland", "Carlo Bergonzi", "Luigi Alva"],
    de: ["Enrico Caruso", "Luciano Pavarotti", "Maria Callas", "Joan Sutherland", "Carlo Bergonzi", "Luigi Alva"],
    fr: ["Enrico Caruso", "Luciano Pavarotti", "Maria Callas", "Joan Sutherland", "Carlo Bergonzi", "Luigi Alva"],
    es: ["Enrico Caruso", "Luciano Pavarotti", "Maria Callas", "Joan Sutherland", "Carlo Bergonzi", "Luigi Alva"],
    ko: ["엔리코 카루소", "루치아노 파바로티", "마리아 칼라스", "존 서덜랜드", "카를로 베르곤치", "루이지 알바"],
  },
  // ===== メロッキ =====
  s2eyebrow: { ja: "A 20TH-CENTURY DEPARTURE", en: "A 20TH-CENTURY DEPARTURE", zh: "A 20TH-CENTURY DEPARTURE", it: "A 20TH-CENTURY DEPARTURE", de: "A 20TH-CENTURY DEPARTURE", fr: "A 20TH-CENTURY DEPARTURE", es: "A 20TH-CENTURY DEPARTURE", ko: "A 20TH-CENTURY DEPARTURE" },
  s2title: { ja: "メロッキ・メソッド", en: "The Melocchi Method", zh: "梅洛基发声法", it: "Il Metodo Melocchi", de: "Die Melocchi-Methode", fr: "La méthode Melocchi", es: "El método Melocchi", ko: "멜로키 메소드" },
  s2subtitle: {
    ja: "喉頭の位置を技術の出発点に据えた、20世紀イタリアの声楽教師アルトゥーロ・メロッキの方法論",
    en: "The pedagogy of Arturo Melocchi, a 20th-century Italian voice teacher who made laryngeal position the starting point of technique",
    zh: "将喉头位置作为技术出发点的、20世纪意大利声乐教师阿尔图罗·梅洛基的方法论",
    it: "La pedagogia di Arturo Melocchi, insegnante di canto italiano del XX secolo che pose la posizione laringea come punto di partenza della tecnica",
    de: "Die Pädagogik von Arturo Melocchi, einem italienischen Gesangslehrer des 20. Jahrhunderts, der die Kehlkopfposition zum Ausgangspunkt der Technik machte",
    fr: "La pédagogie d'Arturo Melocchi, professeur de chant italien du XXe siècle qui a fait de la position laryngée le point de départ de la technique",
    es: "La pedagogía de Arturo Melocchi, profesor de canto italiano del siglo XX que convirtió la posición laríngea en el punto de partida de la técnica",
    ko: "후두의 위치를 기술의 출발점으로 삼은, 20세기 이탈리아 성악 교사 아르투로 멜로키의 방법론",
  },
  s2p1: {
    ja: "アルトゥーロ・メロッキ（Arturo Melocchi、1879–1960）はミラノ出身のバリトン・声楽教師で、伝統的なベルカントとは異なる、独自の身体操作を核とした指導法で知られています。その中心にあるのが、イタリア語で「沈み込ませる」を意味する「アッフォンド（affondo）」と呼ばれる操作です。伝統的なベルカントでも喉頭は歌唱中に自然と低めの位置に落ち着きますが、メロッキ・メソッドでは、これを意図的かつ最大限に、歌唱の出発点として固定的に用いる点が大きく異なります。",
    en: "Arturo Melocchi (1879–1960) was a baritone and voice teacher from Milan, known for a pedagogy centered on a distinctive physical maneuver, distinct from traditional bel canto. At its core is a movement called \"affondo\" — Italian for \"sinking\" or \"plunging.\" In traditional bel canto the larynx naturally settles into a lower position during singing, but the Melocchi Method differs significantly in that it uses this deliberately and maximally, as a fixed starting point for singing itself.",
    zh: "阿尔图罗·梅洛基（Arturo Melocchi，1879–1960）出身于米兰，是一位男中音兼声乐教师，以有别于传统美声唱法、以独特身体操作为核心的教学法而闻名。其核心是意大利语中意为\"下沉\"的\"阿丰多（affondo）\"这一操作。即使在传统美声唱法中，喉头在歌唱时也会自然地稳定在较低的位置，但梅洛基发声法的显著不同之处在于，它有意识地、最大限度地将这一点作为歌唱的固定出发点来使用。",
    it: "Arturo Melocchi (1879–1960) era un baritono e insegnante di canto di Milano, noto per una pedagogia incentrata su una manovra fisica distintiva, diversa dal bel canto tradizionale. Al suo centro vi è un movimento chiamato \"affondo\" — italiano per \"sprofondare\". Nel bel canto tradizionale la laringe si assesta naturalmente in una posizione più bassa durante il canto, ma il Metodo Melocchi differisce significativamente perché lo utilizza deliberatamente e al massimo, come punto di partenza fisso per il canto stesso.",
    de: "Arturo Melocchi (1879–1960) war ein Bariton und Gesangslehrer aus Mailand, bekannt für eine Pädagogik, die sich um ein charakteristisches körperliches Manöver dreht, das sich vom traditionellen Belcanto unterscheidet. Im Zentrum steht eine Bewegung namens „Affondo\" — italienisch für „Versenken\". Im traditionellen Belcanto sinkt der Kehlkopf beim Singen natürlich in eine tiefere Position, doch die Melocchi-Methode unterscheidet sich wesentlich darin, dass sie dies bewusst und maximal als festen Ausgangspunkt für das Singen selbst nutzt.",
    fr: "Arturo Melocchi (1879–1960) était un baryton et professeur de chant milanais, connu pour une pédagogie centrée sur une manœuvre physique distinctive, différente du bel canto traditionnel. En son cœur se trouve un mouvement appelé « affondo » — italien pour « enfoncement ». Dans le bel canto traditionnel, le larynx s'installe naturellement dans une position plus basse pendant le chant, mais la méthode Melocchi diffère significativement en ce qu'elle utilise cela délibérément et au maximum, comme point de départ fixe du chant lui-même.",
    es: "Arturo Melocchi (1879–1960) fue un barítono y profesor de canto de Milán, conocido por una pedagogía centrada en una maniobra física distintiva, diferente del bel canto tradicional. En su núcleo hay un movimiento llamado \"affondo\" — italiano para \"hundimiento\". En el bel canto tradicional, la laringe se asienta naturalmente en una posición más baja durante el canto, pero el Método Melocchi difiere significativamente en que lo utiliza deliberada y máximamente, como punto de partida fijo para el canto mismo.",
    ko: "아르투로 멜로키(Arturo Melocchi, 1879–1960)는 밀라노 출신의 바리톤이자 성악 교사로, 전통적인 벨칸토와는 다른 독자적인 신체 조작을 핵심으로 하는 지도법으로 알려져 있습니다. 그 중심에 있는 것이 이탈리아어로 \"가라앉히다\"를 뜻하는 \"아폰도(affondo)\"라 불리는 조작입니다. 전통적인 벨칸토에서도 후두는 노래하는 동안 자연스럽게 낮은 위치에 자리 잡지만, 멜로키 메소드에서는 이를 의도적으로, 그리고 최대한으로, 노래의 고정된 출발점으로 사용한다는 점이 크게 다릅니다.",
  },
  s2p2: {
    ja: "喉頭を深く下げることで、声帯から咽頭・口腔にかけての「声道」が物理的に延長され、共鳴腔である咽頭腔が拡大します。これにより、より低い倍音成分が強調された、暗く重厚で、しばしば「鋼鉄のような」と形容される力強い音色が生まれます。この方法は特にドラマティックな役柄を歌うテノールにおいて、オーケストラを突き抜けるような強靭な響きをもたらす一方、声帯や喉周辺の筋群への負荷が大きく、声を痛める危険性が高いことでも知られており、声楽教育の中では今なお評価が分かれる、議論の多い方法論です。",
    en: "By lowering the larynx deeply, the \"vocal tract\" — from the vocal folds through the pharynx to the mouth — is physically lengthened, enlarging the pharyngeal resonating cavity. This emphasizes lower overtone components, producing a dark, weighty tone often described as \"steely.\" This method, especially for tenors singing dramatic roles, produces a powerful sound that can cut through an orchestra — but it is also known for placing heavy strain on the vocal folds and surrounding throat muscles, carrying a high risk of vocal damage, and remains a much-debated, divisive methodology within vocal pedagogy.",
    zh: "通过深深下压喉头，从声带经咽部到口腔的\"声道\"在物理上被延长，作为共鸣腔的咽腔随之扩大。这样会强调更低的泛音成分，产生暗沉厚重、常被形容为\"钢铁般\"的强力音色。这种方法尤其在男高音演唱戏剧性角色时，能带来穿透乐团的强劲音响，但同时也因对声带及喉部周围肌群负担极大、声音受损风险高而著称，至今在声乐教育界仍是评价两极、争议颇多的方法论。",
    it: "Abbassando profondamente la laringe, il \"tratto vocale\" — dalle corde vocali attraverso la faringe fino alla bocca — viene fisicamente allungato, ampliando la cavità di risonanza faringea. Questo enfatizza le componenti armoniche più basse, producendo un timbro scuro, pesante, spesso descritto come \"acciaioso\". Questo metodo, specialmente per i tenori che cantano ruoli drammatici, produce un suono potente in grado di tagliare l'orchestra — ma è anche noto per porre un forte stress sulle corde vocali e sui muscoli circostanti la gola, comportando un alto rischio di danno vocale, e rimane una metodologia molto dibattuta e divisiva nella pedagogia vocale.",
    de: "Durch das tiefe Absenken des Kehlkopfs wird der „Vokaltrakt\" — von den Stimmlippen durch den Rachen bis zum Mund — physisch verlängert, wodurch sich der pharyngeale Resonanzraum vergrößert. Dies betont niedrigere Obertonkomponenten und erzeugt einen dunklen, gewichtigen Klang, der oft als „stählern\" beschrieben wird. Diese Methode erzeugt, besonders bei Tenören in dramatischen Rollen, einen kraftvollen Klang, der ein Orchester durchdringen kann — sie ist aber auch dafür bekannt, die Stimmlippen und die umliegende Kehlkopfmuskulatur stark zu belasten, was ein hohes Risiko für Stimmschäden birgt, und bleibt eine vieldiskutierte, umstrittene Methodik innerhalb der Gesangspädagogik.",
    fr: "En abaissant profondément le larynx, le « conduit vocal » — des cordes vocales à travers le pharynx jusqu'à la bouche — est physiquement allongé, agrandissant la cavité de résonance pharyngée. Cela accentue les composantes harmoniques plus basses, produisant un timbre sombre et lourd, souvent décrit comme « d'acier ». Cette méthode, particulièrement pour les ténors chantant des rôles dramatiques, produit un son puissant capable de percer l'orchestre — mais elle est également connue pour exercer une forte contrainte sur les cordes vocales et les muscles environnants de la gorge, comportant un risque élevé de lésion vocale, et demeure une méthodologie très débattue et clivante au sein de la pédagogie vocale.",
    es: "Al bajar profundamente la laringe, el \"tracto vocal\" — desde las cuerdas vocales a través de la faringe hasta la boca — se alarga físicamente, ampliando la cavidad de resonancia faríngea. Esto enfatiza los componentes armónicos más graves, produciendo un timbre oscuro y pesado, a menudo descrito como \"acerado\". Este método, especialmente en tenores que cantan papeles dramáticos, produce un sonido poderoso capaz de atravesar la orquesta, pero también es conocido por ejercer una fuerte tensión sobre las cuerdas vocales y los músculos circundantes de la garganta, con un alto riesgo de daño vocal, y sigue siendo una metodología muy debatida y polémica dentro de la pedagogía vocal.",
    ko: "후두를 깊이 낮춤으로써 성대에서 인두를 거쳐 구강에 이르는 \"성도\"가 물리적으로 길어지고, 공명강인 인두강이 확대됩니다. 이로 인해 더 낮은 배음 성분이 강조되어, 어둡고 묵직하며 종종 \"강철 같다\"고 묘사되는 힘 있는 음색이 만들어집니다. 이 방법은 특히 드라마틱한 배역을 노래하는 테너에게 오케스트라를 뚫고 나가는 강인한 울림을 가져다주는 한편, 성대와 목 주변 근육에 가해지는 부담이 크고 목소리를 상하게 할 위험이 높은 것으로도 알려져 있어, 성악 교육계에서는 지금도 평가가 갈리는 논쟁 많은 방법론입니다.",
  },
  s2singers: {
    ja: ["マリオ・デル・モナコ（メロッキの代表的な体現者）", "マルチェロ・デル・モナコ", "（間接的な影響として）フランコ・コレッリ"],
    en: ["Mario Del Monaco (the method's foremost exponent)", "Marcello Del Monaco", "Franco Corelli (indirectly influenced)"],
    zh: ["马里奥·德尔·莫纳科（该方法最具代表性的体现者）", "马尔切洛·德尔·莫纳科", "弗兰科·科雷利（受到间接影响）"],
    it: ["Mario Del Monaco (il maggiore esponente del metodo)", "Marcello Del Monaco", "Franco Corelli (influenzato indirettamente)"],
    de: ["Mario Del Monaco (der bedeutendste Vertreter der Methode)", "Marcello Del Monaco", "Franco Corelli (indirekt beeinflusst)"],
    fr: ["Mario Del Monaco (le plus grand représentant de la méthode)", "Marcello Del Monaco", "Franco Corelli (influencé indirectement)"],
    es: ["Mario Del Monaco (el máximo exponente del método)", "Marcello Del Monaco", "Franco Corelli (influenciado indirectamente)"],
    ko: ["마리오 델 모나코(멜로키 메소드의 대표적 체현자)", "마르첼로 델 모나코", "(간접적인 영향으로) 프랑코 코렐리"],
  },
  // ===== ガルシア =====
  s3eyebrow: { ja: "THE BIRTH OF VOICE SCIENCE", en: "THE BIRTH OF VOICE SCIENCE", zh: "THE BIRTH OF VOICE SCIENCE", it: "THE BIRTH OF VOICE SCIENCE", de: "THE BIRTH OF VOICE SCIENCE", fr: "THE BIRTH OF VOICE SCIENCE", es: "THE BIRTH OF VOICE SCIENCE", ko: "THE BIRTH OF VOICE SCIENCE" },
  s3title: { ja: "マヌエル・ガルシアの発声理論", en: "Manuel García's Vocal Theory", zh: "曼努埃尔·加西亚的发声理论", it: "La teoria vocale di Manuel García", de: "Manuel Garcías Stimmtheorie", fr: "La théorie vocale de Manuel García", es: "La teoría vocal de Manuel García", ko: "마누엘 가르시아의 발성 이론" },
  s3subtitle: {
    ja: "喉頭鏡を発明し、声楽指導を経験則から観察科学へと転換させた先駆者",
    en: "The pioneer who invented the laryngoscope and transformed vocal pedagogy from folklore into observational science",
    zh: "发明喉镜、将声乐指导从经验法则转变为观察科学的先驱",
    it: "Il pioniere che inventò il laringoscopio e trasformò la pedagogia vocale da folclore a scienza osservativa",
    de: "Der Pionier, der das Laryngoskop erfand und die Gesangspädagogik von Überlieferung zu beobachtender Wissenschaft wandelte",
    fr: "Le pionnier qui inventa le laryngoscope et transforma la pédagogie vocale du folklore en science d'observation",
    es: "El pionero que inventó el laringoscopio y transformó la pedagogía vocal del folclore a la ciencia observacional",
    ko: "후두경을 발명하여 성악 지도를 경험칙에서 관찰 과학으로 전환시킨 선구자",
  },
  s3p1: {
    ja: "マヌエル・パトリシオ・ロドリゲス・ガルシア（Manuel Patricio Rodríguez García、1805–1906）は、スペイン出身のバリトン歌手であり、19世紀を代表する声楽教育者です。彼の最大の功績は、1854年から55年にかけて「喉頭鏡（laryngoscope）」を発明し、鏡と太陽光を使って、自分自身の声帯が振動する様子を史上初めて直接観察したことにあります。これにより声楽の指導は、感覚や比喩に頼るものから、解剖学的・生理学的な観察に基づく科学へと大きく踏み出しました。",
    en: "Manuel Patricio Rodríguez García (1805–1906) was a Spanish baritone and the leading vocal pedagogue of the 19th century. His greatest achievement was inventing the laryngoscope in 1854–55, becoming the first person in history to directly observe his own vibrating vocal folds using a mirror and sunlight. This marked a major step for vocal pedagogy, moving it from reliance on sensation and metaphor toward a science grounded in anatomical and physiological observation.",
    zh: "曼努埃尔·帕特里西奥·罗德里格斯·加西亚（Manuel Patricio Rodríguez García，1805–1906）出身西班牙，是一位男中音歌唱家，也是19世纪最具代表性的声乐教育家。他最大的功绩，是在1854至55年间发明了\"喉镜（laryngoscope）\"，利用镜子与阳光，史上首次直接观察到了自己声带振动的样子。这使声乐指导从依赖感觉与比喻，迈出了转向基于解剖学、生理学观察的科学的重要一步。",
    it: "Manuel Patricio Rodríguez García (1805–1906) era un baritono spagnolo e il principale pedagogo vocale del XIX secolo. Il suo più grande risultato fu l'invenzione del laringoscopio nel 1854–55, diventando la prima persona nella storia a osservare direttamente le proprie corde vocali vibranti usando uno specchio e la luce solare. Questo segnò un passo importante per la pedagogia vocale, spostandola dalla dipendenza da sensazioni e metafore verso una scienza fondata sull'osservazione anatomica e fisiologica.",
    de: "Manuel Patricio Rodríguez García (1805–1906) war ein spanischer Bariton und der führende Gesangspädagoge des 19. Jahrhunderts. Seine größte Leistung war die Erfindung des Laryngoskops in den Jahren 1854–55, wodurch er die erste Person in der Geschichte wurde, die ihre eigenen vibrierenden Stimmlippen mithilfe eines Spiegels und Sonnenlichts direkt beobachtete. Dies markierte einen bedeutenden Schritt für die Gesangspädagogik, weg von der Abhängigkeit von Empfindung und Metapher, hin zu einer auf anatomischer und physiologischer Beobachtung gegründeten Wissenschaft.",
    fr: "Manuel Patricio Rodríguez García (1805–1906) était un baryton espagnol et le principal pédagogue vocal du XIXe siècle. Sa plus grande réalisation fut l'invention du laryngoscope en 1854–55, devenant ainsi la première personne dans l'histoire à observer directement ses propres cordes vocales en vibration à l'aide d'un miroir et de la lumière du soleil. Cela marqua une étape majeure pour la pédagogie vocale, la faisant passer d'une dépendance à la sensation et à la métaphore vers une science fondée sur l'observation anatomique et physiologique.",
    es: "Manuel Patricio Rodríguez García (1805–1906) fue un barítono español y el principal pedagogo vocal del siglo XIX. Su mayor logro fue la invención del laringoscopio en 1854–55, convirtiéndose en la primera persona en la historia en observar directamente sus propias cuerdas vocales vibrando mediante un espejo y la luz solar. Esto marcó un paso importante para la pedagogía vocal, alejándola de la dependencia de la sensación y la metáfora hacia una ciencia basada en la observación anatómica y fisiológica.",
    ko: "마누엘 파트리시오 로드리게스 가르시아(Manuel Patricio Rodríguez García, 1805–1906)는 스페인 출신의 바리톤 가수이자, 19세기를 대표하는 성악 교육가입니다. 그의 가장 큰 업적은 1854년부터 55년에 걸쳐 \"후두경(laryngoscope)\"을 발명하여, 거울과 햇빛을 이용해 역사상 최초로 자신의 성대가 진동하는 모습을 직접 관찰한 것입니다. 이로써 성악 지도는 감각과 비유에 의존하던 것에서, 해부학적·생리학적 관찰에 기반한 과학으로 크게 나아가게 되었습니다.",
  },
  s3p2: {
    ja: "ガルシアはまた、著書『歌唱芸術大全（Traité complet de l'art du chant）』の中で「クー・ド・グロット（coup de la glotte、声門の一撃）」という概念を提唱しました。これは、発声の始まりにおいて声帯（声門）を正確かつ迅速に閉じることで、息漏れのない、明瞭でクリアな音の立ち上がりを得るための考え方です。この概念は発表以来、賛否の分かれる議論を呼び続けていますが、「声門がどのように閉じるか」という視点そのものを声楽理論に持ち込んだこと自体が、その後の発声研究の出発点になったと評価されています。",
    en: "In his treatise Traité complet de l'art du chant, García also proposed the concept of \"coup de la glotte\" (the glottal stroke) — the idea of achieving a clean, breath-free, clear tone onset by closing the vocal folds (glottis) precisely and swiftly at the start of phonation. This concept has remained controversial since it was first proposed, but the very act of bringing the question of \"how the glottis closes\" into vocal theory is credited as a starting point for later research into voice production.",
    zh: "加西亚还在其著作《歌唱艺术大全（Traité complet de l'art du chant）》中提出了\"声门冲击（coup de la glotte）\"这一概念。这是指在发声之初，通过准确而迅速地闭合声带（声门），获得无漏气、清晰明亮的音头的理念。这一概念自提出以来一直存在褒贬不一的争议，但将\"声门如何闭合\"这一视角本身带入声乐理论，这一行为本身被认为是此后发声研究的出发点。",
    it: "Nel suo trattato Traité complet de l'art du chant, García propose anche il concetto di \"coup de la glotte\" (colpo di glottide) — l'idea di ottenere un attacco del suono pulito, senza fuga d'aria e chiaro, chiudendo le corde vocali (glottide) in modo preciso e rapido all'inizio della fonazione. Questo concetto è rimasto controverso da quando fu proposto per la prima volta, ma il fatto stesso di aver introdotto la questione di \"come si chiude la glottide\" nella teoria vocale è considerato un punto di partenza per la successiva ricerca sulla produzione vocale.",
    de: "In seiner Abhandlung Traité complet de l'art du chant schlug García auch das Konzept des „Coup de la glotte\" (Glottisschlag) vor — die Idee, durch präzises und schnelles Schließen der Stimmlippen (Glottis) zu Beginn der Phonation einen sauberen, atemlosen, klaren Toneinsatz zu erzielen. Dieses Konzept blieb seit seiner ersten Vorstellung umstritten, doch die bloße Tatsache, die Frage „wie sich die Glottis schließt\" in die Stimmtheorie eingebracht zu haben, gilt als Ausgangspunkt für spätere Forschung zur Stimmproduktion.",
    fr: "Dans son traité Traité complet de l'art du chant, García proposa également le concept de « coup de la glotte » — l'idée d'obtenir une attaque du son propre, sans fuite d'air, et claire, en fermant les cordes vocales (glotte) de manière précise et rapide au début de la phonation. Ce concept est resté controversé depuis sa première proposition, mais le simple fait d'avoir introduit la question de « comment la glotte se ferme » dans la théorie vocale est considéré comme un point de départ pour les recherches ultérieures sur la production vocale.",
    es: "En su tratado Traité complet de l'art du chant, García también propuso el concepto de \"coup de la glotte\" (golpe de glotis) — la idea de lograr un ataque de sonido limpio, sin fuga de aire, y claro, cerrando las cuerdas vocales (glotis) de manera precisa y rápida al inicio de la fonación. Este concepto ha permanecido controvertido desde que se propuso por primera vez, pero el mero hecho de haber introducido la cuestión de \"cómo se cierra la glotis\" en la teoría vocal se considera un punto de partida para la investigación posterior sobre la producción vocal.",
    ko: "가르시아는 또한 그의 저서 『가창 예술 대전(Traité complet de l'art du chant)』에서 \"쿠 드 글로트(coup de la glotte, 성문의 일격)\"라는 개념을 제창했습니다. 이는 발성이 시작될 때 성대(성문)를 정확하고 신속하게 닫음으로써, 숨이 새지 않는 명료하고 깨끗한 음의 시작을 얻기 위한 사고방식입니다. 이 개념은 발표된 이래 찬반이 갈리는 논쟁을 계속 불러일으키고 있지만, \"성문이 어떻게 닫히는가\"라는 관점 자체를 성악 이론에 끌어들인 것 자체가, 이후 발성 연구의 출발점이 되었다고 평가받고 있습니다.",
  },
  s3callout: {
    ja: "ガルシアの教え子には、伝説的ソプラノのジェニー・リンドや、のちに一大声楽教育の系譜を築いたマティルデ・マルケージなどがいます。彼が切り拓いた「観察に基づく声楽科学」という発想は、現代の音声科学（voice science）や音声生理学の礎として、今日まで受け継がれています。",
    en: "García's students included the legendary soprano Jenny Lind and Mathilde Marchesi, who later built a major lineage of vocal pedagogy. The idea he pioneered — an observation-based vocal science — remains foundational to modern voice science and vocal physiology today.",
    zh: "加西亚的学生中，包括传奇女高音珍妮·林德，以及后来建立起庞大声乐教育谱系的玛蒂尔德·马尔凯西等人。他所开拓的\"基于观察的声乐科学\"这一构想，至今仍作为现代嗓音科学（voice science）与嗓音生理学的基础被传承下来。",
    it: "Tra gli allievi di García c'erano la leggendaria soprano Jenny Lind e Mathilde Marchesi, che in seguito costruì un'importante lignaggio della pedagogia vocale. L'idea che egli aprì — una scienza vocale basata sull'osservazione — rimane oggi fondamentale per la moderna scienza vocale e la fisiologia vocale.",
    de: "Zu Garcías Schülern gehörten die legendäre Sopranistin Jenny Lind und Mathilde Marchesi, die später eine bedeutende Linie der Gesangspädagogik begründete. Die von ihm begründete Idee — eine beobachtungsbasierte Stimmwissenschaft — bleibt bis heute grundlegend für die moderne Stimmwissenschaft und Stimmphysiologie.",
    fr: "Parmi les élèves de García figuraient la légendaire soprano Jenny Lind et Mathilde Marchesi, qui construisit plus tard une importante lignée de pédagogie vocale. L'idée qu'il a ouverte — une science vocale fondée sur l'observation — demeure aujourd'hui fondamentale pour la science vocale moderne et la physiologie vocale.",
    es: "Entre los alumnos de García se encontraban la legendaria soprano Jenny Lind y Mathilde Marchesi, quien más tarde construyó un importante linaje de la pedagogía vocal. La idea que él inauguró — una ciencia vocal basada en la observación — sigue siendo hoy fundamental para la ciencia vocal moderna y la fisiología vocal.",
    ko: "가르시아의 제자로는 전설적인 소프라노 제니 린드, 그리고 훗날 거대한 성악 교육 계보를 구축한 마틸데 마르케시 등이 있습니다. 그가 개척한 \"관찰에 기반한 성악 과학\"이라는 발상은, 현대 음성 과학(voice science)과 음성 생리학의 초석으로 오늘날까지 이어지고 있습니다.",
  },
  // ===== ドイツリート =====
  s4eyebrow: { ja: "REPERTOIRE-DRIVEN TECHNIQUE", en: "REPERTOIRE-DRIVEN TECHNIQUE", zh: "REPERTOIRE-DRIVEN TECHNIQUE", it: "REPERTOIRE-DRIVEN TECHNIQUE", de: "REPERTOIRE-DRIVEN TECHNIQUE", fr: "REPERTOIRE-DRIVEN TECHNIQUE", es: "REPERTOIRE-DRIVEN TECHNIQUE", ko: "REPERTOIRE-DRIVEN TECHNIQUE" },
  s4title: { ja: "ドイツ歌曲（リート）を歌う際の技術", en: "Technique for Singing German Lieder", zh: "演唱德国艺术歌曲（Lied）的技术", it: "La tecnica per cantare il Lied tedesco", de: "Technik für das Singen deutscher Lieder", fr: "La technique pour chanter le lied allemand", es: "La técnica para cantar el lied alemán", ko: "독일 가곡(리트)을 부를 때의 기술" },
  s4subtitle: {
    ja: "大歌劇場ではなくサロンやリサイタルホールで育まれた、言葉に寄り添う声の使い方",
    en: "A way of using the voice that stays close to the words, cultivated in salons and recital halls rather than grand opera houses",
    zh: "并非在大歌剧院、而是在沙龙与独唱会场中培育出的、贴近歌词的用声方式",
    it: "Un modo di usare la voce che resta vicino alle parole, coltivato in salotti e sale da recital piuttosto che nei grandi teatri d'opera",
    de: "Eine Art des Stimmgebrauchs, die den Worten nahebleibt, gepflegt in Salons und Liederabend-Sälen statt in großen Opernhäusern",
    fr: "Une façon d'utiliser la voix qui reste proche des mots, cultivée dans les salons et les salles de récital plutôt que dans les grands opéras",
    es: "Una forma de usar la voz que permanece cercana a las palabras, cultivada en salones y salas de recital en lugar de grandes teatros de ópera",
    ko: "대형 오페라 극장이 아니라 살롱과 리사이틀 홀에서 길러진, 언어에 밀착한 목소리 사용법",
  },
  s4p1: {
    ja: "シューベルト、シューマン、ブラームス、ヴォルフらに代表されるドイツ・リートは、もともと大歌劇場ではなく、サロンやごく小さなリサイタルホールでピアノ一台とともに歌われることを前提に書かれています。そのため、オーケストラを突き抜けるための音量や、遠くの客席まで届く投射力よりも、詩の言葉そのものが持つ意味とニュアンスをいかに繊細に伝えるかが、技術の中心に置かれます。",
    en: "German Lieder, represented by Schubert, Schumann, Brahms, and Wolf, were originally written to be sung with a single piano in salons or very small recital halls, not grand opera houses. Because of this, the central technical concern is not volume to cut through an orchestra or projection to reach distant seats, but rather how delicately the meaning and nuance of the poetic text itself can be conveyed.",
    zh: "以舒伯特、舒曼、勃拉姆斯、沃尔夫为代表的德国艺术歌曲（Lied），原本就是以在沙龙或极小型独唱会场、仅由一架钢琴伴奏演唱为前提而创作的。因此，比起穿透乐团所需的音量、或传达至远处观众席的投射力，技术的核心更在于如何细腻地传达诗歌语言本身所蕴含的意义与细微差别。",
    it: "Il Lied tedesco, rappresentato da Schubert, Schumann, Brahms e Wolf, fu originariamente scritto per essere cantato con un solo pianoforte in salotti o sale da recital molto piccole, non nei grandi teatri d'opera. Per questo motivo, la preoccupazione tecnica centrale non è il volume per tagliare un'orchestra o la proiezione per raggiungere posti lontani, ma piuttosto quanto delicatamente si possa trasmettere il significato e le sfumature del testo poetico stesso.",
    de: "Das deutsche Lied, vertreten durch Schubert, Schumann, Brahms und Wolf, wurde ursprünglich für den Gesang mit nur einem Klavier in Salons oder sehr kleinen Liederabend-Sälen geschrieben, nicht in großen Opernhäusern. Deshalb liegt das zentrale technische Anliegen nicht in der Lautstärke, um ein Orchester zu durchdringen, oder in der Projektion, um entfernte Plätze zu erreichen, sondern vielmehr darin, wie einfühlsam die Bedeutung und Nuance des poetischen Textes selbst vermittelt werden kann.",
    fr: "Le lied allemand, représenté par Schubert, Schumann, Brahms et Wolf, fut à l'origine écrit pour être chanté avec un seul piano dans des salons ou de très petites salles de récital, et non de grands opéras. Pour cette raison, la préoccupation technique centrale n'est pas le volume pour percer un orchestre ou la projection pour atteindre des sièges éloignés, mais plutôt la délicatesse avec laquelle le sens et la nuance du texte poétique lui-même peuvent être transmis.",
    es: "El lied alemán, representado por Schubert, Schumann, Brahms y Wolf, fue escrito originalmente para cantarse con un solo piano en salones o salas de recital muy pequeñas, no en grandes teatros de ópera. Por ello, la preocupación técnica central no es el volumen para atravesar una orquesta o la proyección para llegar a asientos lejanos, sino más bien la delicadeza con la que se puede transmitir el significado y el matiz del propio texto poético.",
    ko: "슈베르트, 슈만, 브람스, 볼프 등으로 대표되는 독일 가곡(리트)은, 애초에 대형 오페라 극장이 아니라 살롱이나 아주 작은 리사이틀 홀에서 피아노 한 대와 함께 불리는 것을 전제로 작곡되었습니다. 그래서 오케스트라를 뚫고 나가기 위한 음량이나 먼 객석까지 닿는 투사력보다는, 시의 언어 자체가 지닌 의미와 뉘앙스를 얼마나 섬세하게 전달하는가가 기술의 중심에 놓입니다.",
  },
  s4p2: {
    ja: "身体の使い方としては、胸声と頭声を混合させた「ミックスヴォイス（voix mixte）」や、息の量を絞った弱声（メッツァヴォーチェ）を自在に使い分け、ごく小さな音量の中でも音程と響きの芯を失わない制御力が求められます。また、ドイツ語特有の子音の明瞭な処理と、詩の韻律（プロソディ）を音楽的なフレーズの抑揚と一致させる感覚が重視され、シンガーズフォルマントに頼った「通る声」よりも、聴き手のすぐそばで語りかけるような、テキストと音楽が一体化した発声が理想とされます。",
    en: "Physically, this requires freely switching between \"mixed voice\" (voix mixte, blending chest and head registers) and a soft, breath-restrained mezza voce, with the control to keep pitch and tonal core intact even at very low volumes. Clear handling of German consonants and matching the poem's prosody to musical phrasing are also emphasized. Rather than a \"carrying\" voice reliant on the singer's formant, the ideal is a delivery where text and music become one, as if speaking intimately right beside the listener.",
    zh: "在身体运用方面，需要自如地区分使用融合胸声与头声的\"混声（voix mixte）\"，以及收敛气息量的弱声（半声），要求即使在极小音量下也不失去音准与共鸣核心的控制力。此外，德语特有子音的清晰处理，以及使诗歌韵律（prosody）与音乐乐句的抑扬顿挫相一致的感觉也备受重视，比起依赖歌手共振峰的\"穿透力强的声音\"，更理想的是仿佛在听者耳边低语般、歌词与音乐融为一体的发声。",
    it: "Fisicamente, questo richiede di passare liberamente tra \"voce mista\" (voix mixte, che fonde i registri di petto e di testa) e una mezza voce morbida e con respiro contenuto, con il controllo per mantenere intatti l'intonazione e il nucleo timbrico anche a volumi molto bassi. Sono inoltre enfatizzati la chiara gestione delle consonanti tedesche e l'allineamento della prosodia poetica con il fraseggio musicale. Piuttosto che una voce \"portante\" che si affida al formante del cantante, l'ideale è un'emissione in cui testo e musica diventano un tutt'uno, come se si parlasse intimamente accanto all'ascoltatore.",
    de: "Körperlich erfordert dies einen freien Wechsel zwischen „Mischstimme\" (voix mixte, die Brust- und Kopfregister vereint) und einer weichen, atemgedämpften Mezza voce, mit der Kontrolle, Tonhöhe und Klangkern auch bei sehr geringer Lautstärke intakt zu halten. Auch die klare Handhabung deutscher Konsonanten und die Abstimmung der Gedichtprosodie mit der musikalischen Phrasierung werden betont. Statt einer „tragenden\" Stimme, die sich auf den Sängerformanten stützt, ist das Ideal ein Vortrag, bei dem Text und Musik eins werden, als spräche man vertraut direkt neben dem Zuhörer.",
    fr: "Physiquement, cela nécessite de passer librement entre la « voix mixte » (voix mixte, mélangeant les registres de poitrine et de tête) et une mezza voce douce et retenue en souffle, avec le contrôle nécessaire pour maintenir intacts la justesse et le noyau timbrique même à très faible volume. La gestion claire des consonnes allemandes et l'alignement de la prosodie du poème sur le phrasé musical sont également soulignés. Plutôt qu'une voix « portante » s'appuyant sur le formant du chanteur, l'idéal est une émission où texte et musique ne font plus qu'un, comme si l'on parlait intimement tout près de l'auditeur.",
    es: "Físicamente, esto requiere alternar libremente entre \"voz mixta\" (voix mixte, que fusiona los registros de pecho y cabeza) y una mezza voce suave y con aliento contenido, con el control necesario para mantener intactos el tono y el núcleo tímbrico incluso a volúmenes muy bajos. También se enfatiza el manejo claro de las consonantes alemanas y la alineación de la prosodia del poema con el fraseo musical. En lugar de una voz \"que se proyecta\" apoyada en el formante del cantante, el ideal es una emisión en la que texto y música se vuelven uno, como si se hablara íntimamente junto al oyente.",
    ko: "신체 사용법 면에서는 흉성과 두성을 혼합한 \"믹스 보이스(voix mixte)\"와, 숨의 양을 절제한 여린 소리(메차보체)를 자유자재로 구분해 사용하며, 아주 작은 음량 속에서도 음정과 울림의 심지를 잃지 않는 제어력이 요구됩니다. 또한 독일어 특유의 자음을 명료하게 처리하는 것과, 시의 운율(프로소디)을 음악적 프레이즈의 억양과 일치시키는 감각이 중시되며, 싱어즈 포먼트에 의존한 \"잘 뻗어나가는 목소리\"보다는, 청자의 바로 곁에서 말을 건네는 듯한, 텍스트와 음악이 하나가 된 발성이 이상적으로 여겨집니다.",
  },
  s4singers: {
    ja: ["ディートリヒ・フィッシャー=ディースカウ", "エリーザベト・シュヴァルツコップ", "クリスタ・ルートヴィヒ", "ハンス・ホッター"],
    en: ["Dietrich Fischer-Dieskau", "Elisabeth Schwarzkopf", "Christa Ludwig", "Hans Hotter"],
    zh: ["迪特里希·菲舍尔-迪斯考", "伊丽莎白·施瓦茨科普夫", "克里斯塔·路德维希", "汉斯·霍特尔"],
    it: ["Dietrich Fischer-Dieskau", "Elisabeth Schwarzkopf", "Christa Ludwig", "Hans Hotter"],
    de: ["Dietrich Fischer-Dieskau", "Elisabeth Schwarzkopf", "Christa Ludwig", "Hans Hotter"],
    fr: ["Dietrich Fischer-Dieskau", "Elisabeth Schwarzkopf", "Christa Ludwig", "Hans Hotter"],
    es: ["Dietrich Fischer-Dieskau", "Elisabeth Schwarzkopf", "Christa Ludwig", "Hans Hotter"],
    ko: ["디트리히 피셔=디스카우", "엘리자베트 슈바르츠코프", "크리스타 루트비히", "한스 호터"],
  },
  // ===== フランスメロディ =====
  s5eyebrow: { ja: "REPERTOIRE-DRIVEN TECHNIQUE", en: "REPERTOIRE-DRIVEN TECHNIQUE", zh: "REPERTOIRE-DRIVEN TECHNIQUE", it: "REPERTOIRE-DRIVEN TECHNIQUE", de: "REPERTOIRE-DRIVEN TECHNIQUE", fr: "REPERTOIRE-DRIVEN TECHNIQUE", es: "REPERTOIRE-DRIVEN TECHNIQUE", ko: "REPERTOIRE-DRIVEN TECHNIQUE" },
  s5title: { ja: "フランス歌曲（メロディ）を歌う際の技術", en: "Technique for Singing French Mélodie", zh: "演唱法国艺术歌曲（Mélodie）的技术", it: "La tecnica per cantare la mélodie francese", de: "Technik für das Singen französischer Mélodies", fr: "La technique pour chanter la mélodie française", es: "La técnica para cantar la mélodie francesa", ko: "프랑스 가곡(멜로디)을 부를 때의 기술" },
  s5subtitle: {
    ja: "フォーレ、ドビュッシー、デュパルクらの作品に求められる、母音の純度と語りの感覚",
    en: "Vowel purity and a sense of speech required by the works of Fauré, Debussy, and Duparc",
    zh: "福雷、德彪西、迪帕克等人作品中所要求的母音纯度与语言感",
    it: "La purezza vocalica e il senso del parlato richiesti dalle opere di Fauré, Debussy e Duparc",
    de: "Vokalreinheit und Sprachgefühl, wie sie die Werke von Fauré, Debussy und Duparc erfordern",
    fr: "La pureté vocalique et le sens de la parole requis par les œuvres de Fauré, Debussy et Duparc",
    es: "La pureza vocálica y el sentido del habla requeridos por las obras de Fauré, Debussy y Duparc",
    ko: "포레, 드뷔시, 뒤파르크 등의 작품에서 요구되는 모음의 순도와 말하는 듯한 감각",
  },
  s5p1: {
    ja: "フォーレ、ドビュッシー、デュパルク、ラヴェルらによるフランス歌曲（メロディ）は、ドイツ・リート以上に親密で、詩と音楽の融合を追求した様式です。技術面でまず求められるのは、母音、とりわけ閉じた母音（é、u など）と、フランス語特有の鼻母音（an、on、in など）を、音色を崩さずに正確に発音する能力です。",
    en: "French mélodie by Fauré, Debussy, Duparc, and Ravel is even more intimate than German Lieder, pursuing a fusion of poetry and music. Technically, what is required first is the ability to pronounce vowels accurately without breaking tone color — especially closed vowels (é, u) and the nasal vowels unique to French (an, on, in).",
    zh: "福雷、德彪西、迪帕克、拉威尔等人创作的法国艺术歌曲（mélodie），是比德国艺术歌曲更为亲密、追求诗与音乐融合的样式。技术层面首先要求的，是能够在不破坏音色的前提下准确发出母音——尤其是闭母音（如é、u等）以及法语特有的鼻化母音（如an、on、in等）的能力。",
    it: "La mélodie francese di Fauré, Debussy, Duparc e Ravel è ancora più intima del Lied tedesco, perseguendo una fusione di poesia e musica. Tecnicamente, ciò che è richiesto per primo è la capacità di pronunciare le vocali con precisione senza rompere il colore del suono — specialmente le vocali chiuse (é, u) e le vocali nasali proprie del francese (an, on, in).",
    de: "Die französische Mélodie von Fauré, Debussy, Duparc und Ravel ist noch intimer als das deutsche Lied und strebt eine Verschmelzung von Poesie und Musik an. Technisch wird zuerst die Fähigkeit gefordert, Vokale präzise auszusprechen, ohne die Klangfarbe zu brechen — besonders geschlossene Vokale (é, u) und die für das Französische typischen Nasalvokale (an, on, in).",
    fr: "La mélodie française de Fauré, Debussy, Duparc et Ravel est encore plus intime que le lied allemand, poursuivant une fusion de la poésie et de la musique. Techniquement, ce qui est requis en premier lieu est la capacité à prononcer les voyelles avec précision sans rompre la couleur du son — en particulier les voyelles fermées (é, u) et les voyelles nasales propres au français (an, on, in).",
    es: "La mélodie francesa de Fauré, Debussy, Duparc y Ravel es aún más íntima que el lied alemán, persiguiendo una fusión de poesía y música. Técnicamente, lo que se requiere primero es la capacidad de pronunciar las vocales con precisión sin romper el color del sonido — especialmente las vocales cerradas (é, u) y las vocales nasales propias del francés (an, on, in).",
    ko: "포레, 드뷔시, 뒤파르크, 라벨 등이 작곡한 프랑스 가곡(멜로디)은, 독일 가곡보다도 더 친밀하며 시와 음악의 융합을 추구한 양식입니다. 기술적으로 우선 요구되는 것은, 모음, 특히 닫힌 모음(é, u 등)과 프랑스어 특유의 비모음(an, on, in 등)을, 음색을 무너뜨리지 않고 정확하게 발음하는 능력입니다.",
  },
  s5p2: {
    ja: "声のライン（ligne de chant）を滑らかに保ちながら、過度なヴィブラートを抑え、フレーズの終わりを重く着地させず軽く収める――これは、朗唱（デクラマシオン、déclamation）に近い性質を持つフランス的な歌唱美学を反映したものです。ドイツ・リートが言葉の意味と感情表現を前面に出す傾向があるのに対し、フランス・メロディはより抑制的で、詩の響きそのものの美しさ、音と言葉の質感を丁寧に磨き上げることに重きが置かれます。",
    en: "Keeping the vocal line (ligne de chant) smooth, restraining excess vibrato, and landing the end of a phrase lightly rather than heavily — this reflects a French singing aesthetic close in nature to declamation (déclamation). Where German Lieder tend to foreground the meaning and emotional expression of the words, French mélodie is more restrained, placing weight on carefully polishing the beauty of the poem's sound itself and the texture of words and music.",
    zh: "保持声线（ligne de chant）的平滑，抑制过度的颤音，让乐句结尾不沉重地落地、而是轻盈地收束——这反映了接近朗诵（déclamation）性质的法式歌唱美学。相较于德国艺术歌曲倾向于将词语的意义与情感表达置于前景，法国艺术歌曲则更为克制，更注重细致打磨诗歌音响本身的美感、以及声音与语言的质感。",
    it: "Mantenere la linea vocale (ligne de chant) fluida, contenere il vibrato eccessivo e far atterrare la fine di una frase leggermente piuttosto che pesantemente — questo riflette un'estetica canora francese vicina per natura alla declamazione (déclamation). Mentre il Lied tedesco tende a mettere in primo piano il significato e l'espressione emotiva delle parole, la mélodie francese è più contenuta, ponendo l'accento sulla cura nel levigare la bellezza del suono stesso della poesia e la texture di parole e musica.",
    de: "Die Gesangslinie (ligne de chant) geschmeidig zu halten, übermäßiges Vibrato zu zügeln und das Ende einer Phrase leicht statt schwer landen zu lassen — dies spiegelt eine französische Gesangsästhetik wider, die der Deklamation (déclamation) nahesteht. Während das deutsche Lied dazu neigt, die Bedeutung und den emotionalen Ausdruck der Worte in den Vordergrund zu stellen, ist die französische Mélodie zurückhaltender und legt Gewicht auf die sorgfältige Politur der Schönheit des Gedichtklangs selbst und der Textur von Wort und Musik.",
    fr: "Maintenir la ligne de chant fluide, contenir le vibrato excessif, et faire atterrir la fin d'une phrase légèrement plutôt que lourdement — cela reflète une esthétique du chant français proche par nature de la déclamation. Alors que le lied allemand tend à mettre en avant le sens et l'expression émotionnelle des mots, la mélodie française est plus retenue, mettant l'accent sur le soin apporté à polir la beauté du son du poème lui-même et la texture des mots et de la musique.",
    es: "Mantener la línea vocal (ligne de chant) fluida, contener el vibrato excesivo y hacer que el final de una frase aterrice ligeramente en lugar de pesadamente — esto refleja una estética del canto francés cercana por naturaleza a la declamación (déclamation). Mientras que el lied alemán tiende a poner en primer plano el significado y la expresión emocional de las palabras, la mélodie francesa es más contenida, poniendo énfasis en pulir cuidadosamente la belleza del propio sonido del poema y la textura de las palabras y la música.",
    ko: "소리의 선(ligne de chant)을 매끄럽게 유지하면서 과도한 비브라토를 억제하고, 프레이즈의 끝을 무겁게 착지시키지 않고 가볍게 마무리한다——이는 낭송(데클라마시옹, déclamation)에 가까운 성질을 지닌 프랑스적 가창 미학을 반영한 것입니다. 독일 가곡이 언어의 의미와 감정 표현을 전면에 내세우는 경향이 있는 데 비해, 프랑스 멜로디는 더 절제되어 있으며, 시의 울림 그 자체의 아름다움과 소리·언어의 질감을 정성껏 다듬는 데 무게를 둡니다.",
  },
  s5singers: {
    ja: ["ピエール・ベルナック", "ジェラール・スゼー", "レジーヌ・クレスパン", "フェリシティ・ロット"],
    en: ["Pierre Bernac", "Gérard Souzay", "Régine Crespin", "Felicity Lott"],
    zh: ["皮埃尔·贝尔纳克", "杰拉德·苏塞", "雷吉娜·克雷斯潘", "费莉希蒂·洛特"],
    it: ["Pierre Bernac", "Gérard Souzay", "Régine Crespin", "Felicity Lott"],
    de: ["Pierre Bernac", "Gérard Souzay", "Régine Crespin", "Felicity Lott"],
    fr: ["Pierre Bernac", "Gérard Souzay", "Régine Crespin", "Felicity Lott"],
    es: ["Pierre Bernac", "Gérard Souzay", "Régine Crespin", "Felicity Lott"],
    ko: ["피에르 베르나크", "제라르 수제", "레진 크레스팽", "펠리시티 로트"],
  },
  // ===== 関係性 =====
  s6eyebrow: { ja: "HOW THESE TRADITIONS RELATE", en: "HOW THESE TRADITIONS RELATE", zh: "HOW THESE TRADITIONS RELATE", it: "HOW THESE TRADITIONS RELATE", de: "HOW THESE TRADITIONS RELATE", fr: "HOW THESE TRADITIONS RELATE", es: "HOW THESE TRADITIONS RELATE", ko: "HOW THESE TRADITIONS RELATE" },
  s6title: { ja: "それぞれの流派の関係性", en: "How These Traditions Relate", zh: "各流派之间的关系", it: "Come si relazionano queste tradizioni", de: "Wie diese Traditionen zusammenhängen", fr: "Comment ces traditions se rejoignent", es: "Cómo se relacionan estas tradiciones", ko: "각 유파의 관계성" },
  s6p1: {
    ja: "ガルシアが切り拓いた「観察に基づく声楽科学」は、特定の様式ではなく、あらゆる声楽指導の土台となる方法論的な転換点でした。伝統的なベルカントは、その科学的視点が確立される以前から経験的に磨かれてきた様式であり、メロッキ・メソッドは、その中でも特にドラマティックな声を求める潮流が、喉頭位置という一点を極端に強調する形で20世紀に枝分かれしたものと捉えることができます。",
    en: "The observation-based vocal science pioneered by García was not a specific style, but a methodological turning point underlying all vocal pedagogy. Traditional bel canto is a style refined empirically before that scientific viewpoint was established, while the Melocchi Method can be seen as a 20th-century offshoot of the current within it seeking especially dramatic voices, taking the single factor of laryngeal position to an extreme.",
    zh: "加西亚所开拓的\"基于观察的声乐科学\"，并非某种特定样式，而是支撑一切声乐指导的方法论转折点。传统美声唱法是在这一科学视角确立之前、凭经验磨砺而成的样式，而梅洛基发声法则可以视为其中特别追求戏剧性声音的潮流，在20世纪将喉头位置这一单一要素推向极端而分化出的分支。",
    it: "La scienza vocale basata sull'osservazione, aperta da García, non era uno stile specifico, ma un punto di svolta metodologico alla base di ogni pedagogia vocale. Il bel canto tradizionale è uno stile affinato empiricamente prima che quella prospettiva scientifica fosse stabilita, mentre il Metodo Melocchi può essere visto come una diramazione del XX secolo della corrente al suo interno che cercava voci particolarmente drammatiche, portando all'estremo il singolo fattore della posizione laringea.",
    de: "Die von García begründete, beobachtungsbasierte Stimmwissenschaft war kein bestimmter Stil, sondern ein methodischer Wendepunkt, der aller Gesangspädagogik zugrunde liegt. Das traditionelle Belcanto ist ein Stil, der empirisch verfeinert wurde, bevor sich diese wissenschaftliche Sichtweise etablierte, während die Melocchi-Methode als ein Ableger des 20. Jahrhunderts jener Strömung darin gesehen werden kann, die besonders dramatische Stimmen suchte und dabei den einzelnen Faktor der Kehlkopfposition auf die Spitze trieb.",
    fr: "La science vocale fondée sur l'observation, ouverte par García, n'était pas un style spécifique, mais un tournant méthodologique sous-jacent à toute pédagogie vocale. Le bel canto traditionnel est un style affiné empiriquement avant que ce point de vue scientifique ne soit établi, tandis que la méthode Melocchi peut être vue comme une ramification du XXe siècle du courant en son sein recherchant des voix particulièrement dramatiques, poussant à l'extrême le seul facteur de la position laryngée.",
    es: "La ciencia vocal basada en la observación, abierta por García, no era un estilo específico, sino un punto de inflexión metodológico subyacente a toda la pedagogía vocal. El bel canto tradicional es un estilo refinado empíricamente antes de que se estableciera esa perspectiva científica, mientras que el Método Melocchi puede verse como una ramificación del siglo XX de la corriente dentro de él que buscaba voces especialmente dramáticas, llevando al extremo el único factor de la posición laríngea.",
    ko: "가르시아가 개척한 \"관찰에 기반한 성악 과학\"은 특정한 양식이 아니라, 모든 성악 지도의 토대가 되는 방법론적 전환점이었습니다. 전통적인 벨칸토는 그러한 과학적 관점이 확립되기 이전부터 경험적으로 다듬어져 온 양식이며, 멜로키 메소드는 그 안에서도 특히 드라마틱한 목소리를 추구하는 흐름이, 후두 위치라는 한 가지 요소를 극단적으로 강조하는 형태로 20세기에 갈라져 나온 것으로 볼 수 있습니다.",
  },
  s6p2: {
    ja: "一方、ドイツ・リートとフランス・メロディの技術は、「どの流派に属するか」というより、「どのホールで、どんな伴奏編成で、どの言語の詩を歌うか」というレパートリーそのものの要求から導き出された、実践的な適応と見ることができます。オペラで鍛えられた声の土台の上に、それぞれの言語とレパートリーが求める繊細さを重ねていく――多くの声楽家にとって、これらは対立する選択肢ではなく、重なり合う技術の層なのです。",
    en: "The techniques of German Lieder and French mélodie, meanwhile, can be seen less as belonging to one \"school\" and more as practical adaptations drawn from the demands of the repertoire itself — which hall, which accompanying forces, which language's poetry. Layering the delicacy each language and repertoire demands onto a vocal foundation built through opera — for many singers, these are not opposing choices, but overlapping layers of technique.",
    zh: "另一方面，德国艺术歌曲与法国艺术歌曲的技巧，与其说是\"属于哪个流派\"，不如说可以视为源自曲目本身要求——在哪个音乐厅、以怎样的伴奏编制、演唱哪种语言的诗——所导出的实践性适应。在通过歌剧锤炼出的声音基础之上，叠加各语言与曲目所要求的细腻——对许多声乐家而言，这些并非相互对立的选择，而是相互叠加的技术层次。",
    it: "D'altra parte, le tecniche del Lied tedesco e della mélodie francese possono essere viste meno come appartenenti a una \"scuola\" e più come adattamenti pratici derivati dalle esigenze del repertorio stesso — quale sala, quale formazione d'accompagnamento, la poesia di quale lingua. Sovrapponendo la delicatezza richiesta da ciascuna lingua e repertorio a una base vocale costruita attraverso l'opera — per molti cantanti, queste non sono scelte opposte, ma strati sovrapposti di tecnica.",
    de: "Andererseits können die Techniken des deutschen Lieds und der französischen Mélodie weniger als Zugehörigkeit zu einer „Schule\" verstanden werden, sondern eher als praktische Anpassungen, die sich aus den Anforderungen des Repertoires selbst ergeben — welcher Saal, welche Begleitbesetzung, welche Sprache der Dichtung. Auf einer durch die Oper aufgebauten stimmlichen Grundlage wird die Feinheit geschichtet, die jede Sprache und jedes Repertoire erfordert — für viele Sänger sind dies keine gegensätzlichen Entscheidungen, sondern überlappende Schichten der Technik.",
    fr: "D'autre part, les techniques du lied allemand et de la mélodie française peuvent être vues moins comme appartenant à une « école » et davantage comme des adaptations pratiques tirées des exigences du répertoire lui-même — quelle salle, quelle formation d'accompagnement, la poésie de quelle langue. En superposant la délicatesse que chaque langue et répertoire exige sur une base vocale construite à travers l'opéra — pour de nombreux chanteurs, ce ne sont pas des choix opposés, mais des couches de technique qui se chevauchent.",
    es: "Por otro lado, las técnicas del lied alemán y la mélodie francesa pueden verse menos como pertenecientes a una \"escuela\" y más como adaptaciones prácticas derivadas de las exigencias del propio repertorio — qué sala, qué formación de acompañamiento, la poesía de qué idioma. Superponiendo la delicadeza que cada idioma y repertorio exige sobre una base vocal construida a través de la ópera — para muchos cantantes, estas no son opciones opuestas, sino capas superpuestas de técnica.",
    ko: "한편 독일 가곡과 프랑스 멜로디의 기술은, \"어느 유파에 속하는가\"라기보다는 \"어느 홀에서, 어떤 반주 편성으로, 어느 언어의 시를 노래하는가\"라는 레퍼토리 자체의 요구에서 도출된 실천적 적응으로 볼 수 있습니다. 오페라로 단련된 목소리의 토대 위에, 각 언어와 레퍼토리가 요구하는 섬세함을 겹쳐 쌓아간다——많은 성악가에게 이것들은 서로 대립하는 선택지가 아니라, 서로 겹쳐지는 기술의 층인 것입니다.",
  },
  // ===== 用語集 =====
  s7eyebrow: { ja: "PHYSICAL MECHANICS", en: "PHYSICAL MECHANICS" },
  s7title: { ja: "発声を支える身体の力学", en: "The Body Mechanics Behind the Voice" },
  s7subtitle: { ja: "喉頭・舌・呼吸・声道——結果としての声を決める9つの要素", en: "Larynx, Tongue, Breath, Vocal Tract — Nine Elements That Shape the Resulting Sound" },
  s7intro: { ja: "ここまでの流派ごとの様式論とは少し視点を変えて、どの流派にも共通して関わってくる「身体の物理的な仕組み」を、9つの観点からまとめます。それぞれは独立した項目ではなく、喉頭の位置は舌の状態に、舌の状態は呼吸の支えに、呼吸の支えは声道の長さに——というように、互いに影響し合う一つのシステムです。", en: "Shifting focus slightly from the stylistic differences between schools above, this section covers nine aspects of the physical mechanics that underlie vocal technique across virtually every tradition. None of these stand alone — laryngeal position affects tongue state, tongue state affects breath support, breath support affects vocal tract length, and so on. They form a single interconnected system." },
  s7t1title: { ja: "① 喉頭の位置", en: "① Laryngeal Position" },
  s7t1p1: { ja: "喉頭（声帯を収めている軟骨の器官、いわゆる「喉仏」の部分）は、発声時にどの高さにあるかで、声の性質が大きく変わります。クラシック発声で一般的に目指されるのは、力で押し下げた低さではなく、リラックスした状態で自然に落ち着く「低め〜中間の安定した位置」です。喉頭を引き上げる筋肉（舌骨上筋群など）と引き下げる筋肉（舌骨下筋群など）のバランスが取れている状態が理想で、どちらかに偏ると声の自由度が失われます。", en: "The larynx — the cartilage structure housing the vocal folds, roughly the \"Adam's apple\" area — has a major effect on vocal quality depending on its height during phonation. What classical technique generally aims for isn't a forcibly pressed-down low position, but a low-to-neutral position that settles there naturally through relaxation. The ideal is a balance between the muscles that raise the larynx (the suprahyoid group) and those that lower it (the infrahyoid group); leaning too far toward either compromises the voice's freedom." },
  s7t1p2: { ja: "喉頭が浮き上がった状態（未訓練の話し声や、力んだ高音でよく起こる）は、声道を短くし、声を薄く・締まった響きにしがちです。逆に、あくびの始まりのような感覚で息を吸うと、喉頭は自然に低く落ち着き、喉の奥に空間ができます。この「あくびの入り口」の感覚を、発声中も保ち続けること（無理に固定するのではなく）が、多くの流派で共通して重視されているポイントです。", en: "A raised larynx — common in untrained speech or strained high notes — shortens the vocal tract and tends to make the voice thin and pinched. Conversely, inhaling with the sensation of the start of a yawn lets the larynx settle low naturally, opening space at the back of the throat. Maintaining that \"beginning-of-a-yawn\" sensation throughout phonation — without forcibly locking it in place — is a point emphasized across many schools of technique." },
  s7t2title: { ja: "② 舌の位置", en: "② Tongue Position" },
  s7t2p1: { ja: "理想的な舌の状態は、舌先が下の前歯の裏に軽く触れ、舌の中央が平らに近く、そして舌根（舌の付け根）がリラックスして前方にある状態です。舌根が緊張して喉の奥に引き込まれると、喉頭が不安定になったり、共鳴のための空間が狭まったりする、発声上の緊張の中でも特に頻度の高い原因の一つになります。", en: "The ideal tongue state has the tip lightly touching behind the lower front teeth, the middle of the tongue relatively flat, and the tongue root relaxed and positioned forward. A tense tongue root pulled back toward the throat is one of the single most common causes of vocal tension — it can destabilize the larynx and narrow the space available for resonance." },
  s7t2p2: { ja: "母音によって舌の形は当然変化します（「イ」では舌の前方が高く盛り上がり、「ア」では平らに近づくなど）が、どの母音であっても、舌根そのものは自由でいる必要があります。舌根の緊張は本人には気づきにくいことが多く、鏡で喉の奥を覗いたり、指で舌の下側の柔らかさを確認したりすることが、セルフチェックの一つの方法になります。", en: "The shape of the tongue naturally changes from vowel to vowel — high and bunched toward the front for \"ee,\" flatter for \"ah\" — but regardless of vowel, the tongue root itself needs to stay free. Tension there is often hard to notice on your own; checking in a mirror at the back of the throat, or feeling the softness under the tongue with a finger, are simple ways to self-check." },
  s7t3title: { ja: "③ 腹圧（アッポッジョの実際の力学）", en: "③ Abdominal Pressure (The Actual Mechanics of Appoggio)" },
  s7t3p1: { ja: "「腹圧で支える」という言葉は、しばしば「お腹に力を入れて押し出す」と誤解されますが、実際に求められているのはその逆に近い動きです。下腹部の筋肉（腹横筋・内外腹斜筋）は、息を吐き出す力を作り出すと同時に、吸気筋（横隔膜・外肋間筋）がその動きにゆっくりと「抵抗」し続けることで、声帯にかかる息の圧力を一定に保ちます。伸ばしたゴムを急に離さず、少しずつコントロールしながら戻していくイメージに近いものです。", en: "The phrase \"support with the abdomen\" is often misunderstood as \"tighten your belly and push out.\" What's actually required is closer to the opposite. The lower abdominal muscles (transverse abdominis, internal and external obliques) generate the force of exhalation, while the inspiratory muscles (diaphragm, external intercostals) continue to slowly \"resist\" that motion, keeping the air pressure on the vocal folds steady. It's closer to controlling a stretched rubber band as it's released gradually, rather than letting go of it suddenly." },
  s7t3p2: { ja: "腹部を強く握りしめるような力み方は、かえって息の圧力を不安定にし、喉頭を押し上げる原因にもなります。適切な支えができている時、喉頭はむしろ自由に低い位置を保ちやすくなります。「お腹の力み」と「喉の自由」は、一見別々の話に思えて、実際には表裏一体の関係にあります。", en: "Gripping the abdomen tightly, by contrast, tends to destabilize breath pressure and can actually push the larynx upward. When support is working correctly, the larynx tends to stay low and free more easily, not less. \"Abdominal tension\" and \"throat freedom\" may seem like separate topics, but they're really two sides of the same coin." },
  s7t4title: { ja: "④ 横隔膜の動き", en: "④ Diaphragm Movement" },
  s7t4p1: { ja: "横隔膜は、息を吸う時に収縮して平らになり下方向へ動くことで、肺に空気を引き込みます。問題は、息を吐く（歌う）時にどう動くかです。何もしなければ、横隔膜は弾性によってすぐに元の位置へ戻ろうとし、息が一気に抜けてしまいます。熟練した歌手は、横隔膜と外肋間筋の働きを完全には止めず、ゆっくりと、コントロールしながら戻していきます。この「ゆっくり戻る動き」こそが、③で説明した腹圧の支えの、身体内部での実体です。", en: "The diaphragm contracts and flattens, moving downward, to draw air into the lungs on inhalation. The question is what it does during exhalation — that is, while singing. Left alone, its elastic recoil would pull it back to its resting position quickly, releasing the breath all at once. Skilled singers don't fully stop the diaphragm and external intercostals from working; instead, they let those muscles slowly, deliberately relax their engagement. This slow return is, physically, what the abdominal support described in ③ actually consists of inside the body." },
  s7t4p2: { ja: "また、息の吸い方自体も重要です。肩だけを上げる浅い呼吸ではなく、下部の肋骨が左右に広がるような、横隔膜と肋骨を連動させた呼吸（肋骨呼吸）を行うことで、より多くの息を、より効率よく使える態勢が整います。", en: "How the breath is taken in the first place matters too. Rather than a shallow breath that only raises the shoulders, breathing that engages the diaphragm together with the lower ribs — letting them expand outward to the sides (costal breathing) — sets up a state where more air can be used more efficiently." },
  s7t5title: { ja: "⑤ 声道の長さ", en: "⑤ Vocal Tract Length" },
  s7t5p1: { ja: "声道とは、声帯から唇までの空間全体を指します。この空間の長さと形が、音のどの周波数帯が強調されるか（フォルマント）を決め、それが声の色そのものを大きく左右します。声道が長いほど、フォルマントの周波数は全体的に低くなり、聴感上「深み」「豊かさ」として感じられる音色になります。訓練された声楽家の声が、話し声と同じ高さの音でもまったく違って聴こえるのは、この声道の使い方の違いが大きな理由の一つです。", en: "The vocal tract refers to the entire space from the vocal folds to the lips. The length and shape of this space determine which frequency bands get emphasized (formants), which in turn shapes the color of the voice itself. A longer vocal tract generally lowers the formant frequencies overall, which is perceived as depth and richness in the tone. One major reason a trained singer's voice sounds completely different from a speaking voice, even at the same pitch, is precisely this difference in how the vocal tract is used." },
  s7t5p2: { ja: "声道を長くする方法は主に2つあります。1つは①で述べた喉頭を低く保つこと（声道を下から伸ばす）、もう1つは唇をわずかに丸めて前に出すこと（声道を上から伸ばす）です。オペラ歌手が用いる「歌手のフォルマント」（オーケストラを突き抜けて聴こえる、2800〜3400Hz付近に生まれる響きの集中）も、こうした声道の使い方と、安定して低い喉頭位置が土台になって生まれるものです。", en: "There are two main ways to lengthen the vocal tract: keeping the larynx low, as discussed in ①, which extends it from below, and slightly rounding and protruding the lips, which extends it from above. The \"singer's formant\" that opera singers rely on — a concentration of resonance around 2800-3400 Hz that lets the voice cut through an orchestra — is built on this kind of vocal tract usage, resting on a stable, low laryngeal position." },
  s7t6title: { ja: "⑥ 関連するマッサージ方法", en: "⑥ Associated Massage Techniques" },
  s7t6p1: { ja: "喉頭・舌根・呼吸のいずれも、周辺の筋肉に余分な緊張があると、思うように機能しません。発声前や練習の合間に取り入れられる、代表的なセルフマッサージをいくつか挙げます。", en: "None of the larynx, tongue root, or breath mechanics described above can function well if the surrounding muscles are carrying excess tension. Here are a few common self-massage techniques that can be worked into warm-ups or breaks between practice." },
  s7t6item1term: { ja: "顎関節まわりのマッサージ", en: "Jaw joint (TMJ) massage" },
  s7t6item1desc: { ja: "耳の少し前、口を開閉すると動く部分を指の腹で小さな円を描くようにほぐします。顎の余計な力みが取れると、舌や喉の自由度も上がります。", en: "Use your fingertips to make small circles just in front of the ears, at the point that moves when you open and close your mouth. Releasing excess jaw tension also frees up the tongue and throat." },
  s7t6item2term: { ja: "舌骨上筋群（あご下）のマッサージ", en: "Suprahyoid muscle massage (under the chin)" },
  s7t6item2desc: { ja: "あごの下、舌の付け根を支えている筋肉を、指の腹で下から上へ優しく押し上げるようにマッサージします。舌根の緊張をほぐすのに役立ちます。", en: "Gently massage the muscles under the chin that support the base of the tongue, pressing upward from below with your fingertips. This helps release tension in the tongue root." },
  s7t6item3term: { ja: "甲状軟骨（喉仏）の優しい左右の揺らし", en: "Gentle side-to-side rocking of the thyroid cartilage (Adam's apple)" },
  s7t6item3desc: { ja: "喉仏を指で挟むように軽く持ち、ごく小さく左右にゆっくり揺らします。力を入れすぎないことが重要で、筋緊張性発声障害のケアでも使われる手法です。", en: "Lightly hold the thyroid cartilage between your fingers and rock it very gently, slowly, from side to side. It's important not to press too hard — this technique is also used in the care of muscle tension dysphonia." },
  s7t6item4term: { ja: "胸鎖乳突筋・首すじのマッサージ", en: "Sternocleidomastoid and neck-line massage" },
  s7t6item4desc: { ja: "耳の後ろから鎖骨に向かって斜めに走る筋肉を、指の腹でゆっくりなでるようにほぐします。首全体の緊張が緩むと、喉頭の自由度にも良い影響があります。", en: "Slowly stroke and loosen the muscle that runs diagonally from behind the ear down to the collarbone, using your fingertips. Releasing overall neck tension has a positive effect on laryngeal freedom as well." },
  s7t7title: { ja: "⑦ 筋トレ方法——どの部位を鍛えるべきか", en: "⑦ Strength Training — Which Muscles to Develop" },
  s7t7p1: { ja: "重要な前提として、喉や首そのものの筋肉は「鍛える」対象ではなく、むしろリラックスさせ続ける対象です。筋力トレーニングの対象になるのは、あくまで呼吸の支えと姿勢を担う、喉から離れた部位です。", en: "An important premise first: the muscles of the throat and neck themselves are not something to \"train\" — if anything, they need to stay relaxed. What strength training should target are the muscles, away from the throat, responsible for breath support and posture." },
  s7t7item1term: { ja: "腹横筋・内外腹斜筋（体幹の支え）", en: "Transverse abdominis and obliques (core support)" },
  s7t7item1desc: { ja: "③で説明した「ゆっくり戻す」動きをコントロールする筋肉です。強く締め付ける腹筋運動よりも、ゆっくりとした呼気コントロールを伴うプランクや、息を細く長く吐き続ける練習の方が、発声に活きる強さがつきます。", en: "These are the muscles that control the \"slow release\" motion described in ③. Rather than forceful, gripping ab exercises, planks combined with slow, controlled exhalation, or practice sustaining a thin, long exhale, build the kind of strength that actually carries over to singing." },
  s7t7item2term: { ja: "脊柱起立筋・姿勢を支える背筋", en: "Erector spinae and postural back muscles" },
  s7t7item2desc: { ja: "胸を潰さず、開いた状態を保つための土台になります。背中が丸まると胸郭の拡張が制限され、結果として呼吸の効率も下がります。", en: "These form the foundation for keeping the chest open rather than collapsed. A rounded back restricts rib cage expansion, which in turn reduces breathing efficiency." },
  s7t7item3term: { ja: "肋間筋（肋骨まわりの筋肉）", en: "Intercostal muscles (around the rib cage)" },
  s7t7item3desc: { ja: "直接的な筋トレというより、肋骨を大きく左右に広げてキープする呼吸練習を繰り返すことで、徐々に強化されていきます。", en: "Rather than direct strength training, these are gradually strengthened through repeated breathing exercises that expand the ribs widely to the sides and hold that expansion." },
  s7t7p2: { ja: "目指すべきは、瞬発的な最大筋力ではなく、長いフレーズを支え続けられる持久力と、微細なコントロール能力です。全身の有酸素運動も、長いフレーズや本番全体を通した息の持久力に間接的に貢献します。", en: "The goal isn't explosive maximum strength, but endurance that can sustain long phrases, along with fine-grained control. General cardiovascular fitness also contributes indirectly to the breath endurance needed for long phrases and a full performance." },
  s7t8title: { ja: "⑧ 水分・栄養学の観点から見た食事の重要性", en: "⑧ Why Diet Matters, from a Hydration and Nutrition Perspective" },
  s7t8p1: { ja: "声帯の粘膜を潤すために摂った水分は、実際に粘膜表面に届くまでに数時間かかるとされています。つまり「本番の直前にたくさん飲む」ことよりも、日常的に、こまめに水分を摂り続けることの方が、声帯の潤いという観点では効果的です。蒸気の吸入は、これとは逆に、比較的短時間で表面を潤す即効性のあるケア方法として補完的に使えます。", en: "Water consumed to hydrate the vocal fold mucosa is thought to take several hours to actually reach the surface of that tissue. In other words, drinking a lot right before a performance matters less, for mucosal hydration specifically, than maintaining steady, frequent hydration throughout the day. Steam inhalation works the opposite way — a faster-acting, complementary method that moistens the surface over a shorter timeframe." },
  s7t8p2: { ja: "栄養面では、筋肉の回復に関わるタンパク質はもちろんですが、粘膜組織の健康を支えるビタミンA・C・Eといった抗酸化系の栄養素や、炎症を抑える働きが期待されるオメガ3系脂肪酸も、間接的に声のコンディションに関わってきます。「乳製品が痰を増やす」という説もよく聞かれますが、これは科学的にはまだ一致した結論が出ておらず、個人差が大きいというのが実情です。断定せず、自分の体の反応を観察する姿勢が現実的です。", en: "Nutritionally, protein matters for muscle recovery, of course, but antioxidant nutrients like vitamins A, C, and E that support mucosal tissue health, and omega-3 fatty acids with their potential anti-inflammatory effects, also play an indirect role in vocal condition. The claim that dairy increases mucus is commonly repeated, but the science on it isn't actually settled — individual variation appears to be significant. Rather than treating it as established fact, it's more realistic to observe your own body's response." },
  s7t9title: { ja: "⑨「鳩胸」のような姿勢は必要か", en: "⑨ Is a \"Pigeon-Chest\" Posture Necessary?" },
  s7t9p1: { ja: "クラシック発声の指導でよく見られる「胸を高く」という指示は、骨格そのものを変える話ではなく、発声中も胸をつぶさずに保つ、姿勢の習慣についての話です。多くの人は、フレーズが進み息が減っていくにつれて、無意識に胸が沈んでいきます。胸が沈むと、肋骨が閉じて呼吸のスペースが狭まり、③④で説明した「ゆっくり戻す」支えの動きも難しくなります。", en: "The \"lift the chest\" cue commonly heard in classical vocal instruction isn't about changing the skeleton itself — it's about the postural habit of keeping the chest from collapsing during phonation. Most people's chest unconsciously sinks as a phrase goes on and breath runs low. When the chest sinks, the ribs close in, breathing space narrows, and the \"slow release\" support motion described in ③ and ④ becomes harder to maintain." },
  s7t9p2: { ja: "適度に高く保たれた胸は、呼吸のためのスペースを一定に保ち、アッポッジョの土台を支えます。ただし、これは力で固定する「反り返った」姿勢ではありません。過度に胸を張ろうとすると、今度は上半身や肩に余計な緊張が生まれ、かえって逆効果になります。目指すのは、力みのない、自然な姿勢の結果として胸が開いている状態——「固定する」のではなく「保たれている」状態です。結論としては、ある程度は必要とされる感覚ですが、それ自体を目的化しない方がよいものです。", en: "A moderately elevated chest keeps consistent space available for breathing and supports the foundation of appoggio. But this isn't a rigid, arched-back posture held by force. Overly forcing the chest up creates unnecessary tension in the upper body and shoulders, which works against you. What you're aiming for is a chest that stays open as the natural result of relaxed, good overall alignment — a state that's \"maintained,\" not \"locked in place.\" In short: some sense of this is needed, but it shouldn't become a goal in itself." },
  glossaryEyebrow: { ja: "GLOSSARY", en: "GLOSSARY", zh: "GLOSSARY", it: "GLOSSARY", de: "GLOSSARY", fr: "GLOSSARY", es: "GLOSSARY", ko: "GLOSSARY" },
  glossaryTitle: { ja: "専門用語まとめ", en: "Glossary of Terms", zh: "术语汇总", it: "Glossario dei termini", de: "Glossar der Begriffe", fr: "Glossaire des termes", es: "Glosario de términos", ko: "전문 용어 정리" },
  g1term: { ja: "アッポッジョ", en: "Appoggio", zh: "支持法（Appoggio）", it: "Appoggio", de: "Appoggio", fr: "Appoggio", es: "Appoggio", ko: "아포조" },
  g1def: {
    ja: "横隔膜と肋骨の拡張状態をできるだけ長く保ちながら息を送り出す、支えの考え方。イタリア語で「支える」の意。",
    en: "The idea of breath support: sending out breath while keeping the diaphragm and ribs expanded for as long as possible. Italian for \"to support.\"",
    zh: "尽可能长时间保持横膈膜与肋骨扩张状态、同时送出气息的支持理念。意大利语意为\"支撑\"。",
    it: "L'idea del sostegno del respiro: emettere il respiro mantenendo il diaframma e le costole espansi il più a lungo possibile. Italiano per \"sostenere\".",
    de: "Die Idee der Atemstütze: Atem aussenden, während Zwerchfell und Rippen so lange wie möglich ausgedehnt gehalten werden. Italienisch für „stützen\".",
    fr: "L'idée du soutien du souffle : émettre le souffle en maintenant le diaphragme et les côtes étendus aussi longtemps que possible. Italien pour « soutenir ».",
    es: "La idea del apoyo respiratorio: emitir el aliento manteniendo el diafragma y las costillas expandidos el mayor tiempo posible. Italiano para \"apoyar\".",
    ko: "횡격막과 늑골의 확장 상태를 가능한 한 오래 유지하면서 숨을 내보내는 지지의 개념. 이탈리아어로 \"지탱하다\"라는 뜻.",
  },
  g2term: { ja: "キアロスクーロ", en: "Chiaro-scuro", zh: "明暗（Chiaro-scuro）", it: "Chiaroscuro", de: "Chiaroscuro", fr: "Chiaroscuro", es: "Claroscuro", ko: "키아로스쿠로" },
  g2def: {
    ja: "声に明るさ（chiaro）と暗さ・深み（oscuro）を同時に持たせる、ベルカントの音色バランスの考え方。",
    en: "The bel canto concept of tonal balance: giving the voice both brightness (chiaro) and darkness/depth (oscuro) at the same time.",
    zh: "让声音同时兼具明亮（chiaro）与暗沉、深邃（oscuro）的美声唱法音色平衡理念。",
    it: "Il concetto del bel canto sull'equilibrio timbrico: dare alla voce sia luminosità (chiaro) sia oscurità/profondità (oscuro) allo stesso tempo.",
    de: "Das Belcanto-Konzept der Klangfarbenbalance: der Stimme gleichzeitig Helligkeit (chiaro) und Dunkelheit/Tiefe (oscuro) zu verleihen.",
    fr: "La notion du bel canto sur l'équilibre timbrique : donner à la voix à la fois luminosité (chiaro) et obscurité/profondeur (oscuro).",
    es: "El concepto del bel canto sobre el equilibrio tímbrico: dar a la voz tanto luminosidad (chiaro) como oscuridad/profundidad (oscuro) a la vez.",
    ko: "목소리에 밝음(chiaro)과 어둠·깊이(oscuro)를 동시에 지니게 하는, 벨칸토의 음색 균형에 대한 사고방식.",
  },
  g3term: { ja: "パッサッジョ", en: "Passaggio", zh: "换声点（Passaggio）", it: "Passaggio", de: "Passaggio", fr: "Passaggio", es: "Passaggio", ko: "파사조" },
  g3def: {
    ja: "胸声・ミックス・頭声など、声区が移行するポイント。この前後で音色や発声の仕組みが変化する。",
    en: "The point where vocal registers transition — chest, mixed, head voice, and so on. Tone color and vocal mechanics shift around this point.",
    zh: "胸声、混声、头声等声区转换的节点。在此前后音色与发声机制会发生变化。",
    it: "Il punto in cui i registri vocali transitano — petto, misto, testa e così via. Il colore del suono e la meccanica vocale cambiano attorno a questo punto.",
    de: "Der Punkt, an dem Stimmregister übergehen — Brust, Misch-, Kopfstimme usw. Klangfarbe und Stimmmechanik verändern sich um diesen Punkt herum.",
    fr: "Le point où les registres vocaux transitent — poitrine, mixte, tête, etc. La couleur du son et la mécanique vocale changent autour de ce point.",
    es: "El punto donde transitan los registros vocales — pecho, mixto, cabeza, etc. El color del sonido y la mecánica vocal cambian alrededor de este punto.",
    ko: "흉성·믹스·두성 등, 음역이 이행하는 지점. 이 전후로 음색과 발성 메커니즘이 변화한다.",
  },
  g4term: { ja: "シンガーズフォルマント", en: "Singer's Formant", zh: "歌手共振峰", it: "Formante del cantante", de: "Sängerformant", fr: "Formant du chanteur", es: "Formante del cantante", ko: "싱어즈 포먼트" },
  g4def: {
    ja: "2800〜3200Hz付近に現れる倍音エネルギーの集積。訓練された声がオーケストラを超えて届く音響的な鍵とされる。",
    en: "A concentration of overtone energy appearing around 2800–3200 Hz. Considered the acoustic key to how a trained voice carries over an orchestra.",
    zh: "出现在2800～3200Hz附近的泛音能量集中现象。被认为是训练有素的嗓音能够超越管弦乐团传达出去的音响关键。",
    it: "Una concentrazione di energia armonica che appare intorno ai 2800–3200 Hz. Considerata la chiave acustica per cui una voce allenata riesce a superare un'orchestra.",
    de: "Eine Konzentration von Obertonenergie um 2800–3200 Hz. Gilt als der akustische Schlüssel dafür, wie eine trainierte Stimme über ein Orchester hinweg trägt.",
    fr: "Une concentration d'énergie harmonique apparaissant autour de 2800–3200 Hz. Considérée comme la clé acoustique permettant à une voix entraînée de porter par-dessus un orchestre.",
    es: "Una concentración de energía armónica que aparece alrededor de 2800–3200 Hz. Considerada la clave acústica de cómo una voz entrenada logra proyectarse por encima de una orquesta.",
    ko: "2800~3200Hz 부근에 나타나는 배음 에너지의 집중. 훈련된 목소리가 오케스트라를 넘어 전달되는 음향적 열쇠로 여겨진다.",
  },
  g5term: { ja: "クー・ド・グロット", en: "Coup de la Glotte", zh: "声门冲击（Coup de la glotte）", it: "Colpo di glottide", de: "Coup de la glotte", fr: "Coup de la glotte", es: "Golpe de glotis", ko: "쿠 드 글로트" },
  g5def: {
    ja: "声門を正確かつ迅速に閉じることで、息漏れのない明瞭な音の立ち上がりを得る考え方。マヌエル・ガルシアが提唱。",
    en: "The idea of achieving a clean, breath-free tone onset by closing the glottis precisely and swiftly. Proposed by Manuel García.",
    zh: "通过准确而迅速地闭合声门，获得无漏气、清晰音头的理念。由曼努埃尔·加西亚提出。",
    it: "L'idea di ottenere un attacco del suono chiaro e senza fuga d'aria chiudendo la glottide in modo preciso e rapido. Proposta da Manuel García.",
    de: "Die Idee, durch präzises und schnelles Schließen der Glottis einen klaren, atemlosen Toneinsatz zu erzielen. Vorgeschlagen von Manuel García.",
    fr: "L'idée d'obtenir une attaque du son claire et sans fuite d'air en fermant la glotte de manière précise et rapide. Proposée par Manuel García.",
    es: "La idea de lograr un ataque de sonido claro y sin fuga de aire cerrando la glotis de manera precisa y rápida. Propuesta por Manuel García.",
    ko: "성문을 정확하고 신속하게 닫음으로써, 숨이 새지 않는 명료한 음의 시작을 얻는다는 개념. 마누엘 가르시아가 제창.",
  },
  g6term: { ja: "ミックスヴォイス（ヴォワ・ミクスト）", en: "Mixed Voice (Voix Mixte)", zh: "混声（Voix mixte）", it: "Voce mista (voix mixte)", de: "Mischstimme (voix mixte)", fr: "Voix mixte", es: "Voz mixta (voix mixte)", ko: "믹스 보이스(부아 믹스트)" },
  g6def: {
    ja: "胸声と頭声を混合させた声区。中間的な音域で音色の断絶を避けるために用いられる。",
    en: "A vocal register blending chest and head voice, used to avoid a tonal break in the middle range.",
    zh: "混合胸声与头声的声区。用于避免中间音域出现音色断层。",
    it: "Un registro vocale che fonde voce di petto e voce di testa, usato per evitare una rottura timbrica nel registro medio.",
    de: "Ein Stimmregister, das Brust- und Kopfstimme mischt, verwendet, um einen Klangfarbenbruch im mittleren Register zu vermeiden.",
    fr: "Un registre vocal mélangeant voix de poitrine et voix de tête, utilisé pour éviter une rupture timbrique dans le registre médium.",
    es: "Un registro vocal que mezcla voz de pecho y voz de cabeza, usado para evitar una ruptura tímbrica en el registro medio.",
    ko: "흉성과 두성을 혼합한 음역. 중간 음역에서 음색이 끊기는 것을 피하기 위해 사용된다.",
  },
  g7term: { ja: "メッツァヴォーチェ", en: "Mezza Voce", zh: "半声（Mezza voce）", it: "Mezza voce", de: "Mezza voce", fr: "Mezza voce", es: "Mezza voce", ko: "메차보체" },
  g7def: {
    ja: "息の量を絞った弱声。小さな音量でも音程と響きの芯を保つ制御力が求められる。",
    en: "A soft voice with restrained breath flow. Requires the control to keep pitch and tonal core intact even at low volume.",
    zh: "收敛气息量的弱声。要求即使在小音量下也能保持音准与共鸣核心的控制力。",
    it: "Una voce morbida con flusso di respiro contenuto. Richiede il controllo per mantenere intatti intonazione e nucleo del suono anche a basso volume.",
    de: "Eine weiche Stimme mit gedämpftem Atemfluss. Erfordert die Kontrolle, Tonhöhe und Klangkern auch bei geringer Lautstärke intakt zu halten.",
    fr: "Une voix douce au flux de souffle retenu. Nécessite le contrôle pour maintenir intacts la justesse et le noyau du son même à faible volume.",
    es: "Una voz suave con flujo de aliento contenido. Requiere el control para mantener intactos el tono y el núcleo del sonido incluso a bajo volumen.",
    ko: "숨의 양을 절제한 여린 소리. 작은 음량에서도 음정과 울림의 심지를 유지하는 제어력이 요구된다.",
  },
  g8term: { ja: "アッフォンド", en: "Affondo", zh: "沉喉法（Affondo）", it: "Affondo", de: "Affondo", fr: "Affondo", es: "Affondo", ko: "아폰도" },
  g8def: {
    ja: "イタリア語で「沈み込ませる」の意。メロッキ・メソッドにおいて喉頭を意図的に深く下げる操作を指す。",
    en: "Italian for \"sinking\" or \"plunging.\" Refers to the deliberate, deep lowering of the larynx in the Melocchi Method.",
    zh: "意大利语意为\"使下沉\"。指梅洛基发声法中有意将喉头深深下压的操作。",
    it: "Italiano per \"far sprofondare\". Si riferisce all'abbassamento deliberato e profondo della laringe nel Metodo Melocchi.",
    de: "Italienisch für „versenken lassen\". Bezieht sich auf das bewusste, tiefe Absenken des Kehlkopfs in der Melocchi-Methode.",
    fr: "Italien pour « faire enfoncer ». Désigne l'abaissement délibéré et profond du larynx dans la méthode Melocchi.",
    es: "Italiano para \"hacer hundir\". Se refiere al descenso deliberado y profundo de la laringe en el Método Melocchi.",
    ko: "이탈리아어로 \"가라앉히다\"라는 뜻. 멜로키 메소드에서 후두를 의도적으로 깊이 낮추는 조작을 가리킨다.",
  },
  g9term: { ja: "声道", en: "Vocal Tract", zh: "声道", it: "Tratto vocale", de: "Vokaltrakt", fr: "Conduit vocal", es: "Tracto vocal", ko: "성도(보컬 트랙트)" },
  g9def: {
    ja: "声帯から唇までの空間全体。その長さと形状が、声の共鳴（倍音構成）を決定づける。",
    en: "The entire space from the vocal folds to the lips. Its length and shape determine the voice's resonance (overtone structure).",
    zh: "从声带到嘴唇的整个空间。其长度与形状决定了嗓音的共鸣（泛音结构）。",
    it: "L'intero spazio dalle corde vocali alle labbra. La sua lunghezza e forma determinano la risonanza della voce (struttura armonica).",
    de: "Der gesamte Raum von den Stimmlippen bis zu den Lippen. Seine Länge und Form bestimmen die Resonanz der Stimme (Obertonstruktur).",
    fr: "L'espace entier des cordes vocales aux lèvres. Sa longueur et sa forme déterminent la résonance de la voix (structure harmonique).",
    es: "El espacio completo desde las cuerdas vocales hasta los labios. Su longitud y forma determinan la resonancia de la voz (estructura armónica).",
    ko: "성대에서 입술까지의 공간 전체. 그 길이와 형태가 목소리의 공명(배음 구조)을 결정짓는다.",
  },
  footer: {
    ja: "主な参考: Sundberg, J. (1974, 1987) の singer's formant に関する一連の研究／Müller et al. (2022) 声種別シンガーズフォルマント中心周波数の報告／Bloothooft & Plomp (1986) 音圧レベルとシンガーズフォルマントの関係／García, M. (1840–47) Traité complet de l'art du chant／Arturo Melocchi の指導法に関する歴史的記述（Del Monaco家および同時代証言に基づく）。本ページは声楽史・声楽教育に関する一般的な知見をまとめたものであり、特定の指導法を推奨するものではありません。",
    en: "Main references: Sundberg, J. (1974, 1987), a series of studies on the singer's formant / Müller et al. (2022), reported center frequencies of the singer's formant by voice type / Bloothooft & Plomp (1986), the relationship between sound pressure level and singer's formant / García, M. (1840–47), Traité complet de l'art du chant / historical accounts of Arturo Melocchi's pedagogy (based on the Del Monaco family and contemporary testimony). This page summarizes general knowledge on vocal history and pedagogy and does not recommend any specific method.",
    zh: "主要参考文献：Sundberg, J.（1974, 1987）关于歌手共振峰的一系列研究／Müller等（2022）不同声种歌手共振峰中心频率的报告／Bloothooft & Plomp（1986）关于声压级与歌手共振峰关系的研究／García, M.（1840–47）《歌唱艺术大全》／关于阿尔图罗·梅洛基教学法的历史记述（基于德尔·莫纳科家族及同时代证言）。本页面整理了关于声乐史与声乐教育的一般性知识，并不推荐特定的指导方法。",
    it: "Riferimenti principali: Sundberg, J. (1974, 1987), una serie di studi sul formante del cantante / Müller et al. (2022), frequenze centrali riportate del formante del cantante per tipo di voce / Bloothooft & Plomp (1986), la relazione tra livello di pressione sonora e formante del cantante / García, M. (1840–47), Traité complet de l'art du chant / resoconti storici sulla pedagogia di Arturo Melocchi (basati sulla famiglia Del Monaco e testimonianze coeve). Questa pagina riassume conoscenze generali sulla storia e la pedagogia vocale e non raccomanda alcun metodo specifico.",
    de: "Hauptquellen: Sundberg, J. (1974, 1987), eine Reihe von Studien zum Sängerformanten / Müller et al. (2022), berichtete Mittenfrequenzen des Sängerformanten nach Stimmtyp / Bloothooft & Plomp (1986), die Beziehung zwischen Schalldruckpegel und Sängerformant / García, M. (1840–47), Traité complet de l'art du chant / historische Berichte über Arturo Melocchis Pädagogik (basierend auf der Familie Del Monaco und zeitgenössischen Zeugnissen). Diese Seite fasst allgemeines Wissen zur Gesangsgeschichte und -pädagogik zusammen und empfiehlt keine bestimmte Methode.",
    fr: "Références principales : Sundberg, J. (1974, 1987), une série d'études sur le formant du chanteur / Müller et al. (2022), fréquences centrales rapportées du formant du chanteur par type de voix / Bloothooft & Plomp (1986), la relation entre le niveau de pression acoustique et le formant du chanteur / García, M. (1840–47), Traité complet de l'art du chant / récits historiques sur la pédagogie d'Arturo Melocchi (basés sur la famille Del Monaco et des témoignages contemporains). Cette page résume des connaissances générales sur l'histoire et la pédagogie vocales et ne recommande aucune méthode particulière.",
    es: "Referencias principales: Sundberg, J. (1974, 1987), una serie de estudios sobre el formante del cantante / Müller et al. (2022), frecuencias centrales reportadas del formante del cantante por tipo de voz / Bloothooft & Plomp (1986), la relación entre el nivel de presión sonora y el formante del cantante / García, M. (1840–47), Traité complet de l'art du chant / relatos históricos sobre la pedagogía de Arturo Melocchi (basados en la familia Del Monaco y testimonios contemporáneos). Esta página resume conocimientos generales sobre la historia y la pedagogía vocal y no recomienda ningún método específico.",
    ko: "주요 참고 문헌: Sundberg, J. (1974, 1987)의 싱어즈 포먼트에 관한 일련의 연구 / Müller 외 (2022)의 성종별 싱어즈 포먼트 중심 주파수 보고 / Bloothooft & Plomp (1986)의 음압 레벨과 싱어즈 포먼트의 관계 / García, M. (1840–47)의 『가창 예술 대전』 / 아르투로 멜로키의 지도법에 관한 역사적 기술(델 모나코 가문 및 동시대 증언에 기반). 본 페이지는 성악사·성악 교육에 관한 일반적인 지식을 정리한 것이며, 특정 지도법을 추천하는 것은 아닙니다.",
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

      {/* 発声を支える身体の力学（9項目） */}
      <Section eyebrow={tr("s7eyebrow", lang)} title={tr("s7title", lang)} subtitle={tr("s7subtitle", lang)} accent={C.rust}>
        <p>{tr("s7intro", lang)}</p>

        <h3 className="ff-display italic" style={{ fontSize: "1.3rem", color: C.ink, margin: "28px 0 10px" }}>{tr("s7t1title", lang)}</h3>
        <p>{tr("s7t1p1", lang)}</p>
        <p>{tr("s7t1p2", lang)}</p>

        <h3 className="ff-display italic" style={{ fontSize: "1.3rem", color: C.ink, margin: "28px 0 10px" }}>{tr("s7t2title", lang)}</h3>
        <p>{tr("s7t2p1", lang)}</p>
        <p>{tr("s7t2p2", lang)}</p>

        <h3 className="ff-display italic" style={{ fontSize: "1.3rem", color: C.ink, margin: "28px 0 10px" }}>{tr("s7t3title", lang)}</h3>
        <p>{tr("s7t3p1", lang)}</p>
        <p>{tr("s7t3p2", lang)}</p>

        <h3 className="ff-display italic" style={{ fontSize: "1.3rem", color: C.ink, margin: "28px 0 10px" }}>{tr("s7t4title", lang)}</h3>
        <p>{tr("s7t4p1", lang)}</p>
        <p>{tr("s7t4p2", lang)}</p>

        <h3 className="ff-display italic" style={{ fontSize: "1.3rem", color: C.ink, margin: "28px 0 10px" }}>{tr("s7t5title", lang)}</h3>
        <p>{tr("s7t5p1", lang)}</p>
        <p>{tr("s7t5p2", lang)}</p>

        <h3 className="ff-display italic" style={{ fontSize: "1.3rem", color: C.ink, margin: "28px 0 10px" }}>{tr("s7t6title", lang)}</h3>
        <p>{tr("s7t6p1", lang)}</p>
        <div>
          {[1, 2, 3, 4].map((n) => (
            <GlossaryItem key={n} term={tr(`s7t6item${n}term`, lang)}>{tr(`s7t6item${n}desc`, lang)}</GlossaryItem>
          ))}
        </div>

        <h3 className="ff-display italic" style={{ fontSize: "1.3rem", color: C.ink, margin: "28px 0 10px" }}>{tr("s7t7title", lang)}</h3>
        <p>{tr("s7t7p1", lang)}</p>
        <div>
          {[1, 2, 3].map((n) => (
            <GlossaryItem key={n} term={tr(`s7t7item${n}term`, lang)}>{tr(`s7t7item${n}desc`, lang)}</GlossaryItem>
          ))}
        </div>
        <p style={{ marginTop: 14 }}>{tr("s7t7p2", lang)}</p>

        <h3 className="ff-display italic" style={{ fontSize: "1.3rem", color: C.ink, margin: "28px 0 10px" }}>{tr("s7t8title", lang)}</h3>
        <p>{tr("s7t8p1", lang)}</p>
        <p>{tr("s7t8p2", lang)}</p>

        <h3 className="ff-display italic" style={{ fontSize: "1.3rem", color: C.ink, margin: "28px 0 10px" }}>{tr("s7t9title", lang)}</h3>
        <p>{tr("s7t9p1", lang)}</p>
        <Callout>{tr("s7t9p2", lang)}</Callout>
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
