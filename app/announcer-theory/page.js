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

const T = {
  diagramTitle: { ja: "「スポット」——舌先の正しい位置", en: "The \"Spot\": Correct Tongue Tip Position" },
  labelSpot: { ja: "スポット", en: "The spot" },
  labelUpperPalate: { ja: "上顎", en: "Upper palate" },
  labelTongueTip: { ja: "舌先", en: "Tongue tip" },
  labelUpperLip: { ja: "上唇", en: "Upper lip" },
  labelLowerLip: { ja: "下唇", en: "Lower lip" },
  labelTeeth: { ja: "前歯", en: "Front teeth" },
  eyebrow: { ja: "FOR BROADCASTERS", en: "FOR BROADCASTERS" },
  title: { ja: "アナウンサーのための声と体の理論", en: "Voice & Body Theory for Broadcasters" },
  intro: { ja: "アナウンサーにとっての声は、感情表現の道具である前に、まず「情報を正確に届ける道具」です。滑舌の仕組み、生放送前のコンディション管理、スタジオという乾燥した環境が体に与える影響——それぞれを、感覚ではなく仕組みとして理解しておくことで、日々の再現性が上がります。ここでは、滑舌の基礎から具体的な練習方法、生放送前後のケアまでをまとめています。", en: "For a broadcaster, the voice is first and foremost a tool for delivering information accurately — expressiveness comes second. Understanding the mechanics behind clear articulation, pre-broadcast condition management, and how a dry studio environment affects the body — as systems rather than just feel — makes day-to-day consistency easier to reproduce. This page covers the fundamentals of articulation, concrete practice methods, and care before and after going on air." },
  s1title: { ja: "滑舌の仕組み——舌・唇・顎・呼吸の連動", en: "How Articulation Works: Tongue, Lips, Jaw, and Breath Working Together" },
  s1p1: { ja: "滑舌の悪さは、単に「舌が回らない」という一言では片づけられません。実際には、舌・唇・顎・呼吸という4つの要素がうまく連動していないことが原因であるケースがほとんどです。舌だけを鍛えても、呼吸が浅ければサ行は明瞭になりませんし、顎が動いていなければマ行・ヤ行の響きはこもったままです。", en: "Poor articulation can't be explained away with a simple \"the tongue isn't moving fast enough.\" In most cases, the real cause is that four elements — tongue, lips, jaw, and breath — aren't coordinating well together. Training the tongue alone won't clarify the S-sounds if breathing stays shallow, and the M/Y sounds will stay muffled if the jaw isn't moving." },
  s1p2: { ja: "特に重要なのが、舌先を置く正しい位置——通称「スポット」です。上の前歯の少し後ろ、上顎がわずかにへこんでいる部分に舌先を収めた状態が、タ行・ラ行・ナ行など、多くの子音の発音の出発点になります。舌がこの位置から外れていると、力を入れて発音しているつもりでも、音がこもったり不明瞭になったりします。", en: "Especially important is the correct resting position for the tip of the tongue — commonly called the \"spot.\" This is the slightly concave area just behind the upper front teeth, on the palate. Resting the tongue tip there is the starting point for many consonants, including the T, R, and N sounds. When the tongue drifts from this position, sounds come out muffled or unclear even when you feel like you're articulating with effort." },
  s1p3: { ja: "また、サ行の発音は、吐く息の量に大きく左右されます。呼吸が浅いと、息の量そのものが不足し、サ行が弱く、こもった音になりがちです。50音にはそれぞれ固有の口の形・舌の位置があり、口先だけでなく顔全体を使って発音することが、明瞭な滑舌の土台になります。", en: "The S-sounds, in particular, depend heavily on the volume of air being exhaled. Shallow breathing means less air overall, which tends to make S-sounds weak and muffled. Each sound in the Japanese syllabary has its own mouth shape and tongue position, and using the whole face — not just the lips — is the foundation of clear articulation." },
  s1callout: { ja: "しっかり話した後に顔が少し疲れた感覚が残るなら、それは顔全体を動かして滑舌よく話せている証拠です。逆に、話した後にまったく疲れを感じない場合は、口先だけしか動かせていない可能性があります。", en: "If your face feels slightly tired after speaking properly, that's a sign you're using your whole face and articulating well. If you feel no fatigue at all afterward, you may only be moving your lips." },
  s2title: { ja: "具体的な練習方法", en: "Concrete Practice Methods" },
  s2item1term: { ja: "舌筋トレーニング", en: "Tongue muscle training" },
  s2item1desc: { ja: "舌先を「スポット」(上あごの裏、前歯の少し後ろ)につけたまま、「タタタタ」「ラララララ」をリズムよく発声します。舌の柔軟性とスピードが上がり、タ行・ラ行・ナ行の発音が明瞭になります。", en: "Keep the tip of your tongue on the \"spot\" (behind the upper front teeth) and say \"ta-ta-ta-ta\" or \"la-la-la-la\" rhythmically. This builds tongue flexibility and speed, clarifying the T, R, and N sounds." },
  s2item2term: { ja: "表情筋トレーニング", en: "Facial muscle training" },
  s2item2desc: { ja: "口を大きく動かしながら「あ・い・う・え・お」をゆっくり発声します。頬や顎周りの筋肉がほぐれ、唇まわりの筋肉(口輪筋)が刺激されて、声の響きが前に出るようになります。", en: "Slowly say \"a-i-u-e-o\" while moving your mouth broadly. This loosens the cheek and jaw muscles and stimulates the muscles around the lips (orbicularis oris), helping the voice's resonance project forward." },
  s2item3term: { ja: "タングトリル", en: "Tongue trill" },
  s2item3desc: { ja: "舌を軽く巻いて「ルルルルル」と震わせます。舌の脱力と、呼吸との連動を鍛える練習で、息の流れが滑らかになると同時に、余計な力みが抜けやすくなります。", en: "Lightly curl the tongue and let it vibrate on a rolled \"rrrr\" sound. This trains tongue relaxation together with breath coordination, smoothing out airflow while releasing unnecessary tension." },
  s2item4term: { ja: "開口トレーニング", en: "Jaw-opening training" },
  s2item4desc: { ja: "指を2〜3本、縦にして、無理のない範囲で口を開けます。あご周りの動きがスムーズになり、マ行・ヤ行など、顎の開閉を伴う音の響きがクリアになります。", en: "Hold two or three fingers vertically and open your mouth as wide as that, without straining. This smooths out jaw movement and clarifies sounds like M and Y that depend on the jaw opening and closing." },
  s3title: { ja: "発語練習文集", en: "Practice Sentence Collection" },
  s3note: { ja: "それぞれの練習文には、狙っている音・鍛えたい部位を明記しています。全部を一度にやろうとせず、自分が苦手だと感じる行に絞って、毎日短時間でも繰り返すのが効果的です。", en: "Each sentence below states exactly which sounds or muscle groups it targets. Rather than trying all of them at once, it's more effective to focus on the rows you personally find difficult and repeat them daily, even briefly." },
  s3item1purpose: { ja: "目的：カ行・ガ行——喉の奥を閉じて開く動きを鍛える", en: "Purpose: K/G sounds — training the closing and opening motion at the back of the throat" },
  s3item2purpose: { ja: "目的：サ行——吐く息の量と摩擦音の明瞭さを鍛える", en: "Purpose: S sounds — training exhaled air volume and the clarity of fricatives" },
  s3item3purpose: { ja: "目的：タ行・ラ行——舌先の素早い切り替えを鍛える", en: "Purpose: T/R sounds — training quick switching of the tongue tip" },
  s3item4purpose: { ja: "目的：ナ行・マ行——舌先と口の開閉のリズムを鍛える", en: "Purpose: N/M sounds — training the rhythm of tongue-tip and mouth-opening coordination" },
  s3item5purpose: { ja: "目的：パ行・バ行——唇の閉鎖と開放の瞬発力を鍛える", en: "Purpose: P/B sounds — training the explosive closing and opening of the lips" },
  s3item6purpose: { ja: "目的：数字の連続読み——ニュース原稿特有の紛らわしい数字を明瞭にする", en: "Purpose: Reading number sequences — clarifying easily-confused numbers common in news scripts" },
  s3textNote: { ja: "練習文は日本語特有の音の組み合わせを狙ったものなので、表示言語にかかわらず日本語のまま表示しています。", en: "These practice sentences target specific Japanese phoneme combinations, so they're always shown in Japanese regardless of the display language." },
  s4title: { ja: "生放送前のコンディション管理", en: "Pre-Broadcast Condition Management" },
  s4p1: { ja: "生放送は、体調を後から取り繕うことができない一発勝負の場です。だからこそ、本番の数時間前から意識的にコンディションを整えておく必要があります。", en: "A live broadcast is a one-shot situation where you can't patch up your condition after the fact. That's exactly why it's important to deliberately manage your condition starting several hours before airtime." },
  s4list1: { ja: "本番の1〜2時間前から、不要な私語や長時間の会話を避け、声帯を休ませる時間を作る", en: "Starting 1-2 hours before airtime, avoid unnecessary chatting and long conversations to give the vocal folds time to rest" },
  s4list2: { ja: "シャウトしたり声を張り上げたりするような、喉に負担のかかる発声は避ける", en: "Avoid vocalizations that strain the throat, such as shouting or forcing volume" },
  s4list3: { ja: "カフェインには利尿作用があり、体の水分とともに喉の潤いも奪われやすいため、本番前は控える", en: "Caffeine has a diuretic effect and tends to draw moisture from the throat along with the rest of the body, so avoid it before airtime" },
  s4list4: { ja: "本番前から常温の水分をこまめに摂り、喉を潤しておく。冷たい飲み物より常温の方が粘膜への負担が少ない", en: "Sip room-temperature fluids frequently before airtime to keep the throat moist — room temperature places less strain on the mucosa than cold drinks" },
  s4list5: { ja: "首周り・表情筋・喉の内側をほぐすウォーミングアップを、声を出す前に行う", en: "Do a warm-up that loosens the neck, facial muscles, and inner throat before you start speaking" },
  s4list6: { ja: "適切な食事・運動・睡眠で、そもそも風邪をひかない体調管理を土台にする", en: "Build a foundation of not getting sick in the first place, through proper diet, exercise, and sleep" },
  s5title: { ja: "乾燥対策と体の機能", en: "Dryness Countermeasures and How the Body Responds" },
  s5p1: { ja: "スタジオ、特に照明の熱がこもる収録スペースは、空気が乾燥しやすい環境です。乾燥は喉の粘膜から潤いを奪い、声帯の振動効率を落とします。潤いのある粘膜は滑らかに振動しますが、乾燥した粘膜は振動にムラが出やすく、同じ声を出すにも余計な力が必要になります。", en: "Studios — especially recording spaces where the heat from lighting builds up — tend to have dry air. Dryness draws moisture away from the throat's mucosa, reducing how efficiently the vocal folds vibrate. Moist mucosa vibrates smoothly, but dry mucosa tends to vibrate unevenly, requiring extra effort to produce the same sound." },
  s5list1: { ja: "常温の水分、または体への吸収が早い温めのスポーツドリンクをこまめに摂る", en: "Sip room-temperature fluids, or a warm sports drink that the body absorbs quickly" },
  s5list2: { ja: "ウーロン茶は喉の滑りを悪くすることがあるとされるため、本番前後は避けた方が無難", en: "Oolong tea is thought to make the throat feel less slick, so it's safer to avoid it before and after broadcasts" },
  s5list3: { ja: "就寝時に濡れマスクを着用し、睡眠中の乾燥・雑菌から喉を守る", en: "Wear a damp mask while sleeping to protect the throat from dryness and bacteria overnight" },
  s5list4: { ja: "湿度が保てない環境(飛行機内など)では、ネブライザーのような携帯型の保湿器具も選択肢になる", en: "In environments where humidity can't be maintained (like airplane cabins), a portable nebulizer-type humidifying device can be an option" },
  s5list5: { ja: "咳や強い咳払いは声帯を傷つけるため、喉の調子が悪い時は塩水うがいなど、負担の少ない方法を選ぶ", en: "Coughing or forceful throat-clearing can injure the vocal folds, so when the throat feels off, choose gentler methods like a saltwater gargle" },
  footer: { ja: "主な参考: 声優・アナウンサー養成校および現役プロによる喉ケア・滑舌トレーニングに関する一般的な知見をまとめたものです。特定の指導法や製品を推奨するものではなく、症状が続く場合は耳鼻咽喉科（できれば音声を専門とする医師）にご相談ください。", en: "Main references: This page summarizes general knowledge on vocal care and articulation training drawn from voice-actor and announcer training programs and working professionals. It does not endorse any specific method or product. If symptoms persist, please consult an ENT specialist, ideally one who specializes in voice care." },
};

