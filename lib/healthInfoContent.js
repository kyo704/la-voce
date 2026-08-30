// 健康情報タブの記事本文（8言語）。
// **text** は太字として表示されます（文中に医学用語を強調するため）。

import { cautionWith, cautionAfter } from "./medicalCaution.js";

export const HEALTH_INFO_CONTENT = {
  // ★注意書きの本文は lib/medicalCaution.js が持ちます。ここで言い換えないこと。
  //   受診の案内だけを、うしろに足します。
  disclaimer: cautionWith({
    ja: "症状が続く場合や不安がある場合は、必ず耳鼻咽喉科（できれば音声を専門とする医師）にご相談ください。",
    en: "If symptoms persist or you have any concerns, please consult an ENT specialist (ideally a voice specialist).",
    zh: "如症状持续或有任何担忧，请务必咨询耳鼻喉科医生（最好是专攻嗓音的医师）。",
    it: "Se i sintomi persistono o hai dubbi, consulta un otorinolaringoiatra (preferibilmente foniatra).",
    de: "Wenn Beschwerden anhalten oder du unsicher bist, wende dich bitte an eine HNO-Praxis (möglichst mit Stimmschwerpunkt).",
    fr: "Si les symptômes persistent ou en cas de doute, consultez un ORL (de préférence spécialiste de la voix).",
    es: "Si los síntomas persisten o tienes dudas, consulta a un otorrinolaringólogo (preferiblemente especialista en voz).",
    ko: "증상이 계속되거나 불안하다면 반드시 이비인후과(가능하면 음성 전문의)에 상담해 주세요.",
    ru: "Если симптомы сохраняются или вас что-то беспокоит, обратитесь к ЛОР-врачу (желательно фониатру)."
  }),

  // ===== Section 1: LPR =====
  s1Title: {
    ja: "逆流性食道炎・咽喉頭逆流症（LPR）と歌手への影響",
    en: "Acid Reflux & Laryngopharyngeal Reflux (LPR): Effects on Singers",
    zh: "反流性食管炎・咽喉反流（LPR）对歌手的影响",
    it: "Reflusso gastroesofageo e reflusso laringofaringeo (LPR): effetti sui cantanti",
    de: "Refluxösophagitis & laryngopharyngealer Reflux (LPR): Auswirkungen auf Sänger",
    fr: "Reflux gastro-œsophagien et reflux laryngopharyngé (LPR) : effets sur les chanteurs",
    es: "Reflujo gastroesofágico y reflujo laringofaríngeo (LPR): efectos en cantantes",
    ko: "역류성 식도염・인후두 역류질환(LPR)이 성악가에게 미치는 영향", ru: "Гастроэзофагеальный рефлюкс и ларингофарингеальный рефлюкс (LPR): влияние на певцов"
  },
  s1Para1: {
    ja: "逆流性食道炎（胃食道逆流症、GERD）は、胃酸が食道に逆流して炎症を起こす病気です。胃酸が食道を超えて喉頭・咽頭にまで達するものは咽喉頭逆流症（LPR：Laryngopharyngeal Reflux）と呼ばれ、典型的な胸焼けを伴わずに喉だけに症状が出ることも多く、「サイレントリフラックス」とも呼ばれます。",
    en: "Acid reflux (gastroesophageal reflux disease, GERD) occurs when stomach acid flows back into the esophagus and causes irritation. When the acid reaches beyond the esophagus into the larynx and pharynx, it's called laryngopharyngeal reflux (LPR). LPR often causes throat-only symptoms without the classic heartburn, which is why it's sometimes called \"silent reflux.\"",
    zh: "反流性食管炎（胃食管反流病，GERD）是胃酸反流至食道并引发炎症的疾病。当胃酸越过食道到达喉部・咽部时，称为咽喉反流（LPR：Laryngopharyngeal Reflux），常常不伴随典型的烧心感，只在喉咙出现症状，因此也被称为「无声反流」。",
    it: "Il reflusso gastroesofageo (GERD) si verifica quando l'acido dello stomaco risale nell'esofago causando irritazione. Quando l'acido raggiunge la laringe e la faringe, si parla di reflusso laringofaringeo (LPR). L'LPR causa spesso sintomi limitati alla gola senza il classico bruciore di stomaco, per questo è talvolta chiamato \"reflusso silenzioso\".",
    de: "Refluxösophagitis (gastroösophageale Refluxkrankheit, GERD) entsteht, wenn Magensäure in die Speiseröhre zurückfließt und Reizungen verursacht. Erreicht die Säure Kehlkopf und Rachen, spricht man von laryngopharyngealem Reflux (LPR). LPR verursacht oft nur Symptome im Hals ohne das typische Sodbrennen, weshalb er manchmal \"stiller Reflux\" genannt wird.",
    fr: "Le reflux gastro-œsophagien (RGO) survient lorsque l'acide gastrique remonte dans l'œsophage et provoque une irritation. Lorsque l'acide atteint le larynx et le pharynx, on parle de reflux laryngopharyngé (LPR). Le LPR provoque souvent des symptômes limités à la gorge sans les brûlures d'estomac classiques, d'où son surnom de « reflux silencieux ».",
    es: "El reflujo ácido (enfermedad por reflujo gastroesofágico, ERGE) ocurre cuando el ácido del estómago regresa al esófago y causa irritación. Cuando el ácido llega hasta la laringe y la faringe, se denomina reflujo laringofaríngeo (LPR). El LPR suele causar síntomas solo en la garganta sin la acidez clásica, por lo que a veces se le llama \"reflujo silencioso\".",
    ko: "역류성 식도염(위식도 역류질환, GERD)은 위산이 식도로 역류하여 염증을 일으키는 질환입니다. 위산이 식도를 넘어 후두・인두까지 도달하는 경우를 인후두 역류질환(LPR: Laryngopharyngeal Reflux)이라 부르며, 전형적인 속쓰림 없이 목에만 증상이 나타나는 경우가 많아 '침묵의 역류'라고도 불립니다.", ru: "Гастроэзофагеальная рефлюксная болезнь (ГЭРБ) возникает, когда желудочная кислота забрасывается обратно в пищевод и вызывает раздражение. Когда кислота попадает дальше — в гортань и глотку, — это называют ларингофарингеальным рефлюксом (LPR). LPR часто вызывает симптомы только в горле, без классической изжоги, поэтому его иногда называют «тихим рефлюксом»."
  },
  s1Para2Intro: {
    ja: "歌手にとって特に注意したいのは、LPRが次のような形で発声に直接影響しうる点です。",
    en: "For singers, it's especially worth noting that LPR can directly affect the voice in the following ways.",
    zh: "对歌手而言，尤其需要注意的是，LPR可能以下列方式直接影响发声。",
    it: "Per i cantanti, è particolarmente importante notare che l'LPR può influire direttamente sulla voce nei seguenti modi.",
    de: "Für Sänger ist besonders wichtig zu wissen, dass LPR die Stimme auf folgende Weise direkt beeinflussen kann.",
    fr: "Pour les chanteurs, il est particulièrement important de noter que le LPR peut affecter directement la voix des manières suivantes.",
    es: "Para los cantantes, es especialmente importante notar que el LPR puede afectar directamente a la voz de las siguientes formas.",
    ko: "성악가에게 특히 주의가 필요한 점은, LPR이 다음과 같은 형태로 발성에 직접 영향을 줄 수 있다는 것입니다.", ru: "Певцам особенно важно учитывать, что LPR может напрямую влиять на голос следующими способами."
  },
  s1List1: {
    ja: "慢性的な喉の違和感・詰まり感（グロブス感）",
    en: "Chronic throat discomfort or a lump-in-the-throat sensation (globus sensation)",
    zh: "慢性喉咙不适感・堵塞感（球感）",
    it: "Fastidio cronico alla gola o sensazione di corpo estraneo (globus)",
    de: "Chronisches Unwohlsein im Hals oder ein Kloßgefühl (Globusgefühl)",
    fr: "Gêne chronique de la gorge ou sensation de boule dans la gorge (globus)",
    es: "Molestia crónica en la garganta o sensación de bola en la garganta (globus)",
    ko: "만성적인 목의 이물감・걸리는 느낌(구주감)", ru: "Хроническое ощущение дискомфорта или комка в горле (ощущение globus)"
  },
  s1List2: {
    ja: "声のかすれ、特に朝方に声が出づらい",
    en: "Hoarseness, especially difficulty producing voice in the morning",
    zh: "声音嘶哑，尤其是早晨发声困难",
    it: "Raucedine, specialmente difficoltà a emettere voce al mattino",
    de: "Heiserkeit, besonders morgendliche Schwierigkeiten beim Stimmeinsatz",
    fr: "Enrouement, notamment des difficultés à émettre la voix le matin",
    es: "Ronquera, especialmente dificultad para emitir la voz por la mañana",
    ko: "목소리 쉼, 특히 아침에 목소리가 잘 나오지 않음", ru: "Хрипота, особенно трудности с голосом по утрам"
  },
  s1List3: {
    ja: "頻繁な喉払い、慢性的な咳",
    en: "Frequent throat-clearing, chronic cough",
    zh: "频繁清嗓、慢性咳嗽",
    it: "Frequente bisogno di schiarirsi la voce, tosse cronica",
    de: "Häufiges Räuspern, chronischer Husten",
    fr: "Besoin fréquent de se racler la gorge, toux chronique",
    es: "Carraspeo frecuente, tos crónica",
    ko: "잦은 헛기침, 만성 기침", ru: "Частое откашливание, хронический кашель"
  },
  s1List4: {
    ja: "声域の低下、高音の出しづらさ",
    en: "Reduced vocal range, difficulty reaching high notes",
    zh: "音域下降，高音难以发出",
    it: "Riduzione dell'estensione vocale, difficoltà nelle note acute",
    de: "Verringerter Stimmumfang, Schwierigkeiten bei hohen Tönen",
    fr: "Réduction de la tessiture, difficulté à atteindre les aigus",
    es: "Reducción del rango vocal, dificultad para alcanzar notas agudas",
    ko: "음역대 저하, 고음 내기 어려움", ru: "Сужение диапазона голоса, трудности с высокими нотами"
  },
  s1Para3: {
    ja: "また、慢性的な喉頭の炎症や違和感は、体が無意識に喉を守ろうとする防御反応（筋緊張性発声障害の一種）を引き起こすことがあり、これが**喉頭挙上**（喉頭が本来より高い位置に上がってしまう状態）につながることがあると言われています。喉頭が過度に上がった状態では声帯の自由な振動が妨げられ、声の伸びや響きが損なわれやすくなります。",
    en: "Chronic laryngeal irritation and discomfort can also trigger an unconscious protective response from the body (a form of muscle tension dysphonia), which may lead to **laryngeal elevation** (the larynx sitting higher than its natural position). When the larynx is elevated, it can restrict the vocal folds' free vibration, making it harder to sustain resonance and vocal freedom.",
    zh: "此外，慢性的喉部炎症或不适感，可能引发身体无意识保护喉部的防御反应（一种肌肉紧张性发声障碍），据说这可能导致**喉部上抬**（喉部上升到高于原本的位置）。喉部过度上抬时，声带的自由振动会受到妨碍，声音的延展与共鸣也容易因此受损。",
    it: "L'irritazione laringea cronica può anche innescare una risposta protettiva inconscia del corpo (una forma di disfonia da tensione muscolare), che può portare all'**innalzamento laringeo** (la laringe si posiziona più in alto del normale). Quando la laringe è sollevata, può limitare la libera vibrazione delle corde vocali, rendendo più difficile mantenere risonanza e libertà vocale.",
    de: "Chronische Kehlkopfreizung und Unwohlsein können auch eine unbewusste Schutzreaktion des Körpers auslösen (eine Form der muskulären Spannungsdysphonie), die zu einer **Kehlkopfanhebung** führen kann (der Kehlkopf sitzt höher als seine natürliche Position). Bei angehobenem Kehlkopf kann die freie Schwingung der Stimmlippen eingeschränkt sein, was Resonanz und stimmliche Freiheit erschwert.",
    fr: "L'irritation laryngée chronique peut aussi déclencher une réponse protectrice inconsciente du corps (une forme de dysphonie de tension musculaire), pouvant entraîner une **élévation laryngée** (le larynx se positionnant plus haut que sa position naturelle). Un larynx élevé peut restreindre la vibration libre des cordes vocales, rendant plus difficile le maintien de la résonance et de la liberté vocale.",
    es: "La irritación laríngea crónica también puede desencadenar una respuesta protectora inconsciente del cuerpo (una forma de disfonía por tensión muscular), que puede provocar **elevación laríngea** (la laringe se sitúa más alta que su posición natural). Con la laringe elevada, puede restringirse la vibración libre de las cuerdas vocales, dificultando mantener la resonancia y la libertad vocal.",
    ko: "또한 만성적인 후두 염증이나 위화감은, 몸이 무의식적으로 목을 보호하려는 방어 반응(근긴장성 발성장애의 일종)을 일으킬 수 있으며, 이것이 **후두 거상**(후두가 원래보다 높은 위치로 올라가는 상태)으로 이어질 수 있다고 알려져 있습니다. 후두가 과도하게 올라간 상태에서는 성대의 자유로운 진동이 방해받아, 목소리의 신장감과 울림이 손상되기 쉬워집니다.", ru: "Хроническое раздражение и дискомфорт в гортани также может вызывать неосознанную защитную реакцию организма (форму мышечно-тензионной дисфонии), которая может приводить к **подъёму гортани** (гортань располагается выше своего естественного положения). Когда гортань поднята, это может ограничивать свободную вибрацию голосовых связок, затрудняя сохранение резонанса и свободы голоса."
  },
  s1Para4Intro: cautionAfter({
    ja: "一般的に言われている対策です。",
    en: "These are commonly suggested approaches.",
    zh: "以下是普遍建议的应对措施。",
    it: "Questi sono approcci comunemente suggeriti.",
    de: "Dies sind allgemein empfohlene Ansätze.",
    fr: "Voici des approches couramment suggérées.",
    es: "Estos son enfoques que se sugieren habitualmente.",
    ko: "일반적으로 권장되는 방법입니다.",
    ru: "Это обычно рекомендуемые подходы."
  }),
  s1List5: {
    ja: "就寝の3時間前までに食事を済ませる。特に本番前後の食事タイミングに注意する",
    en: "Finish eating at least 3 hours before bedtime. Pay special attention to meal timing around performances",
    zh: "睡前3小时内完成用餐。尤其注意演出前后的进食时间",
    it: "Terminare i pasti almeno 3 ore prima di coricarsi. Prestare particolare attenzione ai tempi dei pasti intorno alle esibizioni",
    de: "Mahlzeiten mindestens 3 Stunden vor dem Schlafengehen beenden. Besonders auf die Essenszeiten rund um Auftritte achten",
    fr: "Terminer les repas au moins 3 heures avant le coucher. Faire particulièrement attention au moment des repas autour des représentations",
    es: "Terminar de comer al menos 3 horas antes de acostarte. Prestar especial atención al horario de las comidas alrededor de las actuaciones",
    ko: "취침 3시간 전까지 식사를 마친다. 특히 공연 전후의 식사 타이밍에 주의한다", ru: "Заканчивайте приём пищи как минимум за 3 часа до сна. Особое внимание уделяйте времени приёма пищи вокруг выступлений"
  },
  s1List6: {
    ja: "就寝時に上体をやや高くする",
    en: "Slightly elevate your upper body while sleeping",
    zh: "睡觉时略微垫高上半身",
    it: "Tenere leggermente sollevata la parte superiore del corpo durante il sonno",
    de: "Den Oberkörper beim Schlafen leicht erhöht halten",
    fr: "Surélever légèrement le haut du corps pendant le sommeil",
    es: "Elevar ligeramente la parte superior del cuerpo al dormir",
    ko: "취침 시 상체를 약간 높인다", ru: "Слегка приподнимайте верхнюю часть тела во время сна"
  },
  s1List7: {
    ja: "カフェイン・アルコール・炭酸飲料・脂っこい食事・チョコレート・柑橘類など、逆流を誘発しやすいとされる飲食物を把握しておく",
    en: "Be aware of foods and drinks often associated with triggering reflux, such as caffeine, alcohol, carbonated drinks, fatty foods, chocolate, and citrus",
    zh: "了解容易诱发反流的饮食，如咖啡因、酒精、碳酸饮料、油腻食物、巧克力、柑橘类等",
    it: "Essere consapevoli di cibi e bevande spesso associati al reflusso, come caffeina, alcol, bevande gassate, cibi grassi, cioccolato e agrumi",
    de: "Auf Lebensmittel und Getränke achten, die häufig Reflux auslösen, wie Koffein, Alkohol, kohlensäurehaltige Getränke, fettige Speisen, Schokolade und Zitrusfrüchte",
    fr: "Être attentif aux aliments et boissons souvent associés au déclenchement du reflux, comme la caféine, l'alcool, les boissons gazeuses, les aliments gras, le chocolat et les agrumes",
    es: "Ser consciente de los alimentos y bebidas a menudo asociados con desencadenar el reflujo, como cafeína, alcohol, bebidas carbonatadas, comidas grasas, chocolate y cítricos",
    ko: "카페인・알코올・탄산음료・기름진 음식・초콜릿・감귤류 등 역류를 유발하기 쉽다고 알려진 음식을 파악해 둔다", ru: "Учитывайте продукты и напитки, часто провоцирующие рефлюкс: кофеин, алкоголь, газированные напитки, жирная пища, шоколад и цитрусовые"
  },
  s1List8: {
    ja: "大量の食事を避け、少量に分けて摂る",
    en: "Avoid large meals; eat smaller portions more frequently",
    zh: "避免大量进食，少量多餐",
    it: "Evitare pasti abbondanti; preferire porzioni più piccole e frequenti",
    de: "Große Mahlzeiten vermeiden; lieber kleinere Portionen häufiger essen",
    fr: "Éviter les repas copieux ; privilégier de plus petites portions plus fréquentes",
    es: "Evitar comidas abundantes; comer porciones más pequeñas con más frecuencia",
    ko: "과식을 피하고 소량씩 나누어 섭취한다", ru: "Избегайте обильных приёмов пищи; ешьте небольшими порциями чаще"
  },
  s1Note: {
    ja: "症状が続く場合は自己判断で済ませず、耳鼻咽喉科を受診することを強くおすすめします。",
    en: "If symptoms persist, please don't rely on self-diagnosis — we strongly recommend seeing an ENT specialist.",
    zh: "如症状持续，请勿仅凭自我判断，强烈建议前往耳鼻喉科就诊。",
    it: "Se i sintomi persistono, non affidarti all'autodiagnosi: ti consigliamo vivamente di consultare un otorinolaringoiatra.",
    de: "Bei anhaltenden Symptomen solltest du dich nicht auf Selbstdiagnose verlassen — wir empfehlen dringend, einen HNO-Arzt aufzusuchen.",
    fr: "Si les symptômes persistent, ne vous fiez pas à l'autodiagnostic — nous vous recommandons vivement de consulter un ORL.",
    es: "Si los síntomas persisten, no te bases en el autodiagnóstico: te recomendamos encarecidamente consultar a un otorrinolaringólogo.",
    ko: "증상이 계속되는 경우 자가 판단으로 끝내지 말고, 이비인후과 진료를 받으시길 강력히 권장합니다.", ru: "Если симптомы сохраняются, пожалуйста, не полагайтесь на самодиагностику — настоятельно рекомендуем обратиться к отоларингологу."
  },

  // ===== Section 2: Other symptoms =====
  s2Title: {
    ja: "その他、歌手が注意すべき症状",
    en: "Other Symptoms Singers Should Watch For",
    zh: "歌手需注意的其他症状",
    it: "Altri sintomi a cui i cantanti dovrebbero prestare attenzione",
    de: "Weitere Symptome, auf die Sänger achten sollten",
    fr: "Autres symptômes que les chanteurs devraient surveiller",
    es: "Otros síntomas que los cantantes deben vigilar",
    ko: "성악가가 주의해야 할 그 외의 증상", ru: "Другие симптомы, на которые стоит обратить внимание певцам"
  },
  s2Item1Term: {
    ja: "声帯結節・声帯ポリープ",
    en: "Vocal nodules / vocal polyps",
    zh: "声带结节・声带息肉",
    it: "Noduli vocali / polipi vocali",
    de: "Stimmlippenknötchen / Stimmlippenpolypen",
    fr: "Nodules vocaux / polypes vocaux",
    es: "Nódulos vocales / pólipos vocales",
    ko: "성대결절・성대폴립", ru: "Узелки / полипы голосовых связок"
  },
  s2Item1Desc: {
    ja: "声の使いすぎや発声方法によって声帯にできる良性の病変。声のかすれ、声域の低下が特徴です。",
    en: "Benign growths on the vocal folds caused by vocal overuse or technique issues. Characterized by hoarseness and reduced vocal range.",
    zh: "因用声过度或发声方式不当，在声带上形成的良性病变。特征是声音嘶哑、音域下降。",
    it: "Lesioni benigne sulle corde vocali causate da un uso eccessivo della voce o problemi di tecnica. Caratterizzate da raucedine e riduzione dell'estensione vocale.",
    de: "Gutartige Veränderungen an den Stimmlippen durch übermäßige Stimmnutzung oder Techniktprobleme. Gekennzeichnet durch Heiserkeit und verringerten Stimmumfang.",
    fr: "Lésions bénignes sur les cordes vocales causées par une surutilisation vocale ou des problèmes de technique. Caractérisées par un enrouement et une tessiture réduite.",
    es: "Lesiones benignas en las cuerdas vocales causadas por sobreuso vocal o problemas de técnica. Se caracterizan por ronquera y rango vocal reducido.",
    ko: "목소리의 과사용이나 발성 방법에 의해 성대에 생기는 양성 병변. 목소리 쉼과 음역대 저하가 특징입니다.", ru: "Доброкачественные образования на голосовых связках, возникающие из-за перенапряжения голоса или проблем с техникой. Характеризуются хрипотой и сужением диапазона голоса."
  },
  s2Item2Term: {
    ja: "声帯出血",
    en: "Vocal fold hemorrhage",
    zh: "声带出血",
    it: "Emorragia delle corde vocali",
    de: "Stimmlippenblutung",
    fr: "Hémorragie des cordes vocales",
    es: "Hemorragia de las cuerdas vocales",
    ko: "성대출혈", ru: "Кровоизлияние в голосовую связку"
  },
  s2Item2Desc: {
    ja: "急激な発声（過度な高音や大声）の後に起こることがある、声帯の血管が破れる状態。即座の休声が必要とされます。",
    en: "A condition where a blood vessel in the vocal fold ruptures, sometimes occurring after sudden vocal strain (excessive high notes or loud volume). Immediate voice rest is typically required.",
    zh: "剧烈发声（过高音或过大音量）后可能发生，声带血管破裂的状态。通常需要立即禁声休息。",
    it: "Una condizione in cui un vaso sanguigno nella corda vocale si rompe, talvolta dopo uno sforzo vocale improvviso (note acute eccessive o volume elevato). È generalmente necessario un riposo vocale immediato.",
    de: "Ein Zustand, bei dem ein Blutgefäß in der Stimmlippe reißt, manchmal nach plötzlicher stimmlicher Überlastung (übermäßige hohe Töne oder Lautstärke). Sofortige Stimmruhe ist in der Regel erforderlich.",
    fr: "Une affection où un vaisseau sanguin de la corde vocale se rompt, parfois après un effort vocal soudain (aigus excessifs ou volume élevé). Un repos vocal immédiat est généralement nécessaire.",
    es: "Una condición en la que un vaso sanguíneo de la cuerda vocal se rompe, a veces tras un esfuerzo vocal repentino (notas agudas excesivas o volumen alto). Generalmente se requiere reposo vocal inmediato.",
    ko: "급격한 발성(과도한 고음이나 큰 소리) 후에 발생할 수 있는, 성대의 혈관이 파열되는 상태입니다. 즉각적인 발성 휴식이 필요합니다.", ru: "Состояние, при котором разрывается кровеносный сосуд в голосовой связке, иногда возникающее после резкого голосового перенапряжения (чрезмерно высоких нот или громкого звука). Обычно требуется немедленный голосовой покой."
  },
  s2Item3Term: {
    ja: "筋緊張性発声障害",
    en: "Muscle tension dysphonia",
    zh: "肌肉紧张性发声障碍",
    it: "Disfonia da tensione muscolare",
    de: "Muskuläre Spannungsdysphonie",
    fr: "Dysphonie de tension musculaire",
    es: "Disfonía por tensión muscular",
    ko: "근긴장성 발성장애", ru: "Мышечно-тензионная дисфония"
  },
  s2Item3Desc: {
    ja: "発声時に喉や首まわりの筋肉が過剰に緊張することで起こる、器質的な異常がないのに生じる声の不調です。",
    en: "Voice trouble caused by excessive tension in the throat and neck muscles during phonation, occurring without any underlying structural abnormality.",
    zh: "发声时喉部及颈部肌肉过度紧张所引起的声音异常，即使没有器质性病变也可能发生。",
    it: "Disturbi della voce causati da tensione eccessiva dei muscoli della gola e del collo durante la fonazione, senza alcuna anomalia strutturale sottostante.",
    de: "Stimmprobleme durch übermäßige Anspannung der Hals- und Nackenmuskulatur beim Sprechen/Singen, ohne zugrunde liegende strukturelle Anomalie.",
    fr: "Troubles vocaux causés par une tension excessive des muscles de la gorge et du cou pendant la phonation, sans anomalie structurelle sous-jacente.",
    es: "Problemas de voz causados por tensión excesiva en los músculos de la garganta y el cuello durante la fonación, sin ninguna anomalía estructural subyacente.",
    ko: "발성 시 목과 목 주변 근육이 과도하게 긴장하여 발생하는, 기질적 이상 없이 생기는 목소리 문제입니다.", ru: "Нарушение голоса, вызванное избыточным напряжением мышц горла и шеи во время фонации, возникающее без каких-либо структурных отклонений."
  },
  s2Item4Term: {
    ja: "アレルギー性鼻炎・後鼻漏",
    en: "Allergic rhinitis / postnasal drip",
    zh: "过敏性鼻炎・鼻涕倒流",
    it: "Rinite allergica / scolo retronasale",
    de: "Allergische Rhinitis / postnasaler Tropf",
    fr: "Rhinite allergique / écoulement postnasal",
    es: "Rinitis alérgica / goteo posnasal",
    ko: "알레르기성 비염・후비루", ru: "Аллергический ринит / постназальный синдром"
  },
  s2Item4Desc: {
    ja: "鼻水が喉に垂れることで違和感や咳払いの原因になり、発声にも影響することがあります。",
    en: "Mucus dripping down the back of the throat can cause discomfort and throat-clearing, and may also affect the voice.",
    zh: "鼻涕倒流至喉咙，可能引起不适或清嗓，也可能影响发声。",
    it: "Il muco che scola nella parte posteriore della gola può causare fastidio e bisogno di schiarirsi la voce, e può anche influire sulla voce.",
    de: "Schleim, der die Rachenhinterwand hinabläuft, kann Unwohlsein und Räuspern verursachen und auch die Stimme beeinträchtigen.",
    fr: "Le mucus qui coule à l'arrière de la gorge peut provoquer une gêne et le besoin de se racler la gorge, et peut aussi affecter la voix.",
    es: "El moco que gotea por la parte posterior de la garganta puede causar molestia y carraspeo, y también puede afectar a la voz.",
    ko: "콧물이 목으로 넘어가면서 위화감이나 헛기침의 원인이 되며, 발성에도 영향을 줄 수 있습니다.", ru: "Стекание слизи по задней стенке горла может вызывать дискомфорт и откашливание, а также влиять на голос."
  },
  s2Note: cautionWith({
    ja: "声の不調が2週間以上続く場合は受診をおすすめします。",
    en: "If voice trouble persists for more than 2 weeks, we recommend seeing a doctor.",
    zh: "如声音不适持续2周以上，建议就医。",
    it: "Se i problemi vocali durano più di 2 settimane, consigliamo una visita medica.",
    de: "Wenn Stimmprobleme länger als 2 Wochen anhalten, empfehlen wir einen Arztbesuch.",
    fr: "Si les troubles vocaux durent plus de 2 semaines, nous recommandons de consulter.",
    es: "Si los problemas de voz duran más de 2 semanas, recomendamos acudir al médico.",
    ko: "목소리 이상이 2주 이상 계속되면 진료를 권합니다.",
    ru: "Если проблемы с голосом длятся более 2 недель, рекомендуем обратиться к врачу."
  }),

  // ===== Section 3: Vocal hygiene =====
  s3Title: {
    ja: "声の衛生（ボーカルハイジーン）の基本",
    en: "Vocal Hygiene Basics",
    zh: "嗓音卫生（声音保健）的基础",
    it: "Nozioni di base sull'igiene vocale",
    de: "Grundlagen der Stimmhygiene",
    fr: "Bases de l'hygiène vocale",
    es: "Conceptos básicos de higiene vocal",
    ko: "보컬 하이진(음성 위생)의 기본", ru: "Основы голосовой гигиены"
  },
  s3List1: {
    ja: "こまめな水分補給（全身の水分状態は声帯の潤いにも影響するとされています）",
    en: "Stay hydrated throughout the day (overall body hydration is thought to affect vocal fold moisture too)",
    zh: "勤补水分（全身的水分状态据说也会影响声带的湿润度）",
    it: "Mantenersi idratati durante il giorno (l'idratazione generale del corpo si ritiene influisca anche sull'umidità delle corde vocali)",
    de: "Über den Tag verteilt ausreichend trinken (der allgemeine Flüssigkeitshaushalt des Körpers beeinflusst vermutlich auch die Feuchtigkeit der Stimmlippen)",
    fr: "Rester hydraté tout au long de la journée (l'hydratation générale du corps influencerait aussi l'humidité des cordes vocales)",
    es: "Mantenerse hidratado durante el día (se cree que la hidratación general del cuerpo también afecta a la humedad de las cuerdas vocales)",
    ko: "수시로 수분을 보충한다(전신의 수분 상태가 성대의 촉촉함에도 영향을 준다고 알려져 있습니다)", ru: "Регулярно пейте воду в течение дня (считается, что общая гидратация организма влияет и на увлажнённость голосовых связок)"
  },
  s3List2: {
    ja: "十分な睡眠",
    en: "Get adequate sleep",
    zh: "充足的睡眠",
    it: "Dormire a sufficienza",
    de: "Ausreichend schlafen",
    fr: "Dormir suffisamment",
    es: "Dormir lo suficiente",
    ko: "충분한 수면", ru: "Высыпайтесь достаточно"
  },
  s3List3: {
    ja: "発声前のウォームアップ、発声後のクールダウン",
    en: "Warm up before singing and cool down afterward",
    zh: "发声前热身，发声后放松冷却",
    it: "Riscaldare la voce prima di cantare e rilassarla dopo",
    de: "Vor dem Singen aufwärmen, danach abkühlen",
    fr: "S'échauffer avant de chanter et récupérer après",
    es: "Calentar antes de cantar y enfriar después",
    ko: "발성 전 워밍업, 발성 후 쿨다운", ru: "Разминка перед пением и заминка после"
  },
  s3List4: {
    ja: "大声での会話や過度なささやき声を避ける（ささやき声も声帯に負担がかかるとされています）",
    en: "Avoid shouting and excessive whispering (whispering is also thought to strain the vocal folds)",
    zh: "避免大声说话或过度的耳语（耳语据说也会给声带带来负担）",
    it: "Evitare di gridare e di sussurrare eccessivamente (anche il sussurro si ritiene affatichi le corde vocali)",
    de: "Schreien und übermäßiges Flüstern vermeiden (auch Flüstern belastet vermutlich die Stimmlippen)",
    fr: "Éviter de crier et de chuchoter excessivement (chuchoter solliciterait aussi les cordes vocales)",
    es: "Evitar gritar y susurrar en exceso (se cree que susurrar también tensiona las cuerdas vocales)",
    ko: "큰 소리로 대화하거나 과도하게 속삭이는 것을 피한다(속삭임도 성대에 부담을 준다고 알려져 있습니다)", ru: "Избегайте крика и чрезмерного шёпота (шёпот тоже считается нагрузкой на голосовые связки)"
  },
  s3List5: {
    ja: "空気が乾燥した環境での加湿",
    en: "Use a humidifier in dry environments",
    zh: "在干燥环境中加湿",
    it: "Utilizzare un umidificatore in ambienti secchi",
    de: "In trockenen Umgebungen einen Luftbefeuchter verwenden",
    fr: "Utiliser un humidificateur dans les environnements secs",
    es: "Usar un humidificador en ambientes secos",
    ko: "공기가 건조한 환경에서는 가습한다", ru: "Используйте увлажнитель воздуха в сухих помещениях"
  },
  s3List6: {
    ja: "喫煙・受動喫煙を避ける",
    en: "Avoid smoking and secondhand smoke",
    zh: "避免吸烟及二手烟",
    it: "Evitare il fumo e il fumo passivo",
    de: "Rauchen und Passivrauchen vermeiden",
    fr: "Éviter le tabagisme actif et passif",
    es: "Evitar fumar y el humo de segunda mano",
    ko: "흡연・간접흡연을 피한다", ru: "Избегайте курения и пассивного курения"
  },

  // ===== Section 4: Exercises =====
  s4Title: {
    ja: "歌手に役立つ運動 — 目的別に整理",
    en: "Exercises Useful for Singers — Organized by Purpose",
    zh: "对歌手有益的运动——按目的分类",
    it: "Esercizi utili per i cantanti — organizzati per obiettivo",
    de: "Nützliche Übungen für Sänger — nach Zweck geordnet",
    fr: "Exercices utiles pour les chanteurs — classés par objectif",
    es: "Ejercicios útiles para cantantes, organizados por objetivo",
    ko: "성악가에게 도움이 되는 운동 — 목적별 정리", ru: "Полезные упражнения для певцов — по целям"
  },
  s4Sub1: {
    ja: "呼吸支持（ブレスサポート）のために",
    en: "For breath support",
    zh: "为了呼吸支持",
    it: "Per il sostegno del respiro",
    de: "Für Atemstütze",
    fr: "Pour le soutien respiratoire",
    es: "Para el apoyo respiratorio",
    ko: "호흡 지지(브레스 서포트)를 위해", ru: "Для поддержки дыхания"
  },
  s4Item1Term: {
    ja: "横隔膜呼吸（腹式呼吸）の練習",
    en: "Diaphragmatic (belly) breathing practice",
    zh: "横膈膜呼吸（腹式呼吸）练习",
    it: "Pratica della respirazione diaframmatica (addominale)",
    de: "Zwerchfellatmung (Bauchatmung) üben",
    fr: "Pratique de la respiration diaphragmatique (abdominale)",
    es: "Práctica de respiración diafragmática (abdominal)",
    ko: "횡격막 호흡(복식호흡) 연습", ru: "Практика диафрагмального (брюшного) дыхания"
  },
  s4Item1Desc: {
    ja: "安定した息の流れを作る土台になります。息の流れが安定するほど、音程の安定やフレーズの持続がしやすくなるとされています。",
    en: "Forms the foundation for a steady airflow. A more stable airflow is thought to make pitch stability and sustaining phrases easier.",
    zh: "是构建稳定气流的基础。气流越稳定，据说越容易保持音准稳定和维持乐句的延续。",
    it: "Costituisce la base per un flusso d'aria stabile. Un flusso d'aria più stabile si ritiene renda più facile la stabilità dell'intonazione e il sostenimento delle frasi.",
    de: "Bildet die Grundlage für einen stabilen Atemfluss. Ein stabilerer Atemfluss soll Tonhöhenstabilität und das Durchhalten von Phrasen erleichtern.",
    fr: "Constitue la base d'un flux d'air stable. Un flux d'air plus stable faciliterait la stabilité de la hauteur et le maintien des phrases.",
    es: "Constituye la base para un flujo de aire estable. Se cree que un flujo de aire más estable facilita la estabilidad del tono y sostener las frases.",
    ko: "안정된 숨의 흐름을 만드는 토대가 됩니다. 숨의 흐름이 안정될수록 음정의 안정과 프레이즈 지속이 쉬워진다고 알려져 있습니다.", ru: "Формирует основу для стабильного потока воздуха. Считается, что чем стабильнее поток воздуха, тем легче добиться стабильности высоты тона и удерживать фразы."
  },
  s4Item2Term: {
    ja: "プランクなど体幹トレーニング",
    en: "Core training such as planks",
    zh: "平板支撑等核心力量训练",
    it: "Allenamento del core come il plank",
    de: "Rumpftraining wie Planks",
    fr: "Renforcement du gainage comme la planche",
    es: "Entrenamiento del core como las planchas",
    ko: "플랭크 등 코어 트레이닝", ru: "Тренировка кора, например планка"
  },
  s4Item2Desc: {
    ja: "腹横筋を含む体幹の支持筋を鍛えることで、呼気を細かくコントロールしやすくなります。",
    en: "Strengthening core support muscles, including the transverse abdominis, makes fine control of exhaled air easier.",
    zh: "通过锻炼包括腹横肌在内的核心支撑肌群，能更精细地控制呼气。",
    it: "Rafforzare i muscoli di supporto del core, incluso il trasverso dell'addome, facilita un controllo più fine dell'aria espirata.",
    de: "Die Stärkung der Rumpfstützmuskulatur, einschließlich des Musculus transversus abdominis, erleichtert die feine Kontrolle der Ausatemluft.",
    fr: "Renforcer les muscles de soutien du tronc, y compris le transverse de l'abdomen, facilite un contrôle plus fin de l'air expiré.",
    es: "Fortalecer los músculos de soporte del core, incluido el transverso del abdomen, facilita un control más fino del aire exhalado.",
    ko: "복횡근을 포함한 체간의 지지 근육을 단련함으로써, 날숨을 세밀하게 조절하기 쉬워집니다.", ru: "Укрепление опорных мышц кора, включая поперечную мышцу живота, облегчает точный контроль выдоха."
  },
  s4Item3Term: {
    ja: "ピラティス",
    en: "Pilates",
    zh: "普拉提",
    it: "Pilates",
    de: "Pilates",
    fr: "Pilates",
    es: "Pilates",
    ko: "필라테스", ru: "Пилатес"
  },
  s4Item3Desc: {
    ja: "体幹の意識的なコントロールと呼吸法を組み合わせて練習できるため、ブレスサポートの感覚を養うのに向いています。",
    en: "Combines conscious core control with breathing technique, making it well-suited for developing a sense of breath support.",
    zh: "能够将有意识的核心控制与呼吸法结合练习，适合培养呼吸支持的感觉。",
    it: "Combina il controllo consapevole del core con la tecnica respiratoria, risultando adatto a sviluppare il senso del sostegno del respiro.",
    de: "Kombiniert bewusste Rumpfkontrolle mit Atemtechnik und eignet sich daher gut, um ein Gefühl für Atemstütze zu entwickeln.",
    fr: "Combine le contrôle conscient du tronc avec une technique respiratoire, ce qui est bien adapté au développement du sens du soutien respiratoire.",
    es: "Combina el control consciente del core con la técnica de respiración, siendo adecuado para desarrollar la sensación de apoyo respiratorio.",
    ko: "체간의 의식적인 컨트롤과 호흡법을 결합하여 연습할 수 있어, 브레스 서포트의 감각을 기르는 데 적합합니다.", ru: "Сочетает осознанный контроль кора с техникой дыхания, поэтому хорошо подходит для развития ощущения дыхательной опоры."
  },
  s4Sub2: {
    ja: "姿勢・喉頭の安定のために",
    en: "For posture and laryngeal stability",
    zh: "为了姿势与喉部稳定",
    it: "Per la postura e la stabilità laringea",
    de: "Für Haltung und Kehlkopfstabilität",
    fr: "Pour la posture et la stabilité laryngée",
    es: "Para la postura y la estabilidad laríngea",
    ko: "자세・후두 안정을 위해", ru: "Для осанки и стабильности гортани"
  },
  s4Item4Term: {
    ja: "背中・肩甲骨まわりのストレッチ",
    en: "Back and shoulder-blade stretches",
    zh: "背部・肩胛骨周围拉伸",
    it: "Stretching della schiena e delle scapole",
    de: "Rücken- und Schulterblattdehnungen",
    fr: "Étirements du dos et des omoplates",
    es: "Estiramientos de espalda y omóplatos",
    ko: "등・견갑골 주변 스트레칭", ru: "Растяжка спины и лопаток"
  },
  s4Item4Desc: {
    ja: "猫背などの姿勢の崩れは胸郭の可動域を狭め、呼吸や共鳴に影響しうるため、ほぐしておくことが役立ちます。",
    en: "Poor posture such as slouching can narrow the rib cage's range of motion and affect breathing and resonance, so keeping this area loose can help.",
    zh: "驼背等不良姿势会缩小胸廓的活动范围，可能影响呼吸与共鸣，因此保持这一区域的松弛有帮助。",
    it: "Una postura scorretta come le spalle curve può ridurre l'ampiezza di movimento della gabbia toracica e influire su respirazione e risonanza, quindi mantenere questa zona sciolta può essere utile.",
    de: "Schlechte Haltung wie ein Rundrücken kann den Bewegungsspielraum des Brustkorbs einschränken und Atmung sowie Resonanz beeinflussen, daher hilft es, diesen Bereich locker zu halten.",
    fr: "Une mauvaise posture comme le dos voûté peut réduire l'amplitude de mouvement de la cage thoracique et affecter la respiration et la résonance ; garder cette zone souple peut donc aider.",
    es: "Una mala postura, como encorvarse, puede reducir el rango de movimiento de la caja torácica y afectar la respiración y la resonancia, por lo que mantener esta zona relajada puede ayudar.",
    ko: "새우등 등 자세가 흐트러지면 흉곽의 가동 범위가 좁아져 호흡이나 공명에 영향을 줄 수 있으므로, 평소에 풀어두는 것이 도움이 됩니다.", ru: "Плохая осанка, например сутулость, сужает диапазон движения грудной клетки и может влиять на дыхание и резонанс, поэтому полезно её расслаблять."
  },
  s4Item5Term: {
    ja: "首・肩のストレッチ、緊張のリリース",
    en: "Neck and shoulder stretches, tension release",
    zh: "颈肩拉伸，释放紧张",
    it: "Stretching di collo e spalle, rilascio della tensione",
    de: "Nacken- und Schulterdehnungen, Spannungslösung",
    fr: "Étirements du cou et des épaules, relâchement des tensions",
    es: "Estiramientos de cuello y hombros, liberación de tensión",
    ko: "목・어깨 스트레칭, 긴장 이완", ru: "Растяжка шеи и плеч, снятие напряжения"
  },
  s4Item5Desc: {
    ja: "首まわりの過剰な緊張は、喉頭を不必要に引き上げてしまう一因になりうるとされています。定期的にほぐすことが大切です。",
    en: "Excessive tension around the neck may be a contributing factor in unnecessarily raising the larynx. Regular release is important.",
    zh: "颈部过度紧张，可能是导致喉部不必要上抬的原因之一。定期放松非常重要。",
    it: "Una tensione eccessiva intorno al collo può contribuire a un innalzamento non necessario della laringe. Un rilascio regolare è importante.",
    de: "Übermäßige Anspannung im Nackenbereich kann zu einer unnötigen Anhebung des Kehlkopfs beitragen. Regelmäßiges Lockern ist wichtig.",
    fr: "Une tension excessive autour du cou peut contribuer à une élévation inutile du larynx. Un relâchement régulier est important.",
    es: "La tensión excesiva alrededor del cuello puede contribuir a elevar innecesariamente la laringe. La liberación regular es importante.",
    ko: "목 주변의 과도한 긴장은 후두를 불필요하게 끌어올리는 원인 중 하나가 될 수 있다고 알려져 있습니다. 정기적으로 풀어주는 것이 중요합니다.", ru: "Считается, что чрезмерное напряжение в области шеи может способствовать неоправданному подъёму гортани. Важно регулярно его снимать."
  },
  s4Item6Term: {
    ja: "姿勢を意識したエクササイズ（壁を使った姿勢チェックなど）",
    en: "Posture-focused exercises (e.g. wall posture checks)",
    zh: "注重姿势的练习（如靠墙姿势检查等）",
    it: "Esercizi focalizzati sulla postura (es. controllo posturale contro il muro)",
    de: "Haltungsbewusste Übungen (z. B. Haltungscheck an der Wand)",
    fr: "Exercices axés sur la posture (par ex. vérification posturale contre un mur)",
    es: "Ejercicios centrados en la postura (por ejemplo, comprobación postural contra la pared)",
    ko: "자세를 의식한 운동(벽을 이용한 자세 체크 등)", ru: "Упражнения с фокусом на осанку (например, проверка осанки у стены)"
  },
  s4Item6Desc: {
    ja: "喉頭が自由に動ける安定したアライメント（骨格の並び）を保つのに役立ちます。",
    en: "Helps maintain stable alignment that allows the larynx to move freely.",
    zh: "有助于保持能让喉部自由活动的稳定骨骼排列。",
    it: "Aiuta a mantenere un allineamento stabile che permette alla laringe di muoversi liberamente.",
    de: "Hilft, eine stabile Ausrichtung zu bewahren, die dem Kehlkopf freie Beweglichkeit ermöglicht.",
    fr: "Aide à maintenir un alignement stable permettant au larynx de bouger librement.",
    es: "Ayuda a mantener una alineación estable que permite que la laringe se mueva libremente.",
    ko: "후두가 자유롭게 움직일 수 있는 안정된 정렬(골격 배열)을 유지하는 데 도움이 됩니다.", ru: "Помогает поддерживать стабильное выравнивание, при котором гортань может свободно двигаться."
  },
  s4Sub3: {
    ja: "全身持久力のために",
    en: "For overall endurance",
    zh: "为了全身耐力",
    it: "Per la resistenza generale",
    de: "Für allgemeine Ausdauer",
    fr: "Pour l'endurance générale",
    es: "Para la resistencia general",
    ko: "전신 지구력을 위해", ru: "Для общей выносливости"
  },
  s4Item7Term: {
    ja: "ウォーキングや軽いジョギングなどの有酸素運動",
    en: "Aerobic exercise such as walking or light jogging",
    zh: "步行、轻度慢跑等有氧运动",
    it: "Esercizio aerobico come camminata o jogging leggero",
    de: "Ausdauertraining wie Gehen oder leichtes Joggen",
    fr: "Exercice aérobique comme la marche ou le jogging léger",
    es: "Ejercicio aeróbico como caminar o trotar suavemente",
    ko: "걷기나 가벼운 조깅 등 유산소 운동", ru: "Аэробные упражнения, например ходьба или лёгкий бег трусцой"
  },
  s4Item7Desc: {
    ja: "心肺機能の向上は、長時間の公演やオーケストラを通しての体力維持に役立つとされています。",
    en: "Improved cardiovascular fitness is thought to help maintain stamina through long performances or full runs with orchestra.",
    zh: "提升心肺功能，据说有助于在长时间演出或整场乐团合作中维持体力。",
    it: "Un miglioramento della forma cardiovascolare si ritiene aiuti a mantenere la resistenza durante esibizioni lunghe o prove complete con orchestra.",
    de: "Eine verbesserte kardiovaskuläre Fitness soll helfen, die Ausdauer während langer Auftritte oder kompletter Orchesterproben aufrechtzuerhalten.",
    fr: "Une meilleure condition cardiovasculaire aiderait à maintenir l'endurance lors de représentations longues ou de filages complets avec orchestre.",
    es: "Se cree que una mejor condición cardiovascular ayuda a mantener la resistencia durante actuaciones largas o ensayos completos con orquesta.",
    ko: "심폐 기능 향상은 장시간의 공연이나 오케스트라와 함께하는 전곡 연주에서 체력을 유지하는 데 도움이 된다고 알려져 있습니다.", ru: "Считается, что улучшение сердечно-сосудистой выносливости помогает сохранять силы на протяжении длительных выступлений или полных прогонов с оркестром."
  },

  // ===== Section 5: Strength training reps =====
  s5Title: {
    ja: "筋トレ回数の一般的な目安",
    en: "General Guidelines for Strength Training Reps",
    zh: "力量训练次数的一般参考",
    it: "Linee guida generali per le ripetizioni nell'allenamento di forza",
    de: "Allgemeine Richtwerte für Krafttrainingswiederholungen",
    fr: "Repères généraux pour les répétitions en musculation",
    es: "Pautas generales para las repeticiones en entrenamiento de fuerza",
    ko: "근력 운동 횟수의 일반적인 기준", ru: "Общие рекомендации по числу повторений в силовых тренировках"
  },
  s5Item1Term: {
    ja: "初心者の場合：8〜12回を1セット、2〜3セット、週2〜3回程度",
    en: "For beginners: 8–12 reps per set, 2–3 sets, about 2–3 times per week",
    zh: "初学者：每组8〜12次，2〜3组，每周约2〜3次",
    it: "Per i principianti: 8–12 ripetizioni per serie, 2–3 serie, circa 2–3 volte a settimana",
    de: "Für Anfänger: 8–12 Wiederholungen pro Satz, 2–3 Sätze, etwa 2–3 Mal pro Woche",
    fr: "Pour les débutants : 8 à 12 répétitions par série, 2 à 3 séries, environ 2 à 3 fois par semaine",
    es: "Para principiantes: 8–12 repeticiones por serie, 2–3 series, unas 2–3 veces por semana",
    ko: "초보자의 경우: 8~12회를 1세트, 2~3세트, 주 2~3회 정도", ru: "Для начинающих: 8–12 повторений в подходе, 2–3 подхода, примерно 2–3 раза в неделю"
  },
  s5Item1Desc: {
    ja: "一般的な筋力・筋持久力の向上に広く使われている目安です。正しいフォームを習得しやすく、怪我のリスクも抑えやすい回数設定とされています。",
    en: "A widely used guideline for general strength and muscular endurance gains. This rep range is considered easier for learning correct form and lower in injury risk.",
    zh: "这是广泛用于提升一般肌力与肌耐力的参考标准。据说这一次数设定更容易掌握正确姿势，也更能降低受伤风险。",
    it: "Una linea guida ampiamente utilizzata per i guadagni generali di forza e resistenza muscolare. Questo intervallo di ripetizioni è considerato più facile per imparare la forma corretta e a minor rischio di infortunio.",
    de: "Ein weit verbreiteter Richtwert für allgemeine Kraft- und Muskelausdauergewinne. Dieser Wiederholungsbereich gilt als leichter zum Erlernen der korrekten Form und mit geringerem Verletzungsrisiko.",
    fr: "Un repère largement utilisé pour les gains généraux de force et d'endurance musculaire. Cette plage de répétitions est considérée comme plus facile pour apprendre la bonne forme et présente un risque de blessure plus faible.",
    es: "Una pauta ampliamente utilizada para ganancias generales de fuerza y resistencia muscular. Este rango de repeticiones se considera más fácil para aprender la forma correcta y con menor riesgo de lesión.",
    ko: "일반적인 근력・근지구력 향상에 널리 사용되는 기준입니다. 올바른 자세를 익히기 쉽고, 부상 위험도 억제하기 쉬운 횟수 설정이라고 알려져 있습니다.", ru: "Широко используемая рекомендация для общего развития силы и мышечной выносливости. Считается, что такой диапазон повторений облегчает освоение правильной техники и снижает риск травм."
  },
  s5Item2Term: {
    ja: "慣れてきたら、フォームを保てる範囲で徐々に負荷や回数を増やす",
    en: "As you get used to it, gradually increase load or reps while maintaining proper form",
    zh: "熟悉后，在保持姿势正确的范围内逐渐增加负荷或次数",
    it: "Man mano che prendi confidenza, aumenta gradualmente il carico o le ripetizioni mantenendo la forma corretta",
    de: "Mit zunehmender Gewöhnung Belastung oder Wiederholungen schrittweise steigern, solange die korrekte Form beibehalten werden kann",
    fr: "Au fur et à mesure, augmentez progressivement la charge ou les répétitions tout en conservant une bonne forme",
    es: "A medida que te acostumbres, aumenta gradualmente la carga o las repeticiones mientras mantengas la forma correcta",
    ko: "익숙해지면 자세를 유지할 수 있는 범위 내에서 점차 부하나 횟수를 늘린다", ru: "По мере привыкания постепенно увеличивайте нагрузку или число повторений, сохраняя правильную технику"
  },
  s5Item2Desc: {
    ja: "少しずつ負荷を上げていくことで体が適応していく、という「漸進的過負荷」の考え方に基づいています。",
    en: "Based on the principle of \"progressive overload\" — the body adapts as load is gradually increased over time.",
    zh: "基于「渐进式超负荷」的理念——身体会随着负荷的逐步增加而适应。",
    it: "Basato sul principio del \"sovraccarico progressivo\": il corpo si adatta man mano che il carico viene aumentato gradualmente nel tempo.",
    de: "Basiert auf dem Prinzip der \"progressiven Überlastung\" — der Körper passt sich an, wenn die Belastung im Laufe der Zeit schrittweise gesteigert wird.",
    fr: "Basé sur le principe de la « surcharge progressive » : le corps s'adapte à mesure que la charge est augmentée graduellement au fil du temps.",
    es: "Se basa en el principio de \"sobrecarga progresiva\": el cuerpo se adapta a medida que la carga aumenta gradualmente con el tiempo.",
    ko: "조금씩 부하를 높여감으로써 몸이 적응해 간다는 '점진적 과부하'의 개념에 기반합니다.", ru: "Основано на принципе «прогрессивной перегрузки» — организм адаптируется по мере постепенного увеличения нагрузки."
  },
  s5Note: {
    ja: "体調に不安がある場合や持病がある場合は、始める前に医師に相談してください。",
    en: "If you have any health concerns or existing conditions, please consult a doctor before starting.",
    zh: "如对身体状况有担忧或患有慢性疾病，开始前请咨询医生。",
    it: "In caso di dubbi sulla salute o patologie preesistenti, consulta un medico prima di iniziare.",
    de: "Bei gesundheitlichen Bedenken oder bestehenden Erkrankungen wende dich bitte vor Beginn an einen Arzt.",
    fr: "En cas de préoccupations de santé ou de conditions préexistantes, veuillez consulter un médecin avant de commencer.",
    es: "Si tienes alguna preocupación de salud o condiciones preexistentes, consulta a un médico antes de empezar.",
    ko: "몸 상태가 걱정되거나 지병이 있는 경우, 시작하기 전에 의사와 상담하세요.", ru: "Если у вас есть опасения по поводу здоровья или хронические заболевания, проконсультируйтесь с врачом перед началом занятий."
  }
};