function tr(key, lang) {
  const entry = T[key];
  if (!entry) return "";
  return entry[lang] || entry.en || entry.ja || "";
}

function Section({ eyebrow, title, children, accent }) {
  return (
    <section style={{ marginTop: 56 }}>
      <p style={{ fontSize: 11.5, letterSpacing: "0.12em", color: accent || C.gold, fontWeight: 700, marginBottom: 6 }}>
        {eyebrow}
      </p>
      <h2 className="ff-display italic" style={{ fontSize: "1.9rem", color: C.ink, margin: "0 0 16px" }}>
        {title}
      </h2>
      <div style={{ color: C.ink, fontSize: 14.5, lineHeight: 1.95 }}>{children}</div>
    </section>
  );
}

function Callout({ children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px", margin: "18px 0", fontSize: 13.5, color: C.inkSoft, lineHeight: 1.8 }}>
      {children}
    </div>
  );
}

function GlossaryItem({ term, children }) {
  return (
    <div style={{ borderTop: `1px solid ${C.line}`, padding: "16px 0" }}>
      <p style={{ margin: 0, fontWeight: 600, color: C.curtain, fontSize: 14.5 }}>{term}</p>
      <p style={{ margin: "6px 0 0", color: C.inkSoft, fontSize: 13.5, lineHeight: 1.8 }}>{children}</p>
    </div>
  );
}

function PracticeSentence({ purpose, text, note }) {
  return (
    <div style={{ borderTop: `1px solid ${C.line}`, padding: "16px 0" }}>
      <p style={{ margin: 0, fontSize: 12.5, color: C.gold, fontWeight: 600 }}>{purpose}</p>
      <p className="ff-display italic" style={{ margin: "8px 0 0", fontSize: "1.15rem", color: C.ink }}>{text}</p>
    </div>
  );
}

// 舌先の正しい位置（通称「スポット」）を示す、口腔断面の簡略図
function TongueSpotDiagram({ lang }) {
  return (
    <svg viewBox="0 0 400 260" width="100%" style={{ maxWidth: 420, display: "block", margin: "20px auto" }}>
      {/* 上顎のライン */}
      <path d="M60,90 Q140,50 260,70 Q310,78 330,110" fill="none" stroke={C.ink} strokeWidth="2.5" strokeLinecap="round" />
      {/* 上唇 */}
      <path d="M50,95 Q40,105 45,120" fill="none" stroke={C.ink} strokeWidth="2.5" strokeLinecap="round" />
      {/* 前歯（上） */}
      <rect x="62" y="92" width="10" height="16" fill="#F6F1E7" stroke={C.ink} strokeWidth="1.2" />
      <rect x="74" y="94" width="10" height="15" fill="#F6F1E7" stroke={C.ink} strokeWidth="1.2" />
      {/* 舌 */}
      <path d="M70,180 Q60,140 90,112 Q110,96 150,100 Q190,106 200,140 Q205,165 190,180 Z" fill="#E8A48F" opacity="0.85" stroke="#C97A62" strokeWidth="1.5" />
      {/* スポットの位置（強調） */}
      <circle cx="92" cy="106" r="7" fill="none" stroke={C.gold} strokeWidth="2.5" />
      <circle cx="92" cy="106" r="2.5" fill={C.gold} />
      {/* 前歯（下） */}
      <rect x="65" y="178" width="10" height="14" fill="#F6F1E7" stroke={C.ink} strokeWidth="1.2" />
      <rect x="77" y="180" width="10" height="13" fill="#F6F1E7" stroke={C.ink} strokeWidth="1.2" />
      {/* 下顎・下唇のライン */}
      <path d="M55,195 Q45,205 52,218" fill="none" stroke={C.ink} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M60,195 Q150,225 260,205 Q300,198 320,175" fill="none" stroke={C.ink} strokeWidth="2.5" strokeLinecap="round" />

      {/* ラベル：スポット */}
      <line x1="99" y1="106" x2="150" y2="60" stroke={C.inkSoft} strokeWidth="1" strokeDasharray="3,3" />
      <text x="153" y="55" fontSize="13" fill={C.gold} fontWeight="600">{tr("labelSpot", lang)}</text>

      {/* ラベル：上顎 */}
      <text x="230" y="65" fontSize="12" fill={C.inkSoft}>{tr("labelUpperPalate", lang)}</text>

      {/* ラベル：舌先 */}
      <line x1="100" y1="130" x2="220" y2="130" stroke={C.inkSoft} strokeWidth="1" strokeDasharray="3,3" />
      <text x="223" y="134" fontSize="12" fill={C.inkSoft}>{tr("labelTongueTip", lang)}</text>

      {/* ラベル：上唇・下唇 */}
      <text x="10" y="90" fontSize="11" fill={C.inkSoft}>{tr("labelUpperLip", lang)}</text>
      <text x="10" y="225" fontSize="11" fill={C.inkSoft}>{tr("labelLowerLip", lang)}</text>

      {/* ラベル：前歯 */}
      <line x1="79" y1="92" x2="79" y2="45" stroke={C.inkSoft} strokeWidth="1" strokeDasharray="3,3" />
      <text x="55" y="40" fontSize="11" fill={C.inkSoft}>{tr("labelTeeth", lang)}</text>
    </svg>
  );
}

export default function AnnouncerTheoryPage({ searchParams }) {
  const lang = LANGS.some((l) => l.code === searchParams?.lang) ? searchParams.lang : "ja";

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
              href={`/announcer-theory?lang=${l.code}`}
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

      {/* 滑舌の仕組み */}
      <Section eyebrow={tr("eyebrow", lang)} title={tr("s1title", lang)}>
        <p>{tr("s1p1", lang)}</p>
        <p>{tr("s1p2", lang)}</p>
        <TongueSpotDiagram lang={lang} />
        <p style={{ textAlign: "center", fontSize: 12.5, color: C.inkSoft, marginTop: -8 }}>{tr("diagramTitle", lang)}</p>
        <p>{tr("s1p3", lang)}</p>
        <Callout>{tr("s1callout", lang)}</Callout>
      </Section>

      {/* 具体的な練習方法 */}
      <Section eyebrow={tr("eyebrow", lang)} title={tr("s2title", lang)} accent={C.sage}>
        <div>
          {[1, 2, 3, 4].map((n) => (
            <GlossaryItem key={n} term={tr(`s2item${n}term`, lang)}>{tr(`s2item${n}desc`, lang)}</GlossaryItem>
          ))}
        </div>
      </Section>

      {/* 発語練習文集 */}
      <Section eyebrow={tr("eyebrow", lang)} title={tr("s3title", lang)} accent={C.rust}>
        <p>{tr("s3note", lang)}</p>
        <p style={{ fontSize: 12.5, color: C.inkSoft, fontStyle: "italic" }}>{tr("s3textNote", lang)}</p>
        <div>
          <PracticeSentence purpose={tr("s3item1purpose", lang)} text="客が来客に貴金属をキャッチさせた。" />
          <PracticeSentence purpose={tr("s3item2purpose", lang)} text="隣の客はよく柿食う客だ。" />
          <PracticeSentence purpose={tr("s3item3purpose", lang)} text="東京特許許可局長。" />
          <PracticeSentence purpose={tr("s3item4purpose", lang)} text="生麦生米生卵。" />
          <PracticeSentence purpose={tr("s3item5purpose", lang)} text="坊主が屏風に上手に坊主の絵を描いた。" />
          <PracticeSentence purpose={tr("s3item6purpose", lang)} text="1時7分、7時1分、8時8分の3本の電車が、1番線・7番線・8番線に到着します。" />
        </div>
      </Section>

      {/* 生放送前のコンディション管理 */}
      <Section eyebrow={tr("eyebrow", lang)} title={tr("s4title", lang)}>
        <p>{tr("s4p1", lang)}</p>
        <ul style={{ paddingLeft: 20, margin: "12px 0" }}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <li key={n} style={{ marginBottom: 8 }}>{tr(`s4list${n}`, lang)}</li>
          ))}
        </ul>
      </Section>

      {/* 乾燥対策と体の機能 */}
      <Section eyebrow={tr("eyebrow", lang)} title={tr("s5title", lang)} accent={C.sage}>
        <p>{tr("s5p1", lang)}</p>
        <ul style={{ paddingLeft: 20, margin: "12px 0" }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <li key={n} style={{ marginBottom: 8 }}>{tr(`s5list${n}`, lang)}</li>
          ))}
        </ul>
      </Section>

      <p style={{ marginTop: 56, fontSize: 11.5, color: C.inkSoft, borderTop: `1px solid ${C.line}`, paddingTop: 20, lineHeight: 1.8 }}>
        {tr("footer", lang)}
      </p>
    </main>
  );
}
